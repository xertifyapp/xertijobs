// Uses the Replit Gmail integration (connection: google-mail) to send emails.
import { ReplitConnectors } from "@replit/connectors-sdk";
import { logger } from "./logger";
import { t, type Locale, DEFAULT_LOCALE } from "./i18n";

const connectors = new ReplitConnectors();

function encodeSubject(subject: string): string {
  return `=?UTF-8?B?${Buffer.from(subject, "utf8").toString("base64")}?=`;
}

export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const mime = [
    `To: ${to}`,
    `Subject: ${encodeSubject(subject)}`,
    "MIME-Version: 1.0",
    'Content-Type: text/html; charset="UTF-8"',
    "Content-Transfer-Encoding: base64",
    "",
    Buffer.from(html, "utf8").toString("base64"),
  ].join("\r\n");

  const raw = Buffer.from(mime, "utf8").toString("base64url");

  const response = await connectors.proxy("google-mail", "/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ raw }),
  });

  if (!response.ok) {
    const body = await response.text();
    logger.error({ status: response.status, body }, "Gmail send failed");
    throw new Error(`Gmail send failed with status ${response.status}`);
  }
}

export async function sendOtpEmail(
  to: string,
  name: string,
  code: string,
  locale: Locale = DEFAULT_LOCALE,
): Promise<void> {
  const html = `
  <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
    <h2 style="color: #1a1a2e;">SEMBER CONNECT</h2>
    <p>${t(locale, "email.otp.greeting", { name })}</p>
    <p>${t(locale, "email.otp.instruction")}</p>
    <p style="font-size: 32px; font-weight: bold; letter-spacing: 8px; text-align: center; background: #f4f4f8; padding: 16px; border-radius: 8px;">${code}</p>
    <p>${t(locale, "email.otp.expiry")}</p>
    <p style="color: #888; font-size: 12px;">${t(locale, "email.otp.ignore")}</p>
  </div>`;
  await sendEmail(to, t(locale, "email.otp.subject"), html);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function sendApplicationStatusEmail(
  to: string,
  name: string,
  opportunityTitle: string,
  organizationName: string,
  status: string,
  note: string | null | undefined,
  locale: Locale = DEFAULT_LOCALE,
): Promise<void> {
  const statusLabel = t(locale, `email.appStatus.label.${status}`);
  const noteBlock = note
    ? `<div style="margin: 16px 0; padding: 12px 16px; background: #f4f4f8; border-left: 4px solid #1a1a2e; border-radius: 6px;">
         <p style="margin: 0 0 4px; font-weight: bold; font-size: 13px;">${t(locale, "email.appStatus.noteLabel")}</p>
         <p style="margin: 0; font-style: italic;">${escapeHtml(note)}</p>
       </div>`
    : "";
  const html = `
  <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
    <h2 style="color: #1a1a2e;">SEMBER CONNECT</h2>
    <p>${t(locale, "email.appStatus.greeting", { name: escapeHtml(name) })}</p>
    <p>${t(locale, "email.appStatus.body", { opportunity: escapeHtml(opportunityTitle), organization: escapeHtml(organizationName) })}</p>
    <p style="font-size: 20px; font-weight: bold; text-align: center; background: #eef2ff; color: #1a1a2e; padding: 14px; border-radius: 8px;">${statusLabel}</p>
    ${noteBlock}
    <p>${t(locale, "email.appStatus.cta")}</p>
    <p style="color: #888; font-size: 12px;">${t(locale, "email.appStatus.ignore")}</p>
  </div>`;
  await sendEmail(to, t(locale, "email.appStatus.subject"), html);
}
