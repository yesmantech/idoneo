-- Create question_reports table
create table if not exists public.question_reports (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.profiles(id) on delete set null,
    question_id text not null, -- Assuming question IDs are text/string from imports
    reason text not null,
    description text,
    status text default 'pending' check (status in ('pending', 'resolved', 'dismissed')),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    resolved_at timestamp with time zone,
    resolved_by uuid references public.profiles(id) on delete set null
);

-- Enable RLS
alter table public.question_reports enable row level security;

-- Policies
create policy "Users can insert their own reports"
    on public.question_reports for insert
    with check (auth.uid() = user_id);

create policy "Users can view their own reports"
    on public.question_reports for select
    using (auth.uid() = user_id);

create policy "Admins can view and update all reports"
    on public.question_reports for all
    using (
        exists (
            select 1 from public.profiles
            where id = auth.uid() and role = 'admin'
        )
    );

-- Add simple index
create index if not exists idx_question_reports_status on public.question_reports(status);
create index if not exists idx_question_reports_question_id on public.question_reports(question_id);
