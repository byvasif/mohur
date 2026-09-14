import type {
  DocPort,
  DrivePort,
  GenerateDeps,
  JournalEntry,
  QrPort,
  RowPatch,
  SheetPort,
} from "@/core/ports";
import type { CertificateRow, MappingRow, TemplateRow } from "@/core/types";

export const validRow: CertificateRow = {
  status: "Hazır",
  language: "az",
  equipment: "Qüllə kran KB-403",
  serial: "KB403-11927",
  manufacturer: "Bakı Maşınqayırma",
  company: "Xəzər Tikinti MMC",
  testDate: "14.09.2026",
  nextDate: "14.09.2027",
  inspector: "R. Əliyev",
  result: "PASS",
  refCode: "",
};

export const templates: TemplateRow[] = [
  { language: "az", docId: "TPL_AZ", shortVersionBreaks: 2 },
  { language: "en", docId: "TPL_EN", shortVersionBreaks: 2 },
];

export const mapping: MappingRow[] = [
  { language: "az", placeholder: "{{EQUIPMENT}}", column: "equipment", format: "text", values: "" },
  { language: "az", placeholder: "{{MANUFACTURER}}", column: "manufacturer", format: "text", values: "" },
  { language: "az", placeholder: "{{COMPANY}}", column: "company", format: "text", values: "" },
  { language: "az", placeholder: "{{TEST_DATE}}", column: "testDate", format: "date", values: "" },
  { language: "az", placeholder: "{{REF}}", column: "refCode", format: "text", values: "" },
  {
    language: "az",
    placeholder: "{{RESULT}}",
    column: "result",
    format: "enum",
    values: "PASS=UYĞUNDUR;FAIL=UYĞUN DEYİL",
  },
  { language: "az", placeholder: "{{QR}}", column: "", format: "qr", values: "" },
  // İngilis dilində YALNIZ fərqlənən sətir yazılır — qalanı bazadan gəlir.
  {
    language: "en",
    placeholder: "{{RESULT}}",
    column: "result",
    format: "enum",
    values: "PASS=CONFORMS;FAIL=DOES NOT CONFORM",
  },
];

/** Şablonun daxilindəki yer tutucular — eşləmə ilə üst-üstə düşür. */
export const templatePlaceholders = mapping
  .filter((m) => m.language === "az")
  .map((m) => m.placeholder);

export interface Recorded {
  journal: JournalEntry[];
  patches: Array<{ rowNumber: number; patch: RowPatch }>;
  copies: Array<{ from: string; name: string; id: string }>;
  replacements: Array<{ docId: string; placeholder: string; value: string }>;
  images: Array<{ docId: string; placeholder: string }>;
  truncations: Array<{ docId: string; breaks: number }>;
  pdfs: Array<{ docId: string; name: string; id: string }>;
  folders: string[];
  moves: Array<{ fileId: string; folderId: string }>;
  removed: string[];
}

export interface FakeOptions {
  journalCodes?: string[];
  templates?: TemplateRow[];
  mapping?: MappingRow[];
  placeholders?: string[];
  qrThrows?: boolean;
  truncateThrows?: boolean;
  exportThrowsOn?: string;
}

/** Bütün qapıları qeyd edən saxta dünya. */
export const makeFakes = (options: FakeOptions = {}) => {
  const rec: Recorded = {
    journal: [],
    patches: [],
    copies: [],
    replacements: [],
    images: [],
    truncations: [],
    pdfs: [],
    folders: [],
    moves: [],
    removed: [],
  };
  let counter = 0;
  const nextId = (prefix: string) => `${prefix}_${++counter}`;

  const sheet: SheetPort = {
    templates: () => options.templates ?? templates,
    mapping: () => options.mapping ?? mapping,
    journalCodes: () => options.journalCodes ?? [],
    appendJournal: (entry) => void rec.journal.push(entry),
    writeBack: (rowNumber, patch) => void rec.patches.push({ rowNumber, patch }),
  };

  const doc: DocPort = {
    listPlaceholders: () => options.placeholders ?? templatePlaceholders,
    copy: (from, name) => {
      const id = nextId("DOC");
      rec.copies.push({ from, name, id });
      return id;
    },
    replaceText: (docId, placeholder, value) =>
      void rec.replacements.push({ docId, placeholder, value }),
    insertImage: (docId, placeholder) => void rec.images.push({ docId, placeholder }),
    truncateAfterPageBreak: (docId, breaks) => {
      if (options.truncateThrows) throw new Error("ikinci səhifə sonu tapılmadı");
      rec.truncations.push({ docId, breaks });
    },
    exportPdf: (docId, name) => {
      if (options.exportThrowsOn && name.includes(options.exportThrowsOn)) {
        throw new Error("PDF alınmadı");
      }
      const id = nextId("PDF");
      rec.pdfs.push({ docId, name, id });
      return id;
    },
    remove: (fileId) => void rec.removed.push(fileId),
  };

  const drive: DrivePort = {
    createFolder: (name) => {
      const id = nextId("FOLDER");
      rec.folders.push(name);
      return id;
    },
    move: (fileId, folderId) => void rec.moves.push({ fileId, folderId }),
    url: (fileId) => `https://drive.example/${fileId}`,
  };

  const qr: QrPort = {
    render: () => {
      if (options.qrThrows) throw new Error("QR xidməti cavab vermədi");
      return { qr: true };
    },
  };

  const deps: GenerateDeps = {
    sheet,
    doc,
    drive,
    qr,
    now: () => new Date("2026-09-14T12:00:00Z"),
    random: () => 0.5,
  };

  return { deps, rec };
};

/** Son yazılan patch — testlərdə status və səhvi yoxlamaq üçün. */
export const lastPatch = (rec: Recorded) => rec.patches[rec.patches.length - 1]!.patch;
