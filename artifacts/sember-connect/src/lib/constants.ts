export const OPPORTUNITY_TYPES = [
  { value: "internship", label: "Pasantía" },
  { value: "empleo", label: "Empleo" },
  { value: "beca", label: "Beca" },
  { value: "bootcamp", label: "Bootcamp" },
  { value: "evento", label: "Evento" },
  { value: "movilidad", label: "Movilidad Académica" },
  { value: "convocatoria", label: "Convocatoria" },
];

export const ORGANIZATION_TYPES = [
  { value: "universidad", label: "Universidad" },
  { value: "empresa", label: "Empresa" },
  { value: "gobierno", label: "Gobierno" },
  { value: "ong", label: "ONG" },
  { value: "fundacion", label: "Fundación" },
  { value: "organismo_internacional", label: "Organismo Internacional" },
];

export const MODALITIES = [
  { value: "presencial", label: "Presencial" },
  { value: "remoto", label: "Remoto" },
  { value: "hibrido", label: "Híbrido" },
];

export const STATUS_COLORS: Record<string, string> = {
  activa: "bg-green-100 text-green-800 border-green-200",
  cerrada: "bg-gray-100 text-gray-800 border-gray-200",
  borrador: "bg-yellow-100 text-yellow-800 border-yellow-200",
  pendiente: "bg-yellow-100 text-yellow-800 border-yellow-200",
  aprobada: "bg-green-100 text-green-800 border-green-200",
  rechazada: "bg-red-100 text-red-800 border-red-200",
  enviada: "bg-blue-100 text-blue-800 border-blue-200",
  en_revision: "bg-yellow-100 text-yellow-800 border-yellow-200",
  preseleccionado: "bg-purple-100 text-purple-800 border-purple-200",
  aceptado: "bg-green-100 text-green-800 border-green-200",
  rechazado: "bg-red-100 text-red-800 border-red-200",
};
