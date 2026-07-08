import { MainLayout } from "@/components/layout/MainLayout";
import {
  useRegister,
  useVerifyEmail,
  useResendOtp,
} from "@workspace/api-client-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { ORGANIZATION_TYPES } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { CheckCircle2, MailCheck, UserPlus, Building2, Clock } from "lucide-react";

const postulanteSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Correo inválido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
});

const empresaSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Correo inválido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  orgName: z.string().min(2, "El nombre de la organización es requerido"),
  orgType: z.string().min(1, "Selecciona el tipo de organización"),
  orgCountry: z.string().min(2, "El país es requerido"),
  orgCity: z.string().optional(),
  orgWebsite: z.string().url("Debe ser una URL válida (ej. https://ejemplo.com)").optional().or(z.literal("")),
  orgDescription: z.string().optional(),
});

type Step = "form" | "otp" | "success";

function getApiErrorMessage(err: unknown, fallback: string): string {
  const data = (err as { data?: { error?: string } }).data;
  return data?.error ?? fallback;
}

export default function Register() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const search = useSearch();
  const initialTab = new URLSearchParams(search).get("tipo") === "empresa" ? "empresa" : "postulante";

  const [step, setStep] = useState<Step>("form");
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [registeredRole, setRegisteredRole] = useState<"postulante" | "empresa">("postulante");
  const [otpCode, setOtpCode] = useState("");

  const register = useRegister();
  const verifyEmail = useVerifyEmail();
  const resendOtp = useResendOtp();

  const postulanteForm = useForm<z.infer<typeof postulanteSchema>>({
    resolver: zodResolver(postulanteSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  const empresaForm = useForm<z.infer<typeof empresaSchema>>({
    resolver: zodResolver(empresaSchema),
    defaultValues: {
      name: "", email: "", password: "",
      orgName: "", orgType: "", orgCountry: "", orgCity: "", orgWebsite: "", orgDescription: "",
    },
  });

  function handleRegisterSuccess(email: string, role: "postulante" | "empresa", emailSent: boolean) {
    setRegisteredEmail(email);
    setRegisteredRole(role);
    setStep("otp");
    window.scrollTo(0, 0);
    if (!emailSent) {
      toast({
        title: "No pudimos enviar el correo",
        description: "Usa el botón «Reenviar código» para intentarlo de nuevo.",
        variant: "destructive",
      });
    }
  }

  function onRegisterError(err: unknown) {
    const status = (err as { status?: number }).status;
    toast({
      title: status === 409 ? "Este correo ya está registrado" : getApiErrorMessage(err, "Error al crear la cuenta"),
      variant: "destructive",
    });
  }

  const onSubmitPostulante = (values: z.infer<typeof postulanteSchema>) => {
    register.mutate(
      { data: { role: "postulante", name: values.name, email: values.email, password: values.password } },
      {
        onSuccess: (r) => handleRegisterSuccess(r.email, "postulante", r.emailSent),
        onError: onRegisterError,
      },
    );
  };

  const onSubmitEmpresa = (values: z.infer<typeof empresaSchema>) => {
    register.mutate(
      {
        data: {
          role: "empresa",
          name: values.name,
          email: values.email,
          password: values.password,
          organization: {
            name: values.orgName,
            type: values.orgType,
            country: values.orgCountry,
            city: values.orgCity || undefined,
            website: values.orgWebsite || undefined,
            description: values.orgDescription || undefined,
          },
        },
      },
      {
        onSuccess: (r) => handleRegisterSuccess(r.email, "empresa", r.emailSent),
        onError: onRegisterError,
      },
    );
  };

  const onVerify = () => {
    if (otpCode.length !== 6) return;
    verifyEmail.mutate(
      { data: { email: registeredEmail, code: otpCode } },
      {
        onSuccess: () => {
          setStep("success");
          window.scrollTo(0, 0);
        },
        onError: (err: unknown) => {
          setOtpCode("");
          toast({ title: getApiErrorMessage(err, "Código inválido o expirado"), variant: "destructive" });
        },
      },
    );
  };

  const onResend = () => {
    resendOtp.mutate(
      { data: { email: registeredEmail } },
      {
        onSuccess: () => toast({ title: "Código reenviado", description: "Revisa tu bandeja de entrada." }),
        onError: (err: unknown) =>
          toast({ title: getApiErrorMessage(err, "No se pudo reenviar el código"), variant: "destructive" }),
      },
    );
  };

  if (step === "otp") {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-16 flex justify-center">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto inline-flex justify-center items-center w-16 h-16 rounded-2xl bg-primary/10 text-primary mb-4">
                <MailCheck className="w-8 h-8" />
              </div>
              <CardTitle className="text-2xl">Verifica tu correo</CardTitle>
              <CardDescription>
                Enviamos un código de 6 dígitos a <strong>{registeredEmail}</strong>. Ingrésalo para verificar tu cuenta.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex justify-center">
                <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode}>
                  <InputOTPGroup>
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                      <InputOTPSlot key={i} index={i} />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </div>
              <Button className="w-full" onClick={onVerify} disabled={otpCode.length !== 6 || verifyEmail.isPending}>
                {verifyEmail.isPending ? "Verificando..." : "Verificar código"}
              </Button>
              <div className="text-center text-sm text-muted-foreground">
                ¿No recibiste el correo?{" "}
                <button
                  type="button"
                  className="text-primary hover:underline disabled:opacity-50"
                  onClick={onResend}
                  disabled={resendOtp.isPending}
                >
                  {resendOtp.isPending ? "Enviando..." : "Reenviar código"}
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  if (step === "success") {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-20 max-w-2xl text-center">
          {registeredRole === "postulante" ? (
            <>
              <div className="inline-flex justify-center items-center w-24 h-24 rounded-full bg-green-100 text-green-600 mb-8">
                <CheckCircle2 className="w-12 h-12" />
              </div>
              <h1 className="text-4xl font-bold mb-4">¡Correo verificado!</h1>
              <p className="text-xl text-muted-foreground mb-8">
                Tu cuenta está lista. Ya puedes iniciar sesión y comenzar a postular a oportunidades.
              </p>
              <Button size="lg" onClick={() => navigate("/login")}>Iniciar sesión</Button>
            </>
          ) : (
            <>
              <div className="inline-flex justify-center items-center w-24 h-24 rounded-full bg-yellow-100 text-yellow-600 mb-8">
                <Clock className="w-12 h-12" />
              </div>
              <h1 className="text-4xl font-bold mb-4">Correo verificado — Cuenta pendiente de aprobación</h1>
              <p className="text-xl text-muted-foreground mb-8">
                Tu correo fue verificado con éxito. Tu organización quedó en estado{" "}
                <strong className="text-yellow-600">Pendiente</strong>.
              </p>
              <div className="bg-muted/50 p-6 rounded-lg text-left">
                <p className="mb-4">El equipo de SEMBER revisará la información de la institución para validar su autenticidad.</p>
                <p>Una vez aprobada, podrás iniciar sesión y acceder al <strong>Panel Institucional</strong> para publicar oportunidades y recibir postulaciones.</p>
              </div>
              <Button className="mt-8" onClick={() => navigate("/")}>Volver al inicio</Button>
            </>
          )}
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-3">Crear cuenta</h1>
          <p className="text-muted-foreground text-lg">
            Únete a SEMBER CONNECT como profesional o como organización.
          </p>
        </div>

        <Tabs defaultValue={initialTab}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="postulante">
              <UserPlus className="w-4 h-4 mr-2" /> Postulante
            </TabsTrigger>
            <TabsTrigger value="empresa">
              <Building2 className="w-4 h-4 mr-2" /> Organización
            </TabsTrigger>
          </TabsList>

          <TabsContent value="postulante">
            <Card>
              <CardHeader>
                <CardTitle>Registro de Postulante</CardTitle>
                <CardDescription>Crea tu perfil profesional y postula a oportunidades.</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...postulanteForm}>
                  <form onSubmit={postulanteForm.handleSubmit(onSubmitPostulante)} className="space-y-4">
                    <FormField control={postulanteForm.control} name="name" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre completo *</FormLabel>
                        <FormControl><Input placeholder="Ej. Ana García" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={postulanteForm.control} name="email" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Correo electrónico *</FormLabel>
                        <FormControl><Input type="email" placeholder="tu@correo.com" autoComplete="email" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={postulanteForm.control} name="password" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contraseña *</FormLabel>
                        <FormControl><Input type="password" placeholder="Mínimo 8 caracteres" autoComplete="new-password" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <Button type="submit" className="w-full" disabled={register.isPending}>
                      {register.isPending ? "Creando cuenta..." : "Crear cuenta"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="empresa">
            <Card>
              <CardHeader>
                <CardTitle>Registro de Organización</CardTitle>
                <CardDescription>
                  La cuenta quedará pendiente hasta que el equipo de SEMBER apruebe tu organización.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...empresaForm}>
                  <form onSubmit={empresaForm.handleSubmit(onSubmitEmpresa)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField control={empresaForm.control} name="name" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre del responsable *</FormLabel>
                          <FormControl><Input placeholder="Ej. Juan Pérez" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={empresaForm.control} name="email" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Correo electrónico *</FormLabel>
                          <FormControl><Input type="email" placeholder="contacto@institucion.edu" autoComplete="email" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                    <FormField control={empresaForm.control} name="password" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contraseña *</FormLabel>
                        <FormControl><Input type="password" placeholder="Mínimo 8 caracteres" autoComplete="new-password" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <div className="pt-4 border-t">
                      <p className="text-sm font-medium mb-4 text-muted-foreground">Datos de la organización</p>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField control={empresaForm.control} name="orgName" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nombre de la Institución *</FormLabel>
                              <FormControl><Input placeholder="Ej. Universidad Nacional" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                          <FormField control={empresaForm.control} name="orgType" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tipo de Organización *</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger><SelectValue placeholder="Seleccione un tipo" /></SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {ORGANIZATION_TYPES.map((t) => (
                                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField control={empresaForm.control} name="orgCountry" render={({ field }) => (
                            <FormItem>
                              <FormLabel>País *</FormLabel>
                              <FormControl><Input placeholder="Ej. México" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                          <FormField control={empresaForm.control} name="orgCity" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Ciudad</FormLabel>
                              <FormControl><Input placeholder="Ej. Ciudad de México" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                        </div>
                        <FormField control={empresaForm.control} name="orgWebsite" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Sitio Web</FormLabel>
                            <FormControl><Input placeholder="https://..." {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={empresaForm.control} name="orgDescription" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Descripción de la Organización</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Breve descripción de la misión, visión y actividades..." rows={3} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </div>
                    </div>

                    <Button type="submit" className="w-full" disabled={register.isPending}>
                      {register.isPending ? "Enviando solicitud..." : "Crear cuenta y enviar solicitud"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <p className="text-center text-sm text-muted-foreground mt-6">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="text-primary hover:underline">Inicia sesión</Link>
        </p>
      </div>
    </MainLayout>
  );
}
