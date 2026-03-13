create table teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  coach_user_id uuid not null,
  branding jsonb not null default '{
    "primaryColor": "#C6FF1A",
    "secondaryColor": "#101726",
    "accentColor": "#84CC16",
    "textOnPrimary": "#081018",
    "logoUrl": null,
    "logoMarkUrl": null,
    "updatedAt": "",
    "updatedBy": "",
    "version": 1
  }'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
