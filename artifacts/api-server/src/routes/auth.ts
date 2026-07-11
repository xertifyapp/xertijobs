import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { randomInt } from "node:crypto";
import {
  db,
  usersTable,
  organizationsTable,
  professionalsTable,
  emailOtpsTable,
} from "@workspace/db";
import {
  LoginBody,
  LoginResponse,
  GetCurrentUserResponse,
  RegisterBody,
  RegisterResponse,
  VerifyEmailBody,
  VerifyEmailResponse,
  ResendOtpBody,
  UpdatePreferencesBody,
} from "@workspace/api-zod";
import { sendOtpEmail } from "../lib/mailer";
import { t, type Locale } from "../lib/i18n";

const router: IRouter = Router();

const OTP_TTL_MS = 10 * 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;
const OTP_RESEND_COOLDOWN_MS = 60 * 1000;

function generateOtp(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

async function issueOtp(userId: number): Promise<string> {
  const code = generateOtp();
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);
  await db
    .insert(emailOtpsTable)
    .values({ userId, codeHash, expiresAt, attempts: 0 })
    .onConflictDoUpdate({
      target: emailOtpsTable.userId,
      set: { codeHash, expiresAt, attempts: 0, createdAt: new Date() },
    });
  return code;
}

router.post("/auth/register", async (req, res): Promise<void> => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: t(req.locale, "common.invalidData") });
    return;
  }

  const email = parsed.data.email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ error: t(req.locale, "auth.invalidEmail") });
    return;
  }

  if (parsed.data.role === "empresa" && !parsed.data.organization) {
    res.status(400).json({ error: t(req.locale, "auth.missingOrgData") });
    return;
  }

  const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (existing) {
    res.status(409).json({ error: t(req.locale, "auth.emailAlreadyRegistered") });
    return;
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);

  const userId = await db.transaction(async (tx) => {
    let professionalId: number | null = null;
    let organizationId: number | null = null;

    if (parsed.data.role === "postulante") {
      const [professional] = await tx
        .insert(professionalsTable)
        .values({ name: parsed.data.name, email })
        .returning();
      professionalId = professional.id;
    } else {
      const org = parsed.data.organization!;
      const [organization] = await tx
        .insert(organizationsTable)
        .values({
          name: org.name,
          type: org.type,
          country: org.country,
          city: org.city || null,
          website: org.website || null,
          description: org.description || null,
          contactEmail: org.contactEmail || email,
          status: "pendiente",
        })
        .returning();
      organizationId = organization.id;
    }

    const [user] = await tx
      .insert(usersTable)
      .values({
        email,
        passwordHash,
        role: parsed.data.role,
        name: parsed.data.name,
        professionalId,
        organizationId,
        preferredLanguage: parsed.data.preferredLanguage ?? req.locale,
        emailVerifiedAt: null,
      })
      .returning();
    return user.id;
  });

  const emailLocale: Locale = parsed.data.preferredLanguage ?? req.locale;
  const code = await issueOtp(userId);
  let emailSent = true;
  try {
    await sendOtpEmail(email, parsed.data.name, code, emailLocale);
  } catch (err) {
    req.log.error({ err }, "OTP email send failed on register");
    emailSent = false;
  }

  res.status(201).json(RegisterResponse.parse({ email, emailSent }));
});

router.post("/auth/verify-email", async (req, res): Promise<void> => {
  const parsed = VerifyEmailBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: t(req.locale, "common.invalidData") });
    return;
  }

  const email = parsed.data.email.trim().toLowerCase();
  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (!user || user.emailVerifiedAt) {
    // Respuesta genérica: no revelar si el correo existe o ya está verificado
    res.status(400).json({ error: t(req.locale, "auth.otpInvalidOrExpired") });
    return;
  }

  const [otp] = await db.select().from(emailOtpsTable).where(eq(emailOtpsTable.userId, user.id));
  if (!otp || otp.expiresAt.getTime() < Date.now() || otp.attempts >= OTP_MAX_ATTEMPTS) {
    res.status(400).json({ error: t(req.locale, "auth.otpInvalidOrExpired") });
    return;
  }

  const valid = await bcrypt.compare(parsed.data.code, otp.codeHash);
  if (!valid) {
    await db
      .update(emailOtpsTable)
      .set({ attempts: otp.attempts + 1 })
      .where(eq(emailOtpsTable.id, otp.id));
    const remaining = OTP_MAX_ATTEMPTS - otp.attempts - 1;
    res.status(400).json({
      error:
        remaining > 0
          ? t(req.locale, "auth.otpIncorrectRemaining", { remaining })
          : t(req.locale, "auth.otpTooManyAttempts"),
    });
    return;
  }

  await db.update(usersTable).set({ emailVerifiedAt: new Date() }).where(eq(usersTable.id, user.id));
  await db.delete(emailOtpsTable).where(eq(emailOtpsTable.id, otp.id));

  res.status(200).json(VerifyEmailResponse.parse({ verified: true, role: user.role }));
});

router.post("/auth/resend-otp", async (req, res): Promise<void> => {
  const parsed = ResendOtpBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: t(req.locale, "common.invalidData") });
    return;
  }

  const email = parsed.data.email.trim().toLowerCase();
  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (!user || user.emailVerifiedAt) {
    // No revelar si el correo existe
    res.status(200).json({});
    return;
  }

  const [otp] = await db.select().from(emailOtpsTable).where(eq(emailOtpsTable.userId, user.id));
  if (otp && Date.now() - otp.createdAt.getTime() < OTP_RESEND_COOLDOWN_MS) {
    res.status(429).json({ error: t(req.locale, "auth.otpResendCooldown") });
    return;
  }

  const code = await issueOtp(user.id);
  try {
    await sendOtpEmail(email, user.name, code, user.preferredLanguage as Locale);
  } catch (err) {
    req.log.error({ err }, "OTP email send failed on resend");
    res.status(502).json({ error: t(req.locale, "auth.emailSendFailed") });
    return;
  }

  res.status(200).json({});
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: t(req.locale, "common.invalidData") });
    return;
  }

  const email = parsed.data.email.trim().toLowerCase();
  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));

  if (!user || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) {
    res.status(401).json({ error: t(req.locale, "auth.invalidCredentials") });
    return;
  }

  if (!user.emailVerifiedAt) {
    res.status(403).json({
      error: t(req.locale, "auth.emailNotVerified"),
      code: "email_no_verificado",
    });
    return;
  }

  if (user.role === "empresa" && user.organizationId) {
    const [org] = await db
      .select()
      .from(organizationsTable)
      .where(eq(organizationsTable.id, user.organizationId));
    if (!org || org.status !== "verificada") {
      if (org?.status === "suspendida") {
        res.status(403).json({
          error: t(req.locale, "auth.orgSuspended"),
          code: "org_suspendida",
        });
        return;
      }
      if (org?.status === "rechazada") {
        res.status(403).json({
          error: t(req.locale, "auth.orgRejected"),
          code: "org_rechazada",
        });
        return;
      }
      res.status(403).json({
        error: t(req.locale, "auth.orgPendingApproval"),
        code: "pendiente_aprobacion",
      });
      return;
    }
  }

  await new Promise<void>((resolve, reject) => {
    req.session.regenerate((err) => (err ? reject(err) : resolve()));
  });

  req.session.user = {
    id: user.id,
    role: user.role,
    professionalId: user.professionalId,
    organizationId: user.organizationId,
  };

  await new Promise<void>((resolve, reject) => {
    req.session.save((err) => (err ? reject(err) : resolve()));
  });

  res.status(200).json(
    LoginResponse.parse({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      professionalId: user.professionalId,
      organizationId: user.organizationId,
      preferredLanguage: user.preferredLanguage,
    }),
  );
});

router.post("/auth/logout", async (req, res): Promise<void> => {
  await new Promise<void>((resolve, reject) => {
    req.session.destroy((err) => (err ? reject(err) : resolve()));
  });
  res.clearCookie("connect.sid");
  res.status(204).end();
});

router.get("/auth/me", async (req, res): Promise<void> => {
  const sessionUser = req.session.user;
  if (!sessionUser) {
    res.status(401).json({ error: t(req.locale, "auth.notAuthenticated") });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, sessionUser.id));
  if (!user) {
    res.status(401).json({ error: t(req.locale, "auth.notAuthenticated") });
    return;
  }

  res.status(200).json(
    GetCurrentUserResponse.parse({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      professionalId: user.professionalId,
      organizationId: user.organizationId,
      preferredLanguage: user.preferredLanguage,
    }),
  );
});

router.patch("/auth/me", async (req, res): Promise<void> => {
  const sessionUser = req.session.user;
  if (!sessionUser) {
    res.status(401).json({ error: t(req.locale, "auth.notAuthenticated") });
    return;
  }

  const parsed = UpdatePreferencesBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: t(req.locale, "common.invalidData") });
    return;
  }

  const [user] = await db
    .update(usersTable)
    .set({ preferredLanguage: parsed.data.preferredLanguage })
    .where(eq(usersTable.id, sessionUser.id))
    .returning();
  if (!user) {
    res.status(401).json({ error: t(req.locale, "auth.notAuthenticated") });
    return;
  }

  res.status(200).json(
    GetCurrentUserResponse.parse({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      professionalId: user.professionalId,
      organizationId: user.organizationId,
      preferredLanguage: user.preferredLanguage,
    }),
  );
});

export default router;
