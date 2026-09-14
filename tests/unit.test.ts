import { describe, expect, it } from "vitest";
import { validateRow } from "@/core/validate";
import type { CertificateRow } from "@/core/types";

const ok: CertificateRow = {
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

describe("validateRow", () => {
  it("düzgün sətri qəbul edir", () => {
    expect(validateRow(ok)).toEqual([]);
  });

  it("boş məcburi sahəni tutur", () => {
    const r = validateRow({ ...ok, equipment: "  " });
    expect(r).toEqual([{ kind: "missing_field", field: "equipment" }]);
  });

  it("bir neçə boş sahənin hamısını qaytarır", () => {
    const r = validateRow({ ...ok, equipment: "", inspector: "" });
    expect(r).toHaveLength(2);
  });

  it("pozuq tarixi tutur", () => {
    const r = validateRow({ ...ok, testDate: "2026-09-14" });
    expect(r).toEqual([{ kind: "bad_date", field: "testDate" }]);
  });

  it("mövcud olmayan tarixi tutur", () => {
    const r = validateRow({ ...ok, testDate: "31.02.2026" });
    expect(r).toEqual([{ kind: "bad_date", field: "testDate" }]);
  });

  it("növbəti müayinə test tarixindən əvvəldirsə tutur", () => {
    const r = validateRow({ ...ok, nextDate: "14.09.2025" });
    expect(r).toEqual([{ kind: "next_before_test" }]);
  });

  it("eyni gün olarsa da tutur — müayinə intervalı sıfır ola bilməz", () => {
    const r = validateRow({ ...ok, nextDate: "14.09.2026" });
    expect(r).toEqual([{ kind: "next_before_test" }]);
  });

  it("naməlum nəticə kodunu tutur", () => {
    const r = validateRow({ ...ok, result: "Uyğundur" });
    expect(r).toEqual([{ kind: "bad_result" }]);
  });
});

import { ALPHABET, CODE_LENGTH, generateCode } from "@/core/code";

/** Verilmiş ardıcıllığı qaytaran saxta təsadüfilik. */
const seq = (...values: number[]) => {
  let i = 0;
  return () => values[i++ % values.length]!;
};

describe("generateCode", () => {
  it("7 simvolluq kod qaytarır", () => {
    expect(generateCode(new Set(), seq(0)).length).toBe(CODE_LENGTH);
  });

  it("yalnız icazə verilən əlifbadan istifadə edir", () => {
    for (let i = 0; i < 200; i++) {
      const code = generateCode(new Set(), Math.random);
      for (const ch of code) expect(ALPHABET).toContain(ch);
    }
  });

  it("qarışdırıla bilən simvollar əlifbada yoxdur", () => {
    for (const ch of ["0", "O", "1", "I", "L", "U"]) {
      expect(ALPHABET).not.toContain(ch);
    }
  });

  it("enjekte edilmiş təsadüfiliklə deterministikdir", () => {
    const a = generateCode(new Set(), seq(0));
    const b = generateCode(new Set(), seq(0));
    expect(a).toBe(b);
    expect(a).toBe(ALPHABET[0]!.repeat(CODE_LENGTH));
  });

  it("artıq verilmiş kodu rədd edib yenisini üretir", () => {
    const first = ALPHABET[0]!.repeat(CODE_LENGTH);
    // Əvvəlcə hamısı 0-cı hərf (toqquşur), sonra hamısı 1-ci hərf.
    const random = seq(0, 0, 0, 0, 0, 0, 0, 0.999, 0.999, 0.999, 0.999, 0.999, 0.999, 0.999);
    const code = generateCode(new Set([first]), random);
    expect(code).not.toBe(first);
    expect(code).toBe(ALPHABET[ALPHABET.length - 1]!.repeat(CODE_LENGTH));
  });

  it("cəhdlər tükənəndə xəta atır — səssizcə təkrar kod vermir", () => {
    const only = ALPHABET[0]!.repeat(CODE_LENGTH);
    expect(() => generateCode(new Set([only]), seq(0), { maxAttempts: 3 })).toThrow(
      /təkrarsız kod/i,
    );
  });
});
