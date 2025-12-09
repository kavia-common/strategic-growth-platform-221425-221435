-- ============================================================
-- OPTIONAL SEED DATA
-- Only run this if you have created a user in Supabase Auth
-- and replaced 'YOUR_USER_ID_HERE' with their actual UUID.
-- ============================================================

/*
DO $$
DECLARE
  v_user_id uuid := 'YOUR_USER_ID_HERE'; -- Replace with a real auth.users id
  v_org_id uuid;
  v_conversation_id uuid;
BEGIN
  -- Check if user exists to avoid errors (in a real seed, we might not have this check available for auth schema easily)
  
  -- 1. Create Profile
  INSERT INTO public.profiles (user_id, display_name, avatar_url)
  VALUES (v_user_id, 'Demo User', 'https://ui-avatars.com/api/?name=Demo+User')
  ON CONFLICT (user_id) DO NOTHING;

  -- 2. Create Organization
  INSERT INTO public.organizations (name, created_by)
  VALUES ('Acme Corp', v_user_id)
  RETURNING id INTO v_org_id;

  -- 3. Add Member
  INSERT INTO public.organization_members (org_id, user_id, role)
  VALUES (v_org_id, v_user_id, 'owner');

  -- 4. Create Conversation
  INSERT INTO public.conversations (org_id, created_by, title)
  VALUES (v_org_id, v_user_id, 'Q3 Strategy Planning')
  RETURNING id INTO v_conversation_id;

  -- 5. Add Messages
  INSERT INTO public.messages (conversation_id, sender_id, role, content)
  VALUES 
    (v_conversation_id, v_user_id, 'user', 'How can we increase growth in Q3?'),
    (v_conversation_id, null, 'assistant', 'Based on current metrics, focusing on retention seems promising.');

  -- 6. Add Metrics
  INSERT INTO public.dashboard_metrics (org_id, metric_key, metric_value)
  VALUES 
    (v_org_id, 'monthly_revenue', '{"value": 50000, "currency": "USD"}'::jsonb),
    (v_org_id, 'active_users', '{"count": 1200, "trend": "+5%"}'::jsonb);

END $$;
*/
