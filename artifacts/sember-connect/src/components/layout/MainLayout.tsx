import { Link, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useLogout, getGetCurrentUserQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { LogIn, LogOut, User2 } from "lucide-react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import semberLogo from "@/assets/sember-logo.png";
import xertifyLogo from "@assets/logo-xertify_1783685033241.png";

export function MainLayout({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const { user, isLoading } = useAuth();
  const logout = useLogout();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        queryClient.setQueryData(getGetCurrentUserQueryKey(), null);
        queryClient.clear();
        navigate("/");
      },
    });
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <img src={semberLogo} alt="SEMBER" className="h-11 w-auto object-contain" />
              <span className="text-xl text-muted-foreground">{t("nav.brandSuffix")}</span>
            </Link>
            <nav className="hidden md:flex gap-6">
              <Link href="/oportunidades" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">{t("nav.opportunities")}</Link>
              <Link href="/organizaciones" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">{t("nav.organizations")}</Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            {user?.role === "postulante" && (
              <Link href="/perfil" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">{t("nav.myProfile")}</Link>
            )}
            {(user?.role === "empresa" || user?.role === "admin") && (
              <Link href="/panel" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">{t("nav.panel")}</Link>
            )}
            {user?.role === "admin" && (
              <Link href="/admin" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">{t("nav.admin")}</Link>
            )}
            <LanguageSwitcher />
            {!isLoading && !user && (
              <div className="flex items-center gap-2">
                <Link href="/registro">
                  <Button size="sm" variant="ghost">{t("nav.createAccount")}</Button>
                </Link>
                <Link href="/login">
                  <Button size="sm">
                    <LogIn className="mr-2 h-4 w-4" /> {t("nav.login")}
                  </Button>
                </Link>
              </div>
            )}
            {user && (
              <div className="flex items-center gap-3">
                <span className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                  <User2 className="h-4 w-4" /> {user.name}
                </span>
                <Button size="sm" variant="outline" onClick={handleLogout} disabled={logout.isPending}>
                  <LogOut className="mr-2 h-4 w-4" /> {t("nav.logout")}
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>
      <main className="flex-1">
        {children}
      </main>
      <footer className="border-t bg-muted/40 py-12">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <img src={semberLogo} alt="SEMBER" className="h-12 w-auto object-contain mb-4" />
            <p className="text-sm text-muted-foreground">
              {t("footer.tagline")}
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-4">{t("footer.explore")}</h4>
            <div className="flex flex-col gap-2">
              <Link href="/oportunidades" className="text-sm text-muted-foreground hover:text-primary">{t("footer.searchOpportunities")}</Link>
              <Link href="/organizaciones" className="text-sm text-muted-foreground hover:text-primary">{t("footer.institutionsDirectory")}</Link>
            </div>
          </div>
          <div>
            <h4 className="font-medium mb-4">{t("footer.institutions")}</h4>
            <div className="flex flex-col gap-2">
              <Link href="/registro?tipo=empresa" className="text-sm text-muted-foreground hover:text-primary">{t("footer.registerOrganization")}</Link>
              <Link href="/panel" className="text-sm text-muted-foreground hover:text-primary">{t("footer.controlPanel")}</Link>
            </div>
          </div>
          <div>
            <h4 className="font-medium mb-4">{t("footer.legal")}</h4>
            <div className="flex flex-col gap-2">
              <span className="text-sm text-muted-foreground cursor-pointer hover:text-primary">{t("footer.terms")}</span>
              <span className="text-sm text-muted-foreground cursor-pointer hover:text-primary">{t("footer.privacy")}</span>
            </div>
          </div>
        </div>
        <div className="container mx-auto px-4 mt-10 pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            {t("footer.rights", { year: new Date().getFullYear() })}
          </p>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{t("footer.poweredBy")}</span>
            <img src={xertifyLogo} alt="Xertify" className="h-5 w-auto object-contain" />
          </div>
        </div>
      </footer>
    </div>
  );
}
