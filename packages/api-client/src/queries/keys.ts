export const taskListKeys = {
  all: ['task-lists'] as const,
  lists: () => [...taskListKeys.all, 'list'] as const,
}

export const taskKeys = {
  all: ['tasks'] as const,
  lists: () => [...taskKeys.all, 'list'] as const,
  list: (listId: string) => [...taskKeys.lists(), { listId }] as const,
}
