import { MainLayout } from "@/components/layout/MainLayout";
import { useListOpportunities } from "@workspace/api-client-react";
import { Link, useLocation, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Globe, Briefcase, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDomainLabels } from "@/lib/constants";
import { OpportunityFilters } from "@/components/OpportunityFilters";
import {
  EMPTY_FILTERS,
  parseFilters,
  buildSearchString,
  hasActiveFilters,
  toApiParams,
  type OpportunityFilters as Filters,
} from "@/lib/opportunityFilters";

export default function Opportunities() {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const search = useSearch();
  const { opportunityTypeLabel, modalityLabel } = useDomainLabels();

  const [filters, setFilters] = useState<Filters>(() => parseFilters(search));

  // Keep filters in sync when the URL query string changes (e.g. arriving from
  // the home search or using the browser back/forward buttons).
  useEffect(() => {
    setFilters(parseFilters(search));
  }, [search]);

  const setFilter = (key: keyof Filters, value: string) => {
    const next = { ...filters, [key]: value };
    setFilters(next);
    const qs = buildSearchString(next);
    navigate(qs ? `/oportunidades?${qs}` : "/oportunidades", { replace: true });
  };
  const handleClear = () => {
    setFilters(EMPTY_FILTERS);
    navigate("/oportunidades", { replace: true });
  };

  const { data: opportunities, isLoading } = useListOpportunities(toApiParams(filters));

  return (
    <MainLayout>
      <div className="bg-muted/30 border-b">
        <div className="container mx-auto px-4 py-12">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-4xl font-bold">{t("opportunities.list.title")}</h1>
            {hasActiveFilters(filters) && (
              <Button variant="ghost" onClick={handleClear}>
                <X className="mr-2 h-4 w-4" /> {t("search.clearButton")}
              </Button>
            )}
          </div>

          <OpportunityFilters values={filters} onChange={setFilter} />
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {isLoading ? (
          <div className="text-center py-20 text-muted-foreground">{t("opportunities.list.loading")}</div>
        ) : opportunities?.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">{t("opportunities.list.noResults.title")}</h3>
            <p className="text-muted-foreground">{t("opportunities.list.noResults.description")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              <div className="mb-6 flex justify-between items-center">
                <h2 className="text-xl font-semibold">{t("opportunities.list.resultsCount", { count: opportunities?.length || 0 })}</h2>
              </div>
              
              {opportunities?.map((opp) => (
                <Card key={opp.id} className="hover:border-primary/50 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-6">
                      <div className="flex-1">
                        <div className="flex gap-2 mb-3 flex-wrap">
                          <Badge className="bg-primary/10 text-primary hover:bg-primary/20">{opportunityTypeLabel(opp.type)}</Badge>
                          {opp.paid && <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">{t("opportunities.common.paid")}</Badge>}
                          <Badge variant="outline">{modalityLabel(opp.modality)}</Badge>
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
                            {t("opportunities.list.publishedOn", { date: new Date(opp.createdAt).toLocaleDateString('es-ES') })}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col justify-between items-end md:w-48 gap-4 border-t md:border-t-0 md:border-l pt-4 md:pt-0 md:pl-6">
                        <div className="text-right w-full">
                          {opp.deadline && (
                            <div className="text-sm font-medium text-destructive">
                              {t("opportunities.list.closesOn", { date: new Date(opp.deadline).toLocaleDateString('es-ES') })}
                            </div>
                          )}
                        </div>
                        <Link href={`/oportunidades/${opp.id}`} className="w-full">
                          <Button className="w-full">{t("opportunities.list.viewOpportunity")}</Button>
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
                  <h3 className="font-bold text-lg mb-2 text-accent-foreground/90">{t("opportunities.list.sidebar.title")}</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {t("opportunities.list.sidebar.description")}
                  </p>
                  <Link href="/registro?tipo=empresa">
                    <Button variant="outline" className="w-full">{t("opportunities.list.sidebar.cta")}</Button>
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
