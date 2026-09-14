/**
 * Sertifikatın referans kodu.
 *
 * Kod sənədin üzərində çap olunur və insan tərəfindən telefonla oxunur, əl ilə
 * yazılır. Ona görə əlifbadan qarışdırıla bilən simvollar çıxarılıb:
 * 0/O, 1/I/L, və U (V ilə səhv salınır). Qalan 30 simvol 7 mövqedə
 * 30^7 ≈ 21 milyard kombinasiya verir — kiçik firma üçün kifayətdən çoxdur.
 */
export const ALPHABET = "23456789ABCDEFGHJKMNPQRSTVWXYZ";
export const CODE_LENGTH = 7;
const DEFAULT_MAX_ATTEMPTS = 50;

export interface CodeOptions {
  maxAttempts?: number;
}

/**
 * Verilmiş dəstdə olmayan yeni kod üretir.
 *
 * `random` kənardan verilir ki, test deterministik olsun.
 *
 * Cəhdlər tükənərsə **xəta atır** — təkrar kod qaytarmaqdansa dayanmaq
 * doğrudur, çünki iki sertifikatın eyni nömrəni daşıması sənəd sistemində
 * bərpası olmayan səhvdir.
 */
export const generateCode = (
  taken: ReadonlySet<string>,
  random: () => number,
  options: CodeOptions = {},
): string => {
  const maxAttempts = options.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    let code = "";
    for (let i = 0; i < CODE_LENGTH; i++) {
      const index = Math.min(
        Math.floor(random() * ALPHABET.length),
        ALPHABET.length - 1,
      );
      code += ALPHABET[index];
    }
    if (!taken.has(code)) return code;
  }

  throw new Error(
    `${maxAttempts} cəhddən sonra təkrarsız kod üretilə bilmədi — jurnal yoxlanılmalıdır`,
  );
};
