/** Strips MIME parameter suffixes (e.g. `image/png; charset=binary` → `image/png`). */
export function normalizeMimeType(contentType: string): string {
  return contentType.split(';')[0]?.trim() ?? contentType
}
