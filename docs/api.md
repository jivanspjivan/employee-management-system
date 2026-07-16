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

## Health check

```http
GET /health
```

## Employees

### List employees

Super Admin and HR Manager only.

```http
GET /employees
Authorization: Bearer {{token}}
```

The response contains non-deleted employees ordered by name. Password hashes,
token versions, and soft-deletion metadata are not returned.

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
assign the Super Admin role. Employees can update only their own name, phone,
and profile image URL.

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
