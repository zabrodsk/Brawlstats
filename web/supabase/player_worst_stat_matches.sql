create table if not exists public.player_worst_stat_matches (
  player_tag text not null,
  battle_time text not null,
  mode text not null,
  map_id text not null,
  team_size integer not null,
  metric_name text not null default 'brawler_trophies',
  player_metric integer,
  team_min_metric integer,
  is_worst_on_team boolean not null default false,
  raw_result jsonb not null default '{}'::jsonb,
  ingested_at timestamptz not null default now(),
  primary key (player_tag, battle_time, mode, map_id)
);

create index if not exists idx_player_worst_stat_matches_player_tag
  on public.player_worst_stat_matches (player_tag, battle_time desc);
