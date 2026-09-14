import type { JournalEntry, RowPatch, SheetPort } from "@/core/ports";
import { formatDateCell } from "@/core/validate";
import type { CertificateRow, MappingRow, TemplateRow } from "@/core/types";

/** Sekmə adları — cədvəldə məhz belə adlanmalıdır. */
export const SHEETS = {
  data: "Sertifikatlar",
  templates: "Şablonlar",
  mapping: "Eşləmə",
  journal: "Jurnal",
} as const;

/**
 * Sütun başlığı → `CertificateRow` sahəsi.
 *
 * Sütunlar başlığa görə tapılır, mövqeyə görə yox: aralığa yeni sütun
 * əlavə edilsə sistem pozulmasın.
 */
export const HEADERS: Record<string, keyof CertificateRow> = {
  Status: "status",
  Dil: "language",
  Avadanlıq: "equipment",
  Seriya: "serial",
  İstehsalçı: "manufacturer",
  Sifarişçi: "company",
  "Test tarixi": "testDate",
  "Növbəti müayinə": "nextDate",
  "Müayinə edən": "inspector",
  Nəticə: "result",
  "Referans kodu": "refCode",
};

/** Sistemin geri yazdığı sütunlar. */
export const WRITE_HEADERS = {
  refCode: "Referans kodu",
  status: "Status",
  folderUrl: "Qovluq linki",
  pdfUrl: "PDF linki",
  issuedAt: "Veriliş vaxtı",
  error: "Xəta",
} as const;

type Sheet = GoogleAppsScript.Spreadsheet.Sheet;

const sheetByName = (name: string): Sheet => {
  const sheet = SpreadsheetApp.getActive().getSheetByName(name);
  if (!sheet) throw new Error(`«${name}» sekməsi tapılmadı`);
  return sheet;
};

/** Başlıq sətrini oxuyub başlıq → sütun nömrəsi (1-dən) xəritəsi qurur. */
const headerIndex = (sheet: Sheet): Map<string, number> => {
  const values = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0] ?? [];
  const map = new Map<string, number>();
  values.forEach((value, i) => {
    const key = String(value).trim();
    if (key !== "") map.set(key, i + 1);
  });
  return map;
};

/**
 * Xananı domen mətninə çevirir.
 *
 * Tarix xanaları Date obyekti kimi gəlir — Sheets «14.09.2026» yazısını
 * avtomatik çevirir. Sadə String() burada yanlış nəticə verir.
 */
const cellToString = (value: unknown): string =>
  value instanceof Date ? formatDateCell(value) : String(value ?? "").trim();

/** Cədvəldəki bir sətri `CertificateRow`-a çevirir. */
export const readRow = (rowNumber: number): CertificateRow => {
  const sheet = sheetByName(SHEETS.data);
  const index = headerIndex(sheet);
  const values = sheet.getRange(rowNumber, 1, 1, sheet.getLastColumn()).getValues()[0] ?? [];

  const row = {} as CertificateRow;
  for (const [header, field] of Object.entries(HEADERS)) {
    const column = index.get(header);
    row[field] = column ? cellToString(values[column - 1]) : "";
  }
  return row;
};

/** Tarixi cədvəldə göstərmək üçün `dd.MM.yyyy HH:mm` formatına salır. */
const formatStamp = (date: Date): string =>
  Utilities.formatDate(date, Session.getScriptTimeZone(), "dd.MM.yyyy HH:mm");

export const createSheetPort = (): SheetPort => ({
  templates(): TemplateRow[] {
    const sheet = sheetByName(SHEETS.templates);
    const rows = sheet.getDataRange().getValues().slice(1);
    return rows
      .filter((r) => String(r[0] ?? "").trim() !== "")
      .map((r) => ({
        language: String(r[0]).trim(),
        docId: String(r[1] ?? "").trim(),
        shortVersionBreaks: Number(r[2] ?? 2),
      }));
  },

  mapping(): MappingRow[] {
    const sheet = sheetByName(SHEETS.mapping);
    const rows = sheet.getDataRange().getValues().slice(1);
    return rows
      .filter((r) => String(r[1] ?? "").trim() !== "")
      .map((r) => ({
        language: String(r[0] ?? "").trim(),
        placeholder: String(r[1]).trim(),
        column: String(r[2] ?? "").trim(),
        format: String(r[3] ?? "text").trim() as MappingRow["format"],
        values: String(r[4] ?? "").trim(),
      }));
  },

  journalCodes(): string[] {
    const sheet = sheetByName(SHEETS.journal);
    if (sheet.getLastRow() < 2) return [];
    return sheet
      .getRange(2, 1, sheet.getLastRow() - 1, 1)
      .getValues()
      .map((r) => String(r[0] ?? "").trim())
      .filter((code) => code !== "");
  },

  appendJournal(entry: JournalEntry): void {
    sheetByName(SHEETS.journal).appendRow([
      entry.code,
      entry.rowNumber,
      formatStamp(entry.issuedAt),
      entry.folderId,
    ]);
  },

  writeBack(rowNumber: number, patch: RowPatch): void {
    const sheet = sheetByName(SHEETS.data);
    const index = headerIndex(sheet);
    const put = (header: string, value: string) => {
      const column = index.get(header);
      if (column) sheet.getRange(rowNumber, column).setValue(value);
    };

    put(WRITE_HEADERS.status, patch.status);
    if (patch.refCode !== undefined) put(WRITE_HEADERS.refCode, patch.refCode);
    if (patch.folderUrl !== undefined) put(WRITE_HEADERS.folderUrl, patch.folderUrl);
    if (patch.pdfUrl !== undefined) put(WRITE_HEADERS.pdfUrl, patch.pdfUrl);
    if (patch.issuedAt !== undefined) put(WRITE_HEADERS.issuedAt, formatStamp(patch.issuedAt));
    // Səhv sütunu hər dəfə yazılır: uğurlu keçiddə köhnə mesaj silinməlidir.
    put(WRITE_HEADERS.error, patch.error ?? "");
  },
});
