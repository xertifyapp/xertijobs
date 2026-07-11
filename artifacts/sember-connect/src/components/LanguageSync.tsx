import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";

/**
 * Applies the signed-in user's persisted language preference to the UI.
 * Server preference wins over the locally stored (localStorage) value so the
 * choice stays consistent across devices. Runs whenever the stored preference
 * changes (login, /auth/me refresh, or a persisted switch).
 */
export function LanguageSync() {
  const { user } = useAuth();
  const { i18n } = useTranslation();
  const preferred = user?.preferredLanguage;

  useEffect(() => {
    if (preferred && preferred !== i18n.language) {
      void i18n.changeLanguage(preferred);
    }
  }, [preferred, i18n]);

  return null;
}
