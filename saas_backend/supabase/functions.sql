-- Function to automatically update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger for organizations
drop trigger if exists set_organizations_updated_at on public.organizations;
create trigger set_organizations_updated_at
  before update on public.organizations
  for each row execute procedure public.handle_updated_at();

-- Trigger for profiles
drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

-- Trigger for conversations
drop trigger if exists set_conversations_updated_at on public.conversations;
create trigger set_conversations_updated_at
  before update on public.conversations
  for each row execute procedure public.handle_updated_at();

-- Optional Helper RPC: Create an Organization and add the creator as owner atomically
create or replace function public.create_org_with_owner(
  org_name text
)
returns uuid
language plpgsql
security definer
as $$
declare
  new_org_id uuid;
begin
  -- Insert Organization
  insert into public.organizations (name, created_by)
  values (org_name, auth.uid())
  returning id into new_org_id;

  -- Insert Member as Owner
  insert into public.organization_members (org_id, user_id, role)
  values (new_org_id, auth.uid(), 'owner');

  return new_org_id;
end;
$$;
