import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useLogout, getGetCurrentUserQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { LogIn, LogOut, User2 } from "lucide-react";

export function MainLayout({ children }: { children: React.ReactNode }) {
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
              <span className="font-bold text-xl tracking-tight text-primary">SEMBER</span>
              <span className="text-xl text-muted-foreground">CONNECT</span>
            </Link>
            <nav className="hidden md:flex gap-6">
              <Link href="/oportunidades" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Oportunidades</Link>
              <Link href="/organizaciones" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Organizaciones</Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            {user?.role === "postulante" && (
              <Link href="/perfil" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Mi Perfil</Link>
            )}
            {(user?.role === "empresa" || user?.role === "admin") && (
              <Link href="/panel" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Panel Institucional</Link>
            )}
            {user?.role === "admin" && (
              <Link href="/admin" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Admin</Link>
            )}
            {!isLoading && !user && (
              <div className="flex items-center gap-2">
                <Link href="/registro">
                  <Button size="sm" variant="ghost">Crear Cuenta</Button>
                </Link>
                <Link href="/login">
                  <Button size="sm">
                    <LogIn className="mr-2 h-4 w-4" /> Iniciar Sesión
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
                  <LogOut className="mr-2 h-4 w-4" /> Salir
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
            <div className="font-bold text-xl tracking-tight text-primary mb-4">SEMBER CONNECT</div>
            <p className="text-sm text-muted-foreground">
              Conectando talento con oportunidades en todo el mundo.
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-4">Explorar</h4>
            <div className="flex flex-col gap-2">
              <Link href="/oportunidades" className="text-sm text-muted-foreground hover:text-primary">Buscar Oportunidades</Link>
              <Link href="/organizaciones" className="text-sm text-muted-foreground hover:text-primary">Directorio de Instituciones</Link>
            </div>
          </div>
          <div>
            <h4 className="font-medium mb-4">Instituciones</h4>
            <div className="flex flex-col gap-2">
              <Link href="/registro?tipo=empresa" className="text-sm text-muted-foreground hover:text-primary">Registrar Organización</Link>
              <Link href="/panel" className="text-sm text-muted-foreground hover:text-primary">Panel de Control</Link>
            </div>
          </div>
          <div>
            <h4 className="font-medium mb-4">Legal</h4>
            <div className="flex flex-col gap-2">
              <span className="text-sm text-muted-foreground cursor-pointer hover:text-primary">Términos de Uso</span>
              <span className="text-sm text-muted-foreground cursor-pointer hover:text-primary">Privacidad</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
