import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MODALITY_VALUES,
  OPPORTUNITY_STATUS_VALUES,
  useDomainLabels,
} from "@/lib/constants";
import type { Opportunity, Organization } from "@workspace/api-client-react";

export type OpportunityFormValues = {
  organizationId: string;
  title: string;
  type: string;
  area: string;
  country: string;
  city: string;
  modality: string;
  status: string;
  deadline: string;
  description: string;
  requirements: string;
  benefits: string;
  externalLink: string;
  paid: boolean;
  featured: boolean;
};

const EMPTY: OpportunityFormValues = {
  organizationId: "",
  title: "",
  type: "empleo",
  area: "",
  country: "",
  city: "",
  modality: "presencial",
  status: "activa",
  deadline: "",
  description: "",
  requirements: "",
  benefits: "",
  externalLink: "",
  paid: false,
  featured: false,
};

function fromOpp(opp: Opportunity): OpportunityFormValues {
  return {
    organizationId: String(opp.organizationId ?? ""),
    title: opp.title ?? "",
    type: opp.type ?? "empleo",
    area: opp.area ?? "",
    country: opp.country ?? "",
    city: opp.city ?? "",
    modality: opp.modality ?? "presencial",
    status: opp.status ?? "activa",
    deadline: opp.deadline ?? "",
    description: opp.description ?? "",
    requirements: opp.requirements ?? "",
    benefits: opp.benefits ?? "",
    externalLink: opp.externalLink ?? "",
    paid: opp.paid ?? false,
    featured: opp.featured ?? false,
  };
}

type Props = {
  mode: "create" | "edit";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  opportunity?: Opportunity | null;
  organizations: Organization[];
  onSubmit: (values: OpportunityFormValues) => void;
  isPending?: boolean;
};

export function OpportunityForm({
  mode,
  open,
  onOpenChange,
  opportunity,
  organizations,
  onSubmit,
  isPending,
}: Props) {
  const { t } = useTranslation();
  const { opportunityTypes, modalities, opportunityStatusLabel } = useDomainLabels();
  const [values, setValues] = useState<OpportunityFormValues>(EMPTY);

  useEffect(() => {
    if (!open) return;
    setValues(mode === "edit" && opportunity ? fromOpp(opportunity) : EMPTY);
  }, [open, mode, opportunity]);

  const set = <K extends keyof OpportunityFormValues>(key: K, value: OpportunityFormValues[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const canSubmit =
    values.title.trim() !== "" &&
    values.country.trim() !== "" &&
    values.type !== "" &&
    values.modality !== "" &&
    values.organizationId !== "";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || isPending) return;
    onSubmit(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t(mode === "create" ? "admin.opps.createTitle" : "admin.opps.editTitle")}</DialogTitle>
          <DialogDescription>
            {t(mode === "create" ? "admin.opps.createSubtitle" : "admin.opps.editSubtitle")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <Label>{t("admin.opps.fields.organization")}</Label>
              <Select value={values.organizationId} onValueChange={(v) => set("organizationId", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {organizations.map((o) => (
                    <SelectItem key={o.id} value={String(o.id)}>
                      {o.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="opp-title">{t("admin.opps.fields.title")}</Label>
              <Input id="opp-title" value={values.title} onChange={(e) => set("title", e.target.value)} required />
            </div>

            <div className="space-y-1.5">
              <Label>{t("admin.opps.fields.type")}</Label>
              <Select value={values.type} onValueChange={(v) => set("type", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {opportunityTypes.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>{t("admin.opps.fields.status")}</Label>
              <Select value={values.status} onValueChange={(v) => set("status", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OPPORTUNITY_STATUS_VALUES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {opportunityStatusLabel(s)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>{t("admin.opps.fields.modality")}</Label>
              <Select value={values.modality} onValueChange={(v) => set("modality", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {modalities.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="opp-area">{t("admin.opps.fields.area")}</Label>
              <Input id="opp-area" value={values.area} onChange={(e) => set("area", e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="opp-country">{t("admin.opps.fields.country")}</Label>
              <Input id="opp-country" value={values.country} onChange={(e) => set("country", e.target.value)} required />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="opp-city">{t("admin.opps.fields.city")}</Label>
              <Input id="opp-city" value={values.city} onChange={(e) => set("city", e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="opp-deadline">{t("admin.opps.fields.deadline")}</Label>
              <Input id="opp-deadline" value={values.deadline} onChange={(e) => set("deadline", e.target.value)} placeholder="2026-12-31" />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="opp-link">{t("admin.opps.fields.externalLink")}</Label>
              <Input id="opp-link" value={values.externalLink} onChange={(e) => set("externalLink", e.target.value)} placeholder="https://..." />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="opp-desc">{t("admin.opps.fields.description")}</Label>
              <Textarea id="opp-desc" rows={3} value={values.description} onChange={(e) => set("description", e.target.value)} />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="opp-req">{t("admin.opps.fields.requirements")}</Label>
              <Textarea id="opp-req" rows={2} value={values.requirements} onChange={(e) => set("requirements", e.target.value)} />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="opp-benefits">{t("admin.opps.fields.benefits")}</Label>
              <Textarea id="opp-benefits" rows={2} value={values.benefits} onChange={(e) => set("benefits", e.target.value)} />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <Label htmlFor="opp-paid">{t("admin.opps.fields.paid")}</Label>
              <Switch id="opp-paid" checked={values.paid} onCheckedChange={(v) => set("paid", v)} />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <Label htmlFor="opp-featured">{t("admin.opps.fields.featured")}</Label>
              <Switch id="opp-featured" checked={values.featured} onCheckedChange={(v) => set("featured", v)} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              {t("admin.opps.cancel")}
            </Button>
            <Button type="submit" disabled={!canSubmit || isPending}>
              {isPending
                ? t("admin.opps.saving")
                : t(mode === "create" ? "admin.opps.create" : "admin.opps.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
