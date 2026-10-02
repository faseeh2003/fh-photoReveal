create table if not exists public.puzzles (
  id text primary key,
  image_url text not null,
  grid_size integer not null,
  tiles jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.puzzles enable row level security;

drop policy if exists "Anyone can read puzzles" on public.puzzles;
create policy "Anyone can read puzzles"
on public.puzzles for select
using (true);

drop policy if exists "Anyone can create puzzles" on public.puzzles;
create policy "Anyone can create puzzles"
on public.puzzles for insert
with check (true);
