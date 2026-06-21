export const taskListKeys = {
  all: ['task-lists'] as const,
  lists: (workspaceSlug?: string) =>
    workspaceSlug
      ? ([...taskListKeys.all, 'list', { workspaceSlug }] as const)
      : ([...taskListKeys.all, 'list'] as const),
}

export const taskKeys = {
  all: ['tasks'] as const,
  lists: (workspaceSlug?: string) =>
    workspaceSlug
      ? ([...taskKeys.all, 'list', { workspaceSlug }] as const)
      : ([...taskKeys.all, 'list'] as const),
  list: (listId: string, workspaceSlug?: string) =>
    [...taskKeys.lists(workspaceSlug), { listId }] as const,
}

export const meKeys = {
  all: ['me'] as const,
  avatar: () => [...meKeys.all, 'avatar'] as const,
}

export const attachmentKeys = {
  all: ['attachments'] as const,
  lists: (workspaceSlug?: string) =>
    workspaceSlug
      ? ([...attachmentKeys.all, 'list', { workspaceSlug }] as const)
      : ([...attachmentKeys.all, 'list'] as const),
  list: (taskId: string, workspaceSlug?: string) =>
    [...attachmentKeys.lists(workspaceSlug), { taskId }] as const,
}

export const deviceSessionKeys = {
  all: ['device-sessions'] as const,
  list: () => [...deviceSessionKeys.all, 'list'] as const,
}
