import { MainLayout } from "@/components/layout/MainLayout";
import { useGetGlobalStats, useGetRecentActivity, useListOrganizations, useUpdateOrganization, getListOrganizationsQueryKey, getGetGlobalStatsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Briefcase, Users, Globe2, Activity, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { STATUS_COLORS } from "@/lib/constants";

export default function Admin() {
  const { data: stats, isLoading: isStatsLoading } = useGetGlobalStats();
  const { data: activity } = useGetRecentActivity();
  const { data: pendingOrgs } = useListOrganizations({ status: "pendiente" });
  const { data: allOrgs } = useListOrganizations();
  
  const updateOrg = useUpdateOrganization();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleApprove = (id: number) => {
    updateOrg.mutate({ id, data: { status: "aprobada" } }, {
      onSuccess: () => {
        toast({ title: "Organización aprobada" });
        queryClient.invalidateQueries({ queryKey: getListOrganizationsQueryKey({ status: "pendiente" }) });
        queryClient.invalidateQueries({ queryKey: getListOrganizationsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetGlobalStatsQueryKey() });
      }
    });
  };

  const handleReject = (id: number) => {
    updateOrg.mutate({ id, data: { status: "rechazada" } }, {
      onSuccess: () => {
        toast({ title: "Organización rechazada", variant: "destructive" });
        queryClient.invalidateQueries({ queryKey: getListOrganizationsQueryKey({ status: "pendiente" }) });
        queryClient.invalidateQueries({ queryKey: getListOrganizationsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetGlobalStatsQueryKey() });
      }
    });
  };

  return (
    <MainLayout>
      <div className="bg-primary text-primary-foreground border-b border-primary/20">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold">Panel de Administración SEMBER</h1>
          <p className="text-primary-foreground/80 mt-2">Visión global del ecosistema</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-8">
        {isStatsLoading ? (
          <div className="py-10 text-center">Cargando métricas...</div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col gap-2">
                  <Building2 className="w-6 h-6 text-blue-500" />
                  <p className="text-sm font-medium text-muted-foreground">Instituciones</p>
                  <h3 className="text-3xl font-bold">{stats?.totalOrganizations || 0}</h3>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col gap-2">
                  <Briefcase className="w-6 h-6 text-green-500" />
                  <p className="text-sm font-medium text-muted-foreground">Oportunidades</p>
                  <h3 className="text-3xl font-bold">{stats?.totalOpportunities || 0}</h3>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col gap-2">
                  <Users className="w-6 h-6 text-purple-500" />
                  <p className="text-sm font-medium text-muted-foreground">Postulaciones</p>
                  <h3 className="text-3xl font-bold">{stats?.totalApplications || 0}</h3>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col gap-2">
                  <Globe2 className="w-6 h-6 text-orange-500" />
                  <p className="text-sm font-medium text-muted-foreground">Países</p>
                  <h3 className="text-3xl font-bold">{stats?.totalCountries || 0}</h3>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-primary text-primary-foreground">
              <CardContent className="p-6">
                <div className="flex flex-col gap-2">
                  <Activity className="w-6 h-6 text-primary-foreground/80" />
                  <p className="text-sm font-medium text-primary-foreground/80">Pendientes</p>
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
                  Aprobaciones Pendientes
                  {(stats?.pendingOrganizations ?? 0) > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="all">Todas las Organizaciones</TabsTrigger>
              </TabsList>
              
              <TabsContent value="pending" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Solicitudes de Ingreso ({pendingOrgs?.length || 0})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {pendingOrgs?.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">No hay solicitudes pendientes.</p>
                    ) : (
                      <div className="space-y-4">
                        {pendingOrgs?.map(org => (
                          <div key={org.id} className="p-4 border rounded-xl flex flex-col md:flex-row justify-between gap-4 bg-muted/10">
                            <div>
                              <div className="flex gap-2 items-center mb-1">
                                <h4 className="font-bold text-lg">{org.name}</h4>
                                <Badge variant="outline">{org.type}</Badge>
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
                                <CheckCircle className="w-4 h-4 mr-1" /> Aprobar
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => handleReject(org.id)} disabled={updateOrg.isPending}>
                                <XCircle className="w-4 h-4 mr-1" /> Rechazar
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
                        <div key={org.id} className="p-4 flex justify-between items-center">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-bold">{org.name}</h4>
                              <Badge className={STATUS_COLORS[org.status]}>{org.status}</Badge>
                            </div>
                            <div className="text-sm text-muted-foreground">{org.type} · {org.country}</div>
                          </div>
                          {org.status === 'pendiente' && (
                            <Button variant="outline" size="sm" onClick={() => handleApprove(org.id)}>Aprobar</Button>
                          )}
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
                <CardTitle>Actividad Reciente</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {activity?.map(act => (
                    <div key={act.id} className="flex gap-4 items-start relative">
                      <div className="w-2 h-2 rounded-full bg-primary mt-2 absolute -left-[5px]"></div>
                      <div className="border-l pl-4 pb-4 w-full">
                        <div className="text-xs text-muted-foreground mb-1">
                          {new Date(act.createdAt).toLocaleString('es-ES', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}
                        </div>
                        <h4 className="font-medium text-sm leading-tight">{act.title}</h4>
                        {act.subtitle && <p className="text-xs text-muted-foreground mt-1">{act.subtitle}</p>}
                      </div>
                    </div>
                  ))}
                  {activity?.length === 0 && <p className="text-sm text-muted-foreground text-center">No hay actividad reciente.</p>}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
