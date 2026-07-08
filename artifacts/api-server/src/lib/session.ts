import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import pg from "pg";
import type { RequestHandler } from "express";

declare module "express-session" {
  interface SessionData {
    user?: {
      id: number;
      role: string;
      professionalId: number | null;
      organizationId: number | null;
    };
  }
}

const databaseUrl = process.env["DATABASE_URL"];
if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is required");
}

const sessionSecret = process.env["SESSION_SECRET"];
if (!sessionSecret) {
  throw new Error("SESSION_SECRET environment variable is required");
}

const PgStore = connectPgSimple(session);

const pool = new pg.Pool({ connectionString: databaseUrl });

export const sessionMiddleware: RequestHandler = session({
  store: new PgStore({ pool, createTableIfMissing: false }),
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env["NODE_ENV"] === "production",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  },
});
