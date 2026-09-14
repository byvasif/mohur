import { describe, expect, it } from "vitest";
import { MAX_EQUIPMENT_IN_NAME, fileName, folderName, sanitizeName } from "@/core/naming";

describe("sanitizeName", () => {
  it("Drive-da problem yaradan simvolları atır", () => {
    expect(sanitizeName('a/b\\c:d*e?f"g<h>i|j')).toBe("abcdefghij");
  });

  it("boşluğa və tireyə TOXUNMUR — avadanlıq adının hissəsidir", () => {
    expect(sanitizeName("Qüllə kran KB-403")).toBe("Qüllə kran KB-403");
  });

  it("ardıcıl boşluqları birləşdirir və kənarları kəsir", () => {
    expect(sanitizeName("  Qüllə   kran  ")).toBe("Qüllə kran");
  });

  it("Azərbaycan hərflərinə toxunmur", () => {
    expect(sanitizeName("Şəki Çöl Ğüzər İıÖö")).toBe("Şəki Çöl Ğüzər İıÖö");
  });

  it("çox uzun adı kəsir", () => {
    expect(sanitizeName("A".repeat(200)).length).toBe(MAX_EQUIPMENT_IN_NAME);
  });

  it("tamamilə yararsız ad üçün ehtiyat mətn qaytarır", () => {
    expect(sanitizeName("///")).toBe("adsız");
  });
});

describe("folderName", () => {
  it("kod və avadanlıqdan qurulur", () => {
    expect(folderName("K7MPQ2X", "Qüllə kran KB-403")).toBe("K7MPQ2X — Qüllə kran KB-403");
  });
});

describe("fileName", () => {
  it("tam versiyanın Doc və PDF adları", () => {
    expect(fileName("K7MPQ2X", "Kran", "full", "doc")).toBe("K7MPQ2X — Kran (tam)");
    expect(fileName("K7MPQ2X", "Kran", "full", "pdf")).toBe("K7MPQ2X — Kran (tam).pdf");
  });

  it("qısa versiyanın adları", () => {
    expect(fileName("K7MPQ2X", "Kran", "short", "doc")).toBe("K7MPQ2X — Kran (qısa)");
    expect(fileName("K7MPQ2X", "Kran", "short", "pdf")).toBe("K7MPQ2X — Kran (qısa).pdf");
  });

  it("dörd faylın adı bir-birindən fərqlidir", () => {
    const names = new Set([
      fileName("K7MPQ2X", "Kran", "full", "doc"),
      fileName("K7MPQ2X", "Kran", "full", "pdf"),
      fileName("K7MPQ2X", "Kran", "short", "doc"),
      fileName("K7MPQ2X", "Kran", "short", "pdf"),
    ]);
    expect(names.size).toBe(4);
  });
});
