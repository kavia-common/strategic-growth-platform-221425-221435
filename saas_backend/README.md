# SaaS Backend API

This is the backend for the Strategic Growth Platform SaaS, built with Express.js.

## Supabase Database Setup

To set up the database for this project, follow these steps:

1.  **Create a Supabase Project:**
    Go to [Supabase](https://supabase.com/) and create a new project.

2.  **Run SQL Scripts:**
    Navigate to the SQL Editor in your Supabase dashboard and run the contents of the files in the `supabase/` directory in the following order:
    1.  `supabase/schema.sql` (Creates tables)
    2.  `supabase/functions.sql` (Creates triggers and functions)
    3.  `supabase/policies.sql` (Enables RLS policies)
    4.  `supabase/seed.sql` (Optional: Adds sample data - requires a valid user UUID)

3.  **Enable Realtime:**
    To enable real-time updates for chat and dashboard metrics:
    - Go to **Database > Replication** in the Supabase dashboard.
    - Enable replication for the `messages` and `dashboard_metrics` tables.
    - Alternatively, you can run the SQL commands found in the comments of `schema.sql`.

4.  **Environment Variables:**
    Copy the `.env.example` file to `.env` and fill in your Supabase credentials.
    - `SUPABASE_URL`: Your project URL.
    - `SUPABASE_SERVICE_ROLE_KEY`: Your service role key (keep this secret, for backend use only).

5.  **Frontend Setup:**
    - Update the frontend `.env` with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

6.  **Verify:**
    - Use the Table Editor to verify tables are created.
    - You can test RLS by creating a user in Authentication and trying to query tables.

## Supabase Auth: Auto-Confirmation (Development)

**Purpose:** During development, automated smoke tests and local signup flows can fail due to email confirmation requirements. Enabling auto-confirmation streamlines local testing and allows the smoke test script to complete successfully without manual intervention.

### How to enable
1.  Go to your **Supabase Dashboard**.
2.  Navigate to **Authentication** → **Providers** → **Email**.
3.  Toggle **ON** "Disable email confirmations" (Confirm email causes the user to be confirmed automatically).
    *   *Note: In some UI versions this is labeled "Auto confirm new users" or "Confirm email". Ensure email confirmation is NOT required.*
4.  Click **Save**.

### Recommended Dev Settings
*   **Site URL:** `http://localhost:3000`
*   **Redirect URLs:**
    *   `http://localhost:3000`
    *   `http://localhost:3001` (Backend/Smoke tests)

### Production Guidance
*   **Re-enable email confirmations** before deploying to production to prevent spam accounts.
*   Configure **domain-specific Site URL and Redirect URLs** in the Supabase Auth settings.
*   Consider configuring **custom SMTP settings** for branded emails instead of the default Supabase rate-limited service.

### Note on Smoke Tests
With auto-confirmation enabled, running `npm run smoke` can successfully create and sign in a test user without hitting email verification barriers. If email confirmation is required, the smoke test may fail at the authentication step unless an Admin Service Role key is used to bypass verification (which the script attempts, but auto-confirmation is a safer fallback for local dev).

### Node Version Note
The Supabase JS client is deprecating support for Node 18. It is recommended to use **Node 20+** for local development to avoid warnings and potential compatibility issues.
