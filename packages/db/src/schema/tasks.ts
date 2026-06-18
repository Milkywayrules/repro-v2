import { relations } from 'drizzle-orm'
import { boolean, index, pgTable, text } from 'drizzle-orm/pg-core'

import { auditColumns, idColumn } from '../columns'
import { user } from './auth'

export const taskLists = pgTable(
  'task_lists',
  {
    id: idColumn(),
    name: text('name').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    ...auditColumns(),
  },
  table => [
    index('task_lists_user_id_idx').on(table.userId),
    index('task_lists_deleted_at_idx').on(table.deletedAt),
  ],
)

export const tasks = pgTable(
  'tasks',
  {
    id: idColumn(),
    listId: text('list_id')
      .notNull()
      .references(() => taskLists.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    completed: boolean('completed').default(false).notNull(),
    ...auditColumns(),
  },
  table => [
    index('tasks_list_id_idx').on(table.listId),
    index('tasks_deleted_at_idx').on(table.deletedAt),
  ],
)

export const taskListsRelations = relations(taskLists, ({ one, many }) => ({
  user: one(user, {
    fields: [taskLists.userId],
    references: [user.id],
  }),
  tasks: many(tasks),
}))

export const tasksRelations = relations(tasks, ({ one }) => ({
  list: one(taskLists, {
    fields: [tasks.listId],
    references: [taskLists.id],
  }),
}))

export type TaskList = typeof taskLists.$inferSelect
export type NewTaskList = typeof taskLists.$inferInsert
export type Task = typeof tasks.$inferSelect
export type NewTask = typeof tasks.$inferInsert
