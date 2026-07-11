import { useMemo } from "react";
import { useListOpportunities } from "@workspace/api-client-react";

export type OpportunityFilters = {
  keyword: string;
  country: string;
  modality: string;
  area: string;
  type: string;
  language: string;
};

export const EMPTY_FILTERS: OpportunityFilters = {
  keyword: "",
  country: "",
  modality: "",
  area: "",
  type: "",
  language: "",
};

const FILTER_KEYS = Object.keys(EMPTY_FILTERS) as (keyof OpportunityFilters)[];

/** Parse the current URL query string into a filter object. */
export function parseFilters(search: string): OpportunityFilters {
  const params = new URLSearchParams(search);
  const result = { ...EMPTY_FILTERS };
  for (const key of FILTER_KEYS) {
    const value = params.get(key);
    if (value) result[key] = value;
  }
  return result;
}

/** Build a URL query string (without the leading `?`) from a filter object. */
export function buildSearchString(filters: OpportunityFilters): string {
  const params = new URLSearchParams();
  for (const key of FILTER_KEYS) {
    const value = filters[key].trim();
    if (value) params.set(key, value);
  }
  return params.toString();
}

/** Map the filter object to the query params accepted by the list endpoint. */
export function toApiParams(filters: OpportunityFilters): Record<string, string> {
  const params: Record<string, string> = { status: "activa" };
  if (filters.keyword.trim()) params.search = filters.keyword.trim();
  if (filters.country) params.country = filters.country;
  if (filters.modality) params.modality = filters.modality;
  if (filters.area) params.area = filters.area;
  if (filters.type) params.type = filters.type;
  if (filters.language) params.language = filters.language;
  return params;
}

export function hasActiveFilters(filters: OpportunityFilters): boolean {
  return FILTER_KEYS.some((key) => filters[key].trim() !== "");
}

/**
 * Derives the distinct country / area / language option lists from all active
 * opportunities so the select menus only ever offer values that yield results.
 */
export function useOpportunityFilterOptions(): {
  countries: string[];
  areas: string[];
  languages: string[];
} {
  const { data } = useListOpportunities({ status: "activa" });

  return useMemo(() => {
    const countries = new Set<string>();
    const areas = new Set<string>();
    const languages = new Set<string>();
    for (const opp of data ?? []) {
      if (opp.country) countries.add(opp.country);
      if (opp.area) areas.add(opp.area);
      if (opp.language) languages.add(opp.language);
    }
    const sort = (set: Set<string>) => [...set].sort((a, b) => a.localeCompare(b, "es"));
    return { countries: sort(countries), areas: sort(areas), languages: sort(languages) };
  }, [data]);
}
