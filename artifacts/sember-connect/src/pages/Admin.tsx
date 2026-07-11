import { MainLayout } from "@/components/layout/MainLayout";
import { useGetGlobalStats, useGetRecentActivity, useListOrganizations, useUpdateOrganization, useCreateOrganization, useDeleteOrganization, useListOpportunities, useCreateOpportunity, useUpdateOpportunity, useDeleteOpportunity, getListOrganizationsQueryKey, getListOpportunitiesQueryKey, getGetGlobalStatsQueryKey, getGetRecentActivityQueryKey, type Organization, type Opportunity } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2, Briefcase, Users, Globe2, Activity, CheckCircle, XCircle, Plus, Pencil, Trash2, PlayCircle, PauseCircle, Ban, Star, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { STATUS_COLORS, OPPORTUNITY_STATUS_VALUES, useDomainLabels } from "@/lib/constants";
import { useTranslation } from "react-i18next";
import { useMemo, useState } from "react";
import { Link } from "wouter";
import { OrganizationForm, type OrganizationFormValues } from "@/components/OrganizationForm";
import { OpportunityForm, type OpportunityFormValues } from "@/components/OpportunityForm";

export default function Admin() {
  const { t, i18n } = useTranslation();
  const { organizationTypeLabel, organizationStatusLabel, opportunityTypeLabel, opportunityStatusLabel } = useDomainLabels();
  const { data: stats, isLoading: isStatsLoading } = useGetGlobalStats();
  const { data: activity } = useGetRecentActivity();
  const { data: pendingOrgs } = useListOrganizations({ status: "pendiente" });
  const { data: allOrgs } = useListOrganizations();
  const { data: allOpps } = useListOpportunities();
  
  const updateOrg = useUpdateOrganization();
  const createOrg = useCreateOrganization();
  const deleteOrg = useDeleteOrganization();
  const createOpp = useCreateOpportunity();
  const updateOpp = useUpdateOpportunity();
  const deleteOpp = useDeleteOpportunity();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [deletingOrg, setDeletingOrg] = useState<Organization | null>(null);

  const [oppFormOpen, setOppFormOpen] = useState(false);
  const [oppFormMode, setOppFormMode] = useState<"create" | "edit">("create");
  const [editingOpp, setEditingOpp] = useState<Opportunity | null>(null);
  const [deletingOpp, setDeletingOpp] = useState<Opportunity | null>(null);
  const [oppSearch, setOppSearch] = useState("");
  const [oppStatusFilter, setOppStatusFilter] = useState<string>("all");

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: getListOrganizationsQueryKey({ status: "pendiente" }) });
    queryClient.invalidateQueries({ queryKey: getListOrganizationsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetGlobalStatsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetRecentActivityQueryKey() });
  };

  const invalidateOpps = () => {
    queryClient.invalidateQueries({ queryKey: getListOpportunitiesQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetGlobalStatsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetRecentActivityQueryKey() });
  };

  const filteredOpps = useMemo(() => {
    const term = oppSearch.trim().toLowerCase();
    return (allOpps ?? []).filter((opp) => {
      const matchesStatus = oppStatusFilter === "all" || opp.status === oppStatusFilter;
      const matchesTerm =
        term === "" ||
        opp.title.toLowerCase().includes(term) ||
        (opp.organizationName ?? "").toLowerCase().includes(term);
      return matchesStatus && matchesTerm;
    });
  }, [allOpps, oppSearch, oppStatusFilter]);

  const handleOppStatus = (opp: Opportunity, status: string) => {
    updateOpp.mutate({ id: opp.id, data: { status } }, {
      onSuccess: () => {
        toast({
          title: t("admin.opps.toast.statusChanged"),
          variant: status === "cerrada" ? "destructive" : "default",
        });
        invalidateOpps();
      },
      onError: () => toast({ title: t("admin.opps.toast.error"), variant: "destructive" }),
    });
  };

  const handleToggleFeatured = (opp: Opportunity) => {
    const next = !opp.featured;
    updateOpp.mutate({ id: opp.id, data: { featured: next } }, {
      onSuccess: () => {
        toast({ title: t(next ? "admin.opps.toast.featured" : "admin.opps.toast.unfeatured") });
        invalidateOpps();
      },
      onError: () => toast({ title: t("admin.opps.toast.error"), variant: "destructive" }),
    });
  };

  const openOppCreate = () => {
    setOppFormMode("create");
    setEditingOpp(null);
    setOppFormOpen(true);
  };

  const openOppEdit = (opp: Opportunity) => {
    setOppFormMode("edit");
    setEditingOpp(opp);
    setOppFormOpen(true);
  };

  const handleOppSubmit = (values: OpportunityFormValues) => {
    const payload = {
      organizationId: Number(values.organizationId),
      title: values.title.trim(),
      type: values.type,
      area: values.area.trim(),
      country: values.country.trim(),
      city: values.city.trim(),
      modality: values.modality,
      status: values.status,
      deadline: values.deadline.trim(),
      description: values.description.trim(),
      requirements: values.requirements.trim(),
      benefits: values.benefits.trim(),
      externalLink: values.externalLink.trim(),
      paid: values.paid,
      featured: values.featured,
    };
    if (oppFormMode === "create") {
      createOpp.mutate({ data: payload }, {
        onSuccess: () => {
          toast({ title: t("admin.opps.toast.created") });
          setOppFormOpen(false);
          invalidateOpps();
        },
        onError: () => toast({ title: t("admin.opps.toast.error"), variant: "destructive" }),
      });
    } else if (editingOpp) {
      updateOpp.mutate({ id: editingOpp.id, data: payload }, {
        onSuccess: () => {
          toast({ title: t("admin.opps.toast.updated") });
          setOppFormOpen(false);
          invalidateOpps();
        },
        onError: () => toast({ title: t("admin.opps.toast.error"), variant: "destructive" }),
      });
    }
  };

  const handleDeleteOpp = () => {
    if (!deletingOpp) return;
    deleteOpp.mutate({ id: deletingOpp.id }, {
      onSuccess: () => {
        toast({ title: t("admin.opps.toast.deleted"), variant: "destructive" });
        setDeletingOpp(null);
        invalidateOpps();
      },
      onError: () => toast({ title: t("admin.opps.toast.error"), variant: "destructive" }),
    });
  };

  const handleChangeStatus = (id: number, status: string) => {
    updateOrg.mutate({ id, data: { status } }, {
      onSuccess: () => {
        toast({
          title: t(`admin.toast.${status}`),
          variant: status === "rechazada" || status === "suspendida" ? "destructive" : "default",
        });
        invalidateAll();
      }
    });
  };

  const handleApprove = (id: number) => handleChangeStatus(id, "verificada");
  const handleReject = (id: number) => handleChangeStatus(id, "rechazada");

  const openCreate = () => {
    setFormMode("create");
    setEditingOrg(null);
    setFormOpen(true);
  };

  const openEdit = (org: Organization) => {
    setFormMode("edit");
    setEditingOrg(org);
    setFormOpen(true);
  };

  const handleFormSubmit = (values: OrganizationFormValues) => {
    const payload = {
      name: values.name.trim(),
      type: values.type,
      country: values.country.trim(),
      city: values.city.trim(),
      website: values.website.trim(),
      contactEmail: values.contactEmail.trim(),
      contactPhone: values.contactPhone.trim(),
      verificationDocs: values.verificationDocs.trim(),
      description: values.description.trim(),
      status: values.status,
    };
    if (formMode === "create") {
      createOrg.mutate({ data: payload }, {
        onSuccess: () => {
          toast({ title: t("admin.toast.created") });
          setFormOpen(false);
          invalidateAll();
        },
        onError: () => toast({ title: t("admin.toast.error"), variant: "destructive" }),
      });
    } else if (editingOrg) {
      updateOrg.mutate({ id: editingOrg.id, data: payload }, {
        onSuccess: () => {
          toast({ title: t("admin.toast.updated") });
          setFormOpen(false);
          invalidateAll();
        },
        onError: () => toast({ title: t("admin.toast.error"), variant: "destructive" }),
      });
    }
  };

  const handleDelete = () => {
    if (!deletingOrg) return;
    deleteOrg.mutate({ id: deletingOrg.id }, {
      onSuccess: () => {
        toast({ title: t("admin.toast.deleted"), variant: "destructive" });
        setDeletingOrg(null);
        invalidateAll();
      },
      onError: () => toast({ title: t("admin.toast.error"), variant: "destructive" }),
    });
  };

  return (
    <MainLayout>
      <div className="bg-primary text-primary-foreground border-b border-primary/20">
        <div className="container mx-auto px-4 py-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">{t("admin.title")}</h1>
            <p className="text-primary-foreground/80 mt-2">{t("admin.subtitle")}</p>
          </div>
          <Button
            onClick={openCreate}
            className="bg-accent text-accent-foreground hover:bg-accent/90 shrink-0"
          >
            <Plus className="w-4 h-4 mr-2" /> {t("admin.manage.newOrganization")}
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-8">
        {isStatsLoading ? (
          <div className="py-10 text-center">{t("admin.loadingMetrics")}</div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col gap-2">
                  <Building2 className="w-6 h-6 text-blue-500" />
                  <p className="text-sm font-medium text-muted-foreground">{t("admin.stats.organizations")}</p>
                  <h3 className="text-3xl font-bold">{stats?.totalOrganizations || 0}</h3>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col gap-2">
                  <Briefcase className="w-6 h-6 text-green-500" />
                  <p className="text-sm font-medium text-muted-foreground">{t("admin.stats.opportunities")}</p>
                  <h3 className="text-3xl font-bold">{stats?.totalOpportunities || 0}</h3>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col gap-2">
                  <Users className="w-6 h-6 text-purple-500" />
                  <p className="text-sm font-medium text-muted-foreground">{t("admin.stats.applications")}</p>
                  <h3 className="text-3xl font-bold">{stats?.totalApplications || 0}</h3>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col gap-2">
                  <Globe2 className="w-6 h-6 text-orange-500" />
                  <p className="text-sm font-medium text-muted-foreground">{t("admin.stats.countries")}</p>
                  <h3 className="text-3xl font-bold">{stats?.totalCountries || 0}</h3>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-primary text-primary-foreground">
              <CardContent className="p-6">
                <div className="flex flex-col gap-2">
                  <Activity className="w-6 h-6 text-primary-foreground/80" />
                  <p className="text-sm font-medium text-primary-foreground/80">{t("admin.stats.pending")}</p>
                  <h3 className="text-3xl font-bold">{stats?.pendingOrganizations || 0}</h3>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Tabs defaultValue="pending">
              <TabsList>
                <TabsTrigger value="pending" className="relative">
                  {t("admin.tabs.pending")}
                  {(stats?.pendingOrganizations ?? 0) > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="all">{t("admin.tabs.all")}</TabsTrigger>
              </TabsList>
              
              <TabsContent value="pending" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>{t("admin.pending.cardTitle", { count: pendingOrgs?.length || 0 })}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {pendingOrgs?.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">{t("admin.pending.empty")}</p>
                    ) : (
                      <div className="space-y-4">
                        {pendingOrgs?.map(org => (
                          <div key={org.id} className="p-4 border rounded-xl flex flex-col md:flex-row justify-between gap-4 bg-muted/10">
                            <div>
                              <div className="flex gap-2 items-center mb-1">
                                <h4 className="font-bold text-lg">{org.name}</h4>
                                <Badge variant="outline">{organizationTypeLabel(org.type)}</Badge>
                              </div>
                              <div className="text-sm text-muted-foreground space-y-1 mb-3">
                                <div>📍 {org.city ? `${org.city}, ` : ''}{org.country}</div>
                                <div>📧 {org.contactEmail}</div>
                                <div>🌐 {org.website}</div>
                              </div>
                              <p className="text-sm text-muted-foreground">{org.description}</p>
                            </div>
                            <div className="flex flex-row md:flex-col gap-2 shrink-0">
                              <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleApprove(org.id)} disabled={updateOrg.isPending}>
                                <CheckCircle className="w-4 h-4 mr-1" /> {t("admin.pending.verify")}
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => handleReject(org.id)} disabled={updateOrg.isPending}>
                                <XCircle className="w-4 h-4 mr-1" /> {t("admin.pending.reject")}
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="all" className="mt-4">
                <Card>
                  <CardContent className="p-0">
                    <div className="divide-y">
                      {allOrgs?.map(org => (
                        <div key={org.id} className="p-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-bold">{org.name}</h4>
                              <Badge className={STATUS_COLORS[org.status]}>{organizationStatusLabel(org.status)}</Badge>
                            </div>
                            <div className="text-sm text-muted-foreground">{organizationTypeLabel(org.type)} · {org.country}</div>
                            {org.verifiedAt && (
                              <div className="text-xs text-muted-foreground mt-1">
                                {t("admin.all.verifiedOn", { date: new Date(org.verifiedAt).toLocaleDateString(i18n.language, { day: '2-digit', month: 'short', year: 'numeric' }) })}
                              </div>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-2 shrink-0">
                            {(org.status === 'pendiente' || org.status === 'rechazada' || org.status === 'suspendida') && (
                              <Button variant="outline" size="sm" className="text-green-700 border-green-300 hover:bg-green-50" onClick={() => handleChangeStatus(org.id, "verificada")} disabled={updateOrg.isPending}>{t("admin.all.verify")}</Button>
                            )}
                            {org.status === 'verificada' && (
                              <Button variant="outline" size="sm" className="text-orange-700 border-orange-300 hover:bg-orange-50" onClick={() => handleChangeStatus(org.id, "suspendida")} disabled={updateOrg.isPending}>{t("admin.all.suspend")}</Button>
                            )}
                            {org.status !== 'rechazada' && (
                              <Button variant="outline" size="sm" className="text-red-700 border-red-300 hover:bg-red-50" onClick={() => handleChangeStatus(org.id, "rechazada")} disabled={updateOrg.isPending}>{t("admin.all.reject")}</Button>
                            )}
                            <Button variant="outline" size="sm" onClick={() => openEdit(org)}>
                              <Pencil className="w-3.5 h-3.5 mr-1" /> {t("admin.all.edit")}
                            </Button>
                            <Button variant="outline" size="sm" className="text-destructive border-destructive/40 hover:bg-destructive/10" onClick={() => setDeletingOrg(org)}>
                              <Trash2 className="w-3.5 h-3.5 mr-1" /> {t("admin.all.delete")}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>{t("admin.activity.title")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {activity?.map(act => (
                    <div key={act.id} className="flex gap-4 items-start relative">
                      <div className="w-2 h-2 rounded-full bg-primary mt-2 absolute -left-[5px]"></div>
                      <div className="border-l pl-4 pb-4 w-full">
                        <div className="text-xs text-muted-foreground mb-1">
                          {new Date(act.createdAt).toLocaleString(i18n.language, { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}
                        </div>
                        <h4 className="font-medium text-sm leading-tight">{act.title}</h4>
                        {act.subtitle && <p className="text-xs text-muted-foreground mt-1">{act.subtitle}</p>}
                      </div>
                    </div>
                  ))}
                  {activity?.length === 0 && <p className="text-sm text-muted-foreground text-center">{t("admin.activity.empty")}</p>}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-12">
        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="w-5 h-5" /> {t("admin.opps.sectionTitle")}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">{t("admin.opps.sectionSubtitle")}</p>
            </div>
            <Button onClick={openOppCreate} className="shrink-0">
              <Plus className="w-4 h-4 mr-2" /> {t("admin.opps.new")}
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={oppSearch}
                  onChange={(e) => setOppSearch(e.target.value)}
                  placeholder={t("admin.opps.searchPlaceholder")}
                  className="pl-9"
                />
              </div>
              <Select value={oppStatusFilter} onValueChange={setOppStatusFilter}>
                <SelectTrigger className="w-full sm:w-56">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("admin.opps.filterAll")}</SelectItem>
                  {OPPORTUNITY_STATUS_VALUES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {opportunityStatusLabel(s)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {filteredOpps.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">{t("admin.opps.empty")}</p>
            ) : (
              <div className="divide-y">
                {filteredOpps.map((opp) => (
                  <div key={opp.id} className="py-4 flex flex-col lg:flex-row lg:justify-between lg:items-center gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h4 className="font-bold truncate">{opp.title}</h4>
                        <Badge className={STATUS_COLORS[opp.status]}>{opportunityStatusLabel(opp.status)}</Badge>
                        {opp.featured && (
                          <Badge className="bg-amber-100 text-amber-800 border-amber-200">
                            <Star className="w-3 h-3 mr-1 fill-amber-500 text-amber-500" /> {t("admin.opps.featured")}
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {opp.organizationName ?? "—"} · {opportunityTypeLabel(opp.type)} · {opp.country}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 shrink-0">
                      {opp.status !== "activa" && (
                        <Button variant="outline" size="sm" className="text-green-700 border-green-300 hover:bg-green-50" onClick={() => handleOppStatus(opp, "activa")} disabled={updateOpp.isPending}>
                          <PlayCircle className="w-3.5 h-3.5 mr-1" /> {t("admin.opps.approve")}
                        </Button>
                      )}
                      {opp.status !== "pausada" && (
                        <Button variant="outline" size="sm" className="text-amber-700 border-amber-300 hover:bg-amber-50" onClick={() => handleOppStatus(opp, "pausada")} disabled={updateOpp.isPending}>
                          <PauseCircle className="w-3.5 h-3.5 mr-1" /> {t("admin.opps.pause")}
                        </Button>
                      )}
                      {opp.status !== "cerrada" && (
                        <Button variant="outline" size="sm" className="text-gray-700 border-gray-300 hover:bg-gray-50" onClick={() => handleOppStatus(opp, "cerrada")} disabled={updateOpp.isPending}>
                          <Ban className="w-3.5 h-3.5 mr-1" /> {t("admin.opps.close")}
                        </Button>
                      )}
                      <Button variant="outline" size="sm" className={opp.featured ? "text-amber-700 border-amber-300 hover:bg-amber-50" : ""} onClick={() => handleToggleFeatured(opp)} disabled={updateOpp.isPending}>
                        <Star className={`w-3.5 h-3.5 mr-1 ${opp.featured ? "fill-amber-500 text-amber-500" : ""}`} /> {t(opp.featured ? "admin.opps.unfeature" : "admin.opps.feature")}
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/oportunidades/${opp.id}`}>{t("admin.opps.view")}</Link>
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => openOppEdit(opp)}>
                        <Pencil className="w-3.5 h-3.5 mr-1" /> {t("admin.opps.edit")}
                      </Button>
                      <Button variant="outline" size="sm" className="text-destructive border-destructive/40 hover:bg-destructive/10" onClick={() => setDeletingOpp(opp)}>
                        <Trash2 className="w-3.5 h-3.5 mr-1" /> {t("admin.opps.delete")}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <OrganizationForm
        mode={formMode}
        open={formOpen}
        onOpenChange={setFormOpen}
        organization={editingOrg}
        onSubmit={handleFormSubmit}
        isPending={createOrg.isPending || updateOrg.isPending}
      />

      <OpportunityForm
        mode={oppFormMode}
        open={oppFormOpen}
        onOpenChange={setOppFormOpen}
        opportunity={editingOpp}
        organizations={allOrgs ?? []}
        onSubmit={handleOppSubmit}
        isPending={createOpp.isPending || updateOpp.isPending}
      />

      <AlertDialog open={deletingOpp !== null} onOpenChange={(open) => !open && setDeletingOpp(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("admin.opps.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("admin.opps.deleteConfirm", { title: deletingOpp?.title ?? "" })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteOpp.isPending}>{t("admin.opps.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDeleteOpp();
              }}
              disabled={deleteOpp.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("admin.opps.confirmDelete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deletingOrg !== null} onOpenChange={(open) => !open && setDeletingOrg(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("admin.manage.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("admin.manage.deleteConfirm", { name: deletingOrg?.name ?? "" })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteOrg.isPending}>{t("admin.manage.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={deleteOrg.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("admin.manage.confirmDelete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
