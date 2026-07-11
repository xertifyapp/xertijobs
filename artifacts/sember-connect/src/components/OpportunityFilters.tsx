import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslation } from "react-i18next";
import { useDomainLabels } from "@/lib/constants";
import {
  useOpportunityFilterOptions,
  type OpportunityFilters as Filters,
} from "@/lib/opportunityFilters";

const ANY = "__any__";

type Props = {
  values: Filters;
  onChange: (key: keyof Filters, value: string) => void;
  onSubmit?: () => void;
};

export function OpportunityFilters({ values, onChange, onSubmit }: Props) {
  const { t } = useTranslation();
  const { opportunityTypes, modalities } = useDomainLabels();
  const { countries, areas, languages } = useOpportunityFilterOptions();

  const selectValue = (v: string) => (v === "" ? ANY : v);
  const handleSelect = (key: keyof Filters) => (v: string) =>
    onChange(key, v === ANY ? "" : v);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {/* Palabra clave */}
      <div className="relative md:col-span-2 lg:col-span-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder={t("search.fields.keywordPlaceholder")}
          aria-label={t("search.fields.keyword")}
          className="pl-10 h-12 bg-background text-foreground"
          value={values.keyword}
          onChange={(e) => onChange("keyword", e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && onSubmit) onSubmit();
          }}
        />
      </div>

      {/* País */}
      <Select value={selectValue(values.country)} onValueChange={handleSelect("country")}>
        <SelectTrigger className="h-12 bg-background text-foreground" aria-label={t("search.fields.country")}>
          <SelectValue placeholder={t("search.fields.country")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ANY}>{t("search.fields.allCountries")}</SelectItem>
          {countries.map((c) => (
            <SelectItem key={c} value={c}>{c}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Modalidad */}
      <Select value={selectValue(values.modality)} onValueChange={handleSelect("modality")}>
        <SelectTrigger className="h-12 bg-background text-foreground" aria-label={t("search.fields.modality")}>
          <SelectValue placeholder={t("search.fields.modality")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ANY}>{t("search.fields.allModalities")}</SelectItem>
          {modalities.map((m) => (
            <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Área */}
      <Select value={selectValue(values.area)} onValueChange={handleSelect("area")}>
        <SelectTrigger className="h-12 bg-background text-foreground" aria-label={t("search.fields.area")}>
          <SelectValue placeholder={t("search.fields.area")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ANY}>{t("search.fields.allAreas")}</SelectItem>
          {areas.map((a) => (
            <SelectItem key={a} value={a}>{a}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Tipo de oportunidad */}
      <Select value={selectValue(values.type)} onValueChange={handleSelect("type")}>
        <SelectTrigger className="h-12 bg-background text-foreground" aria-label={t("search.fields.type")}>
          <SelectValue placeholder={t("search.fields.type")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ANY}>{t("search.fields.allTypes")}</SelectItem>
          {opportunityTypes.map((o) => (
            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Idioma */}
      <Select value={selectValue(values.language)} onValueChange={handleSelect("language")}>
        <SelectTrigger className="h-12 bg-background text-foreground" aria-label={t("search.fields.language")}>
          <SelectValue placeholder={t("search.fields.language")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ANY}>{t("search.fields.allLanguages")}</SelectItem>
          {languages.map((l) => (
            <SelectItem key={l} value={l}>{l}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
