import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Usiamo prima le ENV, se mancano usiamo i valori di backup
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://yansgitqqrcovwukvpfm.supabase.co';

const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlhbnNnaXRxcXJjb3Z3dWt2cGZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwNzQ5NzcsImV4cCI6MjA3OTY1MDk3N30.TbLgWITo0hvw1Vl9OY-Y_hbrU-y6cfKEnkMZhvG9bcQ';

export async function middleware(request: NextRequest) {
  // Risposta di base
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  // Client Supabase lato server/edge
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          request.cookies.set(name, value)
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  // Prendiamo l’utente corrente (se c’è)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const url = request.nextUrl;
  const isLoginPage = url.pathname.startsWith('/login');

  const isPublicAsset =
    url.pathname.startsWith('/_next') ||
    url.pathname.startsWith('/static') ||
    url.pathname.includes('.');

  // Se NON loggato e non è /login e non è asset → manda a /login
  if (!user && !isLoginPage && !isPublicAsset) {
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Se loggato e sta cercando /login → mandalo in home
  if (user && isLoginPage) {
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  return response;
}

// Applica il middleware a tutte le route tranne asset statici
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
