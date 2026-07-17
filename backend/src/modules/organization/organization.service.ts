import { prisma } from '../../config/database.js'
import type { OrganizationEmployee, OrganizationTreeNode } from './organization.types.js'

export const getOrganizationTree = async (): Promise<OrganizationTreeNode[]> => {
  const employees: OrganizationEmployee[] = await prisma.employee.findMany({
    where: { isDeleted: false },
    orderBy: { name: 'asc' },
    select: {
      id: true,
      employeeId: true,
      name: true,
      designation: true,
      role: true,
      status: true,
      profileImageUrl: true,
      reportingManagerId: true,
      department: { select: { id: true, name: true } },
    },
  })

  const nodes = new Map<string, OrganizationTreeNode>(
    employees.map((employee) => [employee.id, { ...employee, directReports: [] }]),
  )
  const roots: OrganizationTreeNode[] = []

  for (const employee of employees) {
    const node = nodes.get(employee.id)!
    const manager = employee.reportingManagerId
      ? nodes.get(employee.reportingManagerId)
      : undefined

    if (manager) manager.directReports.push(node)
    else roots.push(node)
  }

  return roots
}
