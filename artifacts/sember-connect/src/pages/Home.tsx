import { MainLayout } from "@/components/layout/MainLayout";
import { useListOpportunities, useListOrganizations } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Globe, Briefcase, GraduationCap, Building2, MapPin, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import { useDomainLabels } from "@/lib/constants";

export default function Home() {
  const { t } = useTranslation();
  const { opportunityTypeLabel, modalityLabel } = useDomainLabels();
  const { data: opportunities } = useListOpportunities({ status: "activa" });
  const { data: organizations } = useListOrganizations({ status: "verificada" });

  const recentOpps = opportunities?.slice(0, 6) || [];
  const featuredOrgs = organizations?.slice(0, 4) || [];

  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="bg-primary text-primary-foreground py-20 lg:py-32 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=2000')] bg-cover bg-center" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl">
            <Badge className="bg-accent text-accent-foreground hover:bg-accent/90 mb-6 border-none px-3 py-1 text-sm">
              {t("home.hero.badge")}
            </Badge>
            <h1 className="text-5xl lg:text-7xl font-bold tracking-tight mb-6 leading-tight">
              {t("home.hero.title")}
            </h1>
            <p className="text-xl text-primary-foreground/80 mb-8 max-w-2xl leading-relaxed">
              {t("home.hero.subtitle")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/oportunidades">
                <Button size="lg" className="w-full sm:w-auto bg-accent text-accent-foreground hover:bg-accent/90 text-lg px-8 h-14">
                  {t("home.hero.exploreCta")} <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/registro?tipo=empresa">
                <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg px-8 h-14 bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 hover:text-white">
                  {t("home.hero.institutionCta")}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Modules Grid */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">{t("home.modules.title")}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">{t("home.modules.subtitle")}</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {[
              { icon: Briefcase, label: t("home.modules.empleabilidad"), color: "bg-blue-100 text-blue-600" },
              { icon: GraduationCap, label: t("home.modules.becas"), color: "bg-emerald-100 text-emerald-600" },
              { icon: Building2, label: t("home.modules.pasantias"), color: "bg-purple-100 text-purple-600" },
              { icon: Globe, label: t("home.modules.movilidad"), color: "bg-orange-100 text-orange-600" },
              { icon: Briefcase, label: t("home.modules.bootcamps"), color: "bg-pink-100 text-pink-600" },
              { icon: GraduationCap, label: t("home.modules.eventos"), color: "bg-indigo-100 text-indigo-600" },
            ].map((mod, i) => (
              <Card key={i} className="border-none shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
                <CardContent className="p-6 flex flex-col items-center text-center gap-4">
                  <div className={`p-4 rounded-full ${mod.color} group-hover:scale-110 transition-transform`}>
                    <mod.icon className="h-8 w-8" />
                  </div>
                  <span className="font-semibold">{mod.label}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Opportunities */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl font-bold mb-4">{t("home.featured.title")}</h2>
              <p className="text-muted-foreground">{t("home.featured.subtitle")}</p>
            </div>
            <Link href="/oportunidades">
              <Button variant="ghost" className="hidden sm:flex">{t("home.featured.viewAll")} <ArrowRight className="ml-2 h-4 w-4" /></Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentOpps.map((opp) => (
              <Card key={opp.id} className="flex flex-col hover:border-primary/50 transition-colors">
                <CardContent className="p-6 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <Badge variant="secondary">{opportunityTypeLabel(opp.type)}</Badge>
                    {opp.paid && <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">{t("home.featured.paid")}</Badge>}
                  </div>
                  <h3 className="font-bold text-xl mb-2 line-clamp-2">{opp.title}</h3>
                  <div className="text-sm text-muted-foreground mb-4 font-medium">{opp.organizationName}</div>
                  
                  <div className="mt-auto space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {opp.city ? `${opp.city}, ` : ''}{opp.country}
                    </div>
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      <span>{modalityLabel(opp.modality)}</span>
                    </div>
                  </div>
                  
                  <Link href={`/oportunidades/${opp.id}`}>
                    <Button className="w-full mt-6" variant="outline">{t("home.featured.viewDetails")}</Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <Button variant="ghost" className="w-full mt-8 sm:hidden">{t("home.featured.viewAllMobile")}</Button>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="bg-primary text-primary-foreground py-24">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl lg:text-5xl font-bold mb-6">{t("home.cta.title")}</h2>
          <p className="text-xl text-primary-foreground/80 max-w-2xl mx-auto mb-10">
            {t("home.cta.subtitle")}
          </p>
          <Link href="/oportunidades">
            <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 text-lg px-10 h-14">
              {t("home.cta.button")}
            </Button>
          </Link>
        </div>
      </section>
    </MainLayout>
  );
}
