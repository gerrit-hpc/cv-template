import { NextResponse, type NextRequest } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { sessionOptions, type SessionData } from "@/server/auth/session";

const PUBLIC_PATHS = new Set(["/login", "/api/health"]);

export async function middleware(req: NextRequest) {
  if (!process.env.ADMIN_PASSWORD_HASH) return NextResponse.next();
  const pathname = req.nextUrl.pathname;
  if (PUBLIC_PATHS.has(pathname) || pathname.startsWith("/_next/")) {
    return NextResponse.next();
  }
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.authenticated) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
