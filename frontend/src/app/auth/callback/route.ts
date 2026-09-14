import { NextResponse } from "next/server";

import { isCuetEmail } from "@/lib/auth/email";
import { getSupabaseServerClient } from "@/lib/supabase/server";

function loginRedirect(request: Request, error: string): NextResponse {
  const url = new URL("/login", request.url);
  url.searchParams.set("error", error);
  return NextResponse.redirect(url);
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (!code) {
    return loginRedirect(request, "oauth_failed");
  }

  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return loginRedirect(request, "oauth_failed");
  }

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !isCuetEmail(userData.user?.email)) {
    await supabase.auth.signOut();
    return loginRedirect(request, "unauthorized_email");
  }

  const next = requestUrl.searchParams.get("next");
  const destination = next?.startsWith("/") ? next : "/dashboard";
  return NextResponse.redirect(new URL(destination, request.url));
}
