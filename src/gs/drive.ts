import type { DrivePort, QrImage, QrPort } from "@/core/ports";

/** Sertifikat qovluqlarının yığıldığı kök qovluğun adı. */
export const ROOT_FOLDER = "Möhür — sertifikatlar";

/** Kök qovluğu tapır, yoxdursa yaradır. */
const rootFolder = (): GoogleAppsScript.Drive.Folder => {
  const existing = DriveApp.getFoldersByName(ROOT_FOLDER);
  return existing.hasNext() ? existing.next() : DriveApp.createFolder(ROOT_FOLDER);
};

export const createDrivePort = (): DrivePort => ({
  ensureFolder(name: string): string {
    const root = rootFolder();
    const existing = root.getFoldersByName(name);
    return existing.hasNext() ? existing.next().getId() : root.createFolder(name).getId();
  },

  placeFiles(folderId: string, fileIds: string[]): void {
    const folder = DriveApp.getFolderById(folderId);

    // Köhnələr ƏVVƏLCƏ qeyd olunur, silinmir.
    const old: GoogleAppsScript.Drive.File[] = [];
    const iterator = folder.getFiles();
    while (iterator.hasNext()) old.push(iterator.next());

    // Yenilər yerinə qoyulur.
    for (const fileId of fileIds) DriveApp.getFileById(fileId).moveTo(folder);

    // Yalnız indi köhnələr zibilə atılır — yenilər artıq qovluqdadır.
    const fresh = new Set(fileIds);
    for (const file of old) {
      if (!fresh.has(file.getId())) file.setTrashed(true);
    }
  },

  url(fileId: string): string {
    // Qovluq da, fayl da eyni ünvan şablonundadır; əvvəlcə fayl kimi sınanır.
    try {
      return DriveApp.getFileById(fileId).getUrl();
    } catch {
      return DriveApp.getFolderById(fileId).getUrl();
    }
  },
});

/**
 * QR şəklini kənar xidmətdən gətirir.
 *
 * Xidmət 2026-09-14-də yoxlanılıb: quickchart.io 200 və image/png qaytarır.
 * Google-un köhnə chart xidməti (chart.googleapis.com) **bağlanıb**, 404 verir —
 * köhnə nümunələrdə rast gəlsən istifadə etmə.
 *
 * Ehtiyat xidmət: https://api.qrserver.com/v1/create-qr-code/
 */
const QR_ENDPOINT = "https://quickchart.io/qr";

export const createQrPort = (): QrPort => ({
  render(payload: string): QrImage {
    const url =
      `${QR_ENDPOINT}?text=${encodeURIComponent(payload)}` +
      "&size=300&margin=2&ecLevel=M&format=png";

    const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    const status = response.getResponseCode();
    if (status !== 200) {
      throw new Error(`QR xidməti ${status} qaytardı — sertifikat üretilmir`);
    }
    return response.getBlob().setName("qr.png");
  },
});
