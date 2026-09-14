import { generateCertificate } from "@/core/generate";
import type { GenerateDeps } from "@/core/ports";
import { bootstrapSheets } from "./bootstrap";
import { createDocPort } from "./doc";
import { createDrivePort, createQrPort } from "./drive";
import { SHEETS, createSheetPort, readRow } from "./sheet";
import { createTemplates } from "./templates";

/** Sistemi işə salan status dəyəri. Digər dəyərlər heç nə etmir. */
const TRIGGER_VALUE = "Hazır";

/** Quraşdırılan tetikleyicinin çağırdığı funksiya adı. */
const HANDLER = "onStatusEdit";

const deps = (): GenerateDeps => ({
  sheet: createSheetPort(),
  doc: createDocPort(),
  drive: createDrivePort(),
  qr: createQrPort(),
  now: () => new Date(),
  random: () => Math.random(),
});

/**
 * Cədvəldə status dəyişəndə işə düşür.
 *
 * DİQQƏT: bu funksiya **quraşdırılan** tetikleyici ilə çağırılmalıdır.
 * Sadə `onEdit` məhdud kontekstdə işləyir — Drive-a yaza bilmir, sənəd aça
 * bilmir, kənara sorğu göndərə bilmir. Üçü də bizə lazımdır.
 * Quraşdırma üçün Apps Script redaktorunda `setup` funksiyasını bir dəfə işə sal.
 */
export function onStatusEdit(event: GoogleAppsScript.Events.SheetsOnEdit): void {
  const range = event.range;
  const sheet = range.getSheet();
  if (sheet.getName() !== SHEETS.data) return;
  if (range.getRow() === 1) return;

  // Yalnız Status sütunundakı dəyişiklik və yalnız «Hazır» dəyəri.
  // «Verilib» və «Xəta» geri yazıldıqda tetikleyici təkrar işə düşmür.
  const header = String(sheet.getRange(1, range.getColumn()).getValue()).trim();
  if (header !== "Status") return;
  if (String(event.value ?? "").trim() !== TRIGGER_VALUE) return;

  const rowNumber = range.getRow();
  const row = readRow(rowNumber);

  try {
    generateCertificate(deps(), row, rowNumber);
  } catch (error) {
    // Buraya yalnız orkestratorun tuta bilmədiyi nasazlıq düşür.
    createSheetPort().writeBack(rowNumber, {
      status: "Xəta",
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Bir dəfə əl ilə işə salınır: sekmələri qurur və tetikleyicini yaradır.
 *
 * Təkrar çağırıla bilər — mövcud sekmələrə toxunmur, tetikleyicinin isə
 * köhnəsini silib yenisini qurur ki, dublikat qalmasın.
 */
export function setup(): void {
  const spreadsheet = SpreadsheetApp.getActive();

  const created = bootstrapSheets();

  for (const trigger of ScriptApp.getProjectTriggers()) {
    if (trigger.getHandlerFunction() === HANDLER) ScriptApp.deleteTrigger(trigger);
  }
  ScriptApp.newTrigger(HANDLER).forSpreadsheet(spreadsheet).onEdit().create();

  const message =
    created.length > 0
      ? `Sekmələr quruldu: ${created.join(", ")}. İndi «Şablonlar» sekməsinə Doc ID-lərini yaz.`
      : "Sekmələr artıq var, toxunulmadı. Tetikleyici yeniləndi.";
  spreadsheet.toast(message, "Möhür", 8);
}

/**
 * Hər iki şablon sənədini qurur və ID-lərini «Şablonlar» sekməsinə yazır.
 *
 * Səhifə sonları proqramla qoyulur — əl ilə qoymaq ən çox səhv çıxan yerdir.
 * Bir dəfə işə salınır; təkrar çağırılsa YENİ sənədlər yaranır.
 */
export function buildTemplates(): void {
  const built = createTemplates();
  SpreadsheetApp.getActive().toast(
    `Şablonlar quruldu — ${built.join(", ")}. ID-lər «Şablonlar» sekməsinə yazıldı.`,
    "Möhür",
    8,
  );
}
