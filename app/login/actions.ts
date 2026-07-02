"use server";

import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/server";
import { getLocale } from "@/lib/i18n";
import { safeNextPath } from "@/lib/nextPath";

export type AuthState = { error?: string; message?: string };

const M = {
  ru: {
    missingCredentials: "Введите email и пароль.",
    signupRequirements: "Email и пароль (от 8 символов) обязательны.",
    confirmEmail: "Аккаунт создан. Подтвердите email по ссылке из письма, затем войдите.",
    invalidCredentials: "Неверный email или пароль.",
    emailNotConfirmed: "Сначала подтвердите email по ссылке из письма.",
    alreadyRegistered: "Аккаунт с таким email уже существует — войдите.",
    rateLimit: "Слишком много попыток. Подождите немного и попробуйте снова.",
    weakPassword: "Пароль слишком простой — минимум 8 символов.",
    loginFailed: "Не удалось войти. Проверьте данные и попробуйте снова.",
    signupFailed: "Не удалось создать аккаунт. Попробуйте ещё раз.",
  },
  en: {
    missingCredentials: "Enter your email and password.",
    signupRequirements: "Email and password (at least 8 characters) are required.",
    confirmEmail: "Account created. Confirm your email via the link we sent, then sign in.",
    invalidCredentials: "Wrong email or password.",
    emailNotConfirmed: "Please confirm your email via the link we sent first.",
    alreadyRegistered: "An account with this email already exists — sign in.",
    rateLimit: "Too many attempts. Please wait a moment and try again.",
    weakPassword: "Password is too weak — at least 8 characters.",
    loginFailed: "Could not sign in. Check your details and try again.",
    signupFailed: "Could not create the account. Please try again.",
  },
  id: {
    missingCredentials: "Masukkan email dan kata sandi Anda.",
    signupRequirements: "Email dan kata sandi (minimal 8 karakter) wajib diisi.",
    confirmEmail: "Akun berhasil dibuat. Konfirmasikan email Anda lewat tautan yang kami kirim, lalu masuk.",
    invalidCredentials: "Email atau kata sandi salah.",
    emailNotConfirmed: "Konfirmasikan email Anda lewat tautan yang kami kirim dulu.",
    alreadyRegistered: "Akun dengan email ini sudah ada — silakan masuk.",
    rateLimit: "Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.",
    weakPassword: "Kata sandi terlalu lemah — minimal 8 karakter.",
    loginFailed: "Gagal masuk. Periksa data Anda lalu coba lagi.",
    signupFailed: "Gagal membuat akun. Silakan coba lagi.",
  },
  uz: {
    missingCredentials: "Email va parolni kiriting.",
    signupRequirements: "Email va parol (kamida 8 ta belgi) talab qilinadi.",
    confirmEmail: "Hisob yaratildi. Biz yuborgan havola orqali emailingizni tasdiqlang, soʻngra kiring.",
    invalidCredentials: "Email yoki parol notoʻgʻri.",
    emailNotConfirmed: "Avval biz yuborgan havola orqali emailingizni tasdiqlang.",
    alreadyRegistered: "Bu email bilan hisob allaqachon mavjud — kiring.",
    rateLimit: "Juda koʻp urinish. Biroz kuting va qayta urinib koʻring.",
    weakPassword: "Parol juda oddiy — kamida 8 ta belgi.",
    loginFailed: "Kirib boʻlmadi. Maʼlumotlarni tekshirib, qayta urinib koʻring.",
    signupFailed: "Hisob yaratib boʻlmadi. Qaytadan urinib koʻring.",
  },
} as const;

function mapAuthError(
  raw: string,
  t: {
    invalidCredentials: string;
    emailNotConfirmed: string;
    alreadyRegistered: string;
    rateLimit: string;
    weakPassword: string;
  },
  fallback: string
): string {
  const m = raw.toLowerCase();
  if (m.includes("invalid login credentials")) return t.invalidCredentials;
  if (m.includes("email not confirmed")) return t.emailNotConfirmed;
  if (m.includes("already registered") || m.includes("already been registered"))
    return t.alreadyRegistered;
  if (m.includes("rate limit") || m.includes("too many")) return t.rateLimit;
  if (m.includes("password")) return t.weakPassword;
  return fallback;
}

export async function login(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const t = M[await getLocale()];
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: t.missingCredentials };

  const supabase = await getSupabaseServer();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: mapAuthError(error.message, t, t.loginFailed) };
  redirect(safeNextPath(formData.get("next")));
}

export async function signup(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const t = M[await getLocale()];
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || password.length < 8) return { error: t.signupRequirements };

  const supabase = await getSupabaseServer();
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return { error: mapAuthError(error.message, t, t.signupFailed) };
  if (!data.session) return { message: t.confirmEmail };
  redirect(safeNextPath(formData.get("next")));
}

/** Выход из аккаунта. */
export async function signOut() {
  const supabase = await getSupabaseServer();
  await supabase.auth.signOut();
  redirect("/login");
}
