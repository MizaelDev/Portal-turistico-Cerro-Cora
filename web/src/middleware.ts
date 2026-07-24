import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from "@/lib/supabase";

function getAdminSessionMaxMs() {
  const configuredHours = Number(process.env.ADMIN_SESSION_MAX_HOURS || 12);
  const hours = Number.isFinite(configuredHours)
    ? Math.min(Math.max(configuredHours, 1), 168)
    : 12;

  return hours * 60 * 60 * 1000;
}

function redirectWithCookies(
  request: NextRequest,
  response: NextResponse,
  pathname: string,
  params?: Record<string, string>,
) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";

  for (const [key, value] of Object.entries(params || {})) {
    url.searchParams.set(key, value);
  }

  const redirectResponse = NextResponse.redirect(url);
  response.cookies.getAll().forEach((cookie) => redirectResponse.cookies.set(cookie));
  return redirectResponse;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAdminRoute = pathname.startsWith("/admin");
  const isLoginRoute = pathname === "/admin/login";

  if (!isAdminRoute) {
    return NextResponse.next();
  }

  if (!isSupabaseConfigured || !supabaseUrl || !supabaseAnonKey) {
    if (isLoginRoute) {
      return NextResponse.next();
    }

    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.searchParams.set("setup", "1");
    return NextResponse.redirect(url);
  }

  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        response = NextResponse.next({
          request,
        });

        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, {
            ...options,
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
          });
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !isLoginRoute) {
    return redirectWithCookies(request, response, "/admin/login", {
      redirectedFrom: pathname,
    });
  }

  if (user) {
    const signedInAt = Date.parse(user.last_sign_in_at || "");
    const sessionExpired =
      Number.isFinite(signedInAt) && Date.now() - signedInAt > getAdminSessionMaxMs();

    if (sessionExpired) {
      await supabase.auth.signOut();

      if (isLoginRoute) {
        return response;
      }

      return redirectWithCookies(request, response, "/admin/login", {
        expired: "1",
      });
    }

    const { data: isAdmin, error: adminError } = await supabase.rpc("is_admin", {
      user_id: user.id,
    });

    if (adminError || isAdmin !== true) {
      await supabase.auth.signOut();

      if (isLoginRoute) {
        return response;
      }

      return redirectWithCookies(request, response, "/admin/login", {
        unauthorized: "1",
      });
    }
  }

  if (user && isLoginRoute) {
    return redirectWithCookies(request, response, "/admin");
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
