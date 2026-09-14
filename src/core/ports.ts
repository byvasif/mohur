import type { MappingRow, TemplateRow } from "./types";

/**
 * Xarici dünyaya açılan qapılar.
 *
 * `core` bu interfeyslərdən başqa heç nə bilmir — nə Apps Script, nə şəbəkə.
 * Həqiqi həyatda `src/gs/` altındakı adaptörlər bunları həyata keçirir,
 * testdə isə saxta obyektlər. Bütün axın buna görə Google hesabı olmadan
 * yoxlanıla bilir.
 */

/** QR şəkli — `core` onun nə olduğunu bilmir və bilməməlidir. */
export type QrImage = unknown;

export interface JournalEntry {
  code: string;
  rowNumber: number;
  issuedAt: Date;
  folderId: string;
}

export interface RowPatch {
  status: string;
  refCode?: string;
  folderUrl?: string;
  pdfUrl?: string;
  issuedAt?: Date;
  error?: string;
}

export interface SheetPort {
  templates(): TemplateRow[];
  mapping(): MappingRow[];
  /** Verilmiş bütün kodlar — təkrarsızlıq buna qarşı yoxlanılır. */
  journalCodes(): string[];
  appendJournal(entry: JournalEntry): void;
  writeBack(rowNumber: number, patch: RowPatch): void;
}

export interface DocPort {
  /** Şablondakı `{{...}}` yer tutucuları — kopyalamadan əvvəl oxunur. */
  listPlaceholders(docId: string): string[];
  copy(docId: string, name: string): string;
  replaceText(docId: string, placeholder: string, value: string): void;
  insertImage(docId: string, placeholder: string, image: QrImage): void;
  /**
   * Verilmiş sayda səhifə sonundan sonrasını silir.
   * İşarə tapılmazsa **xəta atır** — səhv yerdən kəsilmiş sənəd üretilməməlidir.
   */
  truncateAfterPageBreak(docId: string, breakCount: number): void;
  exportPdf(docId: string, name: string): string;
  remove(fileId: string): void;
}

export interface DrivePort {
  createFolder(name: string): string;
  move(fileId: string, folderId: string): void;
  url(fileId: string): string;
}

export interface QrPort {
  /** Alınmazsa xəta atır — QR-sız sertifikat üretilmir. */
  render(payload: string): QrImage;
}

export interface GenerateDeps {
  sheet: SheetPort;
  doc: DocPort;
  drive: DrivePort;
  qr: QrPort;
  now: () => Date;
  random: () => number;
}
