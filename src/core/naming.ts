/** Qovluq və fayl adlarının qurulması. */

/**
 * Adda saxlanmayan simvollar — Drive və əməliyyat sistemləri üçün təhlükəsiz dəst.
 *
 * DİQQƏT: boşluq və tire BURADA YOXDUR və olmamalıdır. «Qüllə kran KB-403»
 * adındakı boşluq və tire mənalıdır; onları atmaq avadanlığı tanınmaz edir.
 */
const FORBIDDEN = /[/\\:*?"<>|]/g;

/** Avadanlıq adının ad içində tuta biləcəyi maksimum uzunluq. */
export const MAX_EQUIPMENT_IN_NAME = 60;

/** Ad tamamilə təmizlənib boş qalarsa işlədilir. */
const FALLBACK = "adsız";

/**
 * Sərbəst mətni fayl/qovluq adına yararlı hala gətirir.
 * Azərbaycan hərflərinə toxunmur — yalnız struktur pozan simvolları atır.
 */
export const sanitizeName = (value: string): string => {
  const cleaned = value
    .replace(FORBIDDEN, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_EQUIPMENT_IN_NAME)
    .trim();
  return cleaned === "" ? FALLBACK : cleaned;
};

/** `KOD — Avadanlıq` */
export const folderName = (code: string, equipment: string): string =>
  `${code} — ${sanitizeName(equipment)}`;

export type Variant = "full" | "short";
export type Extension = "doc" | "pdf";

/**
 * Dörd faylın adı. Google Doc-un uzantısı olmur, PDF-in olur — ona görə eyni
 * baza addan iki fərqli fayl çıxır və qarışmır.
 */
export const fileName = (
  code: string,
  equipment: string,
  variant: Variant,
  extension: Extension,
): string => {
  const suffix = variant === "full" ? "tam" : "qısa";
  const base = `${code} — ${sanitizeName(equipment)} (${suffix})`;
  return extension === "pdf" ? `${base}.pdf` : base;
};
