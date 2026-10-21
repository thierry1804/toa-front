/**
 * R-09 : « photos_lignes_manquantes: installations:2; equipements:1 » →
 * « Installations : ligne 2 — Équipements : ligne 1 ».
 */
export function formatMissingRowPhotos(errorMessage: string): string | null {
  const match = errorMessage.match(/photos_lignes_manquantes:\s*(.+)/);
  if (!match) return null;
  const labels: Record<string, string> = { installations: "Installations", equipements: "Équipements" };
  return match[1]
    .split(";")
    .map((part) => {
      const [list, lines = ""] = part.trim().split(":");
      const numbers = lines.split(",").map((n) => n.trim()).filter(Boolean);
      return `${labels[list] ?? list} : ligne${numbers.length > 1 ? "s" : ""} ${numbers.join(", ")}`;
    })
    .join(" — ");
}
