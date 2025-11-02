import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

type SupabaseCookie = {
  name: string;
  value: string;
  options: object;
};

export const updateSession = async (request: NextRequest) => {
  const response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: SupabaseCookie[]) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // OPTIONAL: protect the account page
  if (request.nextUrl.pathname.startsWith("/account") && !user) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  // OPTIONAL: redirect away from sign-in if already signed in
  if (request.nextUrl.pathname === "/sign-in" && user) {
    return NextResponse.redirect(new URL("/account", request.url));
  }

  return response;
};

export const config = {
  matcher: ["/account/:path*", "/reset-password", "/sign-in", "/sign-up"],
};
