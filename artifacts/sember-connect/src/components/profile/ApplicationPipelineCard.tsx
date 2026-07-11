import { useState } from "react";
import type { Application } from "@workspace/api-client-react";
import {
  useListApplicationEvents,
  getListApplicationEventsQueryKey,
} from "@workspace/api-client-react";
import { useTranslation } from "react-i18next";
import { STATUS_COLORS, APPLICATION_STATUS_VALUES, useDomainLabels } from "@/lib/constants";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ExternalLink, Star, ChevronDown, ChevronUp, Check, Loader2 } from "lucide-react";

const STEPS = ["enviada", "en_revision", "preseleccionado", "entrevista", "aceptado"] as const;

export function ApplicationPipelineCard({ app }: { app: Application }) {
  const { t, i18n } = useTranslation();
  const { applicationStatusLabel } = useDomainLabels();
  const [open, setOpen] = useState(false);

  const { data: events, isLoading } = useListApplicationEvents(app.id, {
    query: { enabled: open, queryKey: getListApplicationEventsQueryKey(app.id) },
  });

  const isRejected = app.status === "rechazado";
  const currentIndex = STEPS.indexOf(app.status as (typeof STEPS)[number]);
  const dateFmt = (d: string) => new Date(d).toLocaleDateString(i18n.language);

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="font-bold text-lg mb-1">{app.opportunityTitle}</h3>
            <p className="text-muted-foreground text-sm">{app.organizationName}</p>
            <div className="text-xs text-muted-foreground mt-2">
              {t("profile.applications.appliedOn", { date: dateFmt(app.createdAt) })}
            </div>
          </div>
          <div className="flex items-center gap-4">
            {app.score != null && (
              <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" /> {app.score}
              </span>
            )}
            <Badge className={STATUS_COLORS[app.status]}>{applicationStatusLabel(app.status)}</Badge>
            <Link href={`/oportunidades/${app.opportunityId}`}>
              <Button variant="ghost" size="icon"><ExternalLink className="h-4 w-4" /></Button>
            </Link>
          </div>
        </div>

        {/* Stepper */}
        {isRejected ? (
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center text-xs">✕</span>
            <span className="text-sm font-medium text-red-700">{applicationStatusLabel("rechazado")}</span>
          </div>
        ) : (
          <div className="flex items-center">
            {STEPS.map((step, idx) => {
              const done = idx < currentIndex;
              const active = idx === currentIndex;
              return (
                <div key={step} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold border-2 ${
                        done
                          ? "bg-primary border-primary text-primary-foreground"
                          : active
                            ? "bg-primary/10 border-primary text-primary"
                            : "bg-muted border-muted-foreground/20 text-muted-foreground"
                      }`}
                    >
                      {done ? <Check className="w-4 h-4" /> : idx + 1}
                    </div>
                    <span
                      className={`text-[10px] mt-1 text-center max-w-[64px] leading-tight ${
                        active ? "text-primary font-medium" : "text-muted-foreground"
                      }`}
                    >
                      {applicationStatusLabel(step)}
                    </span>
                  </div>
                  {idx < STEPS.length - 1 && (
                    <div className={`h-0.5 flex-1 mx-1 ${idx < currentIndex ? "bg-primary" : "bg-muted"}`} />
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div>
          <Button
            variant="ghost"
            size="sm"
            className="px-0 text-primary"
            onClick={() => setOpen((o) => !o)}
          >
            {open ? t("profile.applications.hideProcess") : t("profile.applications.viewProcess")}
            {open ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
          </Button>

          {open && (
            <div className="mt-3">
              <p className="font-semibold text-sm mb-2">{t("profile.applications.history")}</p>
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
              ) : !events || events.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("profile.applications.historyEmpty")}</p>
              ) : (
                <ol className="relative border-l pl-4 space-y-4">
                  {events.map((ev) => (
                    <li key={ev.id} className="relative">
                      <span className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-primary" />
                      <div className="flex items-center gap-2">
                        <Badge className={STATUS_COLORS[ev.status]}>{applicationStatusLabel(ev.status)}</Badge>
                        <span className="text-xs text-muted-foreground">{dateFmt(ev.createdAt)}</span>
                      </div>
                      {ev.note ? (
                        <p className="text-sm mt-1 italic">"{ev.note}"</p>
                      ) : (
                        <p className="text-xs text-muted-foreground mt-1">{t("profile.applications.noNote")}</p>
                      )}
                    </li>
                  ))}
                </ol>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
