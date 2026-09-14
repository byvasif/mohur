import type { CertificateRow } from "./types";

/**
 * QR-ın daşıdığı mətn.
 *
 * Format qəsdən **maşın oxunandır** və açarlar ASCII-dir: sertifikat iki dildə
 * üretilir, amma QR-ı oxuyan tərəf dil bilməməlidir. İkinci mərhələdə
 * planlaşdırılan doğrulama səhifəsi də məhz bu formatı ayrıştıracaq.
 *
 * Sahələr elanda sadalananlarla eynidir: avadanlıq, firma, test tarixi,
 * referans kodu.
 */
export const QR_FIELDS = ["EQUIPMENT", "COMPANY", "TEST_DATE", "REF"] as const;

/**
 * Sətir sonu və artıq boşluq təmizlənir — biri qalsa QR yükü ayrıştırıla
 * bilməyən hala düşür.
 */
const flatten = (value: string): string => value.replace(/\s+/g, " ").trim();

/** Sabit sıralı, sətir başına bir sahə. */
export const buildQrPayload = (row: CertificateRow): string =>
  [
    `EQUIPMENT=${flatten(row.equipment)}`,
    `COMPANY=${flatten(row.company)}`,
    `TEST_DATE=${flatten(row.testDate)}`,
    `REF=${flatten(row.refCode)}`,
  ].join("\n");
