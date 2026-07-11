import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import esCommon from "./locales/es/common.json";
import esHome from "./locales/es/home.json";
import esOpportunities from "./locales/es/opportunities.json";
import esOrganizations from "./locales/es/organizations.json";
import esAuth from "./locales/es/auth.json";
import esProfile from "./locales/es/profile.json";
import esPanel from "./locales/es/panel.json";
import esAdmin from "./locales/es/admin.json";

import enCommon from "./locales/en/common.json";
import enHome from "./locales/en/home.json";
import enOpportunities from "./locales/en/opportunities.json";
import enOrganizations from "./locales/en/organizations.json";
import enAuth from "./locales/en/auth.json";
import enProfile from "./locales/en/profile.json";
import enPanel from "./locales/en/panel.json";
import enAdmin from "./locales/en/admin.json";

import ptCommon from "./locales/pt/common.json";
import ptHome from "./locales/pt/home.json";
import ptOpportunities from "./locales/pt/opportunities.json";
import ptOrganizations from "./locales/pt/organizations.json";
import ptAuth from "./locales/pt/auth.json";
import ptProfile from "./locales/pt/profile.json";
import ptPanel from "./locales/pt/panel.json";
import ptAdmin from "./locales/pt/admin.json";

export const SUPPORTED_LANGUAGES = ["es", "en", "pt"] as const;
export type Language = (typeof SUPPORTED_LANGUAGES)[number];

export const LANGUAGE_NAMES: Record<Language, string> = {
  es: "Español",
  en: "English",
  pt: "Português",
};

const STORAGE_KEY = "sember-lang";

const resources = {
  es: {
    translation: {
      ...esCommon,
      ...esHome,
      ...esOpportunities,
      ...esOrganizations,
      ...esAuth,
      ...esProfile,
      ...esPanel,
      ...esAdmin,
    },
  },
  en: {
    translation: {
      ...enCommon,
      ...enHome,
      ...enOpportunities,
      ...enOrganizations,
      ...enAuth,
      ...enProfile,
      ...enPanel,
      ...enAdmin,
    },
  },
  pt: {
    translation: {
      ...ptCommon,
      ...ptHome,
      ...ptOpportunities,
      ...ptOrganizations,
      ...ptAuth,
      ...ptProfile,
      ...ptPanel,
      ...ptAdmin,
    },
  },
};

function isSupported(value: string | null | undefined): value is Language {
  return !!value && (SUPPORTED_LANGUAGES as readonly string[]).includes(value);
}

function detectInitialLanguage(): Language {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (isSupported(stored)) return stored;
  } catch {
    // localStorage may be unavailable (SSR / privacy mode)
  }
  // Default to Spanish until the user explicitly chooses a language.
  return "es";
}

void i18n.use(initReactI18next).init({
  resources,
  lng: detectInitialLanguage(),
  fallbackLng: "es",
  supportedLngs: SUPPORTED_LANGUAGES as readonly string[],
  interpolation: { escapeValue: false },
  returnNull: false,
});

if (typeof document !== "undefined") {
  document.documentElement.lang = i18n.language;
}

i18n.on("languageChanged", (lng) => {
  try {
    localStorage.setItem(STORAGE_KEY, lng);
  } catch {
    // ignore persistence failures
  }
  if (typeof document !== "undefined") {
    document.documentElement.lang = lng;
  }
});

export function getCurrentLanguage(): Language {
  return isSupported(i18n.language) ? i18n.language : "es";
}

export default i18n;
