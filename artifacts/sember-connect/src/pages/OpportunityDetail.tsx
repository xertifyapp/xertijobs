import { MainLayout } from "@/components/layout/MainLayout";
import {
  useGetOpportunity,
  useGetOrganization,
  useListSavedOpportunities,
  useSaveOpportunity,
  useUnsaveOpportunity,
  useCreateApplication,
  useListFollowedOrganizations,
  useFollowOrganization,
  useUnfollowOrganization,
  getListSavedOpportunitiesQueryKey,
  getGetOpportunityQueryKey,
  getListFollowedOrganizationsQueryKey,
  getGetOrganizationQueryKey,
} from "@workspace/api-client-react";
import { useParams, Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { STATUS_COLORS, useDomainLabels } from "@/lib/constants";
import { useAuth } from "@/hooks/useAuth";
import {
  MapPin,
  Globe,
  Briefcase,
  Calendar,
  FileText,
  CheckCircle2,
  BookmarkIcon,
  ExternalLink,
  Share2,
  Mail,
  Link2,
  Building2,
  Heart,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from "react-i18next";

const objectUrl = (path?: string | null) =>
  path ? `/api/storage${path}` : undefined;

function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "oportunidad"
  );
}

function setMetaTag(attr: "name" | "property", key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

export default function OpportunityDetail() {
  const { t } = useTranslation();
  const { opportunityTypeLabel, modalityLabel, opportunityStatusLabel, organizationTypeLabel } =
    useDomainLabels();
  const { id } = useParams();
  const oppId = parseInt(id || "0", 10);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const professionalId = user?.professionalId ?? 0;
  const isPostulante = user?.role === "postulante" && !!professionalId;

  const { data: opp, isLoading } = useGetOpportunity(oppId, {
    query: { enabled: !!oppId, queryKey: getGetOpportunityQueryKey(oppId) },
  });
  const orgId = opp?.organizationId ?? 0;
  const { data: org } = useGetOrganization(orgId, {
    query: { enabled: !!orgId, queryKey: getGetOrganizationQueryKey(orgId) },
  });
  const { data: savedOpps } = useListSavedOpportunities(professionalId, {
    query: { enabled: isPostulante, queryKey: getListSavedOpportunitiesQueryKey(professionalId) },
  });
  const { data: followedOrgs } = useListFollowedOrganizations(professionalId, {
    query: { enabled: isPostulante, queryKey: getListFollowedOrganizationsQueryKey(professionalId) },
  });

  const saveOpp = useSaveOpportunity();
  const unsaveOpp = useUnsaveOpportunity();
  const apply = useCreateApplication();
  const followOrg = useFollowOrganization();
  const unfollowOrg = useUnfollowOrganization();

  const isSaved = savedOpps?.some((s) => s.id === oppId);
  const isFollowing = followedOrgs?.some((o) => o.id === orgId);
  const [applyMessage, setApplyMessage] = useState("");
  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const slug = opp ? slugify(opp.title) : "";
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const shareUrl = opp ? `${origin}/compartir/${opp.id}/${slug}` : origin;

  useEffect(() => {
    if (!opp) return;
    const prevTitle = document.title;
    const parts = [opp.title, opp.organizationName].filter(Boolean);
    const pageTitle = `${parts.join(" · ")} | SEMBER CONNECT`;
    document.title = pageTitle;
    const desc = (opp.description || parts.join(" · ") || "SEMBER CONNECT")
      .replace(/\s+/g, " ")
      .slice(0, 200);
    setMetaTag("name", "description", desc);
    setMetaTag("property", "og:title", pageTitle);
    setMetaTag("property", "og:description", desc);
    setMetaTag("property", "og:url", shareUrl);
    setMetaTag("property", "og:type", "article");
    return () => {
      document.title = prevTitle;
    };
  }, [opp, shareUrl]);

  const handleSaveToggle = () => {
    if (!isPostulante) {
      navigate("/login");
      return;
    }
    if (isSaved) {
      unsaveOpp.mutate(
        { id: professionalId, opportunityId: oppId },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({
              queryKey: getListSavedOpportunitiesQueryKey(professionalId),
            });
            toast({ title: t("opportunities.detail.toast.removed") });
          },
        },
      );
    } else {
      saveOpp.mutate(
        { id: professionalId, data: { opportunityId: oppId } },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({
              queryKey: getListSavedOpportunitiesQueryKey(professionalId),
            });
            toast({ title: t("opportunities.detail.toast.saved") });
          },
        },
      );
    }
  };

  const handleFollowToggle = () => {
    if (!isPostulante) {
      navigate("/login");
      return;
    }
    if (!orgId) return;
    if (isFollowing) {
      unfollowOrg.mutate(
        { id: professionalId, organizationId: orgId },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({
              queryKey: getListFollowedOrganizationsQueryKey(professionalId),
            });
            queryClient.invalidateQueries({ queryKey: getGetOrganizationQueryKey(orgId) });
            toast({ title: t("opportunities.detail.follow.toast.unfollowed") });
          },
        },
      );
    } else {
      followOrg.mutate(
        { id: professionalId, data: { organizationId: orgId } },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({
              queryKey: getListFollowedOrganizationsQueryKey(professionalId),
            });
            queryClient.invalidateQueries({ queryKey: getGetOrganizationQueryKey(orgId) });
            toast({ title: t("opportunities.detail.follow.toast.followed") });
          },
        },
      );
    }
  };

  const handleApply = () => {
    apply.mutate(
      { data: { opportunityId: oppId, professionalId, message: applyMessage } },
      {
        onSuccess: () => {
          toast({ title: t("opportunities.detail.toast.applied") });
          setIsApplyOpen(false);
          setApplyMessage("");
        },
        onError: (err: any) => {
          if (err.status === 409) {
            toast({
              title: t("opportunities.detail.toast.alreadyApplied"),
              variant: "destructive",
            });
          } else {
            toast({
              title: t("opportunities.detail.toast.applyErrorTitle"),
              description: t("opportunities.detail.toast.applyErrorDescription"),
              variant: "destructive",
            });
          }
        },
      },
    );
  };

  const shareText = opp ? `${opp.title} · ${opp.organizationName}` : "";

  const handleNativeShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: shareText, url: shareUrl });
      } catch {
        /* user cancelled */
      }
      setShareOpen(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast({ title: t("opportunities.detail.share.copied") });
    } catch {
      toast({
        title: t("opportunities.detail.share.copyError"),
        variant: "destructive",
      });
    }
    setShareOpen(false);
  };

  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedText = encodeURIComponent(shareText);
  const shareLinks = {
    whatsapp: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    x: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
  };

  const openShare = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
    setShareOpen(false);
  };

  if (isLoading)
    return (
      <MainLayout>
        <div className="py-20 text-center text-muted-foreground">
          {t("opportunities.detail.loading")}
        </div>
      </MainLayout>
    );
  if (!opp)
    return (
      <MainLayout>
        <div className="py-20 text-center text-muted-foreground">
          {t("opportunities.detail.notFound")}
        </div>
      </MainLayout>
    );

  const orgLogo = objectUrl(org?.logoUrl);
  const contactEmail = org?.contactEmail;

  return (
    <MainLayout>
      <div className="bg-muted/20 border-b">
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col md:flex-row justify-between gap-6 items-start">
            <div className="flex-1">
              <div className="flex gap-2 mb-4 flex-wrap">
                <Badge className={STATUS_COLORS[opp.status] || ""}>
                  {opportunityStatusLabel(opp.status)}
                </Badge>
                <Badge className="bg-primary/10 text-primary">
                  {opportunityTypeLabel(opp.type)}
                </Badge>
                {opp.paid && (
                  <Badge
                    variant="outline"
                    className="bg-green-50 text-green-700 border-green-200"
                  >
                    {t("opportunities.common.paid")}
                  </Badge>
                )}
                <Badge variant="outline">{modalityLabel(opp.modality)}</Badge>
              </div>

              <h1 className="text-4xl md:text-5xl font-bold mb-4">{opp.title}</h1>
              <div className="text-xl text-muted-foreground font-medium mb-6">
                {opp.organizationName}
              </div>

              <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  {opp.city ? `${opp.city}, ` : ""}
                  {opp.country}
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
                    {t("opportunities.detail.closes", {
                      date: new Date(opp.deadline).toLocaleDateString("es-ES"),
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row md:flex-col gap-3 w-full md:w-auto">
              {!user ? (
                <Button
                  size="lg"
                  className="w-full md:w-64"
                  onClick={() => navigate("/login")}
                  disabled={opp.status !== "activa"}
                >
                  {t("opportunities.detail.loginToApply")}
                </Button>
              ) : isPostulante ? (
                <Dialog open={isApplyOpen} onOpenChange={setIsApplyOpen}>
                  <DialogTrigger asChild>
                    <Button
                      size="lg"
                      className="w-full md:w-64"
                      disabled={opp.status !== "activa" || apply.isPending}
                    >
                      {t("opportunities.detail.apply")}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {t("opportunities.detail.applyDialog.title", { title: opp.title })}
                      </DialogTitle>
                      <DialogDescription>
                        {t("opportunities.detail.applyDialog.description")}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                      <Textarea
                        placeholder={t("opportunities.detail.applyDialog.placeholder")}
                        value={applyMessage}
                        onChange={(e) => setApplyMessage(e.target.value)}
                        rows={4}
                      />
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsApplyOpen(false)}>
                        {t("opportunities.detail.applyDialog.cancel")}
                      </Button>
                      <Button onClick={handleApply} disabled={apply.isPending}>
                        {apply.isPending
                          ? t("opportunities.detail.applyDialog.sending")
                          : t("opportunities.detail.applyDialog.confirm")}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              ) : null}

              {(!user || isPostulante) && (
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full md:w-64 bg-background"
                  onClick={handleSaveToggle}
                >
                  <BookmarkIcon
                    className={`mr-2 h-5 w-5 ${isSaved ? "fill-primary text-primary" : ""}`}
                  />
                  {isSaved ? t("opportunities.detail.saved") : t("opportunities.detail.save")}
                </Button>
              )}

              <DropdownMenu open={shareOpen} onOpenChange={setShareOpen}>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full md:w-64 bg-background"
                  >
                    <Share2 className="mr-2 h-5 w-5" />
                    {t("opportunities.detail.share.button")}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {typeof navigator !== "undefined" && "share" in navigator && (
                    <DropdownMenuItem onSelect={(e) => { e.preventDefault(); handleNativeShare(); }}>
                      <Share2 className="mr-2 h-4 w-4" />
                      {t("opportunities.detail.share.native")}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onSelect={(e) => { e.preventDefault(); openShare(shareLinks.whatsapp); }}>
                    <Share2 className="mr-2 h-4 w-4" />
                    {t("opportunities.detail.share.whatsapp")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={(e) => { e.preventDefault(); openShare(shareLinks.linkedin); }}>
                    <Share2 className="mr-2 h-4 w-4" />
                    {t("opportunities.detail.share.linkedin")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={(e) => { e.preventDefault(); openShare(shareLinks.x); }}>
                    <Share2 className="mr-2 h-4 w-4" />
                    {t("opportunities.detail.share.x")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={(e) => { e.preventDefault(); openShare(shareLinks.facebook); }}>
                    <Share2 className="mr-2 h-4 w-4" />
                    {t("opportunities.detail.share.facebook")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={(e) => { e.preventDefault(); openShare(shareLinks.telegram); }}>
                    <Share2 className="mr-2 h-4 w-4" />
                    {t("opportunities.detail.share.telegram")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={(e) => { e.preventDefault(); handleCopyLink(); }}>
                    <Link2 className="mr-2 h-4 w-4" />
                    {t("opportunities.detail.share.copy")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-12">
            {opp.description && (
              <section>
                <h2 className="text-2xl font-bold mb-4">
                  {t("opportunities.detail.description")}
                </h2>
                <div className="prose prose-sm md:prose-base max-w-none text-muted-foreground whitespace-pre-wrap">
                  {opp.description}
                </div>
              </section>
            )}

            {opp.requirements && (
              <section>
                <h2 className="text-2xl font-bold mb-4">
                  {t("opportunities.detail.requirements")}
                </h2>
                <div className="prose prose-sm md:prose-base max-w-none text-muted-foreground whitespace-pre-wrap">
                  {opp.requirements}
                </div>
              </section>
            )}

            {opp.benefits && (
              <section>
                <h2 className="text-2xl font-bold mb-4">
                  {t("opportunities.detail.benefits")}
                </h2>
                <div className="prose prose-sm md:prose-base max-w-none text-muted-foreground whitespace-pre-wrap">
                  {opp.benefits}
                </div>
              </section>
            )}
          </div>

          <div className="space-y-8">
            <div className="bg-muted/30 p-6 rounded-xl border">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Building2 className="h-5 w-5" /> {t("opportunities.detail.institution.title")}
              </h3>
              <div className="flex items-center gap-4 mb-4">
                <div className="h-16 w-16 rounded-lg bg-background border overflow-hidden flex items-center justify-center shrink-0">
                  {orgLogo ? (
                    <img
                      src={orgLogo}
                      alt={opp.organizationName ?? ""}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Building2 className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="font-semibold truncate">{opp.organizationName}</div>
                  {org?.type && (
                    <div className="text-sm text-muted-foreground">
                      {organizationTypeLabel(org.type)}
                    </div>
                  )}
                  {typeof org?.followersCount === "number" && (
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {t("opportunities.detail.follow.followersCount", {
                        count: org.followersCount,
                      })}
                    </div>
                  )}
                </div>
              </div>

              {org?.description && (
                <p className="text-sm text-muted-foreground mb-4 line-clamp-4">
                  {org.description}
                </p>
              )}

              {(!user || isPostulante) && (
                <Button
                  variant={isFollowing ? "outline" : "default"}
                  className="w-full mb-3"
                  onClick={handleFollowToggle}
                  disabled={followOrg.isPending || unfollowOrg.isPending}
                >
                  <Heart
                    className={`mr-2 h-4 w-4 ${isFollowing ? "fill-primary text-primary" : ""}`}
                  />
                  {isFollowing
                    ? t("opportunities.detail.follow.following")
                    : t("opportunities.detail.follow.follow")}
                </Button>
              )}

              <div className="space-y-2">
                {orgId ? (
                  <Link href={`/organizaciones`}>
                    <Button variant="ghost" className="w-full justify-start px-2">
                      <Building2 className="mr-2 h-4 w-4" />
                      {t("opportunities.detail.institution.viewProfile")}
                    </Button>
                  </Link>
                ) : null}
                {org?.website && (
                  <a href={org.website} target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" className="w-full justify-start px-2">
                      <Globe className="mr-2 h-4 w-4" />
                      {t("opportunities.detail.institution.website")}
                    </Button>
                  </a>
                )}
              </div>
            </div>

            {contactEmail && (
              <div className="bg-muted/30 p-6 rounded-xl border">
                <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                  <Mail className="h-5 w-5" /> {t("opportunities.detail.contact.title")}
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  {t("opportunities.detail.contact.description")}
                </p>
                <a href={`mailto:${contactEmail}`}>
                  <Button variant="outline" className="w-full">
                    <Mail className="mr-2 h-4 w-4" />
                    {contactEmail}
                  </Button>
                </a>
              </div>
            )}

            {opp.competencies && opp.competencies.length > 0 && (
              <div className="bg-muted/30 p-6 rounded-xl border">
                <h3 className="font-bold text-lg mb-4">
                  {t("opportunities.detail.competencies")}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {opp.competencies.map((comp, i) => (
                    <Badge key={i} variant="secondary">
                      {comp}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {opp.requiredDocuments && opp.requiredDocuments.length > 0 && (
              <div className="bg-muted/30 p-6 rounded-xl border">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5" /> {t("opportunities.detail.requiredDocuments")}
                </h3>
                <ul className="space-y-3">
                  {opp.requiredDocuments.map((doc, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm text-muted-foreground"
                    >
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" /> {doc}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {opp.externalLink && (
              <div className="bg-primary/5 p-6 rounded-xl border border-primary/10">
                <h3 className="font-bold text-lg mb-2">
                  {t("opportunities.detail.externalApplication.title")}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {t("opportunities.detail.externalApplication.description")}
                </p>
                <a href={opp.externalLink} target="_blank" rel="noopener noreferrer">
                  <Button className="w-full" variant="outline">
                    {t("opportunities.detail.externalApplication.cta")}{" "}
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
                </a>
              </div>
            )}

            <Separator />

            <div className="text-sm text-muted-foreground text-center">
              {t("opportunities.detail.publishedOn", {
                date: new Date(opp.createdAt).toLocaleDateString("es-ES"),
              })}
              {opp.views ? ` · ${t("opportunities.detail.views", { count: opp.views })}` : ""}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
