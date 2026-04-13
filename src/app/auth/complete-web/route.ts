import { handleAuthCodeExchange } from "@/lib/auth/handle-auth-code-exchange";

export async function GET(request: Request) {
  return handleAuthCodeExchange(request);
}
