-- Schéma initial muscu-app — à exécuter une fois dans Supabase Dashboard > SQL Editor > Run

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id                  uuid primary key references auth.users(id) on delete cascade,
  email               text,
  first_name          text,
  last_name           text,
  birth_date          date,
  weight_kg           numeric(5,2),
  height_cm           numeric(5,1),
  objective           text check (objective in ('perte_de_poids','entretien','performance')),
  current_frequency   text check (current_frequency in ('0','1-2','3-4','5+')),
  equipment_location  text check (equipment_location in ('salle_de_sport','domicile')),
  home_equipment      text[],
  preferred_days      text[],
  is_premium          boolean not null default false,
  onboarding_completed boolean not null default false,
  created_at          timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, first_name, last_name, birth_date)
  values (new.id, new.email, new.raw_user_meta_data->>'first_name', new.raw_user_meta_data->>'last_name',
          nullif(new.raw_user_meta_data->>'birth_date', '')::date)
  on conflict (id) do nothing;
  return new;
end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create table if not exists public.exercises (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  category    text not null check (category in ('pectoraux','dos','jambes','epaules','bras','abdos','full_body')),
  equipment   text,
  created_at  timestamptz not null default now()
);
alter table public.exercises enable row level security;
create policy "exercises_select_all" on public.exercises for select using (true);

create table if not exists public.workouts (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  date         date not null default current_date,
  started_at   timestamptz not null default now(),
  ended_at     timestamptz,
  status       text not null check (status in ('planifiee','terminee')) default 'planifiee',
  global_rpe   smallint check (global_rpe between 1 and 10),
  created_at   timestamptz not null default now()
);
create index if not exists idx_workouts_user_date on public.workouts (user_id, date desc);
alter table public.workouts enable row level security;
create policy "workouts_select_own" on public.workouts for select using (auth.uid() = user_id);
create policy "workouts_insert_own" on public.workouts for insert with check (auth.uid() = user_id);
create policy "workouts_update_own" on public.workouts for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "workouts_delete_own" on public.workouts for delete using (auth.uid() = user_id);

create table if not exists public.workout_sets (
  id           uuid primary key default gen_random_uuid(),
  workout_id   uuid not null references public.workouts(id) on delete cascade,
  exercise_id  uuid not null references public.exercises(id),
  set_number   smallint not null,
  reps         smallint not null,
  weight_kg    numeric(6,2) not null,
  rpe          smallint check (rpe between 1 and 10),
  created_at   timestamptz not null default now()
);
create index if not exists idx_workout_sets_workout on public.workout_sets (workout_id);
create index if not exists idx_workout_sets_exercise on public.workout_sets (exercise_id);
alter table public.workout_sets enable row level security;
create policy "workout_sets_select_own" on public.workout_sets for select using (
  exists (select 1 from public.workouts w where w.id = workout_sets.workout_id and w.user_id = auth.uid()));
create policy "workout_sets_insert_own" on public.workout_sets for insert with check (
  exists (select 1 from public.workouts w where w.id = workout_sets.workout_id and w.user_id = auth.uid()));
create policy "workout_sets_update_own" on public.workout_sets for update using (
  exists (select 1 from public.workouts w where w.id = workout_sets.workout_id and w.user_id = auth.uid()));
create policy "workout_sets_delete_own" on public.workout_sets for delete using (
  exists (select 1 from public.workouts w where w.id = workout_sets.workout_id and w.user_id = auth.uid()));

create or replace view public.personal_records with (security_invoker = true) as
select w.user_id, ws.exercise_id, max(ws.weight_kg) as poids_max,
       (array_agg(w.date order by ws.weight_kg desc, w.date desc))[1] as date_obtenu
from public.workout_sets ws
join public.workouts w on w.id = ws.workout_id
where w.status = 'terminee'
group by w.user_id, ws.exercise_id;
grant select on public.personal_records to authenticated;

insert into public.exercises (name, category, equipment) values
  ('Développé couché','pectoraux','barre'), ('Développé incliné haltères','pectoraux','halteres'),
  ('Écarté couché','pectoraux','halteres'), ('Pompes','pectoraux','poids du corps'),
  ('Dips pectoraux','pectoraux','poids du corps'), ('Tractions','dos','poids du corps'),
  ('Rowing barre','dos','barre'), ('Tirage vertical','dos','machine'),
  ('Tirage horizontal','dos','machine'), ('Soulevé de terre','dos','barre'),
  ('Rowing haltère','dos','halteres'), ('Squat','jambes','barre'),
  ('Presse à cuisses','jambes','machine'), ('Fentes','jambes','halteres'),
  ('Extension jambes','jambes','machine'), ('Leg curl','jambes','machine'),
  ('Mollets debout','jambes','machine'), ('Développé militaire','epaules','barre'),
  ('Élévations latérales','epaules','halteres'), ('Élévations frontales','epaules','halteres'),
  ('Oiseau (élévations arrière)','epaules','halteres'), ('Curl biceps barre','bras','barre'),
  ('Curl haltères','bras','halteres'), ('Curl marteau','bras','halteres'),
  ('Extension triceps poulie','bras','machine'), ('Dips triceps','bras','poids du corps'),
  ('Crunch','abdos','poids du corps'), ('Gainage (planche)','abdos','poids du corps'),
  ('Relevé de jambes','abdos','poids du corps'), ('Russian twist','abdos','poids du corps'),
  ('Burpees','full_body','poids du corps'), ('Kettlebell swing','full_body','kettlebell'),
  ('Clean and press','full_body','barre')
on conflict (name) do nothing;

-- 2026-07-25 : blocs (supersets) pour les séances générées
alter table public.workout_sets add column if not exists block_label text;

-- 2026-07-25 : photo de fin de séance
alter table public.workouts add column if not exists photo_path text;

insert into storage.buckets (id, name, public)
values ('workout-photos', 'workout-photos', false)
on conflict (id) do nothing;

create policy "workout_photos_select_own" on storage.objects
  for select using (bucket_id = 'workout-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "workout_photos_insert_own" on storage.objects
  for insert with check (bucket_id = 'workout-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "workout_photos_update_own" on storage.objects
  for update using (bucket_id = 'workout-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "workout_photos_delete_own" on storage.objects
  for delete using (bucket_id = 'workout-photos' and (storage.foldername(name))[1] = auth.uid()::text);

-- 2026-07-25 : catalogue — exercices jambes au poids du corps (manquants, gap détecté en test)
insert into public.exercises (name, category, equipment) values
  ('Squat au poids du corps', 'jambes', 'poids du corps'),
  ('Fentes sautées', 'jambes', 'poids du corps'),
  ('Chaise murale', 'jambes', 'poids du corps')
on conflict (name) do nothing;

-- 2026-07-25 : case "série validée" (déclenche le timer de repos côté app)
alter table public.workout_sets add column if not exists completed boolean not null default false;

-- 2026-07-25 : thématiques de génération (haut/bas/dos/abdo-bras) — priorité aux exercices poly-articulaires
alter table public.exercises add column if not exists is_compound boolean not null default false;

update public.exercises set is_compound = true where name in (
  'Développé couché','Développé incliné haltères','Pompes','Dips pectoraux',
  'Tractions','Rowing barre','Tirage vertical','Tirage horizontal','Soulevé de terre','Rowing haltère',
  'Squat','Presse à cuisses','Fentes','Squat au poids du corps','Fentes sautées',
  'Développé militaire',
  'Burpees','Kettlebell swing','Clean and press'
);

insert into public.exercises (name, category, equipment, is_compound) values
  ('Pompes diamant', 'bras', 'poids du corps', false)
on conflict (name) do nothing;

-- 2026-07-25 : niveau d'expérience + zones sensibles (affine la génération)
alter table public.profiles add column if not exists experience_level text check (experience_level in ('debutant','intermediaire','avance'));
alter table public.profiles add column if not exists avoid_zones text[];

alter table public.exercises add column if not exists difficulty text not null default 'intermediaire' check (difficulty in ('debutant','intermediaire','avance'));
alter table public.exercises add column if not exists stresses_joints text[] not null default '{}';

update public.exercises set difficulty = 'avance' where name in ('Soulevé de terre','Clean and press');

update public.exercises set difficulty = 'debutant' where name in (
  'Presse à cuisses','Tirage vertical','Tirage horizontal','Extension jambes','Leg curl','Mollets debout',
  'Extension triceps poulie','Élévations latérales','Élévations frontales','Oiseau',
  'Curl biceps barre','Curl haltères','Curl marteau',
  'Pompes','Squat au poids du corps','Chaise murale','Burpees','Écarté couché',
  'Crunch','Gainage (planche)','Relevé de jambes','Russian twist','Pompes diamant'
);

update public.exercises as e set stresses_joints = v.zones
from (values
  ('Développé couché', array['epaules','poignets']),
  ('Développé incliné haltères', array['epaules','poignets']),
  ('Écarté couché', array['epaules']),
  ('Pompes', array['poignets']),
  ('Pompes diamant', array['poignets','epaules']),
  ('Dips pectoraux', array['epaules']),
  ('Dips triceps', array['epaules','poignets']),
  ('Tractions', array['epaules']),
  ('Rowing barre', array['dos_bas']),
  ('Rowing haltère', array['dos_bas']),
  ('Soulevé de terre', array['dos_bas','genoux']),
  ('Squat', array['genoux','dos_bas']),
  ('Squat au poids du corps', array['genoux']),
  ('Presse à cuisses', array['genoux']),
  ('Fentes', array['genoux']),
  ('Fentes sautées', array['genoux']),
  ('Extension jambes', array['genoux']),
  ('Leg curl', array['genoux']),
  ('Chaise murale', array['genoux']),
  ('Développé militaire', array['epaules']),
  ('Élévations latérales', array['epaules']),
  ('Élévations frontales', array['epaules']),
  ('Curl biceps barre', array['poignets']),
  ('Crunch', array['dos_bas']),
  ('Relevé de jambes', array['dos_bas']),
  ('Russian twist', array['dos_bas']),
  ('Burpees', array['genoux','poignets']),
  ('Kettlebell swing', array['dos_bas']),
  ('Clean and press', array['dos_bas','genoux','epaules','poignets'])
) as v(name, zones)
where e.name = v.name;

-- 2026-07-25 : notification locale associée à une séance programmée
alter table public.workouts add column if not exists notification_id text;

-- 2026-07-25 : réparation — "Pompes diamant" n'avait jamais été inséré (gap bras débutant/domicile)
-- + 2 exercices poids du corps débutant manquants (dos, épaules) détectés en test
insert into public.exercises (name, category, equipment, is_compound, difficulty, stresses_joints) values
  ('Pompes diamant', 'bras', 'poids du corps', false, 'debutant', array['poignets','epaules']),
  ('Rowing inversé', 'dos', 'poids du corps', true, 'debutant', array[]::text[]),
  ('Pompes pike', 'epaules', 'poids du corps', true, 'debutant', array['poignets'])
on conflict (name) do update set
  category = excluded.category,
  equipment = excluded.equipment,
  is_compound = excluded.is_compound,
  difficulty = excluded.difficulty,
  stresses_joints = excluded.stresses_joints;

NOTIFY pgrst, 'reload schema';

-- 2026-07-25 : élargissement du catalogue débutant/poids du corps (profils très restreints : domicile + débutant + zones sensibles)
insert into public.exercises (name, category, equipment, is_compound, difficulty, stresses_joints) values
  ('Pont fessier', 'jambes', 'poids du corps', false, 'debutant', array[]::text[]),
  ('Superman (extension dorsale)', 'dos', 'poids du corps', false, 'debutant', array['dos_bas'])
on conflict (name) do update set
  category = excluded.category,
  equipment = excluded.equipment,
  is_compound = excluded.is_compound,
  difficulty = excluded.difficulty,
  stresses_joints = excluded.stresses_joints;

-- Dips triceps est raisonnablement accessible à un débutant (plus facile que les pompes diamant)
update public.exercises set difficulty = 'debutant' where name = 'Dips triceps';

NOTIFY pgrst, 'reload schema';

-- 2026-07-26 : check-in de forme quotidien — influence le volume et le poids recommandé
-- des séances générées. Une ligne par utilisateur par jour (upsert sur user_id+date).
-- Sens des notes (1-10) : fatigue/haut_du_corps/bas_du_corps = 10 signifie "au plus mal"
-- (très fatigué / très courbaturé) ; morale/motivation/sommeil = 10 signifie "au mieux".
create table if not exists public.daily_checkins (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  date           date not null,
  fatigue        smallint not null check (fatigue between 1 and 10),
  morale         smallint not null check (morale between 1 and 10),
  haut_du_corps  smallint not null check (haut_du_corps between 1 and 10),
  bas_du_corps   smallint not null check (bas_du_corps between 1 and 10),
  motivation     smallint not null check (motivation between 1 and 10),
  sommeil        smallint not null check (sommeil between 1 and 10),
  created_at     timestamptz not null default now(),
  unique (user_id, date)
);
alter table public.daily_checkins enable row level security;
create policy "daily_checkins_select_own" on public.daily_checkins for select using (auth.uid() = user_id);
create policy "daily_checkins_insert_own" on public.daily_checkins for insert with check (auth.uid() = user_id);
create policy "daily_checkins_update_own" on public.daily_checkins for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

NOTIFY pgrst, 'reload schema';
