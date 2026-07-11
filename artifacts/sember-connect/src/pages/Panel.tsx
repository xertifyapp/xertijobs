import { MainLayout } from "@/components/layout/MainLayout";
import { useListOrganizations, useGetOrganizationStats, useListOpportunities, useListApplications, useCreateOpportunity, useUpdateOpportunity, useGetOrganization, useUpdateOrganization, getListApplicationsQueryKey, getGetOrganizationStatsQueryKey, getListOpportunitiesQueryKey, getListOrganizationsQueryKey, getGetOrganizationQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect, useRef } from "react";
import { useUpload } from "@workspace/object-storage-web";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { STATUS_COLORS, useDomainLabels } from "@/lib/constants";
import { useTranslation } from "react-i18next";
import { Building2, Eye, Users, FileText, CheckCircle2, MapPin, Globe, Loader2, Camera } from "lucide-react";
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
import { CandidatePipeline } from "@/components/panel/CandidatePipeline";

const createOppSchema = (t: (key: string) => string) => z.object({
  title: z.string().min(2, t("panel.validation.titleRequired")),
  type: z.string().min(1, t("panel.validation.typeRequired")),
  modality: z.string().min(1, t("panel.validation.modalityRequired")),
  country: z.string().min(2, t("panel.validation.countryRequired")),
  city: z.string().optional(),
  area: z.string().optional(),
  description: z.string().optional(),
  requirements: z.string().optional(),
  paid: z.boolean().default(false),
});

const createOrgSchema = (t: (key: string) => string) => z.object({
  name: z.string().min(2, t("panel.validation.nameRequired")),
  website: z.string().optional(),
  logoUrl: z.string().optional(),
  description: z.string().optional(),
});

type OppFormValues = z.infer<ReturnType<typeof createOppSchema>>;
type OrgFormValues = z.infer<ReturnType<typeof createOrgSchema>>;

const objectUrl = (path?: string | null) => (path ? `/api/storage${path}` : undefined);

export default function Panel() {
  const { t } = useTranslation();
  const { opportunityTypes, modalities, opportunityStatusLabel, modalityLabel } = useDomainLabels();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const { data: orgs, isLoading: isOrgsLoading } = useListOrganizations({ status: "verificada" }, { query: { enabled: isAdmin, queryKey: getListOrganizationsQueryKey({ status: "verificada" }) } });
  const [selectedOrgId, setSelectedOrgId] = useState<string>("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const currentOrgId = isAdmin
    ? (selectedOrgId ? parseInt(selectedOrgId) : (orgs?.[0]?.id || 0))
    : (user?.organizationId || 0);

  const { data: stats } = useGetOrganizationStats(currentOrgId, { query: { enabled: !!currentOrgId, queryKey: getGetOrganizationStatsQueryKey(currentOrgId) } });
  const { data: opportunities } = useListOpportunities({ organizationId: currentOrgId }, { query: { enabled: !!currentOrgId, queryKey: getListOpportunitiesQueryKey({ organizationId: currentOrgId }) } });
  const { data: applications } = useListApplications({ organizationId: currentOrgId }, { query: { enabled: !!currentOrgId, queryKey: getListApplicationsQueryKey({ organizationId: currentOrgId }) } });

  const createOpp = useCreateOpportunity();
  const updateOpp = useUpdateOpportunity();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const oppForm = useForm<OppFormValues>({
    resolver: zodResolver(createOppSchema(t)),
    defaultValues: { title: "", type: "", modality: "", country: "", city: "", area: "", description: "", requirements: "", paid: false }
  });

  const { data: currentOrg } = useGetOrganization(currentOrgId, { query: { enabled: !!currentOrgId, queryKey: getGetOrganizationQueryKey(currentOrgId) } });
  const updateOrg = useUpdateOrganization();
  const logoInputRef = useRef<HTMLInputElement>(null);

  const orgForm = useForm<OrgFormValues>({
    resolver: zodResolver(createOrgSchema(t)),
    defaultValues: { name: "", website: "", logoUrl: "", description: "" }
  });

  useEffect(() => {
    if (currentOrg) {
      orgForm.reset({
        name: currentOrg.name || "",
        website: currentOrg.website || "",
        logoUrl: currentOrg.logoUrl || "",
        description: currentOrg.description || "",
      });
    }
  }, [currentOrg, orgForm]);

  const { uploadFile: uploadLogo, isUploading: isLogoUploading } = useUpload({
    onSuccess: (res) => {
      orgForm.setValue("logoUrl", res.objectPath, { shouldDirty: true });
      updateOrg.mutate({ id: currentOrgId, data: { logoUrl: res.objectPath } }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetOrganizationQueryKey(currentOrgId) });
          queryClient.invalidateQueries({ queryKey: getListOrganizationsQueryKey({ status: "verificada" }) });
          toast({ title: t("panel.toast.logoUpdated") });
        },
        onError: () => toast({ title: t("panel.toast.logoSaveError"), variant: "destructive" }),
      });
    },
    onError: () => toast({ title: t("panel.toast.logoUploadError"), variant: "destructive" }),
  });

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadLogo(file);
    e.target.value = "";
  };

  const onOrgSubmit = (values: OrgFormValues) => {
    updateOrg.mutate({ id: currentOrgId, data: values }, {
      onSuccess: () => {
        toast({ title: t("panel.toast.orgUpdated") });
        queryClient.invalidateQueries({ queryKey: getGetOrganizationQueryKey(currentOrgId) });
        queryClient.invalidateQueries({ queryKey: getListOrganizationsQueryKey({ status: "verificada" }) });
      },
      onError: () => toast({ title: t("panel.toast.orgUpdateError"), variant: "destructive" }),
    });
  };

  const currentLogo = orgForm.watch("logoUrl") || currentOrg?.logoUrl;

  const handleCloseOpp = (oppId: number) => {
    updateOpp.mutate({ id: oppId, data: { status: "cerrada" } }, {
      onSuccess: () => {
        toast({ title: t("panel.toast.oppClosed") });
        queryClient.invalidateQueries({ queryKey: getListOpportunitiesQueryKey({ organizationId: currentOrgId }) });
        queryClient.invalidateQueries({ queryKey: getGetOrganizationStatsQueryKey(currentOrgId) });
      }
    });
  };

  const onCreateSubmit = (values: OppFormValues) => {
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
        toast({ title: t("panel.toast.oppPublished") });
        setIsCreateOpen(false);
        oppForm.reset();
        queryClient.invalidateQueries({ queryKey: getListOpportunitiesQueryKey({ organizationId: currentOrgId }) });
        queryClient.invalidateQueries({ queryKey: getGetOrganizationStatsQueryKey(currentOrgId) });
      },
      onError: () => {
        toast({ title: t("panel.toast.oppPublishError"), variant: "destructive" });
      }
    });
  };

  if (isAdmin && isOrgsLoading) return <MainLayout><div className="py-20 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" /></div></MainLayout>;

  return (
    <MainLayout>
      <div className="bg-muted/30 border-b">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h1 className="text-3xl font-bold">{t("panel.title")}</h1>
            {isAdmin && orgs && orgs.length > 0 && (
              <Select value={currentOrgId.toString()} onValueChange={setSelectedOrgId}>
                <SelectTrigger className="w-[300px] bg-background">
                  <Building2 className="w-4 h-4 mr-2" />
                  <SelectValue placeholder={t("panel.selectOrgPlaceholder")} />
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
          <p className="text-muted-foreground text-lg mb-4">{t("panel.noOrgs")}</p>
          <Link href="/registro?tipo=empresa"><Button>{t("panel.registerOrg")}</Button></Link>
        </div>
      ) : (
        <div className="container mx-auto px-4 py-8 space-y-8">
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{t("panel.stats.totalViews")}</p>
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
                    <p className="text-sm font-medium text-muted-foreground">{t("panel.stats.applications")}</p>
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
                    <p className="text-sm font-medium text-muted-foreground">{t("panel.stats.activeOpps")}</p>
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
                    <p className="text-sm font-medium text-muted-foreground">{t("panel.stats.publishedOpps")}</p>
                    <h3 className="text-3xl font-bold mt-1">{stats?.publishedOpportunities || 0}</h3>
                  </div>
                  <div className="p-2 bg-orange-100 text-orange-600 rounded-lg"><FileText className="w-5 h-5" /></div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="applications" className="w-full">
            <TabsList>
              <TabsTrigger value="applications">{t("panel.tabs.applications")}</TabsTrigger>
              <TabsTrigger value="opportunities">{t("panel.tabs.opportunities")}</TabsTrigger>
              <TabsTrigger value="profile">{t("panel.tabs.profile")}</TabsTrigger>
            </TabsList>

            <TabsContent value="applications" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t("panel.applications.title", { count: applications?.length || 0 })}</CardTitle>
                </CardHeader>
                <CardContent>
                  {applications?.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">{t("panel.applications.empty")}</p>
                  ) : (
                    <CandidatePipeline orgId={currentOrgId} applications={applications ?? []} />
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="opportunities" className="mt-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>{t("panel.opportunities.title")}</CardTitle>
                  <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                      <Button>{t("panel.opportunities.new")}</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>{t("panel.opportunities.dialogTitle")}</DialogTitle>
                      </DialogHeader>
                      <Form {...oppForm}>
                        <form onSubmit={oppForm.handleSubmit(onCreateSubmit)} className="space-y-4 py-4">
                          <FormField control={oppForm.control} name="title" render={({ field }) => (
                            <FormItem><FormLabel>{t("panel.opportunities.fields.title")}</FormLabel><FormControl><Input placeholder={t("panel.opportunities.fields.titlePlaceholder")} {...field} /></FormControl><FormMessage /></FormItem>
                          )} />
                          <div className="grid grid-cols-2 gap-4">
                            <FormField control={oppForm.control} name="type" render={({ field }) => (
                              <FormItem><FormLabel>{t("panel.opportunities.fields.type")}</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl><SelectTrigger><SelectValue placeholder={t("panel.opportunities.fields.selectPlaceholder")} /></SelectTrigger></FormControl>
                                  <SelectContent>{opportunityTypes.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
                                </Select><FormMessage />
                              </FormItem>
                            )} />
                            <FormField control={oppForm.control} name="modality" render={({ field }) => (
                              <FormItem><FormLabel>{t("panel.opportunities.fields.modality")}</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl><SelectTrigger><SelectValue placeholder={t("panel.opportunities.fields.selectPlaceholder")} /></SelectTrigger></FormControl>
                                  <SelectContent>{modalities.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
                                </Select><FormMessage />
                              </FormItem>
                            )} />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <FormField control={oppForm.control} name="country" render={({ field }) => (
                              <FormItem><FormLabel>{t("panel.opportunities.fields.country")}</FormLabel><FormControl><Input placeholder={t("panel.opportunities.fields.countryPlaceholder")} {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={oppForm.control} name="city" render={({ field }) => (
                              <FormItem><FormLabel>{t("panel.opportunities.fields.city")}</FormLabel><FormControl><Input placeholder={t("panel.opportunities.fields.cityPlaceholder")} {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                          </div>
                          <FormField control={oppForm.control} name="area" render={({ field }) => (
                            <FormItem><FormLabel>{t("panel.opportunities.fields.area")}</FormLabel><FormControl><Input placeholder={t("panel.opportunities.fields.areaPlaceholder")} {...field} /></FormControl><FormMessage /></FormItem>
                          )} />
                          <FormField control={oppForm.control} name="description" render={({ field }) => (
                            <FormItem><FormLabel>{t("panel.opportunities.fields.description")}</FormLabel><FormControl><Textarea rows={3} {...field} /></FormControl><FormMessage /></FormItem>
                          )} />
                          <FormField control={oppForm.control} name="requirements" render={({ field }) => (
                            <FormItem><FormLabel>{t("panel.opportunities.fields.requirements")}</FormLabel><FormControl><Textarea rows={3} {...field} /></FormControl><FormMessage /></FormItem>
                          )} />
                          <FormField control={oppForm.control} name="paid" render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                              <FormControl>
                                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>{t("panel.opportunities.fields.paid")}</FormLabel>
                              </div>
                            </FormItem>
                          )} />
                          <div className="flex justify-end pt-4">
                            <Button type="submit" disabled={createOpp.isPending}>{createOpp.isPending ? t("panel.opportunities.publishing") : t("panel.opportunities.publish")}</Button>
                          </div>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent>
                  {opportunities?.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">{t("panel.opportunities.empty")}</p>
                  ) : (
                    <div className="space-y-4">
                      {opportunities?.map(opp => (
                        <div key={opp.id} className="p-4 border rounded-lg flex flex-col md:flex-row justify-between items-start md:items-center hover:bg-muted/10">
                          <div>
                            <div className="flex items-center gap-3 mb-1">
                              <h4 className="font-bold">{opp.title}</h4>
                              <Badge className={STATUS_COLORS[opp.status]}>{opportunityStatusLabel(opp.status)}</Badge>
                            </div>
                            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mt-2">
                              <span><Eye className="w-4 h-4 inline mr-1" /> {opp.views || 0}</span>
                              <span><Users className="w-4 h-4 inline mr-1" /> {opp.applicationsCount || 0}</span>
                              <span><Globe className="w-4 h-4 inline mr-1" /> {modalityLabel(opp.modality)}</span>
                            </div>
                          </div>
                          <div className="flex gap-2 mt-4 md:mt-0">
                            <Link href={`/oportunidades/${opp.id}`}>
                              <Button variant="outline" size="sm">{t("panel.opportunities.view")}</Button>
                            </Link>
                            {opp.status === 'activa' && (
                              <Button variant="secondary" size="sm" onClick={() => handleCloseOpp(opp.id)}>
                                {t("panel.opportunities.close")}
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

            <TabsContent value="profile" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t("panel.profile.title")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Form {...orgForm}>
                    <form onSubmit={orgForm.handleSubmit(onOrgSubmit)} className="space-y-6">
                      <div className="flex items-center gap-4">
                        <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                        <button
                          type="button"
                          onClick={() => logoInputRef.current?.click()}
                          disabled={isLogoUploading}
                          title={t("panel.profile.changeLogoTitle")}
                          className="group relative w-20 h-20 rounded-lg bg-primary/10 flex justify-center items-center text-primary shrink-0 overflow-hidden border cursor-pointer"
                        >
                          {currentLogo ? (
                            <img src={objectUrl(currentLogo)} alt="Logo" className="w-full h-full object-cover" />
                          ) : (
                            <Building2 className="w-10 h-10" />
                          )}
                          <span className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            {isLogoUploading ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : <Camera className="w-5 h-5 text-white" />}
                          </span>
                        </button>
                        <div>
                          <Button type="button" variant="outline" disabled={isLogoUploading} onClick={() => logoInputRef.current?.click()}>
                            {isLogoUploading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {t("panel.profile.uploading")}</> : <><Camera className="w-4 h-4 mr-2" /> {t("panel.profile.changeLogo")}</>}
                          </Button>
                          <p className="text-xs text-muted-foreground mt-2">{t("panel.profile.logoHint")}</p>
                        </div>
                      </div>

                      <FormField control={orgForm.control} name="name" render={({ field }) => (
                        <FormItem><FormLabel>{t("panel.profile.name")}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                      )} />

                      <FormField control={orgForm.control} name="website" render={({ field }) => (
                        <FormItem><FormLabel className="flex items-center gap-2"><Globe className="h-4 w-4" /> {t("panel.profile.website")}</FormLabel><FormControl><Input placeholder={t("panel.profile.websitePlaceholder")} {...field} /></FormControl><FormMessage /></FormItem>
                      )} />

                      <FormField control={orgForm.control} name="description" render={({ field }) => (
                        <FormItem><FormLabel>{t("panel.profile.description")}</FormLabel><FormControl><Textarea rows={4} {...field} /></FormControl><FormMessage /></FormItem>
                      )} />

                      <Button type="submit" disabled={updateOrg.isPending}>
                        {updateOrg.isPending ? t("panel.profile.saving") : t("panel.profile.save")}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

        </div>
      )}
    </MainLayout>
  );
}
