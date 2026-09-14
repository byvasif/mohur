import { generateCertificate } from "@/core/generate";
import type { GenerateDeps } from "@/core/ports";
import { createDocPort } from "./doc";
import { createDrivePort, createQrPort } from "./drive";
import { SHEETS, createSheetPort, readRow } from "./sheet";

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
 * Bir dəfə əl ilə işə salınır: quraşdırılan tetikleyicini yaradır.
 * Təkrar çağırılsa köhnəsi silinib yenisi qurulur — dublikat tetikleyici qalmır.
 */
export function setup(): void {
  const spreadsheet = SpreadsheetApp.getActive();

  for (const trigger of ScriptApp.getProjectTriggers()) {
    if (trigger.getHandlerFunction() === HANDLER) ScriptApp.deleteTrigger(trigger);
  }

  ScriptApp.newTrigger(HANDLER).forSpreadsheet(spreadsheet).onEdit().create();

  SpreadsheetApp.getActive().toast(
    "Tetikleyici quruldu. Status sütununu «Hazır» edin.",
    "Möhür",
    5,
  );
}
