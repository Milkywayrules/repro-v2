export function serializeAuditTimestamps(row: {
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}) {
  return {
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    deletedAt: row.deletedAt?.toISOString() ?? null,
  }
}
