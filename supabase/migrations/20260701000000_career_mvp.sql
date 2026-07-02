-- =====================================================================
-- Career MVP: apply-layer for vacancies (employers) + applications
-- (candidates). See CLAUDE.md. Public/anon flows go through SECURITY
-- DEFINER RPCs (as with get_shared_document) so no service_role is needed;
-- consent is stored inline on the application row (consent_text /
-- consent_given_at) to avoid clashing with the household-scoped `consents`.
-- =====================================================================

-- ---------------------------- Таблицы ---------------------------------

-- Профиль работодателя (1:1 с auth.users)
create table employer_profiles (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid references auth.users(id) on delete cascade not null unique,
  company_name   text not null,
  company_logo_url text,
  contact_whatsapp text,
  contact_email  text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- Вакансии
create table vacancies (
  id             uuid primary key default gen_random_uuid(),
  employer_id    uuid references employer_profiles(id) on delete cascade not null,
  title          text not null,
  slug           text not null unique,
  company_name   text not null,
  location       text,
  salary_range   text,
  schedule       text,
  description    text,
  urgency        text not null default 'normal' check (urgency in ('normal','hiring_now')),
  required_documents  jsonb not null default '[]',
  screening_questions jsonb not null default '[]',
  status         text not null default 'active' check (status in ('active','paused','closed')),
  closes_at      timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index on vacancies(employer_id);
create index on vacancies(slug);

-- Отклики (кандидат может не иметь аккаунта Doki)
create table applications (
  id             uuid primary key default gen_random_uuid(),
  vacancy_id     uuid references vacancies(id) on delete cascade not null,
  user_id        uuid references auth.users(id) on delete set null,
  full_name      text not null,
  whatsapp       text not null,
  email          text,
  status         text not null default 'new' check (status in ('new','viewed','shortlisted','rejected')),
  -- Секретный токен для страницы статуса (без авторизации)
  access_token   text not null default encode(gen_random_bytes(32), 'hex'),
  consent_given_at timestamptz not null default now(),
  consent_text   text not null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index on applications(vacancy_id);
create index on applications(access_token);

-- Документы отклика
create table application_documents (
  id             uuid primary key default gen_random_uuid(),
  application_id uuid references applications(id) on delete cascade not null,
  document_type  text not null,
  document_label text not null,
  file_path      text not null,
  file_name      text not null,
  file_size      integer,
  uploaded_at    timestamptz not null default now()
);
create index on application_documents(application_id);

-- Ответы на скрининг-вопросы
create table application_answers (
  id             uuid primary key default gen_random_uuid(),
  application_id uuid references applications(id) on delete cascade not null,
  question       text not null,
  question_type  text not null default 'text',
  answer         text not null,
  created_at     timestamptz not null default now()
);
create index on application_answers(application_id);

-- Журнал смены статуса (таймлайн для страницы статуса)
create table application_status_log (
  id             uuid primary key default gen_random_uuid(),
  application_id uuid references applications(id) on delete cascade not null,
  old_status     text,
  new_status     text not null,
  changed_by     uuid references auth.users(id),
  created_at     timestamptz not null default now()
);
create index on application_status_log(application_id);

-- =====================================================================
-- RLS
-- =====================================================================
alter table employer_profiles      enable row level security;
alter table vacancies              enable row level security;
alter table applications           enable row level security;
alter table application_documents  enable row level security;
alter table application_answers    enable row level security;
alter table application_status_log enable row level security;

-- employer_profiles: пользователь управляет только своим профилем
create policy "employers manage own profile" on employer_profiles for all
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- vacancies: любой может читать активные, работодатель — CRUD своих
create policy "anyone reads active vacancies" on vacancies for select
  using (status = 'active');

create policy "employers manage own vacancies" on vacancies for all
  using (employer_id in (
    select id from employer_profiles where user_id = (select auth.uid())
  ))
  with check (employer_id in (
    select id from employer_profiles where user_id = (select auth.uid())
  ));

-- applications: публичная вставка (отклик без авторизации), работодатель
-- видит и меняет статус откликов на свои вакансии
create policy "anyone creates an application" on applications for insert
  with check (true);

create policy "employers read applications for own vacancies" on applications for select
  using (vacancy_id in (
    select id from vacancies where employer_id in (
      select id from employer_profiles where user_id = (select auth.uid())
    )
  ));

create policy "employers update application status" on applications for update
  using (vacancy_id in (
    select id from vacancies where employer_id in (
      select id from employer_profiles where user_id = (select auth.uid())
    )
  ));

-- application_documents: публичная вставка; работодатель читает документы
-- откликов на свои вакансии
create policy "anyone inserts application documents" on application_documents for insert
  with check (true);

create policy "employers read documents for own vacancy applications"
  on application_documents for select
  using (application_id in (
    select id from applications where vacancy_id in (
      select id from vacancies where employer_id in (
        select id from employer_profiles where user_id = (select auth.uid())
      )
    )
  ));

-- application_answers: то же, что и документы
create policy "anyone inserts application answers" on application_answers for insert
  with check (true);

create policy "employers read answers for own vacancy applications"
  on application_answers for select
  using (application_id in (
    select id from applications where vacancy_id in (
      select id from vacancies where employer_id in (
        select id from employer_profiles where user_id = (select auth.uid())
      )
    )
  ));

-- application_status_log: работодатель читает журнал своих откликов
create policy "employers read status log for own vacancy applications"
  on application_status_log for select
  using (application_id in (
    select id from applications where vacancy_id in (
      select id from vacancies where employer_id in (
        select id from employer_profiles where user_id = (select auth.uid())
      )
    )
  ));

-- =====================================================================
-- RPC
-- =====================================================================

-- slug из title+company, латиница/цифры через дефис
create or replace function private.career_slugify(p_text text)
returns text language sql immutable set search_path = public as $$
  select trim(both '-' from
    regexp_replace(lower(coalesce(p_text,'')), '[^a-z0-9]+', '-', 'g')
  );
$$;

-- Создать вакансию: проверяет владельца профиля, генерит уникальный slug.
create or replace function create_vacancy(
  p_title text,
  p_company_name text,
  p_location text default null,
  p_salary_range text default null,
  p_schedule text default null,
  p_description text default null,
  p_urgency text default 'normal',
  p_closes_at timestamptz default null,
  p_required_documents jsonb default '[]',
  p_screening_questions jsonb default '[]'
) returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare
  v_employer uuid;
  v_base text;
  v_slug text;
  v_n int := 1;
  v_id uuid;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;

  select id into v_employer from employer_profiles where user_id = auth.uid();
  if v_employer is null then raise exception 'no employer profile'; end if;

  v_base := private.career_slugify(p_title || '-' || p_company_name);
  if v_base is null or v_base = '' then v_base := 'vacancy'; end if;
  v_slug := v_base;
  while exists (select 1 from vacancies where slug = v_slug) loop
    v_n := v_n + 1;
    v_slug := v_base || '-' || v_n;
  end loop;

  insert into vacancies(
    employer_id, title, slug, company_name, location, salary_range, schedule,
    description, urgency, closes_at, required_documents, screening_questions
  ) values (
    v_employer, p_title, v_slug, p_company_name, p_location, p_salary_range,
    p_schedule, p_description,
    case when p_urgency in ('normal','hiring_now') then p_urgency else 'normal' end,
    p_closes_at, coalesce(p_required_documents,'[]'::jsonb),
    coalesce(p_screening_questions,'[]'::jsonb)
  ) returning id into v_id;

  return jsonb_build_object('id', v_id, 'slug', v_slug);
end; $$;
grant execute on function create_vacancy(text,text,text,text,text,text,text,timestamptz,jsonb,jsonb) to authenticated;

-- Публичная подача отклика. Файлы уже загружены в bucket applications под
-- {vacancy_id}/{p_application_id}/... (id генерит клиент). Всё пишем атомарно.
create or replace function submit_application(
  p_application_id uuid,
  p_slug text,
  p_full_name text,
  p_whatsapp text,
  p_email text,
  p_consent_text text,
  p_answers jsonb default '[]',
  p_documents jsonb default '[]'
) returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare
  v_vac vacancies;
  v_token text;
  rec jsonb;
begin
  select * into v_vac from vacancies where slug = p_slug and status = 'active';
  if not found then raise exception 'vacancy not found'; end if;

  if coalesce(trim(p_full_name),'') = '' then raise exception 'full_name required'; end if;
  if coalesce(trim(p_whatsapp),'') = '' then raise exception 'whatsapp required'; end if;
  if coalesce(trim(p_consent_text),'') = '' then raise exception 'consent required'; end if;

  insert into applications(id, vacancy_id, full_name, whatsapp, email, consent_text, user_id)
  values (
    p_application_id, v_vac.id, trim(p_full_name), trim(p_whatsapp),
    nullif(trim(coalesce(p_email,'')),''), p_consent_text, auth.uid()
  )
  returning access_token into v_token;

  for rec in select * from jsonb_array_elements(coalesce(p_documents,'[]'::jsonb)) loop
    insert into application_documents(application_id, document_type, document_label, file_path, file_name, file_size)
    values (
      p_application_id,
      coalesce(rec->>'type','other'),
      coalesce(rec->>'label', rec->>'type', 'Document'),
      rec->>'path',
      coalesce(rec->>'name','file'),
      nullif(rec->>'size','')::int
    );
  end loop;

  for rec in select * from jsonb_array_elements(coalesce(p_answers,'[]'::jsonb)) loop
    insert into application_answers(application_id, question, question_type, answer)
    values (
      p_application_id,
      coalesce(rec->>'question',''),
      coalesce(rec->>'type','text'),
      coalesce(rec->>'answer','')
    );
  end loop;

  insert into application_status_log(application_id, old_status, new_status)
  values (p_application_id, null, 'new');

  return jsonb_build_object('application_id', p_application_id, 'access_token', v_token);
end; $$;
grant execute on function submit_application(uuid,text,text,text,text,text,jsonb,jsonb) to anon, authenticated;

-- Работодатель меняет статус отклика (с проверкой владения и логом).
create or replace function update_application_status(
  p_application_id uuid,
  p_new_status text
) returns text language plpgsql volatile security definer set search_path = public as $$
declare
  v_owner uuid;
  v_old text;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  if p_new_status not in ('new','viewed','shortlisted','rejected') then
    raise exception 'invalid status';
  end if;

  select ep.user_id, a.status into v_owner, v_old
  from applications a
  join vacancies v on v.id = a.vacancy_id
  join employer_profiles ep on ep.id = v.employer_id
  where a.id = p_application_id;

  if v_owner is null or v_owner <> auth.uid() then raise exception 'not authorized'; end if;
  if v_old = p_new_status then return v_old; end if;

  -- Разрешённые переходы: new→viewed/shortlisted/rejected,
  -- viewed→shortlisted/rejected, shortlisted→rejected. Обратного нет.
  if not (
    (v_old = 'new'         and p_new_status in ('viewed','shortlisted','rejected')) or
    (v_old = 'viewed'      and p_new_status in ('shortlisted','rejected')) or
    (v_old = 'shortlisted' and p_new_status = 'rejected')
  ) then
    raise exception 'transition not allowed: % -> %', v_old, p_new_status;
  end if;

  update applications set status = p_new_status, updated_at = now()
  where id = p_application_id;

  insert into application_status_log(application_id, old_status, new_status, changed_by)
  values (p_application_id, v_old, p_new_status, auth.uid());

  return p_new_status;
end; $$;
grant execute on function update_application_status(uuid,text) to authenticated;

-- Автопометка «просмотрено» при первом открытии карточки (new→viewed).
create or replace function mark_application_viewed(p_application_id uuid)
returns void language plpgsql volatile security definer set search_path = public as $$
declare v_owner uuid; v_old text;
begin
  if auth.uid() is null then return; end if;
  select ep.user_id, a.status into v_owner, v_old
  from applications a
  join vacancies v on v.id = a.vacancy_id
  join employer_profiles ep on ep.id = v.employer_id
  where a.id = p_application_id;
  if v_owner is null or v_owner <> auth.uid() then return; end if;
  if v_old <> 'new' then return; end if;

  update applications set status = 'viewed', updated_at = now() where id = p_application_id;
  insert into application_status_log(application_id, old_status, new_status, changed_by)
  values (p_application_id, 'new', 'viewed', auth.uid());
end; $$;
grant execute on function mark_application_viewed(uuid) to authenticated;

-- Публичная страница статуса по секретному токену.
create or replace function get_application_status(p_token text)
returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare a applications; v vacancies; timeline jsonb;
begin
  select * into a from applications where access_token = p_token;
  if not found then return null; end if;
  select * into v from vacancies where id = a.vacancy_id;

  select coalesce(jsonb_agg(jsonb_build_object(
           'old_status', l.old_status, 'new_status', l.new_status,
           'created_at', l.created_at) order by l.created_at), '[]'::jsonb)
    into timeline
  from application_status_log l where l.application_id = a.id;

  return jsonb_build_object(
    'status', a.status,
    'full_name', a.full_name,
    'created_at', a.created_at,
    'vacancy', jsonb_build_object(
      'title', v.title, 'company_name', v.company_name,
      'location', v.location, 'slug', v.slug),
    'employer_contact', case when a.status = 'shortlisted'
      then (select jsonb_build_object('whatsapp', ep.contact_whatsapp, 'email', ep.contact_email)
            from employer_profiles ep where ep.id = v.employer_id)
      else null end,
    'timeline', timeline
  );
end; $$;
grant execute on function get_application_status(text) to anon, authenticated;

-- =====================================================================
-- Storage: приватный bucket applications (10MB, pdf/jpg/png)
-- =====================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'applications', 'applications', false, 10485760,
  array['application/pdf','image/jpeg','image/png']
)
on conflict (id) do update set
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Кто угодно (в т.ч. anon) может загрузить файл, но только в папку активной
-- вакансии: первый сегмент пути должен быть id существующей активной вакансии.
create policy "applications public upload" on storage.objects for insert
  with check (
    bucket_id = 'applications'
    and (storage.foldername(name))[1]::uuid in (select id from vacancies where status = 'active')
  );

-- Читать/подписывать файлы может только владелец вакансии.
create policy "applications owner read" on storage.objects for select
  using (
    bucket_id = 'applications'
    and (storage.foldername(name))[1]::uuid in (
      select v.id from vacancies v
      join employer_profiles ep on ep.id = v.employer_id
      where ep.user_id = (select auth.uid())
    )
  );
