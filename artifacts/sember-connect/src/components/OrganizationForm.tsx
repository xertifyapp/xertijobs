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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ORGANIZATION_STATUS_VALUES, useDomainLabels } from "@/lib/constants";
import type { Organization } from "@workspace/api-client-react";

export type OrganizationFormValues = {
  name: string;
  type: string;
  country: string;
  city: string;
  website: string;
  contactEmail: string;
  contactPhone: string;
  verificationDocs: string;
  description: string;
  status: string;
};

const EMPTY: OrganizationFormValues = {
  name: "",
  type: "universidad",
  country: "",
  city: "",
  website: "",
  contactEmail: "",
  contactPhone: "",
  verificationDocs: "",
  description: "",
  status: "pendiente",
};

function fromOrg(org: Organization): OrganizationFormValues {
  return {
    name: org.name ?? "",
    type: org.type ?? "universidad",
    country: org.country ?? "",
    city: org.city ?? "",
    website: org.website ?? "",
    contactEmail: org.contactEmail ?? "",
    contactPhone: org.contactPhone ?? "",
    verificationDocs: org.verificationDocs ?? "",
    description: org.description ?? "",
    status: org.status ?? "pendiente",
  };
}

type Props = {
  mode: "create" | "edit";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organization?: Organization | null;
  onSubmit: (values: OrganizationFormValues) => void;
  isPending?: boolean;
};

export function OrganizationForm({ mode, open, onOpenChange, organization, onSubmit, isPending }: Props) {
  const { t } = useTranslation();
  const { organizationTypes, organizationStatusLabel } = useDomainLabels();
  const [values, setValues] = useState<OrganizationFormValues>(EMPTY);

  useEffect(() => {
    if (!open) return;
    setValues(mode === "edit" && organization ? fromOrg(organization) : EMPTY);
  }, [open, mode, organization]);

  const set = (key: keyof OrganizationFormValues, value: string) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const canSubmit = values.name.trim() !== "" && values.country.trim() !== "" && values.type !== "";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || isPending) return;
    onSubmit(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t(mode === "create" ? "admin.manage.createTitle" : "admin.manage.editTitle")}</DialogTitle>
          <DialogDescription>
            {t(mode === "create" ? "admin.manage.createSubtitle" : "admin.manage.editSubtitle")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="org-name">{t("admin.manage.fields.name")}</Label>
              <Input id="org-name" value={values.name} onChange={(e) => set("name", e.target.value)} required />
            </div>

            <div className="space-y-1.5">
              <Label>{t("admin.manage.fields.type")}</Label>
              <Select value={values.type} onValueChange={(v) => set("type", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {organizationTypes.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>{t("admin.manage.fields.status")}</Label>
              <Select value={values.status} onValueChange={(v) => set("status", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ORGANIZATION_STATUS_VALUES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {organizationStatusLabel(s)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="org-country">{t("admin.manage.fields.country")}</Label>
              <Input id="org-country" value={values.country} onChange={(e) => set("country", e.target.value)} required />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="org-city">{t("admin.manage.fields.city")}</Label>
              <Input id="org-city" value={values.city} onChange={(e) => set("city", e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="org-email">{t("admin.manage.fields.contactEmail")}</Label>
              <Input id="org-email" type="email" value={values.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="org-phone">{t("admin.manage.fields.contactPhone")}</Label>
              <Input id="org-phone" value={values.contactPhone} onChange={(e) => set("contactPhone", e.target.value)} />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="org-website">{t("admin.manage.fields.website")}</Label>
              <Input id="org-website" value={values.website} onChange={(e) => set("website", e.target.value)} placeholder="https://..." />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="org-docs">{t("admin.manage.fields.verificationDocs")}</Label>
              <Input
                id="org-docs"
                value={values.verificationDocs}
                onChange={(e) => set("verificationDocs", e.target.value)}
                placeholder={t("admin.manage.placeholders.verificationDocs")}
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="org-desc">{t("admin.manage.fields.description")}</Label>
              <Textarea id="org-desc" rows={3} value={values.description} onChange={(e) => set("description", e.target.value)} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              {t("admin.manage.cancel")}
            </Button>
            <Button type="submit" disabled={!canSubmit || isPending}>
              {isPending
                ? t("admin.manage.saving")
                : t(mode === "create" ? "admin.manage.create" : "admin.manage.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
