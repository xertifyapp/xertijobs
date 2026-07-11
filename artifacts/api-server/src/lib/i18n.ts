export type Locale = "es" | "en" | "pt";

export const SUPPORTED_LOCALES: Locale[] = ["es", "en", "pt"];
export const DEFAULT_LOCALE: Locale = "es";

export function isLocale(value: string): value is Locale {
  return (SUPPORTED_LOCALES as string[]).includes(value);
}

const messages: Record<Locale, Record<string, string>> = {
  es: {
    // auth routes
    "auth.invalidEmail": "Correo electrónico inválido",
    "auth.missingOrgData": "Faltan los datos de la organización",
    "auth.emailAlreadyRegistered": "Este correo ya está registrado",
    "auth.otpInvalidOrExpired": "Código inválido o expirado. Solicita uno nuevo.",
    "auth.otpIncorrectRemaining": "Código incorrecto. Te quedan {{remaining}} intentos.",
    "auth.otpTooManyAttempts": "Demasiados intentos. Solicita un código nuevo.",
    "auth.otpResendCooldown": "Espera un minuto antes de solicitar otro código",
    "auth.emailSendFailed": "No se pudo enviar el correo. Intenta de nuevo.",
    "auth.invalidCredentials": "Correo o contraseña incorrectos",
    "auth.emailNotVerified": "Debes verificar tu correo electrónico antes de iniciar sesión",
    "auth.orgPendingApproval": "Tu organización está pendiente de aprobación por el equipo de SEMBER",
    "auth.notAuthenticated": "No autenticado",
    // auth middleware
    "auth.mustLogin": "Debes iniciar sesión",
    "auth.forbidden": "No tienes permisos para realizar esta acción",
    // shared
    "common.opportunityNotExist": "La oportunidad no existe",
    "common.professionalNotExist": "El profesional no existe",
    "common.invalidData": "Los datos enviados son inválidos",
    "common.invalidParams": "Parámetros de solicitud inválidos",
    // applications
    "applications.noProfessionalProfile": "Tu cuenta no tiene un perfil profesional asociado",
    "applications.noOrganization": "Tu cuenta no tiene una organización asociada",
    "applications.onlyOwnProfile": "Solo puedes postular con tu propio perfil",
    "applications.alreadyApplied": "Ya has postulado a esta oportunidad",
    "applications.onlyOwnOrgApplications": "Solo puedes gestionar postulaciones de tu organización",
    "applications.notFound": "Postulación no encontrada",
    // opportunities
    "opportunities.onlyPublishOwnOrg": "Solo puedes publicar oportunidades de tu organización",
    "opportunities.createFailed": "No se pudo crear la oportunidad",
    "opportunities.notFound": "Oportunidad no encontrada",
    "opportunities.onlyModifyOwnOrg": "Solo puedes modificar oportunidades de tu organización",
    "opportunities.onlyDeleteOwnOrg": "Solo puedes eliminar oportunidades de tu organización",
    // organizations
    "organizations.notFound": "Organización no encontrada",
    "organizations.onlyModifyOwn": "Solo puedes modificar tu propia organización",
    "organizations.cannotChangeStatus": "No puedes cambiar el estado de aprobación",
    // professionals
    "professionals.onlyOwnProfile": "Solo puedes gestionar tu propio perfil",
    "professionals.notFound": "Profesional no encontrado",
    // stats
    "stats.onlyOwnOrgStats": "Solo puedes ver estadísticas de tu organización",
    // activity feed
    "activity.newOpportunity": "Nueva oportunidad: {{title}}",
    "activity.applicationReceived": "{{name}} postuló",
    "activity.orgApproved": "Organización aprobada: {{name}}",
    "activity.orgRegistered": "Nueva organización registrada: {{name}}",
    // storage
    "storage.invalidFields": "Faltan campos obligatorios o son inválidos",
    "storage.fileTypeNotAllowed": "Tipo de archivo no permitido. Sube una imagen (JPG, PNG, GIF o WebP).",
    "storage.fileTooLarge": "El archivo es demasiado grande. Máximo 10MB.",
    "storage.uploadUrlFailed": "No se pudo generar la URL de subida",
    "storage.fileNotFound": "Archivo no encontrado",
    "storage.servePublicFailed": "No se pudo servir el objeto público",
    "storage.objectNotFound": "Objeto no encontrado",
    "storage.serveFailed": "No se pudo servir el objeto",
    // otp email
    "email.otp.subject": "Tu código de verificación — SEMBER CONNECT",
    "email.otp.greeting": "Hola {{name}},",
    "email.otp.instruction": "Tu código de verificación es:",
    "email.otp.expiry": "Este código expira en 10 minutos.",
    "email.otp.ignore": "Si no solicitaste este código, puedes ignorar este correo.",
  },
  en: {
    // auth routes
    "auth.invalidEmail": "Invalid email address",
    "auth.missingOrgData": "Organization details are missing",
    "auth.emailAlreadyRegistered": "This email is already registered",
    "auth.otpInvalidOrExpired": "Invalid or expired code. Request a new one.",
    "auth.otpIncorrectRemaining": "Incorrect code. You have {{remaining}} attempts left.",
    "auth.otpTooManyAttempts": "Too many attempts. Request a new code.",
    "auth.otpResendCooldown": "Wait a minute before requesting another code",
    "auth.emailSendFailed": "The email could not be sent. Please try again.",
    "auth.invalidCredentials": "Incorrect email or password",
    "auth.emailNotVerified": "You must verify your email address before signing in",
    "auth.orgPendingApproval": "Your organization is pending approval by the SEMBER team",
    "auth.notAuthenticated": "Not authenticated",
    // auth middleware
    "auth.mustLogin": "You must sign in",
    "auth.forbidden": "You do not have permission to perform this action",
    // shared
    "common.opportunityNotExist": "The opportunity does not exist",
    "common.professionalNotExist": "The professional does not exist",
    "common.invalidData": "The submitted data is invalid",
    "common.invalidParams": "Invalid request parameters",
    // applications
    "applications.noProfessionalProfile": "Your account does not have an associated professional profile",
    "applications.noOrganization": "Your account does not have an associated organization",
    "applications.onlyOwnProfile": "You can only apply with your own profile",
    "applications.alreadyApplied": "You have already applied to this opportunity",
    "applications.onlyOwnOrgApplications": "You can only manage applications from your organization",
    "applications.notFound": "Application not found",
    // opportunities
    "opportunities.onlyPublishOwnOrg": "You can only publish opportunities for your organization",
    "opportunities.createFailed": "The opportunity could not be created",
    "opportunities.notFound": "Opportunity not found",
    "opportunities.onlyModifyOwnOrg": "You can only modify opportunities from your organization",
    "opportunities.onlyDeleteOwnOrg": "You can only delete opportunities from your organization",
    // organizations
    "organizations.notFound": "Organization not found",
    "organizations.onlyModifyOwn": "You can only modify your own organization",
    "organizations.cannotChangeStatus": "You cannot change the approval status",
    // professionals
    "professionals.onlyOwnProfile": "You can only manage your own profile",
    "professionals.notFound": "Professional not found",
    // stats
    "stats.onlyOwnOrgStats": "You can only view statistics for your organization",
    // activity feed
    "activity.newOpportunity": "New opportunity: {{title}}",
    "activity.applicationReceived": "{{name}} applied",
    "activity.orgApproved": "Organization approved: {{name}}",
    "activity.orgRegistered": "New organization registered: {{name}}",
    // storage
    "storage.invalidFields": "Required fields are missing or invalid",
    "storage.fileTypeNotAllowed": "File type not allowed. Upload an image (JPG, PNG, GIF or WebP).",
    "storage.fileTooLarge": "The file is too large. Maximum 10MB.",
    "storage.uploadUrlFailed": "Failed to generate upload URL",
    "storage.fileNotFound": "File not found",
    "storage.servePublicFailed": "Failed to serve public object",
    "storage.objectNotFound": "Object not found",
    "storage.serveFailed": "Failed to serve object",
    // otp email
    "email.otp.subject": "Your verification code — SEMBER CONNECT",
    "email.otp.greeting": "Hi {{name}},",
    "email.otp.instruction": "Your verification code is:",
    "email.otp.expiry": "This code expires in 10 minutes.",
    "email.otp.ignore": "If you did not request this code, you can ignore this email.",
  },
  pt: {
    // auth routes
    "auth.invalidEmail": "Endereço de e-mail inválido",
    "auth.missingOrgData": "Faltam os dados da organização",
    "auth.emailAlreadyRegistered": "Este e-mail já está registrado",
    "auth.otpInvalidOrExpired": "Código inválido ou expirado. Solicite um novo.",
    "auth.otpIncorrectRemaining": "Código incorreto. Você tem {{remaining}} tentativas restantes.",
    "auth.otpTooManyAttempts": "Muitas tentativas. Solicite um novo código.",
    "auth.otpResendCooldown": "Aguarde um minuto antes de solicitar outro código",
    "auth.emailSendFailed": "Não foi possível enviar o e-mail. Tente novamente.",
    "auth.invalidCredentials": "E-mail ou senha incorretos",
    "auth.emailNotVerified": "Você deve verificar seu endereço de e-mail antes de entrar",
    "auth.orgPendingApproval": "Sua organização está pendente de aprovação pela equipe da SEMBER",
    "auth.notAuthenticated": "Não autenticado",
    // auth middleware
    "auth.mustLogin": "Você precisa entrar",
    "auth.forbidden": "Você não tem permissão para realizar esta ação",
    // shared
    "common.opportunityNotExist": "A oportunidade não existe",
    "common.professionalNotExist": "O profissional não existe",
    "common.invalidData": "Os dados enviados são inválidos",
    "common.invalidParams": "Parâmetros de solicitação inválidos",
    // applications
    "applications.noProfessionalProfile": "Sua conta não possui um perfil profissional associado",
    "applications.noOrganization": "Sua conta não possui uma organização associada",
    "applications.onlyOwnProfile": "Você só pode se candidatar com seu próprio perfil",
    "applications.alreadyApplied": "Você já se candidatou a esta oportunidade",
    "applications.onlyOwnOrgApplications": "Você só pode gerenciar candidaturas da sua organização",
    "applications.notFound": "Candidatura não encontrada",
    // opportunities
    "opportunities.onlyPublishOwnOrg": "Você só pode publicar oportunidades da sua organização",
    "opportunities.createFailed": "Não foi possível criar a oportunidade",
    "opportunities.notFound": "Oportunidade não encontrada",
    "opportunities.onlyModifyOwnOrg": "Você só pode modificar oportunidades da sua organização",
    "opportunities.onlyDeleteOwnOrg": "Você só pode excluir oportunidades da sua organização",
    // organizations
    "organizations.notFound": "Organização não encontrada",
    "organizations.onlyModifyOwn": "Você só pode modificar sua própria organização",
    "organizations.cannotChangeStatus": "Você não pode alterar o status de aprovação",
    // professionals
    "professionals.onlyOwnProfile": "Você só pode gerenciar seu próprio perfil",
    "professionals.notFound": "Profissional não encontrado",
    // stats
    "stats.onlyOwnOrgStats": "Você só pode ver estatísticas da sua organização",
    // activity feed
    "activity.newOpportunity": "Nova oportunidade: {{title}}",
    "activity.applicationReceived": "{{name}} se candidatou",
    "activity.orgApproved": "Organização aprovada: {{name}}",
    "activity.orgRegistered": "Nova organização registrada: {{name}}",
    // storage
    "storage.invalidFields": "Campos obrigatórios ausentes ou inválidos",
    "storage.fileTypeNotAllowed": "Tipo de arquivo não permitido. Envie uma imagem (JPG, PNG, GIF ou WebP).",
    "storage.fileTooLarge": "O arquivo é muito grande. Máximo de 10MB.",
    "storage.uploadUrlFailed": "Não foi possível gerar a URL de upload",
    "storage.fileNotFound": "Arquivo não encontrado",
    "storage.servePublicFailed": "Não foi possível servir o objeto público",
    "storage.objectNotFound": "Objeto não encontrado",
    "storage.serveFailed": "Não foi possível servir o objeto",
    // otp email
    "email.otp.subject": "Seu código de verificação — SEMBER CONNECT",
    "email.otp.greeting": "Olá {{name}},",
    "email.otp.instruction": "Seu código de verificação é:",
    "email.otp.expiry": "Este código expira em 10 minutos.",
    "email.otp.ignore": "Se você não solicitou este código, pode ignorar este e-mail.",
  },
};

export function t(
  locale: Locale,
  key: string,
  params?: Record<string, string | number>,
): string {
  const dict = messages[locale] ?? messages[DEFAULT_LOCALE];
  let str = dict[key] ?? messages[DEFAULT_LOCALE][key] ?? key;
  if (params) {
    for (const [name, value] of Object.entries(params)) {
      str = str.replace(new RegExp(`{{\\s*${name}\\s*}}`, "g"), String(value));
    }
  }
  return str;
}

export function detectLocale(acceptLanguage: string | undefined): Locale {
  if (!acceptLanguage) return DEFAULT_LOCALE;
  const candidates = acceptLanguage
    .split(",")
    .map((part) => {
      const [tag, ...rest] = part.trim().split(";");
      const qPart = rest.find((r) => r.trim().startsWith("q="));
      const q = qPart ? parseFloat(qPart.trim().slice(2)) : 1;
      return { tag: tag.trim().toLowerCase(), q: Number.isNaN(q) ? 1 : q };
    })
    .filter((c) => c.tag.length > 0)
    .sort((a, b) => b.q - a.q);

  for (const { tag } of candidates) {
    const base = tag.split("-")[0];
    if (isLocale(base)) return base;
  }
  return DEFAULT_LOCALE;
}
