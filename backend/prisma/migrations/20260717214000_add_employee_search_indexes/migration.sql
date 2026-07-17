-- Trigram indexes support the case-insensitive contains searches used by
-- GET /api/employees?search=... (ILIKE '%value%'). The existing B-tree
-- indexes remain useful for exact email lookups and name sorting.
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

CREATE INDEX "employees_name_trgm_idx"
ON "employees" USING GIN ("name" gin_trgm_ops)
WHERE "isDeleted" = false;

CREATE INDEX "employees_email_trgm_idx"
ON "employees" USING GIN ("email" gin_trgm_ops)
WHERE "isDeleted" = false;

-- Employee-list indexes cover the common non-deleted filters and sort orders.
-- Employee writes are infrequent, so the small write cost is outweighed by
-- faster list and pagination queries as the organization grows.
CREATE INDEX "employees_active_name_idx"
ON "employees" ("name", "id")
WHERE "isDeleted" = false;

CREATE INDEX "employees_active_joining_date_idx"
ON "employees" ("joiningDate", "id")
WHERE "isDeleted" = false;

CREATE INDEX "employees_active_department_name_idx"
ON "employees" ("departmentId", "name", "id")
WHERE "isDeleted" = false;

CREATE INDEX "employees_active_role_name_idx"
ON "employees" ("role", "name", "id")
WHERE "isDeleted" = false;

CREATE INDEX "employees_active_status_name_idx"
ON "employees" ("status", "name", "id")
WHERE "isDeleted" = false;
