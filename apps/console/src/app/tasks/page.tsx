'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

import type {
  Task,
  TaskList,
  TaskListListResponse,
  TaskListResponse,
} from '@repro-v2/api-client'
import { formatTreatyError } from '@repro-v2/api-client'
import { Button } from '@repro-v2/ui/components/button'
import { Checkbox } from '@repro-v2/ui/components/checkbox'
import { Input } from '@repro-v2/ui/components/input'
import { Label } from '@repro-v2/ui/components/label'

import { apiClient } from '@/lib/api-client'
import { authClient } from '@/lib/auth-client'

export default function TasksPage() {
  const router = useRouter()
  const { data: session, isPending } = authClient.useSession()
  const [lists, setLists] = useState<TaskList[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [selectedListId, setSelectedListId] = useState<string | null>(null)
  const [newListName, setNewListName] = useState('')
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const loadLists = useCallback(async () => {
    const response = await apiClient.api.v1['task-lists'].get()
    if (response.error) {
      setError(formatTreatyError(response.error, 'Failed to load lists'))
      return
    }

    const body = response.data as TaskListListResponse | null
    if (body && Array.isArray(body.data)) {
      setLists(body.data)
      setSelectedListId(current => current ?? body.data[0]?.id ?? null)
    }
  }, [])

  const loadTasks = useCallback(async (listId: string) => {
    const response = await apiClient.api.v1.tasks.get({
      query: { listId },
    })

    if (response.error) {
      setError(formatTreatyError(response.error, 'Failed to load tasks'))
      return
    }

    const body = response.data as TaskListResponse | null
    if (body && Array.isArray(body.data)) {
      setTasks(body.data)
    }
  }, [])

  useEffect(() => {
    if (isPending) {
      return
    }

    if (!session?.user) {
      router.replace('/login')
      return
    }

    loadLists().catch(() => {
      setError('Failed to load task lists')
    })
  }, [isPending, session?.user, router, loadLists])

  useEffect(() => {
    if (!selectedListId) {
      setTasks([])
      return
    }

    loadTasks(selectedListId).catch(() => {
      setError('Failed to load tasks')
    })
  }, [selectedListId, loadTasks])

  async function handleCreateList() {
    if (!newListName.trim()) {
      return
    }

    setLoading(true)
    setError(null)

    const response = await apiClient.api.v1['task-lists'].post({
      name: newListName.trim(),
    })

    setLoading(false)

    if (response.error) {
      setError(formatTreatyError(response.error, 'Failed to create list'))
      return
    }

    setNewListName('')
    await loadLists()
  }

  async function handleCreateTask() {
    if (!(selectedListId && newTaskTitle.trim())) {
      return
    }

    setLoading(true)
    setError(null)

    const response = await apiClient.api.v1.tasks.post({
      title: newTaskTitle.trim(),
      listId: selectedListId,
    })

    setLoading(false)

    if (response.error) {
      setError(formatTreatyError(response.error, 'Failed to create task'))
      return
    }

    setNewTaskTitle('')
    await loadTasks(selectedListId)
  }

  async function handleToggleTask(task: Task) {
    const response = await apiClient.api.v1.tasks({ id: task.id }).patch({
      completed: !task.completed,
    })

    if (response.error || !selectedListId) {
      setError(formatTreatyError(response.error, 'Failed to update task'))
      return
    }

    await loadTasks(selectedListId)
  }

  async function handleDeleteTask(taskId: string) {
    const response = await apiClient.api.v1.tasks({ id: taskId }).delete()

    if (response.error || !selectedListId) {
      setError(formatTreatyError(response.error, 'Failed to delete task'))
      return
    }

    await loadTasks(selectedListId)
  }

  if (isPending || !session?.user) {
    return <p className="p-4">Loading…</p>
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4">
      <h1 className="font-semibold text-2xl">Tasks</h1>

      {error ? <p className="text-destructive text-sm">{error}</p> : null}

      <section className="flex flex-col gap-2">
        <h2 className="font-medium text-lg">Lists</h2>
        <div className="flex flex-wrap gap-2">
          {lists.map(list => (
            <Button
              key={list.id}
              onClick={() => setSelectedListId(list.id)}
              variant={selectedListId === list.id ? 'default' : 'outline'}
            >
              {list.name}
            </Button>
          ))}
        </div>
        <div className="flex gap-2">
          <div className="flex flex-1 flex-col gap-2">
            <Label htmlFor="new-list-name">New list name</Label>
            <Input
              id="new-list-name"
              onChange={event => setNewListName(event.target.value)}
              placeholder="New list name"
              value={newListName}
            />
          </div>
          <Button
            className="self-end"
            disabled={loading}
            onClick={handleCreateList}
          >
            Add list
          </Button>
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-medium text-lg">Tasks</h2>
        <ul className="flex flex-col gap-2">
          {tasks.map(task => (
            <li
              className="flex items-center justify-between gap-2 rounded border p-2"
              key={task.id}
            >
              <div className="flex items-center gap-2">
                <Checkbox
                  aria-label={`Mark "${task.title}" complete`}
                  checked={task.completed}
                  onCheckedChange={() => handleToggleTask(task)}
                />
                <span
                  className={task.completed ? 'line-through opacity-60' : ''}
                >
                  {task.title}
                </span>
              </div>
              <Button
                onClick={() => handleDeleteTask(task.id)}
                size="sm"
                variant="destructive"
              >
                Delete
              </Button>
            </li>
          ))}
        </ul>
        <div className="flex gap-2">
          <div className="flex flex-1 flex-col gap-2">
            <Label htmlFor="new-task-title">New task title</Label>
            <Input
              disabled={!selectedListId}
              id="new-task-title"
              onChange={event => setNewTaskTitle(event.target.value)}
              placeholder="New task title"
              value={newTaskTitle}
            />
          </div>
          <Button
            className="self-end"
            disabled={loading || !selectedListId}
            onClick={handleCreateTask}
          >
            Add task
          </Button>
        </div>
      </section>
    </main>
  )
}
