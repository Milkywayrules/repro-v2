import { relations } from 'drizzle-orm'
import { index, integer, pgTable, text } from 'drizzle-orm/pg-core'

import { auditColumns, idColumn } from '../columns'
import { workspace } from './auth'
import { tasks } from './tasks'

export const taskAttachments = pgTable(
  'task_attachments',
  {
    id: idColumn(),
    taskId: text('task_id')
      .notNull()
      .references(() => tasks.id, { onDelete: 'cascade' }),
    workspaceId: text('workspace_id')
      .notNull()
      .references(() => workspace.id, { onDelete: 'cascade' }),
    storageKey: text('storage_key').notNull(),
    filename: text('filename').notNull(),
    contentType: text('content_type').notNull(),
    sizeBytes: integer('size_bytes').notNull(),
    ...auditColumns(),
  },
  table => [
    index('task_attachments_task_id_idx').on(table.taskId),
    index('task_attachments_workspace_id_idx').on(table.workspaceId),
    index('task_attachments_deleted_at_idx').on(table.deletedAt),
  ],
)

export const taskAttachmentsRelations = relations(
  taskAttachments,
  ({ one }) => ({
    task: one(tasks, {
      fields: [taskAttachments.taskId],
      references: [tasks.id],
    }),
    workspace: one(workspace, {
      fields: [taskAttachments.workspaceId],
      references: [workspace.id],
    }),
  }),
)

export type TaskAttachment = typeof taskAttachments.$inferSelect
export type NewTaskAttachment = typeof taskAttachments.$inferInsert
