import 'dotenv/config'

import bcrypt from 'bcrypt'

import { prisma } from '../src/config/database.js'
import { logger } from '../src/config/logger.js'
import { EmployeeRole, EmployeeStatus } from '../src/generated/prisma/enums.js'

const firstNames = [
  'Mahesh', 'Asha', 'Rahul', 'Priya', 'Arjun', 'Sneha', 'Vikram', 'Ananya', 'Rohan', 'Kavya',
  'Nikhil', 'Meera', 'Aditya', 'Pooja', 'Karthik', 'Neha', 'Sanjay', 'Divya', 'Akash', 'Ishita',
  'Manish', 'Ritika', 'Varun', 'Swati', 'Deepak', 'Nandini', 'Abhishek', 'Shreya', 'Harish', 'Tanvi',
  'Rajesh', 'Simran', 'Gaurav', 'Riya', 'Siddharth', 'Aditi', 'Pranav', 'Lakshmi', 'Mohan', 'Sakshi',
  'Ajay', 'Keerthi', 'Naveen', 'Anjali', 'Rakesh', 'Bhavna', 'Suresh', 'Madhuri', 'Tarun', 'Sonali',
  'Vijay', 'Deepika', 'Ashwin', 'Preeti', 'Sameer', 'Monika', 'Dinesh', 'Shruti', 'Yash', 'Anusha',
  'Ganesh', 'Pallavi', 'Hemant', 'Nisha', 'Sachin', 'Archana', 'Arvind', 'Reshma', 'Dev', 'Trisha',
  'Kunal', 'Manya', 'Ravi', 'Aparna', 'Shankar', 'Vidya', 'Mayank', 'Jaya', 'Rohit', 'Sonia',
  'Amit', 'Gayatri', 'Dhruv', 'Namrata', 'Suraj', 'Rekha', 'Vivek', 'Shalini', 'Anil', 'Kriti',
  'Manoj', 'Rashmi', 'Sandeep', 'Vaishnavi', 'Pankaj', 'Nikita', 'Jayant', 'Shivani', 'Uday', 'Rupali',
]

const lastNames = [
  'Kulkarni', 'Sharma', 'Reddy', 'Iyer', 'Patil', 'Nair', 'Gupta', 'Rao', 'Joshi', 'Menon',
  'Deshmukh', 'Singh', 'Mehta', 'Shetty', 'Verma', 'Bhat', 'Chopra', 'Naik', 'Kapoor', 'Pillai',
]

const departmentDefinitions = [
  { name: 'Engineering - Bangalore', designations: ['Software Engineer', 'Senior Software Engineer', 'Frontend Engineer', 'Backend Engineer'] },
  { name: 'Product - Bangalore', designations: ['Product Analyst', 'Product Manager', 'UX Researcher'] },
  { name: 'Design - Bangalore', designations: ['Product Designer', 'UI Designer', 'Visual Designer'] },
  { name: 'Quality Assurance - Bangalore', designations: ['QA Engineer', 'Automation Engineer', 'Quality Analyst'] },
  { name: 'People Operations - Bangalore', designations: ['People Partner', 'Talent Specialist', 'HR Operations Executive'] },
  { name: 'Finance - Bangalore', designations: ['Finance Analyst', 'Payroll Specialist', 'Accounts Executive'] },
  { name: 'Sales - Bangalore', designations: ['Account Executive', 'Business Development Manager', 'Sales Analyst'] },
  { name: 'Customer Success - Bangalore', designations: ['Customer Success Executive', 'Implementation Specialist', 'Support Engineer'] },
]

const demoPassword = process.env.DEMO_EMPLOYEE_PASSWORD ?? 'PlaystackDemo@123'

if (demoPassword.length < 12) {
  throw new Error('DEMO_EMPLOYEE_PASSWORD must contain at least 12 characters')
}

const seedDemoEmployees = async () => {
  const passwordHash = await bcrypt.hash(demoPassword, 12)
  const departments = await Promise.all(
    departmentDefinitions.map((department) =>
      prisma.department.upsert({
        where: { name: department.name },
        update: {},
        create: { name: department.name },
      }),
    ),
  )
  const superAdmin = await prisma.employee.findFirst({
    where: { role: EmployeeRole.SUPER_ADMIN, isDeleted: false },
    orderBy: { createdAt: 'asc' },
    select: { id: true },
  })

  const employees = []
  for (let index = 0; index < 100; index += 1) {
    const firstName = firstNames[index]!
    const lastName = lastNames[index % lastNames.length]!
    const departmentIndex = index % departments.length
    const department = departments[departmentIndex]!
    const definition = departmentDefinitions[departmentIndex]!
    const isHrManager = index < 5
    const isDepartmentLead = index >= 5 && index < 13
    const designation = isHrManager
      ? index === 0 ? 'Head of People Operations' : 'HR Manager'
      : isDepartmentLead
        ? `${definition.name.split(' - ')[0]} Lead`
        : definition.designations[index % definition.designations.length]!
    const employeeId = `PS-BLR-${String(index + 1001)}`
    const email = `${firstName}.${lastName}.${index + 1}@playstack.demo`.toLowerCase()
    const joiningDate = new Date(2021 + (index % 5), (index * 3) % 12, (index % 25) + 1)
    const status = index > 0 && index % 17 === 0 ? EmployeeStatus.INACTIVE : EmployeeStatus.ACTIVE
    const salary = 480000 + (index % 12) * 65000 + (isHrManager || isDepartmentLead ? 450000 : 0)

    const employee = await prisma.employee.upsert({
      where: { employeeId },
      update: {
        name: `${firstName} ${lastName}`,
        email,
        phone: `+91 9${String(100000000 + index * 7919).slice(-9)}`,
        departmentId: department.id,
        designation,
        salary,
        joiningDate,
        status,
        role: isHrManager ? EmployeeRole.HR_MANAGER : EmployeeRole.EMPLOYEE,
        isDeleted: false,
        deletedAt: null,
      },
      create: {
        employeeId,
        name: `${firstName} ${lastName}`,
        email,
        passwordHash,
        phone: `+91 9${String(100000000 + index * 7919).slice(-9)}`,
        departmentId: department.id,
        designation,
        salary,
        joiningDate,
        status,
        role: isHrManager ? EmployeeRole.HR_MANAGER : EmployeeRole.EMPLOYEE,
      },
      select: { id: true },
    })
    employees.push(employee)
  }

  for (let index = 0; index < employees.length; index += 1) {
    let reportingManagerId: string | null = null
    if (index === 0) reportingManagerId = superAdmin?.id ?? null
    else if (index < 5) reportingManagerId = employees[0]!.id
    else if (index < 13) reportingManagerId = employees[1 + (index % 4)]!.id
    else reportingManagerId = employees[5 + (index % 8)]!.id

    await prisma.employee.update({
      where: { id: employees[index]!.id },
      data: { reportingManagerId },
    })
  }

  logger.info('Playstack demo employees seeded', {
    employees: employees.length,
    hrManagers: 5,
    departments: departments.length,
    location: 'Bangalore',
  })
}

seedDemoEmployees()
  .catch((error: unknown) => {
    logger.error('Demo employee seed failed', {
      error: error instanceof Error ? { message: error.message, stack: error.stack } : error,
    })
    process.exitCode = 1
  })
  .finally(async () => prisma.$disconnect())
