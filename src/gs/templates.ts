import { SHEETS } from "./sheet";

/**
 * Şablon sənədlərinin koda görə qurulması.
 *
 * Səhifə sonları burada proqramla qoyulur. Əl ilə qoymaq ən çox səhv çıxan
 * yerdir: Enter ilə buraxılan boşluq səhifə sonu deyil və qısa versiya
 * kəsilməz. Kod `appendPageBreak()` işlətdiyi üçün işarə həmişə doğru düşür.
 */

interface Strings {
  docName: string;
  title: string;
  certNo: string;
  equipment: string;
  serial: string;
  manufacturer: string;
  client: string;
  testDate: string;
  nextDate: string;
  resultsTitle: string;
  tableHead: string[];
  tableRows: string[];
  overall: string;
  inspectedBy: string;
  signature: string;
  date: string;
  stamp: string;
  observationsTitle: string;
  observations: string;
  photos: string;
  recommendations: string;
  conditionsTitle: string;
  standards: string;
  scope: string;
  scopeText: string;
  limits: string;
  limitLines: string[];
  qrNote: string;
}

const AZ: Strings = {
  docName: "Möhür şablon — az",
  title: "AVADANLIĞIN TEXNİKİ MÜAYİNƏ SERTİFİKATI",
  certNo: "SERTİFİKAT №",
  equipment: "Avadanlıq",
  serial: "Seriya nömrəsi",
  manufacturer: "İstehsalçı",
  client: "Sifarişçi",
  testDate: "Müayinə tarixi",
  nextDate: "Növbəti müayinə",
  resultsTitle: "MÜAYİNƏ NƏTİCƏLƏRİ",
  tableHead: ["Yoxlanılan", "Standart", "Ölçülən", "Hədd", "Nəticə"],
  tableRows: [
    "Yük qaldırma qabiliyyəti",
    "Əyləc sistemi",
    "Polad kanat və qarmaq",
    "Elektrik təchizatı",
    "Qoruyucu qurğular",
  ],
  overall: "Ümumi nəticə",
  inspectedBy: "Müayinəni apardı",
  signature: "İmza",
  date: "Tarix",
  stamp: "[MÖHÜR YERİ]",
  observationsTitle: "MÜŞAHİDƏLƏR VƏ QEYDLƏR",
  observations: "Müşahidələr:",
  photos: "Şəkillər:",
  recommendations: "Tövsiyələr:",
  conditionsTitle: "TƏTBİQ OLUNAN STANDARTLAR VƏ ŞƏRTLƏR",
  standards: "Tətbiq olunan standartlar:",
  scope: "Müayinənin əhatəsi:",
  scopeText:
    "Bu sertifikat yalnız {{TEST_DATE}} tarixində, müayinə anındakı vəziyyəti əks etdirir.",
  limits: "Məhdudiyyətlər:",
  limitLines: [
    "Sertifikat {{NEXT_DATE}} tarixinə qədər etibarlıdır.",
    "Avadanlıqda konstruktiv dəyişiklik edilərsə sertifikat qüvvədən düşür.",
    "Sertifikat istismar qaydalarına riayət olunmasını zəmanət etmir.",
  ],
  qrNote: "Bu sənəd elektron üsulla üredilib. QR kodu oxudaraq yoxlaya bilərsiniz.",
};

const EN: Strings = {
  docName: "Möhür şablon — en",
  title: "EQUIPMENT INSPECTION CERTIFICATE",
  certNo: "CERTIFICATE No.",
  equipment: "Equipment",
  serial: "Serial number",
  manufacturer: "Manufacturer",
  client: "Client",
  testDate: "Date of inspection",
  nextDate: "Next inspection due",
  resultsTitle: "INSPECTION RESULTS",
  tableHead: ["Item checked", "Standard", "Measured", "Limit", "Result"],
  tableRows: [
    "Lifting capacity",
    "Braking system",
    "Wire rope and hook",
    "Electrical supply",
    "Safety devices",
  ],
  overall: "Overall result",
  inspectedBy: "Inspection carried out by",
  signature: "Signature",
  date: "Date",
  stamp: "[STAMP]",
  observationsTitle: "OBSERVATIONS AND NOTES",
  observations: "Observations:",
  photos: "Photographs:",
  recommendations: "Recommendations:",
  conditionsTitle: "STANDARDS APPLIED AND CONDITIONS",
  standards: "Standards applied:",
  scope: "Scope of inspection:",
  scopeText:
    "This certificate reflects the condition of the equipment as observed on {{TEST_DATE}} only.",
  limits: "Limitations:",
  limitLines: [
    "This certificate is valid until {{NEXT_DATE}}.",
    "Any structural modification to the equipment voids this certificate.",
    "This certificate does not warrant compliance with operating procedures.",
  ],
  qrNote: "This document was generated electronically. Scan the QR code to verify it.",
};

const ACCENT = "#1f6f5c";
const MUTED = "#6b7770";

type Body = GoogleAppsScript.Document.Body;
type Paragraph = GoogleAppsScript.Document.Paragraph;

interface TextStyle {
  size?: number;
  bold?: boolean;
  color?: string;
  font?: string;
}

/**
 * Mətn biçimi HƏMİŞƏ editAsText() üzərindən verilir.
 * Paragraph-ın özündə setFontSize yoxdur — birbaşa çağırsan işləməz.
 */
const style = (paragraph: Paragraph, options: TextStyle): Paragraph => {
  const text = paragraph.editAsText();
  if (options.size !== undefined) text.setFontSize(options.size);
  if (options.bold !== undefined) text.setBold(options.bold);
  if (options.color !== undefined) text.setForegroundColor(options.color);
  if (options.font !== undefined) text.setFontFamily(options.font);
  return paragraph;
};

const label = (body: Body, text: string) =>
  style(body.appendParagraph(text), { size: 9, color: MUTED, bold: false });

const field = (body: Body, name: string, placeholder: string) =>
  style(body.appendParagraph(`${name}:  ${placeholder}`), { size: 11, color: "#16202b" });

const rule = (body: Body) => {
  body.appendHorizontalRule();
};

/** Bir dil üçün dörd səhifəlik şablon qurur və Doc ID-ni qaytarır. */
const buildTemplate = (s: Strings): string => {
  const doc = DocumentApp.create(s.docName);
  const body = doc.getBody();
  body.clear();

  // ---------- Səhifə 1 ----------
  label(body, s.certNo);
  const ref = body.appendParagraph("{{REF}}");
  style(ref, { size: 20, font: "Roboto Mono", bold: true });
  rule(body);

  const title = body.appendParagraph(s.title);
  title.setHeading(DocumentApp.ParagraphHeading.HEADING1);
  style(title, { size: 18 });

  body.appendParagraph("");
  field(body, s.equipment, "{{EQUIPMENT}}");
  field(body, s.serial, "{{SERIAL}}");
  field(body, s.manufacturer, "{{MANUFACTURER}}");
  field(body, s.client, "{{COMPANY}}");
  body.appendParagraph("");

  const result = body.appendParagraph("{{RESULT}}");
  style(result, { size: 26, bold: true, color: ACCENT });
  result.setAlignment(DocumentApp.HorizontalAlignment.CENTER);

  body.appendParagraph("");
  field(body, s.testDate, "{{TEST_DATE}}");
  field(body, s.nextDate, "{{NEXT_DATE}}");
  rule(body);

  // QR öz abzasında TƏK durur — sistem bu abzasın mətnini silib şəkil qoyur.
  body.appendParagraph("{{QR}}").setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  label(body, s.qrNote).setAlignment(DocumentApp.HorizontalAlignment.CENTER);

  body.appendPageBreak();

  // ---------- Səhifə 2 ----------
  const h2 = body.appendParagraph(s.resultsTitle);
  h2.setHeading(DocumentApp.ParagraphHeading.HEADING2);
  label(body, `${s.certNo} {{REF}}`);
  rule(body);

  const cells = [s.tableHead, ...s.tableRows.map((name) => [name, "", "", "", ""])];
  const table = body.appendTable(cells);
  const head = table.getRow(0);
  for (let i = 0; i < head.getNumCells(); i++) head.getCell(i).editAsText().setBold(true);

  body.appendParagraph("");
  const overall = body.appendParagraph(`${s.overall}:  {{RESULT}}`);
  style(overall, { size: 13, bold: true });

  body.appendParagraph("");
  rule(body);
  label(body, s.inspectedBy);
  style(body.appendParagraph("{{INSPECTOR}}"), { size: 12, bold: true });
  body.appendParagraph(`${s.signature}: ______________________     ${s.date}: {{TEST_DATE}}`);
  body.appendParagraph("");
  label(body, s.stamp);

  body.appendPageBreak();

  // ---------- Səhifə 3 ----------
  body.appendParagraph(s.observationsTitle).setHeading(DocumentApp.ParagraphHeading.HEADING2);
  label(body, `${s.certNo} {{REF}}`);
  rule(body);
  field(body, s.equipment, "{{EQUIPMENT}}  ({{SERIAL}})");
  body.appendParagraph("");
  label(body, s.observations);
  body.appendParagraph("");
  body.appendParagraph("");
  label(body, s.photos);
  body.appendParagraph("");
  body.appendParagraph("");
  label(body, s.recommendations);

  body.appendPageBreak();

  // ---------- Səhifə 4 ----------
  body.appendParagraph(s.conditionsTitle).setHeading(DocumentApp.ParagraphHeading.HEADING2);
  label(body, `${s.certNo} {{REF}}`);
  rule(body);
  label(body, s.standards);
  for (let i = 0; i < 3; i++) body.appendListItem("").setGlyphType(DocumentApp.GlyphType.BULLET);
  body.appendParagraph("");
  label(body, s.scope);
  body.appendParagraph(s.scopeText);
  body.appendParagraph("");
  label(body, s.limits);
  for (const line of s.limitLines) {
    body.appendListItem(line).setGlyphType(DocumentApp.GlyphType.BULLET);
  }
  body.appendParagraph("");
  field(body, s.client, "{{COMPANY}}");
  field(body, s.certNo, "{{REF}}");

  doc.saveAndClose();
  return doc.getId();
};

/**
 * Hər iki şablonu qurur və ID-lərini `Şablonlar` sekməsinə yazır.
 * Təkrar çağırılsa YENİ sənədlər yaradır — köhnələri əl ilə silmək lazımdır.
 */
export const createTemplates = (): string[] => {
  const sheet = SpreadsheetApp.getActive().getSheetByName(SHEETS.templates);
  if (!sheet) throw new Error(`«${SHEETS.templates}» sekməsi tapılmadı — əvvəlcə setup işə salın`);

  const built: string[] = [];
  const rows = sheet.getDataRange().getValues();

  for (const [language, strings] of [
    ["az", AZ],
    ["en", EN],
  ] as const) {
    const id = buildTemplate(strings);
    built.push(`${language}: ${strings.docName}`);

    for (let i = 1; i < rows.length; i++) {
      if (String(rows[i]?.[0] ?? "").trim() === language) {
        sheet.getRange(i + 1, 2).setValue(id);
        break;
      }
    }
  }

  return built;
};
