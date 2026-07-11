import { inArray, isNull, and, eq } from "drizzle-orm";
import { db, usersTable, organizationsTable } from "@workspace/db";
import { logger } from "./logger";

const DEMO_ACCOUNT_EMAILS = [
  "admin@sember.com",
  "empresa@sember.com",
  "postulante@sember.com",
];

/**
 * Ensures the documented demo/test accounts are email-verified so they can log
 * in on any environment (dev or production). Idempotent: only updates rows that
 * exist and are not yet verified. Safe to run on every startup.
 */
export async function ensureDemoAccountsVerified(): Promise<void> {
  try {
    const updated = await db
      .update(usersTable)
      .set({ emailVerifiedAt: new Date() })
      .where(
        and(
          inArray(usersTable.email, DEMO_ACCOUNT_EMAILS),
          isNull(usersTable.emailVerifiedAt),
        ),
      )
      .returning({ email: usersTable.email });

    if (updated.length > 0) {
      logger.info(
        { emails: updated.map((u) => u.email) },
        "Verified demo accounts on startup",
      );
    }
  } catch (err) {
    logger.error({ err }, "Failed to verify demo accounts on startup");
  }
}

/**
 * Backfills the legacy organization status `aprobada` to the new `verificada`
 * value. Idempotent and safe to run on every startup so existing environments
 * (incl. production, which uses a separate DB and is not seeded) migrate to the
 * 4-state verification model without any manual SQL.
 */
export async function ensureOrgStatusMigrated(): Promise<void> {
  try {
    const updated = await db
      .update(organizationsTable)
      .set({ status: "verificada" })
      .where(eq(organizationsTable.status, "aprobada"))
      .returning({ id: organizationsTable.id });

    if (updated.length > 0) {
      logger.info(
        { count: updated.length },
        "Migrated legacy organization status aprobada -> verificada on startup",
      );
    }
  } catch (err) {
    logger.error({ err }, "Failed to migrate legacy organization status on startup");
  }
}
