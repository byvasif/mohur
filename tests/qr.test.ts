import { describe, expect, it } from "vitest";
import { QR_FIELDS, buildQrPayload } from "@/core/qr";
import type { CertificateRow } from "@/core/types";

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

describe("buildQrPayload", () => {
  it("elanda sadalanan dörd sahənin hamısını daşıyır", () => {
    const payload = buildQrPayload(row);
    for (const field of QR_FIELDS) {
      expect(payload).toContain(`${field}=`);
    }
  });

  it("dəyərləri düzgün yazır", () => {
    expect(buildQrPayload(row)).toBe(
      [
        "EQUIPMENT=Qüllə kran KB-403",
        "COMPANY=Xəzər Tikinti MMC",
        "TEST_DATE=14.09.2026",
        "REF=K7MPQ2X",
      ].join("\n"),
    );
  });

  it("sıra sabitdir — hər dəfə eyni nəticə", () => {
    expect(buildQrPayload(row)).toBe(buildQrPayload(row));
  });

  it("dəyərdəki sətir sonu formatı pozmur", () => {
    const messy = { ...row, company: "Xəzər\nTikinti   MMC" };
    const payload = buildQrPayload(messy);
    expect(payload.split("\n")).toHaveLength(QR_FIELDS.length);
    expect(payload).toContain("COMPANY=Xəzər Tikinti MMC");
  });

  it("açarlar ASCII-dir — oxuyan tərəf dil bilməməlidir", () => {
    for (const field of QR_FIELDS) {
      expect(field).toMatch(/^[A-Z_]+$/);
    }
  });
});
