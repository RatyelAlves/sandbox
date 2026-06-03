import "dotenv/config";

export const env = {

  port:
    Number(process.env.PORT) || 3333,

  databaseUrl:
    process.env.DATABASE_URL || "",

  geminiApiKey:
    process.env.GEMINI_API_KEY || "",

  geminiModel:
    process.env.GEMINI_MODEL ||
    "gemini-2.5-flash-lite",

  geminiFallbackModels:
    process.env.GEMINI_FALLBACK_MODELS ||
    "gemini-2.5-flash,gemini-2.0-flash-lite",

  geminiAutoReply:
    process.env.GEMINI_AUTO_REPLY === "true",

  googleClientId:
    process.env.GOOGLE_CLIENT_ID || "",

  googleClientSecret:
    process.env.GOOGLE_CLIENT_SECRET || "",

  googleRedirectUri:
    process.env.GOOGLE_REDIRECT_URI ||
    "http://localhost:3333/google/callback",

  googleCalendarId:
    process.env.GOOGLE_CALENDAR_ID ||
    process.env.GOOGLE_CALENDAR_EMAIL ||
    "primary",

  googleCalendarEmail:
    process.env.GOOGLE_CALENDAR_EMAIL || "",

  frontendUrl:
    process.env.FRONTEND_URL ||
    "http://localhost:5173",

  clinicOpenHour:
    Number(
      process.env.CLINIC_OPEN_HOUR
    ) || 9,

  clinicCloseHour:
    Number(
      process.env.CLINIC_CLOSE_HOUR
    ) || 18,

  clinicSlotIntervalMin:
    Number(
      process.env.CLINIC_SLOT_INTERVAL_MIN
    ) || 60,

  evolutionApiUrl:
    process.env.EVOLUTION_API_URL ||
    "http://localhost:8080",

  evolutionInstance:
    process.env.EVOLUTION_INSTANCE ||
    "estheticflow",

  evolutionApiKey:
    process.env.EVOLUTION_API_KEY || "",

  evolutionInstanceKey:
    process.env.EVOLUTION_INSTANCE_KEY ||
    "",

  webhookBaseUrl:
    process.env.WEBHOOK_BASE_URL ||
    `http://host.docker.internal:${Number(process.env.PORT) || 3333}`,

  jwtSecret:
    process.env.JWT_SECRET ||
    "dev-secret-change-in-production",

  jwtExpiresIn:
    process.env.JWT_EXPIRES_IN ||
    "7d",

  adminEmail:
    process.env.ADMIN_EMAIL || "",

  adminPassword:
    process.env.ADMIN_PASSWORD || "",

  smtpHost:
    process.env.SMTP_HOST || "",

  smtpPort:
    Number(process.env.SMTP_PORT) || 587,

  smtpUser:
    process.env.SMTP_USER || "",

  smtpPass:
    process.env.SMTP_PASS || "",

  smtpFrom:
    process.env.SMTP_FROM || "",

  passwordResetExpiresMin:
    Number(
      process.env.PASSWORD_RESET_EXPIRES_MIN
    ) || 60,
};
