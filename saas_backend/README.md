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
