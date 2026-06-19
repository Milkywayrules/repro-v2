'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

import type { Task } from '@repro-v2/api-client'
import {
  createTask,
  createTaskList,
  deleteTask,
  formatTreatyError,
  patchTask,
  taskKeys,
  taskListKeys,
  taskListQueryOptions,
  tasksByListQueryOptions,
} from '@repro-v2/api-client/queries'
import { Button } from '@repro-v2/ui/components/button'
import { Checkbox } from '@repro-v2/ui/components/checkbox'
import { Input } from '@repro-v2/ui/components/input'
import { Label } from '@repro-v2/ui/components/label'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useQueryState } from 'nuqs'

import { apiClient } from '@/lib/api-client'
import { authClient } from '@/lib/auth-client'
import { parseAsListId } from '@/lib/list-id-parser'

export function TasksContent() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { data: session, isPending: sessionPending } = authClient.useSession()
  const [listId, setListId] = useQueryState('listId', parseAsListId)
  const [newListName, setNewListName] = useState('')
  const [newTaskTitle, setNewTaskTitle] = useState('')

  const listsQuery = useQuery({
    ...taskListQueryOptions(apiClient),
    enabled: Boolean(session?.user),
  })
  const lists = listsQuery.data?.data ?? []

  const validListId =
    listId !== null && lists.some(list => list.id === listId) ? listId : null

  const tasksQuery = useQuery({
    ...tasksByListQueryOptions(apiClient, validListId ?? ''),
    enabled: Boolean(session?.user && validListId),
  })
  const tasks = tasksQuery.data?.data ?? []

  useEffect(() => {
    if (sessionPending) {
      return
    }

    if (!session?.user) {
      router.replace('/login')
    }
  }, [sessionPending, session?.user, router])

  useEffect(() => {
    if (listsQuery.isPending || lists.length === 0) {
      return
    }

    const isStaleListId =
      listId !== null && !lists.some(list => list.id === listId)

    if (listId === null || isStaleListId) {
      const firstListId = lists[0]?.id
      if (firstListId) {
        setListId(firstListId).then(() => undefined)
      } else if (listId !== null) {
        setListId(null).then(() => undefined)
      }
    }
  }, [listId, lists, listsQuery.isPending, setListId])

  const createListMutation = useMutation({
    mutationFn: (name: string) => createTaskList(apiClient, { name }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: taskListKeys.all })
      setNewListName('')
    },
  })

  const createTaskMutation = useMutation({
    mutationFn: (input: { title: string; listId: string }) =>
      createTask(apiClient, input),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: taskKeys.list(variables.listId),
      })
      setNewTaskTitle('')
    },
  })

  const patchTaskMutation = useMutation({
    mutationFn: (input: { id: string; completed: boolean; listId: string }) =>
      patchTask(apiClient, input.id, { completed: input.completed }),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: taskKeys.list(variables.listId),
      })
    },
  })

  const deleteTaskMutation = useMutation({
    mutationFn: (input: { id: string; listId: string }) =>
      deleteTask(apiClient, input.id),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: taskKeys.list(variables.listId),
      })
    },
  })

  const error = useMemo(() => {
    const activeError =
      listsQuery.error ??
      tasksQuery.error ??
      createListMutation.error ??
      createTaskMutation.error ??
      patchTaskMutation.error ??
      deleteTaskMutation.error

    if (!activeError) {
      return null
    }

    return formatTreatyError(activeError, 'Something went wrong')
  }, [
    listsQuery.error,
    tasksQuery.error,
    createListMutation.error,
    createTaskMutation.error,
    patchTaskMutation.error,
    deleteTaskMutation.error,
  ])

  const isMutating =
    createListMutation.isPending ||
    createTaskMutation.isPending ||
    patchTaskMutation.isPending ||
    deleteTaskMutation.isPending

  function handleCreateList() {
    const name = newListName.trim()
    if (!name) {
      return
    }

    createListMutation.mutate(name)
  }

  function handleCreateTask() {
    const title = newTaskTitle.trim()
    if (!(validListId && title)) {
      return
    }

    createTaskMutation.mutate({ title, listId: validListId })
  }

  function handleToggleTask(task: Task) {
    if (!validListId) {
      return
    }

    patchTaskMutation.mutate({
      id: task.id,
      completed: !task.completed,
      listId: validListId,
    })
  }

  function handleDeleteTask(taskId: string) {
    if (!validListId) {
      return
    }

    deleteTaskMutation.mutate({ id: taskId, listId: validListId })
  }

  if (sessionPending || !session?.user) {
    return <p className="p-4">Loading…</p>
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4">
      <h1 className="font-semibold text-2xl">Tasks</h1>

      {error ? <p className="text-destructive text-sm">{error}</p> : null}

      <section className="flex flex-col gap-2">
        <h2 className="font-medium text-lg">Lists</h2>
        {listsQuery.isPending ? (
          <p className="text-muted-foreground text-sm">Loading lists…</p>
        ) : null}
        <div className="flex flex-wrap gap-2">
          {lists.map(list => (
            <Button
              key={list.id}
              onClick={() => {
                setListId(list.id).then(() => undefined)
              }}
              variant={validListId === list.id ? 'default' : 'outline'}
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
            disabled={isMutating}
            onClick={handleCreateList}
          >
            Add list
          </Button>
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-medium text-lg">Tasks</h2>
        {tasksQuery.isPending && validListId ? (
          <p className="text-muted-foreground text-sm">Loading tasks…</p>
        ) : null}
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
                  disabled={patchTaskMutation.isPending}
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
              disabled={!validListId}
              id="new-task-title"
              onChange={event => setNewTaskTitle(event.target.value)}
              placeholder="New task title"
              value={newTaskTitle}
            />
          </div>
          <Button
            className="self-end"
            disabled={isMutating || !validListId}
            onClick={handleCreateTask}
          >
            Add task
          </Button>
        </div>
      </section>
    </main>
  )
}
