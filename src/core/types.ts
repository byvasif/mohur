/**
 * Bütün domen tipləri. Bu qat Google API-si görmür — yalnız sadə dəyərlər.
 *
 * Ad qaydası: identifikatorlar ingiliscə, şərhlər azərbaycanca.
 * Məftil (sheet) dəyərləri ASCII-dir: PASS, FAIL, text, date, enum, qr.
 */

/** Cədvəldəki bir sertifikat sətri. */
export interface CertificateRow {
  status: string;
  language: string;
  equipment: string;
  serial: string;
  manufacturer: string;
  company: string;
  /** dd.MM.yyyy */
  testDate: string;
  /** dd.MM.yyyy */
  nextDate: string;
  inspector: string;
  /** PASS və ya FAIL — söz deyil, kod. Görünən söz dilə görə həll olunur. */
  result: string;
  /** Boş ola bilər; doludursa sertifikat artıq nömrələnib. */
  refCode: string;
}

/** İnsanın doldurduğu məcburi sahələr. Sistem yazdıqları bura daxil deyil. */
export const REQUIRED_FIELDS = [
  "language",
  "equipment",
  "serial",
  "manufacturer",
  "company",
  "testDate",
  "nextDate",
  "inspector",
  "result",
] as const satisfies readonly (keyof CertificateRow)[];

/** `Eşləmə` cədvəlinin bir sətri. */
export interface MappingRow {
  language: string;
  placeholder: string;
  /** CertificateRow sahəsinin adı; `qr` formatında boş olur. */
  column: string;
  format: "text" | "date" | "enum" | "qr";
  /** Yalnız enum üçün: `PASS=UYĞUNDUR;FAIL=UYĞUN DEYİL` */
  values: string;
}

/** `Şablonlar` cədvəlinin bir sətri. */
export interface TemplateRow {
  language: string;
  docId: string;
  /** Qısa versiya neçənci səhifə sonunda kəsilir. */
  shortVersionBreaks: number;
}

/** Doğrulama nəticəsi. Boş massiv = səhv yoxdur. */
export type ValidationError =
  | { kind: "missing_field"; field: string }
  | { kind: "bad_date"; field: string }
  | { kind: "next_before_test" }
  | { kind: "bad_result" };
