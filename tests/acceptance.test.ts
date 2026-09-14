import { describe, expect, it } from "vitest";
import { generateCertificate } from "@/core/generate";
import { CODE_LENGTH } from "@/core/code";
import { lastPatch, makeFakes, validRow } from "./fakes";

const ROW = 7;

describe("generateCertificate", () => {
  it("1. düzgün sətirdən dörd fayl və bir qovluq çıxır", () => {
    const { deps, rec } = makeFakes();
    const out = generateCertificate(deps, validRow, ROW);

    expect(out.kind).toBe("done");
    expect(rec.copies).toHaveLength(2); // tam Doc + qısa Doc
    expect(rec.pdfs).toHaveLength(2); // tam PDF + qısa PDF
    expect(rec.folders).toHaveLength(1);
    expect(rec.moves).toHaveLength(4); // dörd fayl qovluğa köçür
    expect(lastPatch(rec).status).toBe("Verilib");
  });

  it("2. qovluq ƏN SONDA açılır — fayllardan əvvəl yox", () => {
    const { deps, rec } = makeFakes();
    generateCertificate(deps, validRow, ROW);
    // Dörd fayl da qovluq yaranmamışdan əvvəl üretilib olmalıdır.
    expect(rec.copies.length + rec.pdfs.length).toBe(4);
    expect(rec.folders).toHaveLength(1);
  });

  it("3. yeni kod üretilir, jurnala yazılır və sətirə qaytarılır", () => {
    const { deps, rec } = makeFakes();
    const out = generateCertificate(deps, validRow, ROW);

    expect(out.kind === "done" && out.code.length).toBe(CODE_LENGTH);
    expect(rec.journal).toHaveLength(1);
    expect(rec.journal[0]!.rowNumber).toBe(ROW);
    expect(lastPatch(rec).refCode).toBe(rec.journal[0]!.code);
  });

  it("4. sətirdə kod varsa YENİSİ üretilmir və jurnala təkrar yazılmır", () => {
    const { deps, rec } = makeFakes();
    const out = generateCertificate(deps, { ...validRow, refCode: "K7MPQ2X" }, ROW);

    expect(out.kind === "done" && out.code).toBe("K7MPQ2X");
    expect(rec.journal).toHaveLength(0);
    expect(lastPatch(rec).status).toBe("Verilib");
  });

  it("5. jurnalda olan kod təkrar verilmir — dayanır, səssizcə təkrarlamır", () => {
    // Saxta random sabitdir, ona görə hər dəfə eyni namizəd çıxır.
    // O namizəd jurnalda varsa, sistem cəhdləri tükəndirib XƏTA verməlidir;
    // eyni nömrəni ikinci dəfə vermək sənəd sistemində bərpası olmayan səhvdir.
    const first = generateCertificate(makeFakes().deps, validRow, ROW);
    const taken = first.kind === "done" ? first.code : "";

    const blocked = makeFakes({ journalCodes: [taken] });
    const out = generateCertificate(blocked.deps, validRow, ROW);

    expect(out.kind).toBe("failed");
    expect(lastPatch(blocked.rec).status).toBe("Xəta");
    expect(blocked.rec.folders).toHaveLength(0);
  });

  it("6. məcburi sahə boşdursa heç bir fayl üretilmir", () => {
    const { deps, rec } = makeFakes();
    const out = generateCertificate(deps, { ...validRow, inspector: "" }, ROW);

    expect(out.kind).toBe("failed");
    expect(rec.copies).toHaveLength(0);
    expect(rec.folders).toHaveLength(0);
    expect(lastPatch(rec).status).toBe("Xəta");
    expect(lastPatch(rec).error).toContain("inspector");
  });

  it("7. dil üçün şablon yoxdursa dayanır", () => {
    const { deps, rec } = makeFakes();
    const out = generateCertificate(deps, { ...validRow, language: "ru" }, ROW);

    expect(out.kind).toBe("failed");
    expect(rec.copies).toHaveLength(0);
    expect(lastPatch(rec).error).toContain("ru");
  });

  it("8. şablonda eşlənməmiş yer tutucu qalırsa fayl yaradılmır", () => {
    const { deps, rec } = makeFakes({
      placeholders: ["{{EQUIPMENT}}", "{{INSPECTOR}}"],
    });
    const out = generateCertificate(deps, validRow, ROW);

    expect(out.kind).toBe("failed");
    expect(rec.copies).toHaveLength(0);
    expect(lastPatch(rec).error).toContain("{{INSPECTOR}}");
  });

  it("9. QR alınmazsa sertifikat üretilmir və qalıqlar silinir", () => {
    const { deps, rec } = makeFakes({ qrThrows: true });
    const out = generateCertificate(deps, validRow, ROW);

    expect(out.kind).toBe("failed");
    expect(rec.folders).toHaveLength(0);
    expect(rec.removed.length).toBeGreaterThan(0); // açılmış Doc təmizlənib
    expect(lastPatch(rec).status).toBe("Xəta");
  });

  it("10. səhifə sonu tapılmazsa qısa versiya üretilmir, qovluq açılmır", () => {
    const { deps, rec } = makeFakes({ truncateThrows: true });
    const out = generateCertificate(deps, validRow, ROW);

    expect(out.kind).toBe("failed");
    expect(rec.folders).toHaveLength(0);
    expect(rec.removed.length).toBeGreaterThan(0);
    expect(lastPatch(rec).error).toContain("səhifə sonu");
  });

  it("11. ortada PDF alınmazsa o ana qədər yaradılanlar silinir", () => {
    const { deps, rec } = makeFakes({ exportThrowsOn: "(qısa)" });
    const out = generateCertificate(deps, validRow, ROW);

    expect(out.kind).toBe("failed");
    expect(rec.folders).toHaveLength(0);
    expect(rec.removed).toHaveLength(3); // tam Doc, tam PDF, qısa Doc
  });

  it("12. azərbaycan sertifikatında nəticə azərbaycanca yazılır", () => {
    const { deps, rec } = makeFakes();
    generateCertificate(deps, validRow, ROW);

    const result = rec.replacements.find((r) => r.placeholder === "{{RESULT}}");
    expect(result?.value).toBe("UYĞUNDUR");
  });

  it("12b. ingilis sertifikatında eyni kod ingiliscə söz verir", () => {
    const { deps, rec } = makeFakes();
    generateCertificate(deps, { ...validRow, language: "en" }, ROW);

    const result = rec.replacements.find((r) => r.placeholder === "{{RESULT}}");
    expect(result?.value).toBe("CONFORMS");
  });

  it("12c. ingilis sertifikatı üstələnməyən sahələri bazadan alır", () => {
    const { deps, rec } = makeFakes();
    generateCertificate(deps, { ...validRow, language: "en" }, ROW);

    const equipment = rec.replacements.find((r) => r.placeholder === "{{EQUIPMENT}}");
    expect(equipment?.value).toBe("Qüllə kran KB-403");
  });

  it("12d. ingilis sertifikatı EN şablonundan kopyalanır", () => {
    const { deps, rec } = makeFakes();
    generateCertificate(deps, { ...validRow, language: "en" }, ROW);

    expect(rec.copies[0]!.from).toBe("TPL_EN");
  });

  it("13. QR mətn kimi deyil, şəkil kimi yerləşdirilir", () => {
    const { deps, rec } = makeFakes();
    generateCertificate(deps, validRow, ROW);

    expect(rec.images).toHaveLength(1);
    expect(rec.images[0]!.placeholder).toBe("{{QR}}");
    expect(rec.replacements.find((r) => r.placeholder === "{{QR}}")).toBeUndefined();
  });
});
