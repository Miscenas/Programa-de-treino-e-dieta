-- Create user_measurements table
create table if not exists public.user_measurements (
    id uuid default gen_random_uuid() primary key,
    user_id text not null,
    date date not null,
    weight numeric,
    body_fat numeric,
    waist numeric,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    
    constraint user_measurements_user_id_date_key unique (user_id, date)
);

-- Enable RLS
alter table public.user_measurements enable row level security;

-- Create policies
create policy "Users can view their own measurements"
    on public.user_measurements for select
    using (auth.uid()::text = user_id);

create policy "Users can insert their own measurements"
    on public.user_measurements for insert
    with check (auth.uid()::text = user_id);

create policy "Users can update their own measurements"
    on public.user_measurements for update
    using (auth.uid()::text = user_id);

create policy "Users can delete their own measurements"
    on public.user_measurements for delete
    using (auth.uid()::text = user_id);
