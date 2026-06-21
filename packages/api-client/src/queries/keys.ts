export const taskListKeys = {
  all: ['task-lists'] as const,
  lists: () => [...taskListKeys.all, 'list'] as const,
}

export const taskKeys = {
  all: ['tasks'] as const,
  lists: () => [...taskKeys.all, 'list'] as const,
  list: (listId: string) => [...taskKeys.lists(), { listId }] as const,
}

export const meKeys = {
  all: ['me'] as const,
  avatar: () => [...meKeys.all, 'avatar'] as const,
}

export const attachmentKeys = {
  all: ['attachments'] as const,
  lists: () => [...attachmentKeys.all, 'list'] as const,
  list: (taskId: string) => [...attachmentKeys.lists(), { taskId }] as const,
}
