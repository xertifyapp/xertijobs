import { MainLayout } from "@/components/layout/MainLayout";
import { useGetProfessional, useUpdateProfessional, useListApplications, useListSavedOpportunities, useGetOpportunity, getGetProfessionalQueryKey, getGetOpportunityQueryKey, getListApplicationsQueryKey, getListSavedOpportunitiesQueryKey } from "@workspace/api-client-react";
import { STATUS_COLORS } from "@/lib/constants";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Globe, Mail, User2, Briefcase, GraduationCap, Link as LinkIcon, ExternalLink } from "lucide-react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";

const profileSchema = z.object({
  name: z.string().min(2, "El nombre es requerido"),
  headline: z.string().optional(),
  country: z.string().optional(),
  city: z.string().optional(),
  bio: z.string().optional(),
  education: z.string().optional(),
  experience: z.string().optional(),
});

function SavedOppCard({ oppId }: { oppId: number }) {
  const { data: opp } = useGetOpportunity(oppId, { query: { enabled: !!oppId, queryKey: getGetOpportunityQueryKey(oppId) } });
  if (!opp) return null;
  
  return (
    <Card className="hover:border-primary/50 transition-colors">
      <CardContent className="p-6">
        <h3 className="font-bold text-lg mb-1">{opp.title}</h3>
        <p className="text-muted-foreground mb-4">{opp.organizationName}</p>
        <Link href={`/oportunidades/${opp.id}`}>
          <Button variant="outline" size="sm">Ver Oportunidad</Button>
        </Link>
      </CardContent>
    </Card>
  );
}

export default function Profile() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const professionalId = user?.professionalId ?? 0;
  const { data: profile, isLoading: isProfileLoading } = useGetProfessional(professionalId, { query: { enabled: !!professionalId, queryKey: getGetProfessionalQueryKey(professionalId) } });
  const updateProfile = useUpdateProfessional();

  const { data: applications, isLoading: isAppsLoading } = useListApplications({ professionalId }, { query: { enabled: !!professionalId, queryKey: getListApplicationsQueryKey({ professionalId }) } });
  const { data: savedOpps, isLoading: isSavedLoading } = useListSavedOpportunities(professionalId, { query: { enabled: !!professionalId, queryKey: getListSavedOpportunitiesQueryKey(professionalId) } });

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      headline: "",
      country: "",
      city: "",
      bio: "",
      education: "",
      experience: "",
    },
  });

  useEffect(() => {
    if (profile) {
      form.reset({
        name: profile.name || "",
        headline: profile.headline || "",
        country: profile.country || "",
        city: profile.city || "",
        bio: profile.bio || "",
        education: profile.education || "",
        experience: profile.experience || "",
      });
    }
  }, [profile, form]);

  const onSubmit = (values: z.infer<typeof profileSchema>) => {
    updateProfile.mutate({ id: professionalId, data: values }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetProfessionalQueryKey(professionalId) });
        toast({ title: "Perfil actualizado correctamente" });
      },
      onError: () => {
        toast({ title: "Error al actualizar perfil", variant: "destructive" });
      }
    });
  };

  if (isProfileLoading) return <MainLayout><div className="py-20 text-center">Cargando perfil...</div></MainLayout>;
  if (!profile) return <MainLayout><div className="py-20 text-center">Perfil no encontrado.</div></MainLayout>;

  return (
    <MainLayout>
      <div className="bg-muted/30 border-b">
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
            <div className="w-24 h-24 rounded-full bg-primary/10 flex justify-center items-center text-primary shrink-0">
              <User2 className="w-12 h-12" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-bold mb-2">{profile.name}</h1>
              <p className="text-xl text-muted-foreground mb-4">{profile.headline || "Profesional en la red SEMBER"}</p>
              <div className="flex flex-wrap gap-4 justify-center md:justify-start text-sm text-muted-foreground">
                <div className="flex items-center gap-1"><Mail className="h-4 w-4" /> {profile.email}</div>
                <div className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {profile.city ? `${profile.city}, ` : ''}{profile.country || 'Ubicación no especificada'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <Tabs defaultValue="applications" className="w-full">
          <TabsList className="mb-8">
            <TabsTrigger value="applications">Mis Postulaciones</TabsTrigger>
            <TabsTrigger value="saved">Oportunidades Guardadas</TabsTrigger>
            <TabsTrigger value="edit">Editar Perfil</TabsTrigger>
          </TabsList>

          <TabsContent value="applications">
            {isAppsLoading ? (
              <div className="text-muted-foreground">Cargando postulaciones...</div>
            ) : applications?.length === 0 ? (
              <div className="text-center py-12 border rounded-xl bg-card">
                <p className="text-muted-foreground mb-4">No tienes postulaciones activas.</p>
                <Link href="/oportunidades"><Button>Explorar Oportunidades</Button></Link>
              </div>
            ) : (
              <div className="grid gap-4">
                {applications?.map(app => (
                  <Card key={app.id}>
                    <CardContent className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <h3 className="font-bold text-lg mb-1">{app.opportunityTitle}</h3>
                        <p className="text-muted-foreground text-sm">{app.organizationName}</p>
                        <div className="text-xs text-muted-foreground mt-2">Postulado el {new Date(app.createdAt).toLocaleDateString('es-ES')}</div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge className={STATUS_COLORS[app.status]}>{app.status.replace("_", " ")}</Badge>
                        <Link href={`/oportunidades/${app.opportunityId}`}>
                          <Button variant="ghost" size="icon"><ExternalLink className="h-4 w-4" /></Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="saved">
            {isSavedLoading ? (
              <div className="text-muted-foreground">Cargando guardados...</div>
            ) : savedOpps?.length === 0 ? (
              <div className="text-center py-12 border rounded-xl bg-card">
                <p className="text-muted-foreground mb-4">No tienes oportunidades guardadas.</p>
                <Link href="/oportunidades"><Button>Explorar Oportunidades</Button></Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedOpps?.map(saved => (
                  <SavedOppCard key={saved.id} oppId={saved.id} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="edit">
            <Card>
              <CardHeader>
                <CardTitle>Información Básica</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField control={form.control} name="name" render={({ field }) => (
                        <FormItem><FormLabel>Nombre Completo</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name="headline" render={({ field }) => (
                        <FormItem><FormLabel>Titular (Headline)</FormLabel><FormControl><Input placeholder="Ej. Estudiante de Ing. de Software" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name="country" render={({ field }) => (
                        <FormItem><FormLabel>País</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name="city" render={({ field }) => (
                        <FormItem><FormLabel>Ciudad</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                    </div>

                    <FormField control={form.control} name="bio" render={({ field }) => (
                      <FormItem><FormLabel>Sobre mí</FormLabel><FormControl><Textarea rows={4} {...field} /></FormControl><FormMessage /></FormItem>
                    )} />

                    <FormField control={form.control} name="education" render={({ field }) => (
                      <FormItem><FormLabel>Educación</FormLabel><FormControl><Textarea rows={3} {...field} /></FormControl><FormMessage /></FormItem>
                    )} />

                    <FormField control={form.control} name="experience" render={({ field }) => (
                      <FormItem><FormLabel>Experiencia Profesional</FormLabel><FormControl><Textarea rows={3} {...field} /></FormControl><FormMessage /></FormItem>
                    )} />

                    <Button type="submit" disabled={updateProfile.isPending}>
                      {updateProfile.isPending ? "Guardando..." : "Guardar Cambios"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
