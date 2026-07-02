import { redirect } from "next/navigation";

// Корень ведёт в кабинет работодателя (не залогинен → /login).
export default function Home() {
  redirect("/employer");
}
