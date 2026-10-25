-- ==============================================================================
-- OUR LITTLE GOALS — DATABASE SCHEMA & RLS POLICIES
-- Couple Savings & Personal Wishlist Platform
-- Users: Lutfi Idham Puro & Thania Al Zahra (Bendahara Umum)
-- ==============================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. PROFILES TABLE
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text not null,
  avatar_url text,
  is_treasurer boolean not null default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. COUPLES TABLE (Ruang Tabungan Pasangan)
create table if not exists public.couples (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  invite_code varchar(10) unique not null,
  treasurer_id uuid references public.profiles(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. COUPLE MEMBERS TABLE
create table if not exists public.couple_members (
  id uuid default gen_random_uuid() primary key,
  couple_id uuid references public.couples(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  role text not null check (role in ('partner', 'treasurer')),
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(couple_id, user_id)
);

-- 4. SAVINGS GOALS (Target Tabungan Bersama)
create table if not exists public.savings_goals (
  id uuid default gen_random_uuid() primary key,
  couple_id uuid references public.couples(id) on delete cascade not null,
  created_by uuid references public.profiles(id) on delete set null not null,
  name text not null,
  description text,
  category text not null check (category in ('liburan', 'kuliner', 'hadiah', 'anniversary', 'transportasi', 'hiburan', 'lainnya')),
  destination text,
  city text,
  photo_url text,
  min_estimate numeric not null default 0 check (min_estimate >= 0),
  max_estimate numeric not null default 0 check (max_estimate >= 0),
  target_amount numeric not null check (target_amount > 0),
  current_amount numeric not null default 0 check (current_amount >= 0),
  start_date date not null default current_date,
  deadline date not null,
  notes text,
  status text not null default 'active' check (status in ('active', 'achieved', 'archived')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. SAVINGS CONTRIBUTIONS (Setoran Tabungan Bersama)
create table if not exists public.savings_contributions (
  id uuid default gen_random_uuid() primary key,
  goal_id uuid references public.savings_goals(id) on delete cascade not null,
  couple_id uuid references public.couples(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  amount numeric not null check (amount > 0),
  status text not null default 'pending' check (status in ('planned', 'pending', 'verified', 'rejected')),
  notes text,
  verified_by uuid references public.profiles(id) on delete set null,
  verified_at timestamp with time zone,
  rejection_reason text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. PERSONAL WISHLISTS (Wishlist Pribadi)
create table if not exists public.personal_wishlists (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  description text,
  photo_url text,
  category text not null default 'Lainnya',
  min_estimate numeric not null default 0,
  max_estimate numeric not null default 0,
  target_amount numeric not null check (target_amount > 0),
  current_amount numeric not null default 0 check (current_amount >= 0),
  deadline date,
  priority text not null default 'sedang' check (priority in ('rendah', 'sedang', 'tinggi')),
  visibility text not null default 'shared' check (visibility in ('private', 'shared')),
  notes text,
  status text not null default 'active' check (status in ('active', 'achieved', 'archived')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. PERSONAL SAVINGS (Alokasi Tabungan ke Wishlist Pribadi)
create table if not exists public.personal_savings (
  id uuid default gen_random_uuid() primary key,
  wishlist_id uuid references public.personal_wishlists(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  amount numeric not null check (amount > 0),
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 8. EXPENSE REQUESTS (Pengajuan Pengeluaran Dana Tabungan Bersama)
create table if not exists public.expense_requests (
  id uuid default gen_random_uuid() primary key,
  couple_id uuid references public.couples(id) on delete cascade not null,
  requested_by uuid references public.profiles(id) on delete cascade not null,
  goal_id uuid references public.savings_goals(id) on delete set null,
  amount numeric not null check (amount > 0),
  reason text not null,
  notes text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  approved_by uuid references public.profiles(id) on delete set null,
  approved_at timestamp with time zone,
  rejection_reason text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 9. NOTIFICATIONS
create table if not exists public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  type text not null,
  title text not null,
  message text not null,
  is_read boolean not null default false,
  reference_id text,
  reference_type text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 10. NOTIFICATION PREFERENCES
create table if not exists public.notification_preferences (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade unique not null,
  reminder_enabled boolean not null default true,
  reminder_hour smallint not null default 9,
  reminder_minute smallint not null default 0,
  push_enabled boolean not null default false,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 11. DAILY SAVING ACTIVITY (Rekam Habit Calendar)
create table if not exists public.daily_saving_activity (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  date date not null default current_date,
  has_saved boolean not null default true,
  total_amount numeric not null default 0,
  unique(user_id, date)
);

-- 12. AUDIT LOGS (Keamanan dan Transparansi)
create table if not exists public.audit_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  action text not null,
  entity_type text not null,
  entity_id text not null,
  details jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

alter table public.profiles enable row level security;
alter table public.couples enable row level security;
alter table public.couple_members enable row level security;
alter table public.savings_goals enable row level security;
alter table public.savings_contributions enable row level security;
alter table public.personal_wishlists enable row level security;
alter table public.personal_savings enable row level security;
alter table public.expense_requests enable row level security;
alter table public.notifications enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.daily_saving_activity enable row level security;
alter table public.audit_logs enable row level security;

-- Profiles: Anyone authenticated can view; only owner can update
create policy "Authenticated users can view profiles" on public.profiles
  for select using (auth.role() = 'authenticated');

create policy "Users can update their own profile" on public.profiles
  for update using (auth.uid() = id);

create policy "Users can insert their own profile" on public.profiles
  for insert with check (auth.uid() = id);

-- Couples: Members can view and update their couple
create policy "Couples viewable by authenticated users" on public.couples
  for select using (auth.role() = 'authenticated');

create policy "Couples can be created by authenticated users" on public.couples
  for insert with check (auth.role() = 'authenticated');

create policy "Couples updatable by members" on public.couples
  for update using (
    exists (
      select 1 from public.couple_members
      where couple_members.couple_id = couples.id
      and couple_members.user_id = auth.uid()
    )
  );

-- Couple Members
create policy "Couple members viewable by members" on public.couple_members
  for select using (auth.role() = 'authenticated');

create policy "Couple members insertable by authenticated users" on public.couple_members
  for insert with check (auth.role() = 'authenticated');

-- Savings Goals
create policy "Savings goals viewable by couple members" on public.savings_goals
  for select using (
    exists (
      select 1 from public.couple_members
      where couple_members.couple_id = savings_goals.couple_id
      and couple_members.user_id = auth.uid()
    )
  );

create policy "Savings goals insertable by couple members" on public.savings_goals
  for insert with check (
    exists (
      select 1 from public.couple_members
      where couple_members.couple_id = savings_goals.couple_id
      and couple_members.user_id = auth.uid()
    )
  );

create policy "Savings goals updatable by couple members" on public.savings_goals
  for update using (
    exists (
      select 1 from public.couple_members
      where couple_members.couple_id = savings_goals.couple_id
      and couple_members.user_id = auth.uid()
    )
  );

create policy "Savings goals deletable by couple members" on public.savings_goals
  for delete using (
    exists (
      select 1 from public.couple_members
      where couple_members.couple_id = savings_goals.couple_id
      and couple_members.user_id = auth.uid()
    )
  );

-- Savings Contributions
create policy "Savings contributions viewable by couple members" on public.savings_contributions
  for select using (
    exists (
      select 1 from public.couple_members
      where couple_members.couple_id = savings_contributions.couple_id
      and couple_members.user_id = auth.uid()
    )
  );

create policy "Savings contributions insertable by couple members" on public.savings_contributions
  for insert with check (
    exists (
      select 1 from public.couple_members
      where couple_members.couple_id = savings_contributions.couple_id
      and couple_members.user_id = auth.uid()
    )
  );

create policy "Savings contributions updatable by couple members" on public.savings_contributions
  for update using (
    exists (
      select 1 from public.couple_members
      where couple_members.couple_id = savings_contributions.couple_id
      and couple_members.user_id = auth.uid()
    )
  );

-- Personal Wishlists
create policy "Personal wishlists viewable by owner or partner if shared" on public.personal_wishlists
  for select using (
    user_id = auth.uid()
    or (
      visibility = 'shared'
      and exists (
        select 1 from public.couple_members cm1
        join public.couple_members cm2 on cm1.couple_id = cm2.couple_id
        where cm1.user_id = auth.uid() and cm2.user_id = personal_wishlists.user_id
      )
    )
  );

create policy "Personal wishlists insertable by owner" on public.personal_wishlists
  for insert with check (user_id = auth.uid());

create policy "Personal wishlists updatable by owner" on public.personal_wishlists
  for update using (user_id = auth.uid());

create policy "Personal wishlists deletable by owner" on public.personal_wishlists
  for delete using (user_id = auth.uid());

-- Personal Savings
create policy "Personal savings viewable by owner" on public.personal_savings
  for select using (user_id = auth.uid());

create policy "Personal savings insertable by owner" on public.personal_savings
  for insert with check (user_id = auth.uid());

-- Expense Requests
create policy "Expense requests viewable by couple members" on public.expense_requests
  for select using (
    exists (
      select 1 from public.couple_members
      where couple_members.couple_id = expense_requests.couple_id
      and couple_members.user_id = auth.uid()
    )
  );

create policy "Expense requests insertable by couple members" on public.expense_requests
  for insert with check (
    exists (
      select 1 from public.couple_members
      where couple_members.couple_id = expense_requests.couple_id
      and couple_members.user_id = auth.uid()
    )
  );

create policy "Expense requests updatable by couple members" on public.expense_requests
  for update using (
    exists (
      select 1 from public.couple_members
      where couple_members.couple_id = expense_requests.couple_id
      and couple_members.user_id = auth.uid()
    )
  );

-- Notifications
create policy "Users can view their own notifications" on public.notifications
  for select using (user_id = auth.uid());

create policy "Users can insert notifications" on public.notifications
  for insert with check (auth.role() = 'authenticated');

create policy "Users can update their own notifications" on public.notifications
  for update using (user_id = auth.uid());

create policy "Users can delete their own notifications" on public.notifications
  for delete using (user_id = auth.uid());

-- Audit Logs
create policy "Audit logs viewable by authenticated users" on public.audit_logs
  for select using (auth.role() = 'authenticated');

create policy "Audit logs insertable by authenticated users" on public.audit_logs
  for insert with check (auth.role() = 'authenticated');

-- Notification Preferences
create policy "Notification preferences viewable by owner" on public.notification_preferences
  for select using (user_id = auth.uid());

create policy "Notification preferences updatable by owner" on public.notification_preferences
  for update using (user_id = auth.uid());

create policy "Notification preferences insertable by owner" on public.notification_preferences
  for insert with check (user_id = auth.uid());

-- Daily Saving Activity
create policy "Daily activity viewable by authenticated users" on public.daily_saving_activity
  for select using (auth.role() = 'authenticated');

create policy "Daily activity insertable by authenticated users" on public.daily_saving_activity
  for insert with check (auth.role() = 'authenticated');

-- ==============================================================================
-- AUTOMATIC PROFILE TRIGGER ON SIGNUP
-- ==============================================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, is_treasurer)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    case
      when lower(coalesce(new.raw_user_meta_data->>'full_name', '')) like '%thania%' then true
      when lower(new.email) like '%thania%' or lower(new.email) like '%nia%' then true
      else false
    end
  );
  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if exists
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
