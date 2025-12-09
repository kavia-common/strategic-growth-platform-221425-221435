-- Enable RLS on all tables
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.profiles enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.dashboard_metrics enable row level security;

-- ==========================
-- 1. Organizations Policies
-- ==========================

-- Select: Members of the org can view
create policy "Members can view organizations"
  on public.organizations for select
  using (
    exists (
      select 1 from public.organization_members
      where org_id = organizations.id
      and user_id = auth.uid()
    )
  );

-- Update: Owners and Admins can update
create policy "Owners and Admins can update organizations"
  on public.organizations for update
  using (
    exists (
      select 1 from public.organization_members
      where org_id = organizations.id
      and user_id = auth.uid()
      and role in ('owner', 'admin')
    )
  );

-- Delete: Only Creator can delete (optional: or Owner)
create policy "Creator can delete organizations"
  on public.organizations for delete
  using (
    auth.uid() = created_by
  );
  
-- Insert: Any authenticated user can create an organization
create policy "Authenticated users can create organizations"
  on public.organizations for insert
  with check (auth.role() = 'authenticated');


-- ==========================
-- 2. Organization Members Policies
-- ==========================

-- Select: Users can see their own memberships or memberships of orgs they belong to
create policy "Users can view members of their orgs"
  on public.organization_members for select
  using (
    auth.uid() = user_id -- View own membership
    or exists (
      select 1 from public.organization_members as my_membership
      where my_membership.org_id = organization_members.org_id
      and my_membership.user_id = auth.uid()
    )
  );

-- Insert: Owners and Admins can add members
create policy "Owners and Admins can add members"
  on public.organization_members for insert
  with check (
    exists (
      select 1 from public.organization_members as my_membership
      where my_membership.org_id = organization_members.org_id
      and my_membership.user_id = auth.uid()
      and my_membership.role in ('owner', 'admin')
    )
    -- Also allow self-insertion if handled via invitation logic, but strict here
    or 
    -- Allow the RPC/Trigger to insert the first member (owner) when creating org
    (
       exists (
         select 1 from public.organizations 
         where id = organization_members.org_id 
         and created_by = auth.uid()
       )
       and organization_members.user_id = auth.uid()
       and organization_members.role = 'owner'
    )
  );

-- Update: Owners can update roles
create policy "Owners can update member roles"
  on public.organization_members for update
  using (
    exists (
      select 1 from public.organization_members as my_membership
      where my_membership.org_id = organization_members.org_id
      and my_membership.user_id = auth.uid()
      and my_membership.role = 'owner'
    )
  );

-- Delete: Owners can remove members; Users can leave (delete self)
create policy "Owners can remove members or user can leave"
  on public.organization_members for delete
  using (
    (auth.uid() = user_id) -- Leave
    or exists ( -- Owner removing someone
      select 1 from public.organization_members as my_membership
      where my_membership.org_id = organization_members.org_id
      and my_membership.user_id = auth.uid()
      and my_membership.role = 'owner'
    )
  );

-- ==========================
-- 3. Profiles Policies
-- ==========================

-- Select: Users can view their own profile and profiles of users in same orgs
create policy "Users can view relevant profiles"
  on public.profiles for select
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.organization_members om1
      join public.organization_members om2 on om1.org_id = om2.org_id
      where om1.user_id = auth.uid()
      and om2.user_id = profiles.user_id
    )
  );

-- Insert: Users can create their own profile
create policy "Users can create own profile"
  on public.profiles for insert
  with check (auth.uid() = user_id);

-- Update: Users can update their own profile
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = user_id);


-- ==========================
-- 4. Conversations Policies
-- ==========================

-- Select/Insert/Update/Delete:
-- Case A: Personal (org_id is null) -> Owner access only
-- Case B: Org (org_id is not null) -> Org Members access

create policy "Access conversation"
  on public.conversations
  using (
    (org_id is null and created_by = auth.uid()) -- Personal
    or (
      org_id is not null and exists (
        select 1 from public.organization_members
        where org_id = conversations.org_id
        and user_id = auth.uid()
      )
    ) -- Org
  );

-- ==========================
-- 5. Messages Policies
-- ==========================

-- Select: If user has access to conversation
create policy "View messages"
  on public.messages for select
  using (
    exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
      and (
        (c.org_id is null and c.created_by = auth.uid())
        or (
          c.org_id is not null and exists (
            select 1 from public.organization_members
            where org_id = c.org_id
            and user_id = auth.uid()
          )
        )
      )
    )
  );

-- Insert: If user has access to conversation
create policy "Insert messages"
  on public.messages for insert
  with check (
    exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
      and (
        (c.org_id is null and c.created_by = auth.uid())
        or (
          c.org_id is not null and exists (
            select 1 from public.organization_members
            where org_id = c.org_id
            and user_id = auth.uid()
          )
        )
      )
    )
  );

-- Delete: Sender or Admin (if org conversation)
create policy "Delete messages"
  on public.messages for delete
  using (
    sender_id = auth.uid()
    or exists (
      select 1 from public.conversations c
      join public.organization_members om on c.org_id = om.org_id
      where c.id = messages.conversation_id
      and om.user_id = auth.uid()
      and om.role in ('owner', 'admin')
    )
  );


-- ==========================
-- 6. Dashboard Metrics Policies
-- ==========================

-- Select: Org members can view metrics
create policy "Members view metrics"
  on public.dashboard_metrics for select
  using (
    exists (
      select 1 from public.organization_members
      where org_id = dashboard_metrics.org_id
      and user_id = auth.uid()
    )
  );

-- Insert/Update: Service Role only (or specific admin logic)
-- Typically, metrics are generated by the backend system.
-- We will allow service role by default (implicit bypass RLS), but if we need a policy:
-- (No policy for insert/update means only service role/superadmin can do it via API with service key)
