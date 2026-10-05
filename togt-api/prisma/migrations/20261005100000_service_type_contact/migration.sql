-- Contact-us requests: the app's "Contact us" button and the web smart form's
-- contact tab submit serviceType CONTACT (no payment involved). CONSULTING is
-- kept for existing rows. IF NOT EXISTS makes a retried migration a no-op.
ALTER TYPE "ServiceType" ADD VALUE IF NOT EXISTS 'CONTACT';
