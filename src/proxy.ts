import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { canAccessPath, getDefaultRouteForRole, normalizeAppRole } from "@/lib/access-control";

const publicRoutes = ["/", "/login", "/signup"];

function hasSupabaseEnv() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

function getFallbackRoleFromMetadata(user: { user_metadata?: unknown }) {
  if (
    user.user_metadata &&
    typeof user.user_metadata === "object" &&
    "auto_customer" in user.user_metadata &&
    user.user_metadata.auto_customer === true
  ) {
    return "customer";
  }

  return "user";
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const forceLogin = request.nextUrl.searchParams.get("force") === "1";

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/api") ||
    /\.[a-zA-Z0-9]+$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  if (!hasSupabaseEnv()) {
    return NextResponse.next();
  }

  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
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
          cookiesToSet.forEach(({ name, options, value }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isPublicRoute = publicRoutes.includes(pathname);

  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (user && (pathname === "/login" || pathname === "/signup") && !forceLogin) {
    const url = request.nextUrl.clone();
    const { data: profile } = await supabase
      .from("users")
      .select("id")
      .eq("auth_user_id", user.id)
      .maybeSingle();
    const { data: roleRows } = profile?.id
      ? await supabase.from("user_roles").select("roles(name)").eq("user_id", profile.id).limit(1)
      : { data: null };
    const rawRole =
      Array.isArray(roleRows) &&
      roleRows[0] &&
      typeof roleRows[0] === "object" &&
      roleRows[0] !== null &&
      "roles" in roleRows[0] &&
      roleRows[0].roles &&
      typeof roleRows[0].roles === "object" &&
      "name" in roleRows[0].roles
        ? String(roleRows[0].roles.name)
        : getFallbackRoleFromMetadata(user);
    url.pathname = getDefaultRouteForRole(rawRole);
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (user && !isPublicRoute) {
    const { data: profile } = await supabase
      .from("users")
      .select("id")
      .eq("auth_user_id", user.id)
      .maybeSingle();
    const { data: roleRows } = profile?.id
      ? await supabase.from("user_roles").select("roles(name)").eq("user_id", profile.id).limit(1)
      : { data: null };
    const rawRole =
      Array.isArray(roleRows) &&
      roleRows[0] &&
      typeof roleRows[0] === "object" &&
      roleRows[0] !== null &&
      "roles" in roleRows[0] &&
      roleRows[0].roles &&
      typeof roleRows[0].roles === "object" &&
      "name" in roleRows[0].roles
        ? String(roleRows[0].roles.name)
        : getFallbackRoleFromMetadata(user);
    const role = normalizeAppRole(rawRole);

    if (!canAccessPath(role, pathname)) {
      const url = request.nextUrl.clone();
      url.pathname = getDefaultRouteForRole(role);
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|supabase-proxy).*)"],
};
