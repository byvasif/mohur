import { SHEETS } from "./sheet";

/**
 * Cədvəlin ilk qurulması.
 *
 * QAYDA: mövcud sekməyə TOXUNMUR. Yalnız olmayanı yaradır. Bu qəsdəndir —
 * `Jurnal` sekməsinin üstündən yazmaq verilmiş sertifikat nömrələrini məhv
 * edərdi və bunun bərpası yoxdur.
 */

/** `Sertifikatlar` sekməsinin sütunları — sıra burada təyin olunur. */
const DATA_HEADERS = [
  "Status",
  "Dil",
  "Avadanlıq",
  "Seriya",
  "İstehsalçı",
  "Sifarişçi",
  "Test tarixi",
  "Növbəti müayinə",
  "Müayinə edən",
  "Nəticə",
  "Referans kodu",
  "Qovluq linki",
  "PDF linki",
  "Veriliş vaxtı",
  "Xəta",
];

const SAMPLE_ROW = [
  "Layihə",
  "az",
  "Qüllə kran KB-403",
  "KB403-11927",
  "Bakı Maşınqayırma",
  "Xəzər Tikinti MMC",
  "14.09.2026",
  "14.09.2027",
  "R. Əliyev",
  "PASS",
  "",
  "",
  "",
  "",
  "",
];

const TEMPLATE_HEADERS = ["Dil", "Şablon Doc ID", "Qısa versiya səhifə sonu"];
const TEMPLATE_ROWS = [
  ["az", "", 2],
  ["en", "", 2],
];

const MAPPING_HEADERS = ["Dil", "Yer tutucu", "Sütun", "Format", "Dəyər əvəzləmə"];
const MAPPING_ROWS = [
  ["az", "{{EQUIPMENT}}", "equipment", "text", ""],
  ["az", "{{SERIAL}}", "serial", "text", ""],
  ["az", "{{MANUFACTURER}}", "manufacturer", "text", ""],
  ["az", "{{COMPANY}}", "company", "text", ""],
  ["az", "{{TEST_DATE}}", "testDate", "date", ""],
  ["az", "{{NEXT_DATE}}", "nextDate", "date", ""],
  ["az", "{{INSPECTOR}}", "inspector", "text", ""],
  ["az", "{{REF}}", "refCode", "text", ""],
  ["az", "{{RESULT}}", "result", "enum", "PASS=UYĞUNDUR;FAIL=UYĞUN DEYİL"],
  ["az", "{{QR}}", "", "qr", ""],
  // İngilis dilində YALNIZ fərqlənən sətir yazılır; qalanı bazadan gəlir.
  ["en", "{{RESULT}}", "result", "enum", "PASS=CONFORMS;FAIL=DOES NOT CONFORM"],
];

const JOURNAL_HEADERS = ["Referans kodu", "Sətir", "Veriliş vaxtı", "Qovluq ID"];

const dropdown = (values: string[]) =>
  SpreadsheetApp.newDataValidation().requireValueInList(values, true).build();

const styleHeader = (sheet: GoogleAppsScript.Spreadsheet.Sheet, count: number) => {
  sheet.getRange(1, 1, 1, count).setFontWeight("bold").setBackground("#eceae5");
  sheet.setFrozenRows(1);
};

/**
 * Olmayan sekmələri yaradır. Yaradılanların adlarını qaytarır ki,
 * istifadəçiyə nə dəyişdiyi deyilə bilsin.
 */
export const bootstrapSheets = (): string[] => {
  const spreadsheet = SpreadsheetApp.getActive();
  const created: string[] = [];

  const ensure = (
    name: string,
    fill: (sheet: GoogleAppsScript.Spreadsheet.Sheet) => void,
  ) => {
    if (spreadsheet.getSheetByName(name)) return;
    const sheet = spreadsheet.insertSheet(name);
    fill(sheet);
    created.push(name);
  };

  ensure(SHEETS.data, (sheet) => {
    sheet.getRange(1, 1, 1, DATA_HEADERS.length).setValues([DATA_HEADERS]);
    styleHeader(sheet, DATA_HEADERS.length);
    sheet.getRange(2, 1, 1, SAMPLE_ROW.length).setValues([SAMPLE_ROW]);

    const column = (header: string) => DATA_HEADERS.indexOf(header) + 1;
    sheet
      .getRange(2, column("Status"), 500)
      .setDataValidation(dropdown(["Layihə", "Hazır", "Verilib", "Xəta"]));
    sheet.getRange(2, column("Dil"), 500).setDataValidation(dropdown(["az", "en"]));
    sheet.getRange(2, column("Nəticə"), 500).setDataValidation(dropdown(["PASS", "FAIL"]));

    // Sistemin yazdığı sütunlar vizual olaraq ayrılır — insan ora yazmamalıdır.
    sheet
      .getRange(1, column("Referans kodu"), 1, 5)
      .setBackground("#dfe7e3")
      .setNote("Bu sütunları sistem doldurur — əl ilə yazma.");

    sheet.setColumnWidths(1, DATA_HEADERS.length, 130);
  });

  ensure(SHEETS.templates, (sheet) => {
    sheet.getRange(1, 1, 1, TEMPLATE_HEADERS.length).setValues([TEMPLATE_HEADERS]);
    styleHeader(sheet, TEMPLATE_HEADERS.length);
    sheet.getRange(2, 1, TEMPLATE_ROWS.length, TEMPLATE_HEADERS.length).setValues(TEMPLATE_ROWS);
    sheet.getRange(2, 2, TEMPLATE_ROWS.length).setNote("Google Docs şablonunun ID-si");
    sheet.setColumnWidths(1, TEMPLATE_HEADERS.length, 200);
  });

  ensure(SHEETS.mapping, (sheet) => {
    sheet.getRange(1, 1, 1, MAPPING_HEADERS.length).setValues([MAPPING_HEADERS]);
    styleHeader(sheet, MAPPING_HEADERS.length);
    sheet.getRange(2, 1, MAPPING_ROWS.length, MAPPING_HEADERS.length).setValues(MAPPING_ROWS);
    sheet.setColumnWidths(1, MAPPING_HEADERS.length, 170);
  });

  ensure(SHEETS.journal, (sheet) => {
    sheet.getRange(1, 1, 1, JOURNAL_HEADERS.length).setValues([JOURNAL_HEADERS]);
    styleHeader(sheet, JOURNAL_HEADERS.length);
    sheet.setColumnWidths(1, JOURNAL_HEADERS.length, 170);
  });

  return created;
};
