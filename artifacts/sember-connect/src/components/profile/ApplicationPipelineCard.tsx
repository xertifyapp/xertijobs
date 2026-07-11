import { useState } from "react";
import type { Application } from "@workspace/api-client-react";
import {
  useListApplicationEvents,
  getListApplicationEventsQueryKey,
  useGetOpportunity,
  getGetOpportunityQueryKey,
  useRespondApplication,
  useWithdrawApplication,
  getListApplicationsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { STATUS_COLORS, useDomainLabels } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
import { Link } from "wouter";
import {
  ExternalLink,
  Star,
  Check,
  Loader2,
  FileText,
  MessageSquare,
  Send,
  Trash2,
  Eye,
} from "lucide-react";

const STEPS = ["enviada", "en_revision", "preseleccionado", "entrevista", "aceptado"] as const;

export function ApplicationPipelineCard({ app }: { app: Application }) {
  const { t, i18n } = useTranslation();
  const { applicationStatusLabel } = useDomainLabels();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [detailOpen, setDetailOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [reply, setReply] = useState("");

  const eventsQueryKey = getListApplicationEventsQueryKey(app.id);
  const { data: events, isLoading: eventsLoading } = useListApplicationEvents(app.id, {
    query: { enabled: detailOpen, queryKey: eventsQueryKey },
  });

  const { data: opportunity, isLoading: oppLoading } = useGetOpportunity(app.opportunityId, {
    query: { enabled: detailOpen, queryKey: getGetOpportunityQueryKey(app.opportunityId) },
  });

  const respond = useRespondApplication();
  const withdraw = useWithdrawApplication();

  const isRejected = app.status === "rechazado";
  const currentIndex = STEPS.indexOf(app.status as (typeof STEPS)[number]);
  const dateFmt = (d: string) => new Date(d).toLocaleDateString(i18n.language);
  const dateTimeFmt = (d: string) =>
    new Date(d).toLocaleString(i18n.language, {
      dateStyle: "medium",
      timeStyle: "short",
    });

  const authorLabel = (role?: string | null) => {
    if (role === "postulante") return t("profile.applications.author.you");
    if (role === "empresa") return t("profile.applications.author.institution");
    if (role === "admin") return t("profile.applications.author.sember");
    return t("profile.applications.author.system");
  };

  const documents = opportunity?.requiredDocuments ?? [];

  const handleReply = () => {
    const note = reply.trim();
    if (!note) return;
    respond.mutate(
      { id: app.id, data: { note } },
      {
        onSuccess: () => {
          setReply("");
          queryClient.invalidateQueries({ queryKey: eventsQueryKey });
          toast({ title: t("profile.applications.toast.messageSent") });
        },
        onError: () =>
          toast({ title: t("profile.applications.toast.messageError"), variant: "destructive" }),
      },
    );
  };

  const handleWithdraw = () => {
    withdraw.mutate(
      { id: app.id },
      {
        onSuccess: () => {
          setWithdrawOpen(false);
          setDetailOpen(false);
          queryClient.invalidateQueries({ queryKey: getListApplicationsQueryKey() });
          queryClient.invalidateQueries({
            queryKey: getListApplicationsQueryKey({ professionalId: app.professionalId }),
          });
          toast({ title: t("profile.applications.toast.withdrawn") });
        },
        onError: () =>
          toast({ title: t("profile.applications.toast.withdrawError"), variant: "destructive" }),
      },
    );
  };

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

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => setDetailOpen(true)}>
            <Eye className="w-4 h-4 mr-1" /> {t("profile.applications.viewDetail")}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={() => setWithdrawOpen(true)}
          >
            <Trash2 className="w-4 h-4 mr-1" /> {t("profile.applications.withdraw")}
          </Button>
        </div>
      </CardContent>

      {/* Detail dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{app.opportunityTitle}</DialogTitle>
            <DialogDescription>{app.organizationName}</DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Summary */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">{t("profile.applications.detail.status")}</p>
                <Badge className={`mt-1 ${STATUS_COLORS[app.status]}`}>
                  {applicationStatusLabel(app.status)}
                </Badge>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">{t("profile.applications.detail.date")}</p>
                <p className="font-medium mt-1">{dateFmt(app.createdAt)}</p>
              </div>
              {app.score != null && (
                <div>
                  <p className="text-muted-foreground text-xs">{t("profile.applications.score")}</p>
                  <p className="font-medium mt-1 inline-flex items-center gap-1">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" /> {app.score}
                  </p>
                </div>
              )}
            </div>

            <Separator />

            {/* Documents */}
            <div>
              <p className="font-semibold text-sm mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4" /> {t("profile.applications.detail.documents")}
              </p>
              {oppLoading ? (
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
              ) : documents.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {t("profile.applications.detail.noDocuments")}
                </p>
              ) : (
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {documents.map((doc, idx) => (
                    <li key={idx}>{doc}</li>
                  ))}
                </ul>
              )}
            </div>

            <Separator />

            {/* Messages timeline */}
            <div>
              <p className="font-semibold text-sm mb-3 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" /> {t("profile.applications.detail.messages")}
              </p>
              {eventsLoading ? (
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
              ) : !events || events.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {t("profile.applications.historyEmpty")}
                </p>
              ) : (
                <ol className="relative border-l pl-4 space-y-4">
                  {events.map((ev) => (
                    <li key={ev.id} className="relative">
                      <span className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-primary" />
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold">{authorLabel(ev.authorRole)}</span>
                        <Badge className={STATUS_COLORS[ev.status]}>
                          {applicationStatusLabel(ev.status)}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{dateTimeFmt(ev.createdAt)}</span>
                      </div>
                      {ev.note ? (
                        <p className="text-sm mt-1">{ev.note}</p>
                      ) : (
                        <p className="text-xs text-muted-foreground mt-1">
                          {t("profile.applications.noNote")}
                        </p>
                      )}
                    </li>
                  ))}
                </ol>
              )}

              {/* Reply box */}
              <div className="mt-4 space-y-2">
                <Textarea
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder={t("profile.applications.detail.replyPlaceholder")}
                  rows={3}
                />
                <div className="flex justify-end">
                  <Button size="sm" onClick={handleReply} disabled={respond.isPending || !reply.trim()}>
                    {respond.isPending ? (
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4 mr-1" />
                    )}
                    {t("profile.applications.detail.send")}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Withdraw confirm */}
      <AlertDialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("profile.applications.withdrawConfirm.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("profile.applications.withdrawConfirm.description", {
                title: app.opportunityTitle,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("profile.applications.withdrawConfirm.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleWithdraw();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {withdraw.isPending ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4 mr-1" />
              )}
              {t("profile.applications.withdrawConfirm.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
