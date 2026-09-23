import { BRAND, WHATSAPP } from "@/config/brand";
// Estructura de los ítems variables del contrato
// Guardados como JSONB en bookings.contract_items

export interface ContractItems {
  // Cantidad (número) — 0 = no aplica, ≥1 = cantidad incluida
  dj:                  string;
  maestro_ceremonia:   string;
  sonido:              string;
  luces:               string;
  pista_baile:         string;
  barman:              string;
  aseo:                string;
  planner:             string;
  estacion_cafe:       string;
  mobiliario:          string;  // auto-fill con guest_count
  pirotecnia:          string;  // NUEVO
  polvora_fria:        string;  // NUEVO
  // Sí/No toggle
  gaseosa_agua:        boolean;
  coctel:              boolean;
  kit_boda:            boolean;
  // Cantidad (por persona / unidades)
  menu:                string;
  pastel:              string;
  mesa_dulces:         string;
  canelazo:            string;  // auto-fill con guest_count
  champana:            string;  // auto-fill con guest_count (copas)
  whisky:              string;
  meseros:             string;
  menaje:              string;  // auto-fill con guest_count
  // Texto libre
  tarjetas_invitacion: string;
}

// Por defecto 1 para servicios estándar siempre incluidos; 0 para cantidades variables
export const DEFAULT_CONTRACT_ITEMS: ContractItems = {
  dj:                  "1",
  maestro_ceremonia:   "1",
  sonido:              "1",
  luces:               "1",
  pista_baile:         "1",
  barman:              "1",
  aseo:                "1",
  planner:             "1",
  estacion_cafe:       "1",
  mobiliario:          "0",
  pirotecnia:          "0",
  polvora_fria:        "0",
  gaseosa_agua:        false,
  coctel:              false,
  kit_boda:            false,
  menu:                "0",
  pastel:              "0",
  mesa_dulces:         "1",
  canelazo:            "0",
  champana:            "0",
  whisky:              "0",
  meseros:             "0",
  menaje:              "0",
  tarjetas_invitacion: "Según cotización",
};

// Convierte datos históricos (booleanos en campos ahora string) al tipo actual
export function coerceContractItems(raw: unknown): ContractItems {
  const result = { ...DEFAULT_CONTRACT_ITEMS };
  if (!raw || typeof raw !== "object") return result;
  const obj = raw as Record<string, unknown>;

  for (const key of Object.keys(result) as (keyof ContractItems)[]) {
    const v = obj[key];
    if (v === undefined || v === null) continue;
    const def = result[key];
    if (typeof def === "string") {
      if (typeof v === "boolean") {
        // campo migrado de boolean → string
        (result as Record<string, unknown>)[key] = v ? "1" : "0";
      } else {
        (result as Record<string, unknown>)[key] = String(v);
      }
    } else {
      // boolean fields (gaseosa_agua, coctel, kit_boda)
      (result as Record<string, unknown>)[key] = Boolean(v);
    }
  }

  return result;
}

// Orden de visualización en formulario y PDF
export const VARIABLE_ITEM_ORDER: (keyof ContractItems)[] = [
  "dj", "maestro_ceremonia",
  "sonido", "luces", "pista_baile",
  "gaseosa_agua", "coctel",
  "barman", "aseo", "planner", "estacion_cafe", "kit_boda", "mobiliario",
  "pirotecnia", "polvora_fria",
  "menu", "pastel", "mesa_dulces", "canelazo", "champana", "whisky",
  "meseros", "menaje", "tarjetas_invitacion",
];

// Etiquetas de los ítems variables
export const VARIABLE_ITEM_LABELS: Record<keyof ContractItems, string> = {
  dj:                  "DJ",
  maestro_ceremonia:   "Maestro de ceremonia",
  sonido:              "Sonido",
  luces:               "Luces",
  pista_baile:         "Pista de baile",
  gaseosa_agua:        "Gaseosa y Agua",
  coctel:              "Cóctel",
  barman:              "Barman",
  aseo:                "Aseo",
  planner:             "Planner",
  estacion_cafe:       "Estación de café",
  kit_boda:            "Kit de boda",
  mobiliario:          "Mobiliario",
  pirotecnia:          "Pirotecnia",
  polvora_fria:        "Pólvora fría",
  menu:                "Menú",
  pastel:              "Pastel",
  mesa_dulces:         "Mesa de dulces",
  canelazo:            "Canelazo",
  champana:            "Champaña (copas)",
  whisky:              "Whisky (botellas)",
  meseros:             "Meseros",
  menaje:              "Menaje",
  tarjetas_invitacion: "Tarjetas de invitación",
};

// Tipo de campo por ítem variable
// sino-fixed-1 → legacy (sin uso activo tras migración)
// sino          → Sí/No toggle booleano
// cantidad      → número entero ≥ 0
// texto         → texto libre
export type ContractFieldType = "sino-fixed-1" | "sino" | "cantidad" | "texto";

export const VARIABLE_ITEM_TYPES: Record<keyof ContractItems, ContractFieldType> = {
  dj:                  "cantidad",
  maestro_ceremonia:   "cantidad",
  sonido:              "cantidad",
  luces:               "cantidad",
  pista_baile:         "cantidad",
  gaseosa_agua:        "sino",
  coctel:              "sino",
  barman:              "cantidad",
  aseo:                "cantidad",
  planner:             "cantidad",
  estacion_cafe:       "cantidad",
  kit_boda:            "sino",
  mobiliario:          "cantidad",
  pirotecnia:          "cantidad",
  polvora_fria:        "cantidad",
  menu:                "cantidad",
  pastel:              "cantidad",
  mesa_dulces:         "cantidad",
  canelazo:            "cantidad",
  champana:            "cantidad",
  whisky:              "cantidad",
  meseros:             "cantidad",
  menaje:              "cantidad",
  tarjetas_invitacion: "texto",
};

// Datos de la hacienda — valores por defecto (hardcoded como fallback)
export const HACIENDA_INFO = {
  nombre:            "HACIENDA EL ENCANTO S.A.S.",
  representante:     "Ana Victoria Marquez Villarreal",
  cc_representante:  "1127661646",
  nit:               "901860912-1",
  direccion:         "Km 5.5, Vía Suba Cota",
  whatsapp:          WHATSAPP.number,
  email:             BRAND.email,
  cuenta_davivienda: "108900524282",
} as const;

// Claves en site_content para datos editables de la hacienda
export const HACIENDA_CONTENT_KEYS: Record<keyof typeof HACIENDA_INFO, string> = {
  nombre:            "hacienda_nombre",
  representante:     "hacienda_representante",
  cc_representante:  "hacienda_cc_representante",
  nit:               "hacienda_nit",
  direccion:         "hacienda_direccion",
  whatsapp:          "hacienda_whatsapp",
  email:             "hacienda_email",
  cuenta_davivienda: "hacienda_cuenta_davivienda",
};

export const HACIENDA_FIELD_LABELS: Record<keyof typeof HACIENDA_INFO, string> = {
  nombre:            "Razón social",
  representante:     "Representante legal",
  cc_representante:  "CC del representante",
  nit:               "NIT",
  direccion:         "Dirección",
  whatsapp:          "WhatsApp (solo dígitos)",
  email:             "Correo electrónico",
  cuenta_davivienda: "Cuenta Davivienda",
};

// Resuelve datos de la hacienda combinando site_content con defaults
export type HaciendaData = { -readonly [K in keyof typeof HACIENDA_INFO]: string };

export function resolveHaciendaData(
  contentMap: Record<string, string | null>
): HaciendaData {
  const keys = Object.keys(HACIENDA_CONTENT_KEYS) as (keyof typeof HACIENDA_INFO)[];
  const result = {} as HaciendaData;
  for (const k of keys) {
    result[k] = contentMap[HACIENDA_CONTENT_KEYS[k]] || HACIENDA_INFO[k];
  }
  return result;
}

// Número de cláusulas base del contrato
export const CONTRATO_CLAUSULAS_COUNT = 20;

export const CLAUSULA_KEYS = Array.from(
  { length: CONTRATO_CLAUSULAS_COUNT },
  (_, i) => `contrato_clausula_${i + 1}` as const
);

export const FIRMA_KEY = "firma_representante" as const;
