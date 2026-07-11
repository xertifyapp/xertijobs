import { useTranslation } from "react-i18next";
import { Globe, Check } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useUpdatePreferences,
  getGetCurrentUserQueryKey,
  type AuthUser,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { SUPPORTED_LANGUAGES, LANGUAGE_NAMES, type Language } from "@/i18n";

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const updatePreferences = useUpdatePreferences();
  const current = (SUPPORTED_LANGUAGES as readonly string[]).includes(i18n.language)
    ? (i18n.language as Language)
    : "es";

  const handleSelect = (lng: Language) => {
    void i18n.changeLanguage(lng);
    if (isAuthenticated && user) {
      // Optimistically keep the cached user in sync so LanguageSync doesn't
      // revert the UI while the request is in flight, then persist server-side.
      queryClient.setQueryData<AuthUser>(getGetCurrentUserQueryKey(), {
        ...user,
        preferredLanguage: lng,
      });
      updatePreferences.mutate(
        { data: { preferredLanguage: lng } },
        {
          onSuccess: (updated) => {
            queryClient.setQueryData(getGetCurrentUserQueryKey(), updated);
          },
        },
      );
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" aria-label={t("nav.language")} className="gap-1.5">
          <Globe className="h-4 w-4" />
          <span className="uppercase text-xs font-semibold">{current}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {SUPPORTED_LANGUAGES.map((lng) => (
          <DropdownMenuItem
            key={lng}
            onClick={() => handleSelect(lng)}
            className="flex items-center justify-between gap-4 cursor-pointer"
          >
            {LANGUAGE_NAMES[lng]}
            {current === lng && <Check className="h-4 w-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
