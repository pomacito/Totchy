/**
 * Нормалізація назв для пошуку: нижній регістр, заміна апострофів/дефісів,
 * видалення зайвих пробілів. Не транслітерує кирилицю в латиницю — для
 * пошуку транслітерованим запитом використовується окрема функція
 * {@link transliterateLatinToCyrillicGuess}, яка дає приблизні варіанти.
 */
export function normalizeName(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/['’ʼ`´]/g, "'")
    .replace(/\s+/g, " ")
    .replace(/[-‐-―]/g, "-");
}

/** Спрощена мапа поширеної транслітерації латиницею -> кириличні відповідники. */
const LATIN_TO_CYRILLIC: Array<[RegExp, string]> = [
  [/shch/gi, "щ"],
  [/kh/gi, "х"],
  [/ts/gi, "ц"],
  [/ch/gi, "ч"],
  [/sh/gi, "ш"],
  [/yi/gi, "ї"],
  [/ye/gi, "є"],
  [/yu/gi, "ю"],
  [/ya/gi, "я"],
  [/zh/gi, "ж"],
  [/a/gi, "а"],
  [/b/gi, "б"],
  [/v/gi, "в"],
  [/h/gi, "г"],
  [/g/gi, "ґ"],
  [/d/gi, "д"],
  [/e/gi, "е"],
  [/z/gi, "з"],
  [/y/gi, "и"],
  [/i/gi, "і"],
  [/k/gi, "к"],
  [/l/gi, "л"],
  [/m/gi, "м"],
  [/n/gi, "н"],
  [/o/gi, "о"],
  [/p/gi, "п"],
  [/r/gi, "р"],
  [/s/gi, "с"],
  [/t/gi, "т"],
  [/u/gi, "у"],
  [/f/gi, "ф"],
  [/j/gi, "й"],
  [/c/gi, "к"],
  [/q/gi, "к"],
  [/w/gi, "в"],
  [/x/gi, "кс"],
];

/**
 * Дає приблизний кириличний варіант латинського запиту для пошуку
 * транслітерованих назв (напр. "Kyiv" -> "києв"-подібний рядок). Це
 * евристика, а не точний зворотній переклад: результат використовується
 * лише як додатковий кандидат пошукового запиту.
 */
export function transliterateLatinToCyrillicGuess(input: string): string {
  let result = input.trim().toLowerCase();
  for (const [pattern, replacement] of LATIN_TO_CYRILLIC) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

export function isLatinScript(input: string): boolean {
  return /^[a-z0-9\s'’ʼ`´\-.,]+$/i.test(input.trim());
}
