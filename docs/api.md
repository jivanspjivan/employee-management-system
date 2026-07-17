# Employee Management System API

Local base URL:

```text
http://localhost:4000/api
```

All JSON errors use this structure:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message"
  }
}
```

## Authentication

### Login

```http
POST /auth/login
Content-Type: application/json
```

```json
{
  "email": "admin@example.com",
  "password": "your-password"
}
```

A successful response contains an access token and the safe employee profile.
The password hash and token version are never returned.

In Postman, save `data.token` as an environment variable named `token`.

### Current employee

```http
GET /auth/me
Authorization: Bearer {{token}}
```

### Logout

```http
POST /auth/logout
Authorization: Bearer {{token}}
```

Logout increments the employee's token version. The same token cannot be used
again after a successful logout.

## Dashboard

### Statistics

Super Admin and HR Manager only. Soft-deleted employees are excluded from all
employee totals.

```http
GET /dashboard/stats
Authorization: Bearer {{token}}
```

```json
{
  "data": {
    "stats": {
      "totalEmployees": 12,
      "activeEmployees": 9,
      "inactiveEmployees": 3,
      "departmentCount": 4
    }
  }
}
```

## Health check

```http
GET /health
```

## Departments

### List departments

Returns departments alphabetically for authenticated users.

```http
GET /departments
Authorization: Bearer {{token}}
```

## Employees

### List employees

Super Admin and HR Manager only.

```http
GET /employees
Authorization: Bearer {{token}}
```

All query parameters are optional and can be combined:

```text
search=asha
departmentId=d4266f98-1abc-49e6-9659-e0bd86e1fa7f
role=EMPLOYEE
status=ACTIVE
sortBy=name|joiningDate
sortOrder=asc|desc
page=1
limit=10
```

When a filter is omitted, employees of every value for that filter are
included. Search matches name or email without case sensitivity. Pagination
defaults to page 1 with 10 records and accepts at most 100 records per page.
Password hashes, token versions, soft-deletion metadata, and deleted employees
are never returned.

```json
{
  "data": {
    "employees": [],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 0,
      "totalPages": 0
    }
  }
}
```

### Get an employee

Super Admin and HR Manager can view any employee. Employees can only view their
own record.

```http
GET /employees/:id
Authorization: Bearer {{token}}
```

### Create an employee

Super Admin and HR Manager can create employees. HR Managers cannot assign the
Super Admin role. The password is hashed before storage.

```http
POST /employees
Authorization: Bearer {{token}}
Content-Type: application/json
```

```json
{
  "employeeId": "EMP-002",
  "name": "Asha Sharma",
  "email": "asha@example.com",
  "password": "temporary-password",
  "phone": "+91 9876543210",
  "departmentId": "d4266f98-1abc-49e6-9659-e0bd86e1fa7f",
  "designation": "Software Engineer",
  "salary": 75000,
  "joiningDate": "2026-07-18",
  "role": "EMPLOYEE"
}
```

### Update an employee

Super Admin and HR Manager can update employee fields. HR Managers cannot
assign the Super Admin role or modify an existing Super Admin. Users cannot
change their own role, and the last active Super Admin cannot be demoted,
deactivated, or deleted. Employees can update only their own name, phone, and
profile image URL.

```http
PUT /employees/:id
Authorization: Bearer {{token}}
Content-Type: application/json
```

Only the fields that need to change are required in the request body.

```json
{
  "designation": "Senior Software Engineer",
  "salary": 90000
}
```

### Delete an employee

Super Admin only. This is a soft delete: the row remains in the database, the
employee becomes inactive, and their existing authentication tokens are
invalidated. A Super Admin cannot delete their own account.

```http
DELETE /employees/:id
Authorization: Bearer {{token}}
```

## Organizational hierarchy

### Organization tree

Returns every non-deleted employee as a nested reporting tree. Employees with
no available reporting manager are returned as root nodes.

```http
GET /organization/tree
Authorization: Bearer {{token}}
```

### Direct reportees

Returns the non-deleted employees who report directly to the selected employee.

```http
GET /employees/:id/reportees
Authorization: Bearer {{token}}
```

### Assign or remove a reporting manager

Super Admin and HR Manager only. Circular reporting relationships are rejected.
Send `null` to remove the current manager.

```http
PATCH /employees/:id/manager
Authorization: Bearer {{token}}
Content-Type: application/json
```

```json
{
  "reportingManagerId": "51b3dfb6-7c06-4540-8f45-b65be389ef27"
}
```
