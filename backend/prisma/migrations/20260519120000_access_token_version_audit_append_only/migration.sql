-- Invalidate outstanding access JWTs per user (logout / suspend / ban).
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "accessTokenVersion" INTEGER NOT NULL DEFAULT 0;

-- Append-only audit log: block UPDATE/DELETE at the database layer.
CREATE OR REPLACE FUNCTION prevent_audit_log_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'audit_logs rows are append-only and cannot be updated or deleted';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS audit_logs_prevent_update ON "audit_logs";
CREATE TRIGGER audit_logs_prevent_update
  BEFORE UPDATE ON "audit_logs"
  FOR EACH ROW
  EXECUTE PROCEDURE prevent_audit_log_mutation();

DROP TRIGGER IF EXISTS audit_logs_prevent_delete ON "audit_logs";
CREATE TRIGGER audit_logs_prevent_delete
  BEFORE DELETE ON "audit_logs"
  FOR EACH ROW
  EXECUTE PROCEDURE prevent_audit_log_mutation();
