import { MainLayout } from "@/components/layout/MainLayout";
import { useListOrganizations } from "@workspace/api-client-react";
import { ORGANIZATION_TYPES, STATUS_COLORS } from "@/lib/constants";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, MapPin, Building2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Organizations() {
  const [search, setSearch] = useState("");
  const [type, setType] = useState<string>("all");

  const { data: organizations, isLoading } = useListOrganizations({
    status: "aprobada",
    ...(search && { search }),
    ...(type !== "all" && { type }),
  });

  return (
    <MainLayout>
      <div className="bg-muted/30 border-b">
        <div className="container mx-auto px-4 py-12">
          <h1 className="text-4xl font-bold mb-6">Directorio de Organizaciones</h1>
          <p className="text-muted-foreground text-lg mb-8 max-w-2xl">
            Descubre las universidades, empresas, gobiernos y organismos que forman parte del ecosistema global de SEMBER.
          </p>

          <div className="flex flex-col md:flex-row gap-4 max-w-3xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input 
                placeholder="Buscar organización..." 
                className="pl-10 h-12 text-lg bg-background"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="w-full md:w-[250px] h-12 bg-background">
                <SelectValue placeholder="Tipo de institución" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                {ORGANIZATION_TYPES.map(t => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {isLoading ? (
          <div className="text-center py-20 text-muted-foreground">Cargando directorio...</div>
        ) : organizations?.length === 0 ? (
          <div className="text-center py-20">
            <h3 className="text-xl font-semibold mb-2">No se encontraron organizaciones</h3>
            <p className="text-muted-foreground">Intenta ajustando tu búsqueda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {organizations?.map((org) => (
              <Card key={org.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Building2 className="h-6 w-6 text-primary" />
                    </div>
                    <Badge variant="secondary" className="bg-primary/5 text-primary">
                      {ORGANIZATION_TYPES.find(t => t.value === org.type)?.label || org.type}
                    </Badge>
                  </div>
                  
                  <h3 className="text-xl font-bold mb-2 line-clamp-1">{org.name}</h3>
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                    <MapPin className="h-4 w-4" />
                    {org.city ? `${org.city}, ` : ''}{org.country}
                  </div>
                  
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-6 min-h-[4rem]">
                    {org.description || "Sin descripción disponible."}
                  </p>
                  
                  {org.website && (
                    <a href={org.website.startsWith('http') ? org.website : `https://${org.website}`} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" className="w-full text-sm h-9">
                        Visitar sitio web <ExternalLink className="ml-2 h-3 w-3" />
                      </Button>
                    </a>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
