import { randomUUID } from 'node:crypto'

import { cacheGet, cacheSet } from '../../config/cache.js'
import { prisma } from '../../config/database.js'
import { AppError } from '../../errors/app-error.js'
import { EmployeeRole, EmployeeStatus } from '../../generated/prisma/enums.js'
import { ZodError } from 'zod'
import { createEmployeeSchema } from './employee.schema.js'
import { employeeListSelect } from './employee.types.js'
import { assignManager, createEmployee, updateEmployee } from './employee.service.js'

const JOB_TTL_SECONDS = 60 * 60
const jobs = new Map<string, CsvJob>()

type JobStatus = 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
type CsvJob = {
  id: string
  ownerId: string
  type: 'IMPORT' | 'EXPORT'
  status: JobStatus
  progress: number
  processed: number
  total: number
  created: number
  updated: number
  failed: number
  errors: string[]
  fileName?: string
  csv?: string
  error?: string
}

type Actor = { id: string; role: EmployeeRole }

const jobKey = (id: string) => `employee:csv-job:${id}`
const saveJob = async (job: CsvJob) => {
  jobs.set(job.id, job)
  await cacheSet(jobKey(job.id), job, JOB_TTL_SECONDS)
}

export const getCsvJob = async (id: string, ownerId: string) => {
  const job = jobs.get(id) ?? await cacheGet<CsvJob>(jobKey(id))
  if (!job || job.ownerId !== ownerId) throw new AppError(404, 'CSV_JOB_NOT_FOUND', 'CSV job not found')
  return job
}

const parseCsv = (csv: string) => {
  const rows: string[][] = []
  let row: string[] = []
  let value = ''
  let quoted = false

  for (let index = 0; index < csv.length; index += 1) {
    const character = csv[index]!
    if (character === '"' && quoted && csv[index + 1] === '"') {
      value += '"'
      index += 1
    } else if (character === '"') quoted = !quoted
    else if (character === ',' && !quoted) {
      row.push(value.trim())
      value = ''
    } else if ((character === '\n' || character === '\r') && !quoted) {
      if (character === '\r' && csv[index + 1] === '\n') index += 1
      row.push(value.trim())
      if (row.some(Boolean)) rows.push(row)
      row = []
      value = ''
    } else value += character
  }
  row.push(value.trim())
  if (row.some(Boolean)) rows.push(row)
  return rows
}

const csvValue = (value: unknown) => `"${String(value ?? '').replaceAll('"', '""')}"`

const runImport = async (job: CsvJob, csv: string, actor: Actor) => {
  try {
    const rows = parseCsv(csv)
    const headers = rows.shift()?.map((header) => header.trim()) ?? []
    const required = ['employeeId', 'name', 'email', 'designation', 'salary', 'joiningDate']
    if (required.some((header) => !headers.includes(header)) || (!headers.includes('departmentId') && !headers.includes('departmentName'))) {
      throw new Error(`CSV requires columns: ${required.join(', ')}, and either departmentId or departmentName`)
    }
    if (rows.length > 5_000) throw new Error('A single import cannot contain more than 5,000 employee rows')

    job.status = 'PROCESSING'
    job.total = rows.length
    await saveJob(job)

    for (const [index, values] of rows.entries()) {
      try {
        const record = Object.fromEntries(headers.map((header, column) => [header, values[column] ?? '']))
        const matches = await prisma.employee.findMany({
          where: { OR: [{ employeeId: record.employeeId }, { email: String(record.email ?? '').toLowerCase() }] },
          select: { id: true, employeeId: true, email: true, role: true },
          take: 2,
        })
        if (matches.length > 1) throw new Error('Employee ID and email belong to different employees')
        const existing = matches[0]
        if (!record.departmentId && !record.departmentName) {
          throw new Error('departmentId or departmentName is required')
        }
        const department = record.departmentId
          ? await prisma.department.findUnique({ where: { id: record.departmentId }, select: { id: true } })
          : await prisma.department.findFirst({
              where: { name: { equals: record.departmentName, mode: 'insensitive' } },
              select: { id: true },
            })
        if (!department) throw new Error(`Department "${record.departmentName || record.departmentId}" was not found`)
        const parsed = createEmployeeSchema.parse({
          employeeId: record.employeeId,
          name: record.name,
          email: record.email,
          password: record.password || 'ExistingEmployeeOnly!',
          phone: record.phone || undefined,
          departmentId: department.id,
          designation: record.designation,
          salary: record.salary,
          joiningDate: record.joiningDate,
          status: record.status || EmployeeStatus.ACTIVE,
          role: record.role || EmployeeRole.EMPLOYEE,
          reportingManagerId: record.reportingManagerId || undefined,
          profileImageUrl: record.profileImageUrl || undefined,
        })

        if (actor.role === EmployeeRole.HR_MANAGER && (parsed.role === EmployeeRole.SUPER_ADMIN || existing?.role === EmployeeRole.SUPER_ADMIN)) {
          throw new Error('HR Managers cannot create or modify a Super Admin')
        }

        if (existing) {
          const { password, reportingManagerId, ...update } = parsed
          void password
          await updateEmployee(existing.id, update, actor)
          if (reportingManagerId !== undefined) {
            await assignManager(existing.id, reportingManagerId)
          }
          job.updated += 1
        } else {
          if (!record.password) throw new Error('Password is required for a new employee')
          await createEmployee(parsed)
          job.created += 1
        }
      } catch (error) {
        job.failed += 1
        const message = error instanceof ZodError
          ? error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join(', ')
          : error instanceof Error ? error.message : 'Import failed'
        job.errors.push(`Row ${index + 2}: ${message}`)
      }

      job.processed = index + 1
      job.progress = job.total ? Math.round((job.processed / job.total) * 100) : 100
      await saveJob(job)
    }

    job.status = 'COMPLETED'
    job.progress = 100
    await saveJob(job)
  } catch (error) {
    job.status = 'FAILED'
    job.error = error instanceof Error ? error.message : 'Import failed'
    await saveJob(job)
  }
}

const runExport = async (job: CsvJob) => {
  try {
    job.status = 'PROCESSING'
    job.progress = 15
    await saveJob(job)
    const employees = await prisma.employee.findMany({
      where: { isDeleted: false },
      orderBy: { name: 'asc' },
      select: employeeListSelect,
    })
    job.total = employees.length
    job.progress = 70
    await saveJob(job)
    const headers = ['employeeId', 'name', 'email', 'password', 'phone', 'departmentId', 'departmentName', 'designation', 'salary', 'joiningDate', 'status', 'role', 'reportingManagerId', 'reportingManagerName', 'profileImageUrl']
    const rows = employees.map((employee) => [
      employee.employeeId, employee.name, employee.email, '', employee.phone,
      employee.departmentId, employee.department.name, employee.designation,
      employee.salary, employee.joiningDate.toISOString().slice(0, 10), employee.status,
      employee.role, employee.reportingManagerId, employee.reportingManager?.name ?? '',
      employee.profileImageUrl,
    ].map(csvValue).join(','))
    job.csv = [headers.join(','), ...rows].join('\n')
    job.fileName = `playstack-employees-${new Date().toISOString().slice(0, 10)}.csv`
    job.processed = employees.length
    job.progress = 100
    job.status = 'COMPLETED'
    await saveJob(job)
  } catch (error) {
    job.status = 'FAILED'
    job.error = error instanceof Error ? error.message : 'Export failed'
    await saveJob(job)
  }
}

export const startImportJob = async (csv: string, actor: Actor) => {
  const job: CsvJob = { id: randomUUID(), ownerId: actor.id, type: 'IMPORT', status: 'QUEUED', progress: 0, processed: 0, total: 0, created: 0, updated: 0, failed: 0, errors: [] }
  await saveJob(job)
  setImmediate(() => void runImport(job, csv, actor))
  return job
}

export const startExportJob = async (actor: Actor) => {
  const job: CsvJob = { id: randomUUID(), ownerId: actor.id, type: 'EXPORT', status: 'QUEUED', progress: 0, processed: 0, total: 0, created: 0, updated: 0, failed: 0, errors: [] }
  await saveJob(job)
  setImmediate(() => void runExport(job))
  return job
}
