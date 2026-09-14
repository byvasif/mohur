import { parseDate } from "./validate";
import type { CertificateRow, MappingRow } from "./types";

/**
 * Baza dili. `Eşləmə` cədvəlində hər yer tutucu üçün baza sətri yazılır;
 * digər dillərdə yalnız FƏRQLƏNƏNLƏR yazılır və bazanın üstünə yazılır.
 * Beləliklə yeni dil əlavə etmək bütün sətirləri təkrarlamağı tələb etmir.
 */
export const BASE_LANGUAGE = "az";

export interface ResolvedPlaceholder {
  placeholder: string;
  value: string;
  /** QR yer tutucusu — dəyəri şəkil kimi sonra doldurulur. */
  isQr: boolean;
}

export type MappingError =
  | { kind: "empty_mapping" }
  | { kind: "unknown_column"; placeholder: string; column: string }
  | { kind: "unknown_enum_value"; placeholder: string; value: string }
  | { kind: "bad_date"; placeholder: string };

export interface ResolveResult {
  values: ResolvedPlaceholder[];
  errors: MappingError[];
}

/** `PASS=UYĞUNDUR;FAIL=UYĞUN DEYİL` → Map */
const parseEnumValues = (raw: string): Map<string, string> => {
  const map = new Map<string, string>();
  for (const pair of raw.split(";")) {
    const index = pair.indexOf("=");
    if (index === -1) continue;
    const key = pair.slice(0, index).trim();
    const value = pair.slice(index + 1).trim();
    if (key !== "") map.set(key, value);
  }
  return map;
};

/**
 * Baza sətirlərinin üstünə istənilən dilin sətirlərini yazır.
 * Nəticə: hər yer tutucu üçün bir sətir.
 */
const effectiveRows = (mapping: MappingRow[], language: string): MappingRow[] => {
  const byPlaceholder = new Map<string, MappingRow>();
  for (const r of mapping) {
    if (r.language === BASE_LANGUAGE) byPlaceholder.set(r.placeholder, r);
  }
  if (language !== BASE_LANGUAGE) {
    for (const r of mapping) {
      if (r.language === language) byPlaceholder.set(r.placeholder, r);
    }
  }
  return [...byPlaceholder.values()];
};

/**
 * Sətri və eşləmə cədvəlini birləşdirib doldurulacaq dəyərləri hazırlayır.
 *
 * Bütün səhvləri toplayır — ilk səhvdə dayanmır ki, istifadəçi hamısını bir
 * dəfəyə görsün. Səhv varsa sertifikat ümumiyyətlə üretilmir.
 */
export const resolveMapping = (
  row: CertificateRow,
  mapping: MappingRow[],
  language: string,
): ResolveResult => {
  const rows = effectiveRows(mapping, language);
  if (rows.length === 0) {
    return { values: [], errors: [{ kind: "empty_mapping" }] };
  }

  const values: ResolvedPlaceholder[] = [];
  const errors: MappingError[] = [];

  for (const r of rows) {
    if (r.format === "qr") {
      values.push({ placeholder: r.placeholder, value: "", isQr: true });
      continue;
    }

    if (!(r.column in row)) {
      errors.push({ kind: "unknown_column", placeholder: r.placeholder, column: r.column });
      continue;
    }
    const raw = String(row[r.column as keyof CertificateRow] ?? "").trim();

    if (r.format === "date") {
      if (!parseDate(raw)) {
        errors.push({ kind: "bad_date", placeholder: r.placeholder });
        continue;
      }
      values.push({ placeholder: r.placeholder, value: raw, isQr: false });
      continue;
    }

    if (r.format === "enum") {
      const word = parseEnumValues(r.values).get(raw);
      if (word === undefined) {
        errors.push({ kind: "unknown_enum_value", placeholder: r.placeholder, value: raw });
        continue;
      }
      values.push({ placeholder: r.placeholder, value: word, isQr: false });
      continue;
    }

    values.push({ placeholder: r.placeholder, value: raw, isQr: false });
  }

  return { values, errors };
};

/**
 * Şablonda qalıb eşlənməmiş yer tutucuları tapır.
 *
 * Bu yoxlama olmasa, üzərində «{{INSPECTOR}}» yazan sertifikat üretilərdi.
 * Yarımçıq doldurulmuş rəsmi sənəd, heç üretilməyən sənəddən pisdir.
 */
export const findUnmappedPlaceholders = (
  templatePlaceholders: string[],
  resolved: ResolvedPlaceholder[],
): string[] => {
  const known = new Set(resolved.map((v) => v.placeholder));
  return templatePlaceholders.filter((p) => !known.has(p));
};
