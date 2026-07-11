import { useState } from "react";
import type { Application } from "@workspace/api-client-react";
import {
  useUpdateApplication,
  useGetProfessional,
  useGetOpportunity,
  useListApplicationEvents,
  getListApplicationsQueryKey,
  getGetOrganizationStatsQueryKey,
  getListApplicationEventsQueryKey,
  getGetProfessionalQueryKey,
  getGetOpportunityQueryKey,
} from "@workspace/api-client-react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { APPLICATION_STATUS_VALUES, STATUS_COLORS, useDomainLabels } from "@/lib/constants";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Star, Mail, MapPin, FileText, Instagram, Linkedin } from "lucide-react";
import { Link } from "wouter";

const objectUrl = (path?: string | null) => (path ? `/api/storage${path}` : undefined);

function ProfileField({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="text-sm whitespace-pre-line">{value}</p>
    </div>
  );
}

function CandidateDetail({
  app,
  orgId,
  onClose,
}: {
  app: Application;
  orgId: number;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const { applicationStatusLabel } = useDomainLabels();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const updateApp = useUpdateApplication();

  const { data: professional, isLoading: isProfLoading } = useGetProfessional(app.professionalId, {
    query: { queryKey: getGetProfessionalQueryKey(app.professionalId) },
  });
  const { data: opportunity } = useGetOpportunity(app.opportunityId, {
    query: { queryKey: getGetOpportunityQueryKey(app.opportunityId) },
  });
  const { data: events, isLoading: isEventsLoading } = useListApplicationEvents(app.id, {
    query: { queryKey: getListApplicationEventsQueryKey(app.id) },
  });

  const [status, setStatus] = useState<string>(app.status);
  const [score, setScore] = useState<string>(app.score != null ? String(app.score) : "");
  const [note, setNote] = useState<string>("");

  const handleSave = () => {
    const parsedScore = score.trim() === "" ? null : Number(score);
    updateApp.mutate(
      {
        id: app.id,
        data: {
          status,
          score: parsedScore,
          note: note.trim() === "" ? undefined : note.trim(),
        },
      },
      {
        onSuccess: () => {
          toast({ title: t("panel.toast.appStatusUpdated") });
          setNote("");
          queryClient.invalidateQueries({ queryKey: getListApplicationsQueryKey({ organizationId: orgId }) });
          queryClient.invalidateQueries({ queryKey: getGetOrganizationStatsQueryKey(orgId) });
          queryClient.invalidateQueries({ queryKey: getListApplicationEventsQueryKey(app.id) });
        },
        onError: () => toast({ title: t("panel.toast.orgUpdateError"), variant: "destructive" }),
      },
    );
  };

  const dateFmt = (d: string) => new Date(d).toLocaleDateString();
  const location = [professional?.city, professional?.country].filter(Boolean).join(", ");
  const requiredDocs = opportunity?.requiredDocuments ?? [];

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("panel.pipeline.detailTitle")}</DialogTitle>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6 py-2">
          {/* Candidate profile */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              {professional?.avatarUrl ? (
                <img
                  src={objectUrl(professional.avatarUrl)}
                  alt={professional?.name || ""}
                  className="w-14 h-14 rounded-full object-cover border"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center text-lg font-bold">
                  {(app.professionalName || "?").charAt(0)}
                </div>
              )}
              <div>
                <h3 className="font-bold text-lg">{app.professionalName}</h3>
                {app.professionalHeadline && (
                  <p className="text-sm text-muted-foreground">{app.professionalHeadline}</p>
                )}
                <Badge className={`mt-1 ${STATUS_COLORS[app.status]}`}>{applicationStatusLabel(app.status)}</Badge>
              </div>
            </div>

            <p className="text-sm">
              <Link href={`/oportunidades/${app.opportunityId}`} className="text-primary hover:underline">
                {app.opportunityTitle}
              </Link>
            </p>

            {isProfLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            ) : (
              <div className="space-y-3">
                {app.professionalEmail && (
                  <p className="text-sm flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" /> {app.professionalEmail}
                  </p>
                )}
                {location && (
                  <p className="text-sm flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" /> {location}
                  </p>
                )}
                <ProfileField label={t("panel.pipeline.fields.bio")} value={professional?.bio} />
                <ProfileField label={t("panel.pipeline.fields.education")} value={professional?.education} />
                <ProfileField label={t("panel.pipeline.fields.experience")} value={professional?.experience} />
                {professional?.skills && professional.skills.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                      {t("panel.pipeline.fields.skills")}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {professional.skills.map((s) => (
                        <Badge key={s} variant="secondary">{s}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {professional?.languages && professional.languages.length > 0 && (
                  <ProfileField
                    label={t("panel.pipeline.fields.languages")}
                    value={professional.languages.join(", ")}
                  />
                )}
                {professional?.certifications && professional.certifications.length > 0 && (
                  <ProfileField
                    label={t("panel.pipeline.fields.certifications")}
                    value={professional.certifications.join(", ")}
                  />
                )}
                {(professional?.linkedin || professional?.instagram) && (
                  <div className="flex gap-3">
                    {professional?.linkedin && (
                      <a href={professional.linkedin} target="_blank" rel="noreferrer" className="text-primary">
                        <Linkedin className="w-5 h-5" />
                      </a>
                    )}
                    {professional?.instagram && (
                      <a href={professional.instagram} target="_blank" rel="noreferrer" className="text-primary">
                        <Instagram className="w-5 h-5" />
                      </a>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Documents */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                {t("panel.pipeline.documents")}
              </p>
              {requiredDocs.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("panel.pipeline.noDocuments")}</p>
              ) : (
                <ul className="text-sm space-y-1">
                  {requiredDocs.map((doc) => (
                    <li key={doc} className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-muted-foreground" /> {doc}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {app.message && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                  {t("panel.pipeline.fields.message")}
                </p>
                <div className="text-sm bg-muted/30 p-3 rounded-md italic border-l-4 border-muted">
                  "{app.message}"
                </div>
              </div>
            )}
          </div>

          {/* Actions + history */}
          <div className="space-y-5">
            <div className="space-y-3 border rounded-lg p-4">
              <div className="space-y-2">
                <Label>{t("panel.pipeline.changeStatus")}</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {APPLICATION_STATUS_VALUES.map((s) => (
                      <SelectItem key={s} value={s}>{applicationStatusLabel(s)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("panel.pipeline.scoreLabel")}</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={score}
                  onChange={(e) => setScore(e.target.value)}
                  placeholder={t("panel.pipeline.scorePlaceholder")}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("panel.pipeline.note")}</Label>
                <Textarea
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={t("panel.pipeline.notePlaceholder")}
                />
              </div>
              <Button className="w-full" onClick={handleSave} disabled={updateApp.isPending}>
                {updateApp.isPending ? t("panel.pipeline.saving") : t("panel.pipeline.saveAndNotify")}
              </Button>
            </div>

            <div>
              <p className="font-semibold mb-2">{t("panel.pipeline.history")}</p>
              {isEventsLoading ? (
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
              ) : !events || events.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("panel.pipeline.historyEmpty")}</p>
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
                        <p className="text-xs text-muted-foreground mt-1">{t("panel.pipeline.noNote")}</p>
                      )}
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function CandidatePipeline({
  orgId,
  applications,
}: {
  orgId: number;
  applications: Application[];
}) {
  const { t } = useTranslation();
  const { applicationStatusLabel } = useDomainLabels();
  const [filter, setFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Application | null>(null);

  const counts: Record<string, number> = { all: applications.length };
  for (const s of APPLICATION_STATUS_VALUES) counts[s] = 0;
  for (const app of applications) {
    counts[app.status] = (counts[app.status] || 0) + 1;
  }

  const filtered = filter === "all" ? applications : applications.filter((a) => a.status === filter);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilter("all")}
          className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
            filter === "all" ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted"
          }`}
        >
          {t("panel.pipeline.all")} ({counts.all})
        </button>
        {APPLICATION_STATUS_VALUES.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
              filter === s ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted"
            }`}
          >
            {applicationStatusLabel(s)} ({counts[s] || 0})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">{t("panel.pipeline.emptyFilter")}</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((app) => (
            <Card key={app.id} className="hover:bg-muted/10 transition-colors">
              <CardContent className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1 flex-wrap">
                    <h4 className="font-bold">{app.professionalName}</h4>
                    <Badge className={STATUS_COLORS[app.status]}>{applicationStatusLabel(app.status)}</Badge>
                    {app.score != null && (
                      <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                        <Star className="w-4 h-4 text-amber-500 fill-amber-500" /> {app.score}
                      </span>
                    )}
                  </div>
                  {app.professionalHeadline && (
                    <p className="text-sm text-muted-foreground mb-1">{app.professionalHeadline}</p>
                  )}
                  <p className="text-sm">
                    <strong>{t("panel.applications.appliesTo")}</strong>{" "}
                    <Link href={`/oportunidades/${app.opportunityId}`} className="text-primary hover:underline">
                      {app.opportunityTitle}
                    </Link>
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setSelected(app)}>
                  {t("panel.pipeline.viewDetail")}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selected && (
        <CandidateDetail app={selected} orgId={orgId} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
