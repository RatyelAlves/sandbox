import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseEnv } from "@/lib/env";

const APP_PREFIXES = ["/descobrir", "/conta", "/chat", "/u"];

function withNoCapture(response: NextResponse) {
  response.headers.set(
    "Permissions-Policy",
    "display-capture=(), camera=(self), microphone=(self)",
  );
  return response;
}

function isAppPath(pathname: string) {
  return APP_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export async function updateSession(request: NextRequest) {
  const env = getSupabaseEnv();
  if (!env) {
    return withNoCapture(NextResponse.next({ request }));
  }

  let supabaseResponse = withNoCapture(NextResponse.next({ request }));

  const supabase = createServerClient(env.url, env.key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        supabaseResponse = withNoCapture(NextResponse.next({ request }));
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname, searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  if ((code || tokenHash) && pathname !== "/auth/callback") {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/callback";
    if (!searchParams.get("next")) {
      url.searchParams.set(
        "next",
        searchParams.get("type") === "recovery" || pathname === "/redefinir-senha"
          ? "/redefinir-senha"
          : "/onboarding",
      );
    }
    return NextResponse.redirect(url);
  }

  const onboarding = pathname === "/onboarding";
  const authPage =
    pathname === "/entrar" ||
    pathname === "/cadastro" ||
    pathname === "/esqueci-senha";
  const appPath = isAppPath(pathname);

  if (!user && (appPath || onboarding)) {
    const url = request.nextUrl.clone();
    url.pathname = "/entrar";
    return NextResponse.redirect(url);
  }

  if (user && authPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/descobrir";
    return NextResponse.redirect(url);
  }

  if (user && (appPath || onboarding)) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile && appPath) {
      const url = request.nextUrl.clone();
      url.pathname = "/onboarding";
      return NextResponse.redirect(url);
    }

    if (profile && onboarding) {
      const url = request.nextUrl.clone();
      url.pathname = "/descobrir";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
