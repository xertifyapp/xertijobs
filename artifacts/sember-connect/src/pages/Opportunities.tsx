import { MainLayout } from "@/components/layout/MainLayout";
import { useListOpportunities } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Globe, Filter, Briefcase } from "lucide-react";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OPPORTUNITY_TYPES, MODALITIES } from "@/lib/constants";

export default function Opportunities() {
  const [search, setSearch] = useState("");
  const [type, setType] = useState<string>("all");
  const [modality, setModality] = useState<string>("all");

  const { data: opportunities, isLoading } = useListOpportunities({
    status: "activa",
    ...(search && { search }),
    ...(type !== "all" && { type }),
    ...(modality !== "all" && { modality }),
  });

  return (
    <MainLayout>
      <div className="bg-muted/30 border-b">
        <div className="container mx-auto px-4 py-12">
          <h1 className="text-4xl font-bold mb-6">Explorar Oportunidades</h1>
          
          <div className="flex flex-col md:flex-row gap-4 max-w-4xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input 
                placeholder="Buscar por palabra clave, cargo o empresa..." 
                className="pl-10 h-12 text-lg bg-background"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="w-full md:w-[200px] h-12 bg-background">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                {OPPORTUNITY_TYPES.map(t => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={modality} onValueChange={setModality}>
              <SelectTrigger className="w-full md:w-[200px] h-12 bg-background">
                <SelectValue placeholder="Modalidad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toda modalidad</SelectItem>
                {MODALITIES.map(m => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {isLoading ? (
          <div className="text-center py-20 text-muted-foreground">Cargando oportunidades...</div>
        ) : opportunities?.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No se encontraron resultados</h3>
            <p className="text-muted-foreground">Intenta ajustando los filtros de búsqueda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              <div className="mb-6 flex justify-between items-center">
                <h2 className="text-xl font-semibold">{opportunities?.length || 0} oportunidades encontradas</h2>
              </div>
              
              {opportunities?.map((opp) => (
                <Card key={opp.id} className="hover:border-primary/50 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-6">
                      <div className="flex-1">
                        <div className="flex gap-2 mb-3 flex-wrap">
                          <Badge className="bg-primary/10 text-primary hover:bg-primary/20">{
                            OPPORTUNITY_TYPES.find(t => t.value === opp.type)?.label || opp.type
                          }</Badge>
                          {opp.paid && <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Remunerada</Badge>}
                          <Badge variant="outline" className="capitalize">{opp.modality}</Badge>
                        </div>
                        
                        <h3 className="font-bold text-2xl mb-2">
                          <Link href={`/oportunidades/${opp.id}`} className="hover:text-primary transition-colors">
                            {opp.title}
                          </Link>
                        </h3>
                        
                        <div className="text-lg text-muted-foreground mb-4 font-medium">
                          {opp.organizationName}
                        </div>
                        
                        <p className="text-muted-foreground line-clamp-2 mb-6">
                          {opp.description}
                        </p>
                        
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {opp.city ? `${opp.city}, ` : ''}{opp.country}
                          </div>
                          {opp.area && (
                            <div className="flex items-center gap-1">
                              <Briefcase className="h-4 w-4" />
                              {opp.area}
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Globe className="h-4 w-4" />
                            Publicado {new Date(opp.createdAt).toLocaleDateString('es-ES')}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col justify-between items-end md:w-48 gap-4 border-t md:border-t-0 md:border-l pt-4 md:pt-0 md:pl-6">
                        <div className="text-right w-full">
                          {opp.deadline && (
                            <div className="text-sm font-medium text-destructive">
                              Cierra el {new Date(opp.deadline).toLocaleDateString('es-ES')}
                            </div>
                          )}
                        </div>
                        <Link href={`/oportunidades/${opp.id}`} className="w-full">
                          <Button className="w-full">Ver Oportunidad</Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <div className="hidden lg:block space-y-6">
              {/* Sidebar content like ads or tips could go here */}
              <Card className="bg-accent/10 border-accent/20">
                <CardContent className="p-6">
                  <h3 className="font-bold text-lg mb-2 text-accent-foreground/90">¿Buscas talento?</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Publica tus oportunidades y conecta con profesionales en toda la región.
                  </p>
                  <Link href="/registro?tipo=empresa">
                    <Button variant="outline" className="w-full">Registrar Institución</Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
