import { MainLayout } from "@/components/layout/MainLayout";
import { useListOrganizations, useGetOrganizationStats, useListOpportunities, useListApplications, useUpdateApplication, useCreateOpportunity, useUpdateOpportunity, getListApplicationsQueryKey, getGetOrganizationStatsQueryKey, getListOpportunitiesQueryKey } from "@workspace/api-client-react";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { STATUS_COLORS, OPPORTUNITY_TYPES, MODALITIES } from "@/lib/constants";
import { Building2, Eye, Users, FileText, CheckCircle2, MoreVertical, MapPin, Globe, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const oppSchema = z.object({
  title: z.string().min(2, "Título requerido"),
  type: z.string().min(1, "Tipo requerido"),
  modality: z.string().min(1, "Modalidad requerida"),
  country: z.string().min(2, "País requerido"),
  city: z.string().optional(),
  area: z.string().optional(),
  description: z.string().optional(),
  requirements: z.string().optional(),
  paid: z.boolean().default(false),
});

export default function Panel() {
  const { data: orgs, isLoading: isOrgsLoading } = useListOrganizations({ status: "aprobada" });
  const [selectedOrgId, setSelectedOrgId] = useState<string>("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const currentOrgId = selectedOrgId ? parseInt(selectedOrgId) : (orgs?.[0]?.id || 0);

  const { data: stats } = useGetOrganizationStats(currentOrgId, { query: { enabled: !!currentOrgId, queryKey: getGetOrganizationStatsQueryKey(currentOrgId) } });
  const { data: opportunities } = useListOpportunities({ organizationId: currentOrgId }, { query: { enabled: !!currentOrgId, queryKey: getListOpportunitiesQueryKey({ organizationId: currentOrgId }) } });
  const { data: applications } = useListApplications({ organizationId: currentOrgId }, { query: { enabled: !!currentOrgId, queryKey: getListApplicationsQueryKey({ organizationId: currentOrgId }) } });

  const updateApp = useUpdateApplication();
  const createOpp = useCreateOpportunity();
  const updateOpp = useUpdateOpportunity();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const oppForm = useForm<z.infer<typeof oppSchema>>({
    resolver: zodResolver(oppSchema),
    defaultValues: { title: "", type: "", modality: "", country: "", city: "", area: "", description: "", requirements: "", paid: false }
  });

  const handleUpdateStatus = (appId: number, newStatus: string) => {
    updateApp.mutate({ id: appId, data: { status: newStatus } }, {
      onSuccess: () => {
        toast({ title: "Estado de postulación actualizado" });
        queryClient.invalidateQueries({ queryKey: getListApplicationsQueryKey({ organizationId: currentOrgId }) });
        queryClient.invalidateQueries({ queryKey: getGetOrganizationStatsQueryKey(currentOrgId) });
      }
    });
  };

  const handleCloseOpp = (oppId: number) => {
    updateOpp.mutate({ id: oppId, data: { status: "cerrada" } }, {
      onSuccess: () => {
        toast({ title: "Oportunidad cerrada" });
        queryClient.invalidateQueries({ queryKey: getListOpportunitiesQueryKey({ organizationId: currentOrgId }) });
        queryClient.invalidateQueries({ queryKey: getGetOrganizationStatsQueryKey(currentOrgId) });
      }
    });
  };

  const onCreateSubmit = (values: z.infer<typeof oppSchema>) => {
    createOpp.mutate({
      data: {
        ...values,
        organizationId: currentOrgId,
        status: "activa",
        competencies: [],
        requiredDocuments: [],
      }
    }, {
      onSuccess: () => {
        toast({ title: "Oportunidad publicada exitosamente" });
        setIsCreateOpen(false);
        oppForm.reset();
        queryClient.invalidateQueries({ queryKey: getListOpportunitiesQueryKey({ organizationId: currentOrgId }) });
        queryClient.invalidateQueries({ queryKey: getGetOrganizationStatsQueryKey(currentOrgId) });
      },
      onError: () => {
        toast({ title: "Error al publicar", variant: "destructive" });
      }
    });
  };

  if (isOrgsLoading) return <MainLayout><div className="py-20 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" /></div></MainLayout>;

  return (
    <MainLayout>
      <div className="bg-muted/30 border-b">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h1 className="text-3xl font-bold">Panel Institucional</h1>
            {orgs && orgs.length > 0 && (
              <Select value={currentOrgId.toString()} onValueChange={setSelectedOrgId}>
                <SelectTrigger className="w-[300px] bg-background">
                  <Building2 className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Seleccionar Organización" />
                </SelectTrigger>
                <SelectContent>
                  {orgs.map(org => (
                    <SelectItem key={org.id} value={org.id.toString()}>{org.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      </div>

      {!currentOrgId ? (
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="text-muted-foreground text-lg mb-4">No hay organizaciones aprobadas disponibles.</p>
          <Link href="/registro-organizacion"><Button>Registrar una Organización</Button></Link>
        </div>
      ) : (
        <div className="container mx-auto px-4 py-8 space-y-8">
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Vistas Totales</p>
                    <h3 className="text-3xl font-bold mt-1">{stats?.totalViews || 0}</h3>
                  </div>
                  <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><Eye className="w-5 h-5" /></div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Postulaciones</p>
                    <h3 className="text-3xl font-bold mt-1">{stats?.totalApplications || 0}</h3>
                  </div>
                  <div className="p-2 bg-green-100 text-green-600 rounded-lg"><Users className="w-5 h-5" /></div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Opps Activas</p>
                    <h3 className="text-3xl font-bold mt-1">{stats?.activeOpportunities || 0}</h3>
                  </div>
                  <div className="p-2 bg-purple-100 text-purple-600 rounded-lg"><CheckCircle2 className="w-5 h-5" /></div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Opps Publicadas</p>
                    <h3 className="text-3xl font-bold mt-1">{stats?.publishedOpportunities || 0}</h3>
                  </div>
                  <div className="p-2 bg-orange-100 text-orange-600 rounded-lg"><FileText className="w-5 h-5" /></div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="applications" className="w-full">
            <TabsList>
              <TabsTrigger value="applications">Postulaciones Recibidas</TabsTrigger>
              <TabsTrigger value="opportunities">Gestionar Oportunidades</TabsTrigger>
            </TabsList>

            <TabsContent value="applications" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Postulaciones ({applications?.length || 0})</CardTitle>
                </CardHeader>
                <CardContent>
                  {applications?.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">Aún no hay postulaciones recibidas.</p>
                  ) : (
                    <div className="space-y-4">
                      {applications?.map(app => (
                        <div key={app.id} className="p-4 border rounded-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-muted/10 transition-colors">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-bold">{app.professionalName}</h4>
                              <Badge className={STATUS_COLORS[app.status]}>{app.status.replace("_", " ")}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-1">{app.professionalHeadline}</p>
                            <p className="text-sm"><strong>Postula a:</strong> <Link href={`/oportunidades/${app.opportunityId}`} className="text-primary hover:underline">{app.opportunityTitle}</Link></p>
                            {app.message && <div className="mt-3 text-sm bg-muted/30 p-3 rounded-md italic border-l-4 border-muted">"{app.message}"</div>}
                          </div>
                          <div className="flex items-center gap-2">
                            <Select value={app.status} onValueChange={(val) => handleUpdateStatus(app.id, val)}>
                              <SelectTrigger className="w-[180px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="en_revision">En Revisión</SelectItem>
                                <SelectItem value="preseleccionado">Preseleccionado</SelectItem>
                                <SelectItem value="aceptado">Aceptado</SelectItem>
                                <SelectItem value="rechazado">Rechazado</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="opportunities" className="mt-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Oportunidades Publicadas</CardTitle>
                  <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                      <Button>Nueva Oportunidad</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Publicar Nueva Oportunidad</DialogTitle>
                      </DialogHeader>
                      <Form {...oppForm}>
                        <form onSubmit={oppForm.handleSubmit(onCreateSubmit)} className="space-y-4 py-4">
                          <FormField control={oppForm.control} name="title" render={({ field }) => (
                            <FormItem><FormLabel>Título</FormLabel><FormControl><Input placeholder="Ej. Desarrollador Frontend" {...field} /></FormControl><FormMessage /></FormItem>
                          )} />
                          <div className="grid grid-cols-2 gap-4">
                            <FormField control={oppForm.control} name="type" render={({ field }) => (
                              <FormItem><FormLabel>Tipo</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger></FormControl>
                                  <SelectContent>{OPPORTUNITY_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                                </Select><FormMessage />
                              </FormItem>
                            )} />
                            <FormField control={oppForm.control} name="modality" render={({ field }) => (
                              <FormItem><FormLabel>Modalidad</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger></FormControl>
                                  <SelectContent>{MODALITIES.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
                                </Select><FormMessage />
                              </FormItem>
                            )} />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <FormField control={oppForm.control} name="country" render={({ field }) => (
                              <FormItem><FormLabel>País</FormLabel><FormControl><Input placeholder="Ej. Argentina" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={oppForm.control} name="city" render={({ field }) => (
                              <FormItem><FormLabel>Ciudad</FormLabel><FormControl><Input placeholder="Ej. Buenos Aires" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                          </div>
                          <FormField control={oppForm.control} name="area" render={({ field }) => (
                            <FormItem><FormLabel>Área/Departamento</FormLabel><FormControl><Input placeholder="Ej. Tecnología" {...field} /></FormControl><FormMessage /></FormItem>
                          )} />
                          <FormField control={oppForm.control} name="description" render={({ field }) => (
                            <FormItem><FormLabel>Descripción</FormLabel><FormControl><Textarea rows={3} {...field} /></FormControl><FormMessage /></FormItem>
                          )} />
                          <FormField control={oppForm.control} name="requirements" render={({ field }) => (
                            <FormItem><FormLabel>Requisitos</FormLabel><FormControl><Textarea rows={3} {...field} /></FormControl><FormMessage /></FormItem>
                          )} />
                          <FormField control={oppForm.control} name="paid" render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                              <FormControl>
                                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>Oportunidad Remunerada</FormLabel>
                              </div>
                            </FormItem>
                          )} />
                          <div className="flex justify-end pt-4">
                            <Button type="submit" disabled={createOpp.isPending}>{createOpp.isPending ? "Publicando..." : "Publicar Oportunidad"}</Button>
                          </div>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent>
                  {opportunities?.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No has publicado oportunidades.</p>
                  ) : (
                    <div className="space-y-4">
                      {opportunities?.map(opp => (
                        <div key={opp.id} className="p-4 border rounded-lg flex flex-col md:flex-row justify-between items-start md:items-center hover:bg-muted/10">
                          <div>
                            <div className="flex items-center gap-3 mb-1">
                              <h4 className="font-bold">{opp.title}</h4>
                              <Badge className={STATUS_COLORS[opp.status]}>{opp.status}</Badge>
                            </div>
                            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mt-2">
                              <span><Eye className="w-4 h-4 inline mr-1" /> {opp.views || 0}</span>
                              <span><Users className="w-4 h-4 inline mr-1" /> {opp.applicationsCount || 0}</span>
                              <span><Globe className="w-4 h-4 inline mr-1" /> {opp.modality}</span>
                            </div>
                          </div>
                          <div className="flex gap-2 mt-4 md:mt-0">
                            <Link href={`/oportunidades/${opp.id}`}>
                              <Button variant="outline" size="sm">Ver</Button>
                            </Link>
                            {opp.status === 'activa' && (
                              <Button variant="secondary" size="sm" onClick={() => handleCloseOpp(opp.id)}>
                                Cerrar
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

        </div>
      )}
    </MainLayout>
  );
}
