// Typo-tolerant search helper (no external package needed)

export type SearchField = {
  text?: string | null;
  weight: number; // importance of this field (1 = highest)
  fuzzy?: boolean; // allow spelling mistakes in this field
};

// lowercase, remove accents and symbols, collapse spaces
const normalize = (value: string): string =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

// Damerau-Levenshtein distance: counts inserts, deletes, replaces and swaps
// ("printr" -> "printer" = 1, "pritner" -> "printer" = 1)
const editDistance = (a: string, b: string): number => {
  if (a === b) return 0;
  const m = a.length;
  const n = b.length;
  if (!m) return n;
  if (!n) return m;

  const d: number[][] = Array.from({ length: m + 1 }, () =>
    new Array(n + 1).fill(0)
  );
  for (let i = 0; i <= m; i++) d[i][0] = i;
  for (let j = 0; j <= n; j++) d[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(
        d[i - 1][j] + 1,
        d[i][j - 1] + 1,
        d[i - 1][j - 1] + cost
      );
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    }
  }
  return d[m][n];
};

// score of one typed word against one word of the product/category text
const wordScore = (q: string, t: string, fuzzy: boolean): number => {
  if (q === t) return 1; // exact word
  if (t.startsWith(q)) return 0.9; // user is still typing
  if (q.length >= 3 && t.includes(q)) return 0.7; // part of a word
  if (!fuzzy || q.length < 4) return 0; // spelling mistakes only for 4+ letters

  const allowed = q.length <= 5 ? 1 : 2; // longer words allow more mistakes
  const full = editDistance(q, t);
  const prefix = t.length > q.length ? editDistance(q, t.slice(0, q.length)) : full;
  const best = Math.min(full, prefix);

  if (best <= allowed) return 0.8 - best * 0.15;
  return 0;
};

// Returns 0 (no match) up to 1 (perfect match)
export function fuzzyScore(query: string, fields: SearchField[]): number {
  const q = normalize(query);
  if (!q) return 0;

  const qWords = q.split(" ");

  const prepared = fields
    .filter((f) => f.text && f.text.trim())
    .map((f) => {
      const text = normalize(f.text as string);
      return {
        words: text.split(" "),
        compact: text.replace(/ /g, ""),
        weight: f.weight,
        fuzzy: !!f.fuzzy,
      };
    });

  let total = 0;

  for (const qw of qWords) {
    let best = 0;

    for (const field of prepared) {
      for (const word of field.words) {
        best = Math.max(best, wordScore(qw, word, field.fuzzy) * field.weight);
      }

      // handles "hand held" vs "handheld" (extra or missing space)
      if (qw.length >= 4 && field.fuzzy && field.compact.includes(qw)) {
        best = Math.max(best, 0.7 * field.weight);
      }
    }

    // every typed word must match something
    if (best === 0) return 0;
    total += best;
  }

  return total / qWords.length;
}