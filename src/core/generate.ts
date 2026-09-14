import { generateCode } from "./code";
import { findUnmappedPlaceholders, resolveMapping } from "./mapping";
import { fileName, folderName } from "./naming";
import { buildQrPayload } from "./qr";
import { validateRow } from "./validate";
import type { GenerateDeps } from "./ports";
import type { CertificateRow } from "./types";

export type GenerateOutcome =
  | { kind: "done"; code: string; folderUrl: string; pdfUrl: string }
  | { kind: "failed"; message: string };

/** Səhv mesajlarını insanın oxuya biləcəyi hala gətirir. */
const describeValidation = (row: CertificateRow): string | null => {
  const errors = validateRow(row);
  if (errors.length === 0) return null;
  return errors
    .map((e) => {
      switch (e.kind) {
        case "missing_field":
          return `boş sahə: ${e.field}`;
        case "bad_date":
          return `tarix formatı yanlış: ${e.field}`;
        case "next_before_test":
          return "növbəti müayinə tarixi test tarixindən sonra olmalıdır";
        case "bad_result":
          return "nəticə PASS və ya FAIL olmalıdır";
      }
    })
    .join("; ");
};

/**
 * Bir sətri sertifikat dəstinə çevirir.
 *
 * Bir prinsip: **yarımçıq sənəd üretilmir.** Hər hansı addım pozularsa,
 * o ana qədər yaradılmış fayllar silinir, qovluq heç açılmır və səhv
 * cədvəldə görünür.
 *
 * Qovluq qəsdən ən sonda açılır — yarımçıq dolu sertifikat qovluğu
 * təhlükəlidir, oradan səhv fayl göndərilə bilər.
 */
export const generateCertificate = (
  deps: GenerateDeps,
  row: CertificateRow,
  rowNumber: number,
): GenerateOutcome => {
  const { sheet, doc, drive, qr, now, random } = deps;

  const fail = (message: string): GenerateOutcome => {
    sheet.writeBack(rowNumber, { status: "Xəta", error: message });
    return { kind: "failed", message };
  };

  // ① Doğrulama
  const validationError = describeValidation(row);
  if (validationError) return fail(validationError);

  // ② Şablon
  const template = sheet.templates().find((t) => t.language === row.language);
  if (!template) return fail(`«${row.language}» dili üçün şablon təyin olunmayıb`);

  // ③ Eşləmə
  const mapping = sheet.mapping();
  const resolved = resolveMapping(row, mapping, row.language);
  if (resolved.errors.length > 0) {
    return fail(
      resolved.errors
        .map((e) => {
          switch (e.kind) {
            case "empty_mapping":
              return "eşləmə cədvəli boşdur";
            case "unknown_column":
              return `${e.placeholder} üçün naməlum sütun: ${e.column}`;
            case "unknown_enum_value":
              return `${e.placeholder} üçün naməlum dəyər: ${e.value}`;
            case "bad_date":
              return `${e.placeholder} üçün tarix oxunmadı`;
          }
        })
        .join("; "),
    );
  }

  // ④ Şablonda eşlənməmiş yer tutucu qalıbmı — fayl yaratmadan ƏVVƏL yoxlanılır
  const unmapped = findUnmappedPlaceholders(
    doc.listPlaceholders(template.docId),
    resolved.values,
  );
  if (unmapped.length > 0) {
    return fail(`şablonda eşlənməmiş yer tutucu: ${unmapped.join(", ")}`);
  }

  // ⑤ Kod — sətirdə varsa SAXLANILIR, yenisi üretilmir
  const isNewCode = row.refCode.trim() === "";
  let code: string;
  try {
    code = isNewCode
      ? generateCode(new Set(sheet.journalCodes()), random)
      : row.refCode.trim();
  } catch (error) {
    return fail(error instanceof Error ? error.message : String(error));
  }

  const withCode: CertificateRow = { ...row, refCode: code };
  const created: string[] = [];

  // Hansı mərhələdə olduğumuz izlənilir ki, nasazlıq halında cədvəldəki
  // mesaj yerini göstərsin — istehsalda xətanı tapmağın ən sürətli yolu budur.
  let step = "başlanğıc";

  try {
    // ⑥ Tam versiya: kopyala, doldur, QR, PDF
    step = "şablon kopyalanarkən";
    const fullDocId = doc.copy(template.docId, fileName(code, row.equipment, "full", "doc"));
    created.push(fullDocId);

    step = "QR alınarkən";
    const qrImage = qr.render(buildQrPayload(withCode));

    step = "yer tutucular doldurularkən";
    for (const value of resolveMapping(withCode, mapping, row.language).values) {
      if (value.isQr) doc.insertImage(fullDocId, value.placeholder, qrImage);
      else doc.replaceText(fullDocId, value.placeholder, value.value);
    }

    step = "tam PDF alınarkən";
    const fullPdfId = doc.exportPdf(fullDocId, fileName(code, row.equipment, "full", "pdf"));
    created.push(fullPdfId);

    // ⑦ Qısa versiya: kopyanın kopyası, kəs, PDF
    step = "qısa versiya kopyalanarkən";
    const shortDocId = doc.copy(fullDocId, fileName(code, row.equipment, "short", "doc"));
    created.push(shortDocId);
    step = "qısa versiya kəsilərkən";
    doc.truncateAfterPageBreak(shortDocId, template.shortVersionBreaks);
    step = "qısa PDF alınarkən";
    const shortPdfId = doc.exportPdf(shortDocId, fileName(code, row.equipment, "short", "pdf"));
    created.push(shortPdfId);

    // ⑧ Qovluq ƏN SONDA
    step = "qovluq açılarkən";
    const folderId = drive.createFolder(folderName(code, row.equipment));
    for (const fileId of created) drive.move(fileId, folderId);

    // ⑨ Geri yazma
    step = "cədvələ geri yazılarkən";
    const issuedAt = now();
    if (isNewCode) {
      sheet.appendJournal({ code, rowNumber, issuedAt, folderId });
    }
    const folderUrl = drive.url(folderId);
    const pdfUrl = drive.url(fullPdfId);
    sheet.writeBack(rowNumber, {
      status: "Verilib",
      refCode: code,
      folderUrl,
      pdfUrl,
      issuedAt,
    });

    return { kind: "done", code, folderUrl, pdfUrl };
  } catch (error) {
    // Yarımçıq qalmış nə varsa silinir — qovluq onsuz da açılmayıb.
    for (const fileId of created) {
      try {
        doc.remove(fileId);
      } catch {
        // təmizləmə uğursuz olsa da əsas səhvi gizlətmirik
      }
    }
    const detail = error instanceof Error ? error.message : String(error);
    return fail(`${step}: ${detail}`);
  }
};
