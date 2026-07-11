import { useTranslation } from "react-i18next";

export const OPPORTUNITY_TYPE_VALUES = [
  "internship",
  "empleo",
  "beca",
  "bootcamp",
  "evento",
  "movilidad",
  "convocatoria",
] as const;

export const ORGANIZATION_TYPE_VALUES = [
  "universidad",
  "empresa",
  "gobierno",
  "ong",
  "fundacion",
  "organismo_internacional",
  "academia",
  "bootcamp",
] as const;

export const MODALITY_VALUES = ["presencial", "remoto", "hibrido"] as const;

export const ORGANIZATION_STATUS_VALUES = [
  "pendiente",
  "verificada",
  "suspendida",
  "rechazada",
] as const;

export type DomainOption = { value: string; label: string };

/**
 * Localized label helpers for the domain enums. The stored DB values never
 * change; only their display labels are translated via the `enums.*` keys.
 */
export function useDomainLabels() {
  const { t } = useTranslation();

  const opportunityTypes: DomainOption[] = OPPORTUNITY_TYPE_VALUES.map((value) => ({
    value,
    label: t(`enums.opportunityType.${value}`),
  }));

  const organizationTypes: DomainOption[] = ORGANIZATION_TYPE_VALUES.map((value) => ({
    value,
    label: t(`enums.organizationType.${value}`),
  }));

  const modalities: DomainOption[] = MODALITY_VALUES.map((value) => ({
    value,
    label: t(`enums.modality.${value}`),
  }));

  return {
    opportunityTypes,
    organizationTypes,
    modalities,
    opportunityTypeLabel: (value?: string | null) =>
      value ? t(`enums.opportunityType.${value}`) : "",
    organizationTypeLabel: (value?: string | null) =>
      value ? t(`enums.organizationType.${value}`) : "",
    modalityLabel: (value?: string | null) => (value ? t(`enums.modality.${value}`) : ""),
    applicationStatusLabel: (value?: string | null) =>
      value ? t(`enums.applicationStatus.${value}`) : "",
    opportunityStatusLabel: (value?: string | null) =>
      value ? t(`enums.opportunityStatus.${value}`) : "",
    organizationStatusLabel: (value?: string | null) =>
      value ? t(`enums.organizationStatus.${value}`) : "",
  };
}

export const STATUS_COLORS: Record<string, string> = {
  activa: "bg-green-100 text-green-800 border-green-200",
  cerrada: "bg-gray-100 text-gray-800 border-gray-200",
  borrador: "bg-yellow-100 text-yellow-800 border-yellow-200",
  pendiente: "bg-yellow-100 text-yellow-800 border-yellow-200",
  verificada: "bg-green-100 text-green-800 border-green-200",
  suspendida: "bg-orange-100 text-orange-800 border-orange-200",
  aprobada: "bg-green-100 text-green-800 border-green-200",
  rechazada: "bg-red-100 text-red-800 border-red-200",
  enviada: "bg-blue-100 text-blue-800 border-blue-200",
  en_revision: "bg-yellow-100 text-yellow-800 border-yellow-200",
  preseleccionado: "bg-purple-100 text-purple-800 border-purple-200",
  aceptado: "bg-green-100 text-green-800 border-green-200",
  rechazado: "bg-red-100 text-red-800 border-red-200",
};
