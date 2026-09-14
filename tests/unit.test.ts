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
