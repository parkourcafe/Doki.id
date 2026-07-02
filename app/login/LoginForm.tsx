"use client";

import { useActionState, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { login, signup, type AuthState } from "./actions";
import type { Locale } from "@/lib/i18n";

const initial: AuthState = {};

const M = {
  ru: {
    googleSignIn: "Войти через Google", enterEmail: "Введите email.",
    resetSent: "Если такой email есть — мы отправили ссылку для сброса пароля. Проверьте почту (и «Спам»).",
    backToLogin: "← Вернуться ко входу", resetHint: "Укажите email — пришлём ссылку, чтобы задать новый пароль.",
    email: "Email", sending: "Отправляю…", sendLink: "Прислать ссылку", password: "Пароль",
    forgotPassword: "Забыли пароль?", submitting: "Минутку…", signIn: "Войти", createAccount: "Создать аккаунт",
    noAccount: "Нет аккаунта? ", haveAccount: "Уже есть аккаунт? ", signUp: "Зарегистрироваться", or: "или",
  },
  en: {
    googleSignIn: "Sign in with Google", enterEmail: "Enter your email.",
    resetSent: "If that email exists, we've sent a password reset link. Check your inbox (and “Spam”).",
    backToLogin: "← Back to sign in", resetHint: "Enter your email — we'll send a link to set a new password.",
    email: "Email", sending: "Sending…", sendLink: "Send link", password: "Password",
    forgotPassword: "Forgot password?", submitting: "Just a moment…", signIn: "Sign in", createAccount: "Create account",
    noAccount: "No account? ", haveAccount: "Already have an account? ", signUp: "Sign up", or: "or",
  },
  id: {
    googleSignIn: "Masuk dengan Google", enterEmail: "Masukkan email Anda.",
    resetSent: "Jika email itu ada, kami kirim tautan reset kata sandi. Periksa kotak masuk (dan “Spam”).",
    backToLogin: "← Kembali ke masuk", resetHint: "Masukkan email — kami kirim tautan untuk kata sandi baru.",
    email: "Email", sending: "Mengirim…", sendLink: "Kirim tautan", password: "Kata sandi",
    forgotPassword: "Lupa kata sandi?", submitting: "Sebentar…", signIn: "Masuk", createAccount: "Buat akun",
    noAccount: "Belum punya akun? ", haveAccount: "Sudah punya akun? ", signUp: "Daftar", or: "atau",
  },
  uz: {
    googleSignIn: "Google orqali kirish", enterEmail: "Emailingizni kiriting.",
    resetSent: "Agar bunday email boʻlsa, parol tiklash havolasini yubordik. Pochtangizni (va “Spam”) tekshiring.",
    backToLogin: "← Kirishga qaytish", resetHint: "Emailingizni kiriting — yangi parol uchun havola yuboramiz.",
    email: "Email", sending: "Yuborilmoqda…", sendLink: "Havola yuborish", password: "Parol",
    forgotPassword: "Parolni unutdingizmi?", submitting: "Bir lahza…", signIn: "Kirish", createAccount: "Hisob yaratish",
    noAccount: "Hisobingiz yoʻqmi? ", haveAccount: "Hisobingiz bormi? ", signUp: "Roʻyxatdan oʻtish", or: "yoki",
  },
} as const;

function GoogleButton({ locale, next }: { locale: Locale; next?: string }) {
  const t = M[locale];
  async function google() {
    const supabase = getSupabaseBrowser();
    const callback = new URL("/auth/callback", window.location.origin);
    if (next) callback.searchParams.set("next", next);
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callback.toString() },
    });
  }
  return (
    <button
      type="button"
      onClick={google}
      className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
    >
      <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
        <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z" />
        <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z" />
        <path fill="#FBBC05" d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33z" />
        <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z" />
      </svg>
      {t.googleSignIn}
    </button>
  );
}

function ResetRequest({ onBack, locale }: { onBack: () => void; locale: Locale }) {
  const t = M[locale];
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!email.trim()) return setErr(t.enterEmail);
    setBusy(true);
    const supabase = getSupabaseBrowser();
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/login`,
    });
    setBusy(false);
    if (error) setErr(error.message);
    else setSent(true);
  }

  if (sent) {
    return (
      <div className="space-y-4 text-sm">
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-emerald-700">{t.resetSent}</p>
        <button onClick={onBack} className="font-medium text-brand-600 hover:underline">
          {t.backToLogin}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <p className="text-sm text-slate-500">{t.resetHint}</p>
      <div>
        <label className="label" htmlFor="reset-email">{t.email}</label>
        <input id="reset-email" type="email" autoComplete="email" required value={email}
          onChange={(e) => setEmail(e.target.value)} className="input" placeholder="you@example.com" />
      </div>
      {err && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>}
      <button type="submit" disabled={busy} className="btn-primary w-full">
        {busy ? t.sending : t.sendLink}
      </button>
      <p className="text-center text-sm">
        <button type="button" onClick={onBack} className="font-medium text-brand-600 hover:underline">
          {t.backToLogin}
        </button>
      </p>
    </form>
  );
}

export default function LoginForm({ locale, next = "" }: { locale: Locale; next?: string }) {
  const t = M[locale];
  const [mode, setMode] = useState<"login" | "signup" | "reset">("login");
  const action = mode === "signup" ? signup : login;
  const [state, formAction, pending] = useActionState(action, initial);

  if (mode === "reset") return <ResetRequest onBack={() => setMode("login")} locale={locale} />;

  return (
    <div className="space-y-4">
      <GoogleButton locale={locale} next={next} />

      <div className="flex items-center gap-3 text-xs text-slate-400">
        <span className="h-px flex-1 bg-slate-200" /> {t.or}{" "}
        <span className="h-px flex-1 bg-slate-200" />
      </div>

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="next" value={next} />
        <div>
          <label className="label" htmlFor="email">{t.email}</label>
          <input id="email" name="email" type="email" autoComplete="email" required
            className="input" placeholder="you@example.com" />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <label className="label" htmlFor="password">{t.password}</label>
            {mode === "login" && (
              <button type="button" onClick={() => setMode("reset")}
                className="text-xs font-medium text-brand-600 hover:underline">
                {t.forgotPassword}
              </button>
            )}
          </div>
          <input id="password" name="password" type="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"} required
            minLength={mode === "signup" ? 8 : undefined} className="input" placeholder="••••••••" />
        </div>

        {state.error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
        )}
        {state.message && (
          <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{state.message}</p>
        )}

        <button type="submit" disabled={pending} className="btn-primary w-full">
          {pending ? t.submitting : mode === "login" ? t.signIn : t.createAccount}
        </button>

        <p className="text-center text-sm text-slate-500">
          {mode === "login" ? t.noAccount : t.haveAccount}
          <button type="button" onClick={() => setMode(mode === "login" ? "signup" : "login")}
            className="font-medium text-brand-600 hover:underline">
            {mode === "login" ? t.signUp : t.signIn}
          </button>
        </p>
      </form>
    </div>
  );
}
