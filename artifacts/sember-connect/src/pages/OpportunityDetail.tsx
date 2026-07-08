import { MainLayout } from "@/components/layout/MainLayout";
import { useGetOpportunity, useListSavedOpportunities, useSaveOpportunity, useUnsaveOpportunity, useCreateApplication, getListSavedOpportunitiesQueryKey, getGetOpportunityQueryKey } from "@workspace/api-client-react";
import { useParams, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DEMO_PROFESSIONAL_ID, OPPORTUNITY_TYPES, STATUS_COLORS } from "@/lib/constants";
import { MapPin, Globe, Briefcase, Calendar, FileText, CheckCircle2, BookmarkIcon, ExternalLink } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export default function OpportunityDetail() {
  const { id } = useParams();
  const oppId = parseInt(id || "0", 10);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: opp, isLoading } = useGetOpportunity(oppId, { query: { enabled: !!oppId, queryKey: getGetOpportunityQueryKey(oppId) } });
  const { data: savedOpps } = useListSavedOpportunities(DEMO_PROFESSIONAL_ID, { query: { enabled: true, queryKey: getListSavedOpportunitiesQueryKey(DEMO_PROFESSIONAL_ID) } });
  
  const saveOpp = useSaveOpportunity();
  const unsaveOpp = useUnsaveOpportunity();
  const apply = useCreateApplication();

  const isSaved = savedOpps?.some(s => s.id === oppId);
  const [applyMessage, setApplyMessage] = useState("");
  const [isApplyOpen, setIsApplyOpen] = useState(false);

  const handleSaveToggle = () => {
    if (isSaved) {
      unsaveOpp.mutate({ id: DEMO_PROFESSIONAL_ID, opportunityId: oppId }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListSavedOpportunitiesQueryKey(DEMO_PROFESSIONAL_ID) });
          toast({ title: "Oportunidad eliminada de guardados" });
        }
      });
    } else {
      saveOpp.mutate({ id: DEMO_PROFESSIONAL_ID, data: { opportunityId: oppId } }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListSavedOpportunitiesQueryKey(DEMO_PROFESSIONAL_ID) });
          toast({ title: "Oportunidad guardada con éxito" });
        }
      });
    }
  };

  const handleApply = () => {
    apply.mutate({ data: { opportunityId: oppId, professionalId: DEMO_PROFESSIONAL_ID, message: applyMessage } }, {
      onSuccess: () => {
        toast({ title: "¡Postulación enviada exitosamente!" });
        setIsApplyOpen(false);
        setApplyMessage("");
      },
      onError: (err: any) => {
        if (err.status === 409) {
          toast({ title: "Ya te has postulado a esta oportunidad", variant: "destructive" });
        } else {
          toast({ title: "Error al postular", description: "Ocurrió un error inesperado", variant: "destructive" });
        }
      }
    });
  };

  if (isLoading) return <MainLayout><div className="py-20 text-center text-muted-foreground">Cargando oportunidad...</div></MainLayout>;
  if (!opp) return <MainLayout><div className="py-20 text-center text-muted-foreground">Oportunidad no encontrada.</div></MainLayout>;

  return (
    <MainLayout>
      <div className="bg-muted/20 border-b">
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col md:flex-row justify-between gap-6 items-start">
            <div className="flex-1">
              <div className="flex gap-2 mb-4 flex-wrap">
                <Badge className={STATUS_COLORS[opp.status] || ""}>{opp.status}</Badge>
                <Badge className="bg-primary/10 text-primary">{OPPORTUNITY_TYPES.find(t => t.value === opp.type)?.label || opp.type}</Badge>
                {opp.paid && <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Remunerada</Badge>}
                <Badge variant="outline" className="capitalize">{opp.modality}</Badge>
              </div>
              
              <h1 className="text-4xl md:text-5xl font-bold mb-4">{opp.title}</h1>
              <div className="text-xl text-muted-foreground font-medium mb-6">
                {opp.organizationName}
              </div>

              <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  {opp.city ? `${opp.city}, ` : ''}{opp.country}
                </div>
                {opp.area && (
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5" />
                    {opp.area}
                  </div>
                )}
                {opp.deadline && (
                  <div className="flex items-center gap-2 text-destructive font-medium">
                    <Calendar className="h-5 w-5" />
                    Cierra: {new Date(opp.deadline).toLocaleDateString('es-ES')}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row md:flex-col gap-3 w-full md:w-auto">
              <Dialog open={isApplyOpen} onOpenChange={setIsApplyOpen}>
                <DialogTrigger asChild>
                  <Button size="lg" className="w-full md:w-64" disabled={opp.status !== 'activa' || apply.isPending}>
                    Postularme
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Postular a {opp.title}</DialogTitle>
                    <DialogDescription>
                      Confirma tu postulación. Puedes agregar un mensaje opcional para la organización.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4">
                    <Textarea 
                      placeholder="Mensaje opcional para el reclutador..." 
                      value={applyMessage}
                      onChange={(e) => setApplyMessage(e.target.value)}
                      rows={4}
                    />
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsApplyOpen(false)}>Cancelar</Button>
                    <Button onClick={handleApply} disabled={apply.isPending}>
                      {apply.isPending ? "Enviando..." : "Confirmar Postulación"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Button 
                size="lg" 
                variant="outline" 
                className="w-full md:w-64 bg-background"
                onClick={handleSaveToggle}
              >
                <BookmarkIcon className={`mr-2 h-5 w-5 ${isSaved ? "fill-primary text-primary" : ""}`} />
                {isSaved ? "Guardada" : "Guardar Oportunidad"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-12">
            {opp.description && (
              <section>
                <h2 className="text-2xl font-bold mb-4">Descripción</h2>
                <div className="prose prose-sm md:prose-base max-w-none text-muted-foreground whitespace-pre-wrap">
                  {opp.description}
                </div>
              </section>
            )}

            {opp.requirements && (
              <section>
                <h2 className="text-2xl font-bold mb-4">Requisitos</h2>
                <div className="prose prose-sm md:prose-base max-w-none text-muted-foreground whitespace-pre-wrap">
                  {opp.requirements}
                </div>
              </section>
            )}

            {opp.benefits && (
              <section>
                <h2 className="text-2xl font-bold mb-4">Beneficios</h2>
                <div className="prose prose-sm md:prose-base max-w-none text-muted-foreground whitespace-pre-wrap">
                  {opp.benefits}
                </div>
              </section>
            )}
          </div>

          <div className="space-y-8">
            {(opp.competencies && opp.competencies.length > 0) && (
              <div className="bg-muted/30 p-6 rounded-xl border">
                <h3 className="font-bold text-lg mb-4">Competencias Esperadas</h3>
                <div className="flex flex-wrap gap-2">
                  {opp.competencies.map((comp, i) => (
                    <Badge key={i} variant="secondary">{comp}</Badge>
                  ))}
                </div>
              </div>
            )}

            {(opp.requiredDocuments && opp.requiredDocuments.length > 0) && (
              <div className="bg-muted/30 p-6 rounded-xl border">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5" /> Documentos Requeridos
                </h3>
                <ul className="space-y-3">
                  {opp.requiredDocuments.map((doc, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" /> {doc}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {opp.externalLink && (
              <div className="bg-primary/5 p-6 rounded-xl border border-primary/10">
                <h3 className="font-bold text-lg mb-2">Postulación Externa</h3>
                <p className="text-sm text-muted-foreground mb-4">Esta oportunidad requiere completar la postulación en un sitio externo.</p>
                <a href={opp.externalLink} target="_blank" rel="noopener noreferrer">
                  <Button className="w-full" variant="outline">
                    Ir al sitio externo <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
                </a>
              </div>
            )}
            
            <div className="text-sm text-muted-foreground text-center">
              Publicada el {new Date(opp.createdAt).toLocaleDateString('es-ES')}
              {opp.views ? ` · ${opp.views} vistas` : ''}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
