import type { SessionOptions } from "iron-session";

export type SessionData = {
  authenticated: true;
};

export const sessionOptions: SessionOptions = {
  cookieName: "kb-session",
  password: process.env.SESSION_SECRET ?? "x".repeat(32),
  cookieOptions: {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  },
};
