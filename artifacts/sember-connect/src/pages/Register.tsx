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
import { useDomainLabels } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation, useSearch } from "wouter";
import { CheckCircle2, MailCheck, UserPlus, Building2, Clock } from "lucide-react";

type Step = "form" | "otp" | "success";

function getApiErrorMessage(err: unknown, fallback: string): string {
  const data = (err as { data?: { error?: string } }).data;
  return data?.error ?? fallback;
}

export default function Register() {
  const { t } = useTranslation();
  const { organizationTypes } = useDomainLabels();
  const { toast } = useToast();

  const postulanteSchema = z.object({
    name: z.string().min(2, t("auth.validation.nameMin")),
    email: z.string().email(t("auth.validation.invalidEmail")),
    password: z.string().min(8, t("auth.validation.passwordMin")),
  });

  const empresaSchema = z.object({
    name: z.string().min(2, t("auth.validation.nameMin")),
    email: z.string().email(t("auth.validation.invalidEmail")),
    password: z.string().min(8, t("auth.validation.passwordMin")),
    orgName: z.string().min(2, t("auth.validation.orgNameRequired")),
    orgType: z.string().min(1, t("auth.validation.orgTypeRequired")),
    orgCountry: z.string().min(2, t("auth.validation.orgCountryRequired")),
    orgCity: z.string().optional(),
    orgWebsite: z.string().url(t("auth.validation.orgWebsiteUrl")).optional().or(z.literal("")),
    orgDescription: z.string().optional(),
  });
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
        title: t("auth.register.toasts.emailNotSentTitle"),
        description: t("auth.register.toasts.emailNotSentDesc"),
        variant: "destructive",
      });
    }
  }

  function onRegisterError(err: unknown) {
    const status = (err as { status?: number }).status;
    toast({
      title: status === 409 ? t("auth.register.toasts.emailExists") : getApiErrorMessage(err, t("auth.register.toasts.createError")),
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
          toast({ title: getApiErrorMessage(err, t("auth.register.toasts.invalidCode")), variant: "destructive" });
        },
      },
    );
  };

  const onResend = () => {
    resendOtp.mutate(
      { data: { email: registeredEmail } },
      {
        onSuccess: () => toast({ title: t("auth.register.toasts.codeResent"), description: t("auth.register.toasts.codeResentDesc") }),
        onError: (err: unknown) =>
          toast({ title: getApiErrorMessage(err, t("auth.register.toasts.resendError")), variant: "destructive" }),
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
              <CardTitle className="text-2xl">{t("auth.register.otp.title")}</CardTitle>
              <CardDescription>
                {t("auth.register.otp.descriptionBefore")}<strong>{registeredEmail}</strong>{t("auth.register.otp.descriptionAfter")}
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
                {verifyEmail.isPending ? t("auth.register.otp.verifying") : t("auth.register.otp.verify")}
              </Button>
              <div className="text-center text-sm text-muted-foreground">
                {t("auth.register.otp.noEmail")}{" "}
                <button
                  type="button"
                  className="text-primary hover:underline disabled:opacity-50"
                  onClick={onResend}
                  disabled={resendOtp.isPending}
                >
                  {resendOtp.isPending ? t("auth.register.otp.resending") : t("auth.register.otp.resend")}
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
              <h1 className="text-4xl font-bold mb-4">{t("auth.register.success.applicantTitle")}</h1>
              <p className="text-xl text-muted-foreground mb-8">
                {t("auth.register.success.applicantMessage")}
              </p>
              <Button size="lg" onClick={() => navigate("/login")}>{t("auth.register.success.loginButton")}</Button>
            </>
          ) : (
            <>
              <div className="inline-flex justify-center items-center w-24 h-24 rounded-full bg-yellow-100 text-yellow-600 mb-8">
                <Clock className="w-12 h-12" />
              </div>
              <h1 className="text-4xl font-bold mb-4">{t("auth.register.success.orgTitle")}</h1>
              <p className="text-xl text-muted-foreground mb-8">
                {t("auth.register.success.orgMessageBefore")}
                <strong className="text-yellow-600">{t("auth.register.success.orgStatusPending")}</strong>{t("auth.register.success.orgMessageAfter")}
              </p>
              <div className="bg-muted/50 p-6 rounded-lg text-left">
                <p className="mb-4">{t("auth.register.success.orgInfo1")}</p>
                <p>{t("auth.register.success.orgInfo2Before")}<strong>{t("auth.register.success.orgInfo2Panel")}</strong>{t("auth.register.success.orgInfo2After")}</p>
              </div>
              <Button className="mt-8" onClick={() => navigate("/")}>{t("auth.register.success.backHome")}</Button>
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
          <h1 className="text-4xl font-bold mb-3">{t("auth.register.title")}</h1>
          <p className="text-muted-foreground text-lg">
            {t("auth.register.subtitle")}
          </p>
        </div>

        <Tabs defaultValue={initialTab}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="postulante">
              <UserPlus className="w-4 h-4 mr-2" /> {t("auth.register.tabApplicant")}
            </TabsTrigger>
            <TabsTrigger value="empresa">
              <Building2 className="w-4 h-4 mr-2" /> {t("auth.register.tabOrganization")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="postulante">
            <Card>
              <CardHeader>
                <CardTitle>{t("auth.register.applicant.title")}</CardTitle>
                <CardDescription>{t("auth.register.applicant.description")}</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...postulanteForm}>
                  <form onSubmit={postulanteForm.handleSubmit(onSubmitPostulante)} className="space-y-4">
                    <FormField control={postulanteForm.control} name="name" render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("auth.register.fields.fullName")}</FormLabel>
                        <FormControl><Input placeholder={t("auth.register.fields.fullNamePlaceholder")} {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={postulanteForm.control} name="email" render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("auth.register.fields.email")}</FormLabel>
                        <FormControl><Input type="email" placeholder={t("auth.register.fields.emailPlaceholder")} autoComplete="email" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={postulanteForm.control} name="password" render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("auth.register.fields.password")}</FormLabel>
                        <FormControl><Input type="password" placeholder={t("auth.register.fields.passwordPlaceholder")} autoComplete="new-password" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <Button type="submit" className="w-full" disabled={register.isPending}>
                      {register.isPending ? t("auth.register.applicant.submitting") : t("auth.register.applicant.submit")}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="empresa">
            <Card>
              <CardHeader>
                <CardTitle>{t("auth.register.organization.title")}</CardTitle>
                <CardDescription>
                  {t("auth.register.organization.description")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...empresaForm}>
                  <form onSubmit={empresaForm.handleSubmit(onSubmitEmpresa)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField control={empresaForm.control} name="name" render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("auth.register.organization.responsibleName")}</FormLabel>
                          <FormControl><Input placeholder={t("auth.register.organization.responsibleNamePlaceholder")} {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={empresaForm.control} name="email" render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("auth.register.fields.email")}</FormLabel>
                          <FormControl><Input type="email" placeholder={t("auth.register.organization.emailPlaceholder")} autoComplete="email" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                    <FormField control={empresaForm.control} name="password" render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("auth.register.fields.password")}</FormLabel>
                        <FormControl><Input type="password" placeholder={t("auth.register.fields.passwordPlaceholder")} autoComplete="new-password" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <div className="pt-4 border-t">
                      <p className="text-sm font-medium mb-4 text-muted-foreground">{t("auth.register.organization.dataHeading")}</p>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField control={empresaForm.control} name="orgName" render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("auth.register.organization.orgName")}</FormLabel>
                              <FormControl><Input placeholder={t("auth.register.organization.orgNamePlaceholder")} {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                          <FormField control={empresaForm.control} name="orgType" render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("auth.register.organization.orgType")}</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger><SelectValue placeholder={t("auth.register.organization.orgTypePlaceholder")} /></SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {organizationTypes.map((o) => (
                                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
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
                              <FormLabel>{t("auth.register.organization.country")}</FormLabel>
                              <FormControl><Input placeholder={t("auth.register.organization.countryPlaceholder")} {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                          <FormField control={empresaForm.control} name="orgCity" render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("auth.register.organization.city")}</FormLabel>
                              <FormControl><Input placeholder={t("auth.register.organization.cityPlaceholder")} {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                        </div>
                        <FormField control={empresaForm.control} name="orgWebsite" render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("auth.register.organization.website")}</FormLabel>
                            <FormControl><Input placeholder={t("auth.register.organization.websitePlaceholder")} {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={empresaForm.control} name="orgDescription" render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("auth.register.organization.descriptionLabel")}</FormLabel>
                            <FormControl>
                              <Textarea placeholder={t("auth.register.organization.descriptionPlaceholder")} rows={3} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </div>
                    </div>

                    <Button type="submit" className="w-full" disabled={register.isPending}>
                      {register.isPending ? t("auth.register.organization.submitting") : t("auth.register.organization.submit")}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <p className="text-center text-sm text-muted-foreground mt-6">
          {t("auth.register.haveAccount")}{" "}
          <Link href="/login" className="text-primary hover:underline">{t("auth.register.loginLink")}</Link>
        </p>
      </div>
    </MainLayout>
  );
}
