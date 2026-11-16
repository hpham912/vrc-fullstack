-- Store the Twilio SMS credentials in the church_info document.
-- Run this in the Cloud SQL Query tab (dev + prod). Replace
-- <TWILIO_ACCOUNT_SID> and <TWILIO_AUTH_TOKEN> with the values from
-- the Twilio Console dashboard (keep the token secret — never paste
-- it anywhere public). The phone number is already filled in.
--
-- Why the database and not env vars: this Cloud Run service cannot
-- be updated with env vars from an end-user account (deployments
-- using end-user credentials are not allowed), so the backend reads
-- these three fields from church_info instead. Env vars still work
-- as a fallback when they are set. The values are stripped from the
-- public GET /api/church-info response, so they never reach the app.
-- Safe to re-run: the UPDATE only merges these three keys into the
-- existing document and leaves every other field untouched.

-- Make sure the single church_info row (id = 1) exists.
INSERT INTO church_info (id, data, created_at, updated_at)
VALUES (1, '{}'::jsonb, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Merge the Twilio credentials into the document.
UPDATE church_info
SET data = data || jsonb_build_object(
  'twilioAccountSid', '<TWILIO_ACCOUNT_SID>',
  'twilioAuthToken', '<TWILIO_AUTH_TOKEN>',
  'twilioPhoneNumber', '+18888374252'
),
updated_at = NOW()
WHERE id = 1;

-- Verify (the token is shown here — only run this in the Cloud SQL
-- console, and do not share the output):
-- SELECT data->>'twilioAccountSid' AS sid, data->>'twilioPhoneNumber' AS phone FROM church_info WHERE id = 1;
