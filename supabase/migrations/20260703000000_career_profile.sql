-- =====================================================================
-- Career v3: расширенный профиль кандидата (все поля необязательные) —
-- соцсети, опыт, референс, адрес, зарплата, дата выхода. Хранится в
-- applications.profile (jsonb). submit_application принимает p_profile.
-- Идемпотентно; дополняет v2. Существующее не ломает.
-- =====================================================================

alter table applications add column if not exists profile jsonb not null default '{}'::jsonb;

-- Пересоздаём submit_application с параметром p_profile (снимаем прежние сигнатуры).
drop function if exists submit_application(uuid,text,text,text,text,text,jsonb,jsonb);
drop function if exists submit_application(uuid,text,text,text,text,text,jsonb,jsonb,text,text,uuid);

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
  p_user_id uuid default null,
  p_profile jsonb default '{}'
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

  if p_ip_hash is not null then
    select count(*) into v_recent from applications
    where ip_hash = p_ip_hash and created_at > now() - interval '1 hour';
    if v_recent >= 5 then raise exception 'rate_limited'; end if;
  end if;

  select access_token into v_token from applications
  where vacancy_id = v_vac.id and whatsapp = trim(p_whatsapp) limit 1;
  if v_token is not null then
    return jsonb_build_object('duplicate', true, 'access_token', v_token);
  end if;

  insert into applications(
    id, vacancy_id, full_name, whatsapp, email, consent_text, user_id,
    source, ip_hash, profile
  ) values (
    p_application_id, v_vac.id, trim(p_full_name), trim(p_whatsapp),
    nullif(trim(coalesce(p_email,'')),''), p_consent_text, coalesce(p_user_id, auth.uid()),
    case when p_source in ('wa','ig','qr','direct','other') then p_source else 'direct' end,
    p_ip_hash, coalesce(p_profile,'{}'::jsonb)
  ) returning access_token into v_token;

  for rec in select * from jsonb_array_elements(coalesce(p_documents,'[]'::jsonb)) loop
    insert into application_documents(application_id, document_type, document_label, file_path, file_name, file_size)
    values (p_application_id, coalesce(rec->>'type','other'),
      coalesce(rec->>'label', rec->>'type', 'Document'), rec->>'path',
      coalesce(rec->>'name','file'), nullif(rec->>'size','')::int);
  end loop;

  for rec in select * from jsonb_array_elements(coalesce(p_answers,'[]'::jsonb)) loop
    insert into application_answers(application_id, question, question_type, answer)
    values (p_application_id, coalesce(rec->>'question',''),
      coalesce(rec->>'type','text'), coalesce(rec->>'answer',''));
  end loop;

  insert into application_status_log(application_id, old_status, new_status)
  values (p_application_id, null, 'new');

  return jsonb_build_object('duplicate', false, 'application_id', p_application_id,
    'access_token', v_token, 'vacancy_id', v_vac.id, 'employer_email', v_emp_email,
    'vacancy_title', v_vac.title, 'company_name', v_vac.company_name);
end; $$;
grant execute on function submit_application(uuid,text,text,text,text,text,jsonb,jsonb,text,text,uuid,jsonb) to anon, authenticated;
