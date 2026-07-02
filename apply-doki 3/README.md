# Doki Hiring — apply-layer (standalone)

Автономное Next.js-приложение карьерного модуля Doki: работодатель создаёт
вакансию → получает ссылку + QR → кандидат откликается **без регистрации** →
работодатель ведёт отклики. Это отдельный проект, не связанный с кодом
основного Doki.help.

Стек: Next.js 15 (App Router) · React 19 · TypeScript · Tailwind · Supabase.

## Экраны
- `/apply/[slug]` — публичная страница отклика (без входа)
- `/employer/vacancies/new` — создание вакансии (нужен вход)
- `/employer/vacancies/[id]` — дашборд откликов (вход + проверка владельца)
- `/applications/status/[token]` — статус отклика по секретному токену (без входа)
- `/login`, `/auth/callback` — вход (Google + email/пароль) через Supabase Auth

## Быстрый старт (локально)
```bash
npm install
cp .env.example .env.local   # заполнить значения
npm run dev                  # http://localhost:3000
```

## Переменные окружения
| Переменная | Назначение |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL проекта Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | publishable/anon-ключ Supabase |
| `NEXT_PUBLIC_APP_URL` | публичный адрес (новый домен) — apply-ссылки и QR |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Cloudflare Turnstile site key (клиент) |
| `TURNSTILE_SECRET_KEY` | Turnstile secret (сервер). Нет ключей → в dev проверка пропускается |
| `IP_HASH_SALT` | соль для хэширования IP (rate limit) |
| `RESEND_API_KEY` | письма работодателю (Resend). Нет ключа → письмо логируется |
| `RESEND_FROM` | адрес отправителя писем |
| `NEXT_PUBLIC_YM_ID` | счётчик Yandex Metrica (опц.) |
| `SUPABASE_SERVICE_ROLE_KEY` | опц. — копирование файлов отклика в vault при регистрации |

Для базового потока service-role не нужен (публичные операции идут через
`SECURITY DEFINER` RPC). Он нужен только для «claim» — переноса файлов в vault.

## База данных
Миграции применять по порядку:
- `20260701000000_career_mvp.sql` — 6 таблиц, RLS, bucket `applications`
  (10MB, pdf/jpg/png), базовые RPC.
- `20260702000000_career_mvp_v2.sql` — hardening: `source` + `ip_hash`,
  `UNIQUE(vacancy_id, whatsapp)`, `vacancies.views_count`, анти-спам RPC
  (`precheck_application`, rate-limit в `submit_application`),
  `increment_vacancy_views`, `find_existing_application`, `claim_application`.

- **Если используете тот же проект Supabase, что и Doki** — миграция уже
  применена, ничего делать не нужно.
- **Если новый проект Supabase:**
  ```bash
  supabase link --project-ref <NEW_REF>
  supabase db push
  ```
  либо выполните SQL из файла миграции в SQL Editor.

## Деплой на Vercel
1. Залить этот каталог в новый GitHub-репозиторий (см. ниже).
2. Vercel → New Project → импортировать репозиторий (Next.js определится сам).
3. Env-переменные (см. таблицу выше) для Production и Preview.
4. Deploy. Затем Settings → Domains → добавить новый домен, настроить DNS.

## Supabase Auth (обязательно для входа)
Supabase → Authentication → URL Configuration:
- **Site URL:** `https://<новый-домен>`
- **Redirect URLs:** добавить `https://<новый-домен>/auth/callback`
  (и `https://<preview>.vercel.app/auth/callback` для превью).
Google-провайдер должен быть включён (Authentication → Providers → Google).

## Залить в новый репозиторий
```bash
cd apply-doki
git init
git add -A
git commit -m "init: Doki Hiring standalone"
git branch -M main
git remote add origin https://github.com/<you>/<new-repo>.git
git push -u origin main
```

Doki.help при этом не затрагивается — это полностью отдельный проект.
