// src/lib/subjects.ts
export function generateSubjectCode(name: string): string {
  if (!name) return "";

  // Parole "inutili" da saltare
  const stopWords = ["di", "del", "della", "dei", "delle", "e", "ed", "per", "su", "nel", "nella"];

  const parts = name
    .trim()
    .split(/\s+/)
    .filter((w) => !stopWords.includes(w.toLowerCase()));

  if (parts.length === 0) return "";

  // Es: "Diritto privato" -> DIR-PRIV
  if (parts.length >= 2) {
    const first = parts[0].slice(0, 3).toUpperCase();
    const second = parts[1].slice(0, 4).toUpperCase();
    return `${first}-${second}`;
  }

  // Es: "Matematica" -> MAT
  return parts[0].slice(0, 3).toUpperCase();
}
