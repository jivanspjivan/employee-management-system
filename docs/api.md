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
