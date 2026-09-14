import { REQUIRED_FIELDS, type CertificateRow, type ValidationError } from "./types";

const DATE_RE = /^(\d{2})\.(\d{2})\.(\d{4})$/;

/**
 * `dd.MM.yyyy` mətnini tarixə çevirir. Forma səhvdirsə və ya təqvimdə belə gün
 * yoxdursa (31.02 kimi) null qaytarır.
 *
 * UTC işlədilir: yerli saat qurşağı sərhəd günlərdə tarixi sürüşdürə bilər.
 */
export const parseDate = (value: string): Date | null => {
  const m = DATE_RE.exec(value.trim());
  if (!m) return null;
  const [, dd, mm, yyyy] = m;
  const day = Number(dd);
  const month = Number(mm);
  const year = Number(yyyy);
  const d = new Date(Date.UTC(year, month - 1, day));
  // Təqvimdə olmayan gün normallaşdırılır — geri yoxlayırıq.
  if (
    d.getUTCFullYear() !== year ||
    d.getUTCMonth() !== month - 1 ||
    d.getUTCDate() !== day
  ) {
    return null;
  }
  return d;
};

/**
 * Sətri yoxlayır. Tapılan bütün səhvləri qaytarır — ilk səhvdə dayanmır ki,
 * istifadəçi hamısını bir dəfəyə görsün.
 */
export const validateRow = (row: CertificateRow): ValidationError[] => {
  const errors: ValidationError[] = [];

  for (const field of REQUIRED_FIELDS) {
    if (String(row[field] ?? "").trim() === "") {
      errors.push({ kind: "missing_field", field });
    }
  }
  // Boş sahə varsa tarix və nəticə yoxlaması mənasızdır.
  if (errors.length > 0) return errors;

  if (row.result !== "PASS" && row.result !== "FAIL") {
    errors.push({ kind: "bad_result" });
  }

  const test = parseDate(row.testDate);
  const next = parseDate(row.nextDate);
  if (!test) errors.push({ kind: "bad_date", field: "testDate" });
  if (!next) errors.push({ kind: "bad_date", field: "nextDate" });

  // Növbəti müayinə test tarixindən sonra olmalıdır; eyni gün də qəbul edilmir.
  if (test && next && next.getTime() <= test.getTime()) {
    errors.push({ kind: "next_before_test" });
  }

  return errors;
};
