'use client'

import { useState } from 'react'

import type { Task } from '@repro-v2/api-client'
import {
  createTask,
  deleteTask,
  formatTreatyError,
  patchTask,
  taskKeys,
  tasksByListQueryOptions,
} from '@repro-v2/api-client/queries'
import { Button } from '@repro-v2/ui/components/button'
import { Checkbox } from '@repro-v2/ui/components/checkbox'
import { Input } from '@repro-v2/ui/components/input'
import { Label } from '@repro-v2/ui/components/label'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { InlineErrorCallout } from '@/components/inline-error-callout'
import { getApiClient } from '@/lib/api-client'

interface TaskItemsSectionProps {
  listId: string | null
  onSelectTask: (task: Task) => void
  onTaskDeleted: (taskId: string) => void
  selectedTaskId: string | null
  workspaceSlug?: string
}

export function TaskItemsSection({
  listId,
  selectedTaskId,
  onSelectTask,
  onTaskDeleted,
  workspaceSlug,
}: TaskItemsSectionProps) {
  const queryClient = useQueryClient()
  const client = getApiClient()
  const [newTaskTitle, setNewTaskTitle] = useState('')

  const tasksQuery = useQuery({
    ...tasksByListQueryOptions(client, listId ?? '', workspaceSlug),
    enabled: Boolean(listId),
  })
  const tasks = tasksQuery.data?.data ?? []

  async function invalidateTaskList(taskListId: string) {
    await queryClient.invalidateQueries({
      queryKey: taskKeys.list(taskListId),
    })
  }

  const createTaskMutation = useMutation({
    mutationFn: (input: { title: string; listId: string }) =>
      createTask(client, input, workspaceSlug),
    onSuccess: async (_data, variables) => {
      await invalidateTaskList(variables.listId)
      setNewTaskTitle('')
    },
  })

  const patchTaskMutation = useMutation({
    mutationFn: (input: { id: string; completed: boolean; listId: string }) =>
      patchTask(
        client,
        input.id,
        { completed: input.completed },
        workspaceSlug,
      ),
    onSuccess: async (_data, variables) => {
      await invalidateTaskList(variables.listId)
    },
  })

  const deleteTaskMutation = useMutation({
    mutationFn: (input: { id: string; listId: string }) =>
      deleteTask(client, input.id, workspaceSlug),
    onSuccess: async (_data, variables) => {
      onTaskDeleted(variables.id)
      await invalidateTaskList(variables.listId)
    },
  })

  const activeError =
    createTaskMutation.error ??
    patchTaskMutation.error ??
    deleteTaskMutation.error

  const error = activeError
    ? formatTreatyError(activeError, 'Something went wrong')
    : null

  const tasksError = tasksQuery.isError
    ? formatTreatyError(tasksQuery.error, 'Failed to load tasks')
    : null

  const isMutating =
    createTaskMutation.isPending ||
    patchTaskMutation.isPending ||
    deleteTaskMutation.isPending

  function handleCreateTask() {
    const title = newTaskTitle.trim()
    if (!(listId && title)) {
      return
    }

    createTaskMutation.mutate({ title, listId })
  }

  function handleToggleTask(task: Task) {
    if (!listId) {
      return
    }

    patchTaskMutation.mutate({
      id: task.id,
      completed: !task.completed,
      listId,
    })
  }

  function handleDeleteTask(taskId: string) {
    if (!listId) {
      return
    }

    deleteTaskMutation.mutate({ id: taskId, listId })
  }

  function resetMutationErrors() {
    createTaskMutation.reset()
    patchTaskMutation.reset()
    deleteTaskMutation.reset()
  }

  return (
    <section className="flex flex-col gap-2">
      <h2 className="font-medium text-lg">Tasks</h2>
      {error ? (
        <div className="space-y-2">
          <InlineErrorCallout>{error}</InlineErrorCallout>
          <Button onClick={resetMutationErrors} type="button" variant="outline">
            Try again
          </Button>
        </div>
      ) : null}
      {tasksQuery.isPending && listId ? (
        <p className="text-muted-foreground text-sm">Loading tasks…</p>
      ) : null}
      {tasksError ? (
        <div className="space-y-2">
          <InlineErrorCallout>{tasksError}</InlineErrorCallout>
          <Button
            onClick={() => {
              tasksQuery.refetch()
            }}
            type="button"
            variant="outline"
          >
            Retry
          </Button>
        </div>
      ) : null}
      <ul className="flex flex-col gap-2">
        {tasks.map(task => (
          <li
            className={`flex flex-col gap-2 rounded border p-2 ${selectedTaskId === task.id ? 'border-primary' : ''}`}
            key={task.id}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  aria-label={`Mark "${task.title}" complete`}
                  checked={task.completed}
                  disabled={patchTaskMutation.isPending}
                  onCheckedChange={() => handleToggleTask(task)}
                />
                <button
                  className={`text-left ${task.completed ? 'line-through opacity-60' : ''}`}
                  onClick={() => onSelectTask(task)}
                  type="button"
                >
                  {task.title}
                </button>
              </div>
              <Button
                onClick={() => handleDeleteTask(task.id)}
                size="sm"
                variant="destructive"
              >
                Delete
              </Button>
            </div>
          </li>
        ))}
      </ul>
      <div className="flex gap-2">
        <div className="flex flex-1 flex-col gap-2">
          <Label htmlFor="new-task-title">New task title</Label>
          <Input
            disabled={!listId}
            id="new-task-title"
            onChange={event => setNewTaskTitle(event.target.value)}
            placeholder="New task title"
            value={newTaskTitle}
          />
        </div>
        <Button
          className="self-end"
          disabled={isMutating || !listId || tasksQuery.isError}
          onClick={handleCreateTask}
        >
          Add task
        </Button>
      </div>
    </section>
  )
}
