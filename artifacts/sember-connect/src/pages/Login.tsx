import { MainLayout } from "@/components/layout/MainLayout";
import { useLogin, getGetCurrentUserQueryKey, type AuthUser } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation, Redirect } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { LogIn } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Correo inválido"),
  password: z.string().min(1, "La contraseña es requerida"),
});

function homeForRole(role: string): string {
  switch (role) {
    case "admin":
      return "/admin";
    case "empresa":
      return "/panel";
    default:
      return "/perfil";
  }
}

export default function Login() {
  const { user, isLoading } = useAuth();
  const login = useLogin();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  if (!isLoading && user) {
    return <Redirect to={homeForRole(user.role)} />;
  }

  const onSubmit = (values: z.infer<typeof loginSchema>) => {
    login.mutate({ data: values }, {
      onSuccess: (authUser: AuthUser) => {
        queryClient.setQueryData(getGetCurrentUserQueryKey(), authUser);
        toast({ title: `Bienvenido/a, ${authUser.name}` });
        navigate(homeForRole(authUser.role));
      },
      onError: (err: unknown) => {
        const status = (err as { status?: number }).status;
        toast({
          title: status === 401 ? "Correo o contraseña incorrectos" : "Error al iniciar sesión",
          variant: "destructive",
        });
      },
    });
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-16 flex justify-center">
        <div className="w-full max-w-md space-y-6">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Iniciar Sesión</CardTitle>
              <CardDescription>Accede a tu cuenta de SEMBER CONNECT</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Correo electrónico</FormLabel>
                      <FormControl><Input type="email" placeholder="tu@correo.com" autoComplete="email" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="password" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contraseña</FormLabel>
                      <FormControl><Input type="password" placeholder="••••••••" autoComplete="current-password" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <Button type="submit" className="w-full" disabled={login.isPending}>
                    <LogIn className="mr-2 h-4 w-4" />
                    {login.isPending ? "Ingresando..." : "Ingresar"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          <Card className="bg-muted/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Cuentas de prueba</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <div><span className="font-medium text-foreground">Postulante:</span> postulante@sember.com / Postulante123!</div>
              <div><span className="font-medium text-foreground">Empresa:</span> empresa@sember.com / Empresa123!</div>
              <div><span className="font-medium text-foreground">Admin:</span> admin@sember.com / Admin123!</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
