CREATE TABLE IF NOT EXISTS "Appointment" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "procedure" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "durationMin" INTEGER NOT NULL DEFAULT 60,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Appointment_date_idx" ON "Appointment"("date");
CREATE INDEX IF NOT EXISTS "Appointment_clientId_idx" ON "Appointment"("clientId");
CREATE INDEX IF NOT EXISTS "Appointment_status_idx" ON "Appointment"("status");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'Appointment_clientId_fkey'
    ) THEN
        ALTER TABLE "Appointment"
        ADD CONSTRAINT "Appointment_clientId_fkey"
        FOREIGN KEY ("clientId")
        REFERENCES "Client"("id")
        ON DELETE RESTRICT
        ON UPDATE CASCADE;
    END IF;
END $$;
