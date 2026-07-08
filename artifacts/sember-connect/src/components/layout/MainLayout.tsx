import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";

export function MainLayout({ children }: { children: React.ReactNode }) {
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
            <Link href="/perfil" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Mi Perfil</Link>
            <Link href="/panel" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Panel Institucional</Link>
            <Link href="/admin" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Admin</Link>
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
              <Link href="/registro-organizacion" className="text-sm text-muted-foreground hover:text-primary">Registrar Organización</Link>
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
