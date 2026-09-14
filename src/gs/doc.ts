import type { DocPort, QrImage } from "@/core/ports";

const PLACEHOLDER_RE = /\{\{[A-Z_]+\}\}/g;

/** `{{X}}` mətnini findText üçün təhlükəsiz regex sətrinə çevirir. */
const escapeForSearch = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const createDocPort = (): DocPort => ({
  listPlaceholders(docId: string): string[] {
    const text = DocumentApp.openById(docId).getBody().getText();
    return [...new Set(text.match(PLACEHOLDER_RE) ?? [])];
  },

  copy(docId: string, name: string): string {
    return DriveApp.getFileById(docId).makeCopy(name).getId();
  },

  replaceText(docId: string, placeholder: string, value: string): void {
    const doc = DocumentApp.openById(docId);
    // Kolontitullar ayrı bölmələrdir — referans kodu orada olduğu üçün
    // hər üçündə əvəzləmə aparılır.
    doc.getBody().replaceText(escapeForSearch(placeholder), value);
    doc.getHeader()?.replaceText(escapeForSearch(placeholder), value);
    doc.getFooter()?.replaceText(escapeForSearch(placeholder), value);
    doc.saveAndClose();
  },

  insertImage(docId: string, placeholder: string, image: QrImage): void {
    const doc = DocumentApp.openById(docId);
    const blob = image as GoogleAppsScript.Base.Blob;

    const place = (container: GoogleAppsScript.Document.Body | GoogleAppsScript.Document.HeaderSection | GoogleAppsScript.Document.FooterSection | null) => {
      if (!container) return false;
      const found = container.findText(escapeForSearch(placeholder));
      if (!found) return false;

      const element = found.getElement();
      const paragraph = element.getParent().asParagraph();

      // Abzas boşaldılır, sonra şəkil qoyulur.
      // DİQQƏT: setText("") İŞLƏMİR — Apps Script «Cannot insert an empty
      // text element» xətası atır. Boşaltmaq üçün clear() işlədilməlidir.
      paragraph.clear();
      paragraph.appendInlineImage(blob).setWidth(110).setHeight(110);
      return true;
    };

    const placed = place(doc.getBody()) || place(doc.getFooter()) || place(doc.getHeader());
    doc.saveAndClose();
    if (!placed) throw new Error(`${placeholder} yer tutucusu sənəddə tapılmadı`);
  },

  /**
   * Verilmiş sayda açıq səhifə sonundan sonrasını silir.
   *
   * Google Docs-da «səhifə» quruluşu yoxdur — sənəd düz axındır. Ona görə
   * kəsmə YALNIZ açıq səhifə sonu işarələrinə görə aparılır; işarə sayı
   * çatmırsa xəta atılır, çünki səhv yerdən kəsilmiş rəsmi sənəd üretilməməlidir.
   */
  truncateAfterPageBreak(docId: string, breakCount: number): void {
    const doc = DocumentApp.openById(docId);
    const body = doc.getBody();

    let seen = 0;
    let cutAt = -1;

    outer: for (let i = 0; i < body.getNumChildren(); i++) {
      const child = body.getChild(i);
      if (child.getType() !== DocumentApp.ElementType.PARAGRAPH) continue;
      const paragraph = child.asParagraph();
      for (let j = 0; j < paragraph.getNumChildren(); j++) {
        if (paragraph.getChild(j).getType() === DocumentApp.ElementType.PAGE_BREAK) {
          seen++;
          if (seen === breakCount) {
            // Səhifə sonunun özü də silinir, yoxsa sonda boş səhifə qalır.
            paragraph.getChild(j).removeFromParent();
            cutAt = i;
            break outer;
          }
        }
      }
    }

    if (cutAt === -1) {
      doc.saveAndClose();
      throw new Error(
        `şablonda ${breakCount} səhifə sonu tapılmadı — qısa versiya kəsilə bilmir`,
      );
    }

    /**
     * Docs bölməni tamamilə abzassız qoymağa icazə vermir və
     * «Can't remove the last paragraph in a document section» atır.
     * Silinə bilməyən elementi silmək əvəzinə boşaldırıq — nəticə eynidir,
     * səhifədə görünən heç nə qalmır.
     */
    for (let i = body.getNumChildren() - 1; i > cutAt; i--) {
      const child = body.getChild(i);
      try {
        child.removeFromParent();
      } catch {
        if (child.getType() === DocumentApp.ElementType.PARAGRAPH) {
          child.asParagraph().clear();
        } else if (child.getType() === DocumentApp.ElementType.LIST_ITEM) {
          child.asListItem().clear();
        }
      }
    }

    if (body.getNumChildren() === 0) body.appendParagraph("");

    doc.saveAndClose();
  },

  exportPdf(docId: string, name: string): string {
    const blob = DriveApp.getFileById(docId).getAs("application/pdf").setName(name);
    return DriveApp.createFile(blob).getId();
  },

  remove(fileId: string): void {
    DriveApp.getFileById(fileId).setTrashed(true);
  },
});
