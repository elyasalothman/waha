create table if not exists public_books (
  id uuid primary key,
  owner_id text not null,
  title text not null,
  author text not null,
  category text not null,
  audience text not null,
  cover text not null default '',
  chapters jsonb not null,
  created_at timestamptz not null default now(),
  constraint public_books_chapters_array check (jsonb_typeof(chapters) = 'array')
);
create index if not exists public_books_created_at on public_books(created_at desc);
