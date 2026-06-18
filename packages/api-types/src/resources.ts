export interface TaskListResource {
  createdAt: string
  deletedAt: string | null
  id: string
  name: string
  updatedAt: string
}

export interface TaskResource {
  completed: boolean
  createdAt: string
  deletedAt: string | null
  id: string
  listId: string
  title: string
  updatedAt: string
}
