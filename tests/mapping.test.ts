import { describe, expect, it } from "vitest";
import { findUnmappedPlaceholders, resolveMapping } from "@/core/mapping";
import type { CertificateRow, MappingRow } from "@/core/types";

const row: CertificateRow = {
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
  refCode: "K7MPQ2X",
};

const mapping: MappingRow[] = [
  { language: "az", placeholder: "{{EQUIPMENT}}", column: "equipment", format: "text", values: "" },
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
  {
    language: "en",
    placeholder: "{{RESULT}}",
    column: "result",
    format: "enum",
    values: "PASS=CONFORMS;FAIL=DOES NOT CONFORM",
  },
];

const valueOf = (r: ReturnType<typeof resolveMapping>, placeholder: string) =>
  r.values.find((v) => v.placeholder === placeholder)?.value;

describe("resolveMapping", () => {
  it("baza dilində sahələri doldurur", () => {
    const r = resolveMapping(row, mapping, "az");
    expect(r.errors).toEqual([]);
    expect(valueOf(r, "{{EQUIPMENT}}")).toBe("Qüllə kran KB-403");
    expect(valueOf(r, "{{REF}}")).toBe("K7MPQ2X");
  });

  it("enum kodunu dilə uyğun sözə çevirir", () => {
    expect(valueOf(resolveMapping(row, mapping, "az"), "{{RESULT}}")).toBe("UYĞUNDUR");
  });

  it("ingilis dilində eyni kod başqa söz verir", () => {
    expect(valueOf(resolveMapping(row, mapping, "en"), "{{RESULT}}")).toBe("CONFORMS");
  });

  it("FAIL kodu da dilə görə həll olunur", () => {
    const failed = { ...row, result: "FAIL" };
    expect(valueOf(resolveMapping(failed, mapping, "az"), "{{RESULT}}")).toBe("UYĞUN DEYİL");
    expect(valueOf(resolveMapping(failed, mapping, "en"), "{{RESULT}}")).toBe("DOES NOT CONFORM");
  });

  it("ingilis sətri olmayan yer tutucu baza dilindən götürülür", () => {
    const r = resolveMapping(row, mapping, "en");
    expect(r.errors).toEqual([]);
    expect(valueOf(r, "{{EQUIPMENT}}")).toBe("Qüllə kran KB-403");
  });

  it("QR sətri işarələnir, dəyəri sonra doldurulur", () => {
    const r = resolveMapping(row, mapping, "az");
    const qr = r.values.find((v) => v.isQr);
    expect(qr?.placeholder).toBe("{{QR}}");
    expect(qr?.value).toBe("");
  });

  it("tarixi olduğu kimi qaytarır", () => {
    expect(valueOf(resolveMapping(row, mapping, "az"), "{{TEST_DATE}}")).toBe("14.09.2026");
  });

  it("pozuq tarixi xəta kimi bildirir", () => {
    const bad = { ...row, testDate: "31.02.2026" };
    const r = resolveMapping(bad, mapping, "az");
    expect(r.errors).toContainEqual({ kind: "bad_date", placeholder: "{{TEST_DATE}}" });
  });

  it("naməlum sütun adını xəta kimi bildirir", () => {
    const broken: MappingRow[] = [
      { language: "az", placeholder: "{{X}}", column: "yoxdur", format: "text", values: "" },
    ];
    const r = resolveMapping(row, broken, "az");
    expect(r.errors).toContainEqual({
      kind: "unknown_column",
      placeholder: "{{X}}",
      column: "yoxdur",
    });
  });

  it("enum siyahısında olmayan dəyəri xəta kimi bildirir", () => {
    const weird = { ...row, result: "MAYBE" };
    const r = resolveMapping(weird, mapping, "az");
    expect(r.errors).toContainEqual({
      kind: "unknown_enum_value",
      placeholder: "{{RESULT}}",
      value: "MAYBE",
    });
  });

  it("eşləmə cədvəli boşdursa xəta verir", () => {
    const r = resolveMapping(row, [], "az");
    expect(r.errors).toContainEqual({ kind: "empty_mapping" });
  });
});

describe("findUnmappedPlaceholders", () => {
  it("şablonda qalan, eşlənməmiş yer tutucunu tapır", () => {
    const resolved = resolveMapping(row, mapping, "az").values;
    const left = findUnmappedPlaceholders(
      ["{{EQUIPMENT}}", "{{REF}}", "{{INSPECTOR}}"],
      resolved,
    );
    expect(left).toEqual(["{{INSPECTOR}}"]);
  });

  it("hamısı eşlənibsə boş qaytarır", () => {
    const resolved = resolveMapping(row, mapping, "az").values;
    expect(findUnmappedPlaceholders(["{{EQUIPMENT}}", "{{QR}}"], resolved)).toEqual([]);
  });
});
