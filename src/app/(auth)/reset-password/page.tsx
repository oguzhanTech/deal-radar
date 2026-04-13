import { redirect } from "next/navigation";

/** Eski rota: `(auth)` grubu URL'de görünmediği için `/reset-password` idi. Kanonik adres `/auth/reset-password`. */
export default function LegacyResetPasswordRedirect() {
  redirect("/auth/reset-password");
}
