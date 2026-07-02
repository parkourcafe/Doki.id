-- =====================================================================
-- Career MVP v2 (hardening). Additive on top of 20260701000000_career_mvp.
-- Adds: source + ip_hash on applications, UNIQUE(vacancy_id, whatsapp),
-- vacancies.views_count, anti-spam/duplicate RPCs, "candidates see own
-- applications" policy, and a rewritten submit_application that enforces
-- rate-limit + duplicate atomically and records source/ip_hash.
-- =====================================================================

-- ---------------------------- Columns ---------------------------------
alter table applications add column if not exists source text not null default 'direct';
do $$ begin
  alter table applications add constraint applications_source_check
    check (source in ('wa','ig','qr','direct','other'));
exception when duplicate_object then null; end $$;

alter table applications add column if not exists ip_hash text;

alter table vacancies add column if not exists views_count integer not null default 0;

-- Anti-duplicate: one application per phone per vacancy.
do $$ begin
  alter table applications add constraint uq_application_per_phone
    unique (vacancy_id, whatsapp);
-- unique constraint creates a backing index of the same name; a re-run
-- raises duplicate_table (42P07) on that index, not duplicate_object.
exception when duplicate_object or duplicate_table then null; end $$;

-- Rate-limit lookup index (ip_hash + recent time).
create index if not exists idx_applications_ip_hash_created
  on applications(ip_hash, created_at);

-- Candidates who created an account can see their own applications.
do $$ begin
  create policy "candidates see own applications" on applications for select
    using (user_id = (select auth.uid()));
exception when duplicate_object then null; end $$;

-- ---------------------------- RPCs ------------------------------------

-- Atomic view counter (anon allowed) — called on apply page load.
create or replace function increment_vacancy_views(p_slug text)
returns void language sql security definer set search_path = public as $$
  update vacancies set views_count = views_count + 1
  where slug = p_slug and status = 'active';
$$;
grant execute on function increment_vacancy_views(text) to anon, authenticated;

-- Duplicate lookup for the friendly "already applied" flow.
create or replace function find_existing_application(p_vacancy_id uuid, p_whatsapp text)
returns text language sql security definer set search_path = public as $$
  select access_token from applications
  where vacancy_id = p_vacancy_id and whatsapp = p_whatsapp
  limit 1;
$$;
grant execute on function find_existing_application(uuid,text) to anon, authenticated;

-- Client precheck (before uploading files): duplicate + IP rate limit.
-- Returns { duplicate, access_token, rate_limited }.
create or replace function precheck_application(
  p_slug text, p_whatsapp text, p_ip_hash text
) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_vac_id uuid; v_token text; v_recent int;
begin
  select id into v_vac_id from vacancies where slug = p_slug and status = 'active';
  if v_vac_id is null then return jsonb_build_object('not_found', true); end if;

  if p_ip_hash is not null then
    select count(*) into v_recent from applications
    where ip_hash = p_ip_hash and created_at > now() - interval '1 hour';
    if v_recent >= 5 then
      return jsonb_build_object('rate_limited', true);
    end if;
  end if;

  select access_token into v_token from applications
  where vacancy_id = v_vac_id and whatsapp = p_whatsapp limit 1;
  if v_token is not null then
    return jsonb_build_object('duplicate', true, 'access_token', v_token);
  end if;

  return jsonb_build_object('ok', true);
end; $$;
grant execute on function precheck_application(text,text,text) to anon, authenticated;

-- Rewritten submit: enforces rate-limit + duplicate atomically, records
-- source + ip_hash. Order per spec: rate limit → duplicate → create.
drop function if exists submit_application(uuid,text,text,text,text,text,jsonb,jsonb);
create or replace function submit_application(
  p_application_id uuid,
  p_slug text,
  p_full_name text,
  p_whatsapp text,
  p_email text,
  p_consent_text text,
  p_answers jsonb default '[]',
  p_documents jsonb default '[]',
  p_source text default 'direct',
  p_ip_hash text default null,
  p_user_id uuid default null
) returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare
  v_vac vacancies;
  v_token text;
  v_recent int;
  v_emp_email text;
  rec jsonb;
begin
  select * into v_vac from vacancies where slug = p_slug and status = 'active';
  if not found then raise exception 'vacancy not found'; end if;
  select contact_email into v_emp_email from employer_profiles where id = v_vac.employer_id;

  if coalesce(trim(p_full_name),'') = '' then raise exception 'full_name required'; end if;
  if coalesce(trim(p_whatsapp),'') = '' then raise exception 'whatsapp required'; end if;
  if coalesce(trim(p_consent_text),'') = '' then raise exception 'consent required'; end if;

  -- Rate limit (backstop; UI prechecks too).
  if p_ip_hash is not null then
    select count(*) into v_recent from applications
    where ip_hash = p_ip_hash and created_at > now() - interval '1 hour';
    if v_recent >= 5 then raise exception 'rate_limited'; end if;
  end if;

  -- Duplicate: return existing token instead of a second row.
  select access_token into v_token from applications
  where vacancy_id = v_vac.id and whatsapp = trim(p_whatsapp) limit 1;
  if v_token is not null then
    return jsonb_build_object('duplicate', true, 'access_token', v_token);
  end if;

  insert into applications(
    id, vacancy_id, full_name, whatsapp, email, consent_text, user_id,
    source, ip_hash
  ) values (
    p_application_id, v_vac.id, trim(p_full_name), trim(p_whatsapp),
    nullif(trim(coalesce(p_email,'')),''), p_consent_text,
    coalesce(p_user_id, auth.uid()),
    case when p_source in ('wa','ig','qr','direct','other') then p_source else 'direct' end,
    p_ip_hash
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

  return jsonb_build_object(
    'duplicate', false,
    'application_id', p_application_id,
    'access_token', v_token,
    'vacancy_id', v_vac.id,
    'employer_email', v_emp_email,
    'vacancy_title', v_vac.title,
    'company_name', v_vac.company_name
  );
end; $$;
grant execute on function submit_application(uuid,text,text,text,text,text,jsonb,jsonb,text,text,uuid) to anon, authenticated;

-- Claim an anonymous application after the candidate signs up: link user_id.
-- (File copy into the vault is done app-side with the service role.)
create or replace function claim_application(p_token text)
returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare a applications;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  select * into a from applications where access_token = p_token;
  if not found then return jsonb_build_object('ok', false); end if;
  if a.user_id is null then
    update applications set user_id = auth.uid(), updated_at = now()
    where id = a.id;
  end if;
  return jsonb_build_object('ok', true, 'application_id', a.id, 'already', a.user_id is not null);
end; $$;
grant execute on function claim_application(text) to authenticated;
