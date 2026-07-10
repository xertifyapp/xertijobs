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
import { useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Mail, User2, ExternalLink, Camera, Loader2 } from "lucide-react";
import { FaInstagram, FaLinkedin, FaXTwitter, FaTiktok } from "react-icons/fa6";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useUpload } from "@workspace/object-storage-web";

const objectUrl = (path?: string | null) => (path ? `/api/storage${path}` : undefined);

const profileSchema = z.object({
  name: z.string().min(2, "El nombre es requerido"),
  headline: z.string().optional(),
  country: z.string().optional(),
  city: z.string().optional(),
  bio: z.string().optional(),
  education: z.string().optional(),
  experience: z.string().optional(),
  avatarUrl: z.string().optional(),
  instagram: z.string().optional(),
  linkedin: z.string().optional(),
  x: z.string().optional(),
  tiktok: z.string().optional(),
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

  const fileInputRef = useRef<HTMLInputElement>(null);

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
      avatarUrl: "",
      instagram: "",
      linkedin: "",
      x: "",
      tiktok: "",
    },
  });

  const { uploadFile, isUploading } = useUpload({
    onSuccess: (res) => {
      form.setValue("avatarUrl", res.objectPath, { shouldDirty: true });
      updateProfile.mutate({ id: professionalId, data: { avatarUrl: res.objectPath } }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetProfessionalQueryKey(professionalId) });
          toast({ title: "Foto de perfil actualizada" });
        },
        onError: () => toast({ title: "Error al guardar la foto", variant: "destructive" }),
      });
    },
    onError: () => toast({ title: "Error al subir la foto", variant: "destructive" }),
  });

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    e.target.value = "";
  };

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
        avatarUrl: profile.avatarUrl || "",
        instagram: profile.instagram || "",
        linkedin: profile.linkedin || "",
        x: profile.x || "",
        tiktok: profile.tiktok || "",
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

  const currentAvatar = form.watch("avatarUrl") || profile?.avatarUrl;

  if (isProfileLoading) return <MainLayout><div className="py-20 text-center">Cargando perfil...</div></MainLayout>;
  if (!profile) return <MainLayout><div className="py-20 text-center">Perfil no encontrado.</div></MainLayout>;

  return (
    <MainLayout>
      <div className="bg-muted/30 border-b">
        <div className="container mx-auto px-4 py-12">
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
          <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              title="Cambiar foto de perfil"
              className="group relative w-24 h-24 rounded-full bg-primary/10 flex justify-center items-center text-primary shrink-0 overflow-hidden cursor-pointer"
            >
              {currentAvatar ? (
                <img src={objectUrl(currentAvatar)} alt={profile.name} className="w-full h-full object-cover" />
              ) : (
                <User2 className="w-12 h-12" />
              )}
              <span className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                {isUploading ? <Loader2 className="w-6 h-6 text-white animate-spin" /> : <Camera className="w-6 h-6 text-white" />}
              </span>
            </button>
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-bold mb-2">{profile.name}</h1>
              <p className="text-xl text-muted-foreground mb-4">{profile.headline || "Profesional en la red SEMBER"}</p>
              <div className="flex flex-wrap gap-4 justify-center md:justify-start text-sm text-muted-foreground">
                <div className="flex items-center gap-1"><Mail className="h-4 w-4" /> {profile.email}</div>
                <div className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {profile.city ? `${profile.city}, ` : ''}{profile.country || 'Ubicación no especificada'}</div>
              </div>
              {(profile.instagram || profile.linkedin || profile.x || profile.tiktok) && (
                <div className="flex flex-wrap gap-3 justify-center md:justify-start mt-4">
                  {profile.instagram && <a href={profile.instagram} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-primary transition-colors"><FaInstagram className="h-5 w-5" /></a>}
                  {profile.linkedin && <a href={profile.linkedin} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-primary transition-colors"><FaLinkedin className="h-5 w-5" /></a>}
                  {profile.x && <a href={profile.x} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-primary transition-colors"><FaXTwitter className="h-5 w-5" /></a>}
                  {profile.tiktok && <a href={profile.tiktok} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-primary transition-colors"><FaTiktok className="h-5 w-5" /></a>}
                </div>
              )}
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
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-20 rounded-full bg-primary/10 flex justify-center items-center text-primary shrink-0 overflow-hidden">
                        {currentAvatar ? (
                          <img src={objectUrl(currentAvatar)} alt="Foto de perfil" className="w-full h-full object-cover" />
                        ) : (
                          <User2 className="w-10 h-10" />
                        )}
                      </div>
                      <div>
                        <Button type="button" variant="outline" disabled={isUploading} onClick={() => fileInputRef.current?.click()}>
                          {isUploading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Subiendo...</> : <><Camera className="w-4 h-4 mr-2" /> Cambiar Foto</>}
                        </Button>
                        <p className="text-xs text-muted-foreground mt-2">JPG, PNG o GIF. Máximo 10MB.</p>
                      </div>
                    </div>

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

                    <div className="pt-2">
                      <h3 className="text-sm font-semibold mb-4">Redes Sociales</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField control={form.control} name="instagram" render={({ field }) => (
                          <FormItem><FormLabel className="flex items-center gap-2"><FaInstagram className="h-4 w-4" /> Instagram</FormLabel><FormControl><Input placeholder="https://instagram.com/tuusuario" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="linkedin" render={({ field }) => (
                          <FormItem><FormLabel className="flex items-center gap-2"><FaLinkedin className="h-4 w-4" /> LinkedIn</FormLabel><FormControl><Input placeholder="https://linkedin.com/in/tuusuario" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="x" render={({ field }) => (
                          <FormItem><FormLabel className="flex items-center gap-2"><FaXTwitter className="h-4 w-4" /> X (Twitter)</FormLabel><FormControl><Input placeholder="https://x.com/tuusuario" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="tiktok" render={({ field }) => (
                          <FormItem><FormLabel className="flex items-center gap-2"><FaTiktok className="h-4 w-4" /> TikTok</FormLabel><FormControl><Input placeholder="https://tiktok.com/@tuusuario" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                      </div>
                    </div>

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
