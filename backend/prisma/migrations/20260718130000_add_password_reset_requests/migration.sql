CREATE TABLE "password_reset_requests" (
    "id" UUID NOT NULL,
    "employeeId" UUID NOT NULL,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "password_reset_requests_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "password_reset_requests_employeeId_resolvedAt_idx"
    ON "password_reset_requests"("employeeId", "resolvedAt");

CREATE INDEX "password_reset_requests_requestedAt_idx"
    ON "password_reset_requests"("requestedAt");

ALTER TABLE "password_reset_requests"
    ADD CONSTRAINT "password_reset_requests_employeeId_fkey"
    FOREIGN KEY ("employeeId") REFERENCES "employees"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
