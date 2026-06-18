import { text, timestamp } from 'drizzle-orm/pg-core'

import { createId } from './id'
import { user } from './schema/auth'

export function idColumn(name = 'id') {
  return text(name)
    .primaryKey()
    .$defaultFn(() => createId())
}

export function auditColumns() {
  return {
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    createdById: text('created_by_id').references(() => user.id),
    updatedById: text('updated_by_id').references(() => user.id),
    deletedById: text('deleted_by_id').references(() => user.id),
  }
}
