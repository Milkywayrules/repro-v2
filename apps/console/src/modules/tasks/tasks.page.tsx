'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

import {
  createTaskList,
  formatTreatyError,
  taskListKeys,
  taskListQueryOptions,
} from '@repro-v2/api-client/queries'
import { Button } from '@repro-v2/ui/components/button'
import { Input } from '@repro-v2/ui/components/input'
import { Label } from '@repro-v2/ui/components/label'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useQueryState } from 'nuqs'

import { InlineErrorCallout } from '@/components/inline-error-callout'
import { PageErrorState } from '@/components/page-error-state'
import { apiClient } from '@/lib/api-client'
import { iamClient } from '@/lib/iam-client'
import { parseAsListId } from '@/lib/list-id-parser'
import { routes } from '@/lib/routes'
import { searchParams } from '@/lib/search-params'
import { useOnboardingGate } from '@/modules/iam/use-onboarding-gate'

import { TaskAttachmentsPanel } from './task-attachments-panel'
import { TaskItemsSection } from './task-items-section'
import { useSyncSelectedListId } from './use-sync-selected-list-id'

export function TasksPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { data: session, isPending: sessionPending } = iamClient.useSession()
  const [listId, setListId] = useQueryState(searchParams.listId, parseAsListId)
  const [newListName, setNewListName] = useState('')
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)

  const listsQuery = useQuery({
    ...taskListQueryOptions(apiClient),
    enabled: Boolean(session?.user),
  })
  const lists = listsQuery.data?.data ?? []

  useEffect(() => {
    if (sessionPending) {
      return
    }

    if (!session?.user) {
      router.replace(routes.login)
    }
  }, [sessionPending, session?.user, router])

  const { error: onboardingError, isChecking: onboardingChecking } =
    useOnboardingGate(session?.user?.id)

  useSyncSelectedListId({
    listId,
    lists,
    listsPending: listsQuery.isPending,
    setListId,
  })

  const createListMutation = useMutation({
    mutationFn: (name: string) => createTaskList(apiClient, { name }),
    onSuccess: async created => {
      await queryClient.invalidateQueries({ queryKey: taskListKeys.all })
      setListId(created.data.id).then(() => undefined)
      setNewListName('')
    },
  })

  const activeError = createListMutation.error

  const error = activeError
    ? formatTreatyError(activeError, 'Something went wrong')
    : null

  const listsError = listsQuery.isError
    ? formatTreatyError(listsQuery.error, 'Failed to load lists')
    : null

  const isMutating = createListMutation.isPending

  function handleCreateList() {
    const name = newListName.trim()
    if (!name) {
      return
    }

    createListMutation.mutate(name)
  }

  function resetMutationErrors() {
    createListMutation.reset()
  }

  function handleSelectTask(task: { id: string }) {
    setSelectedTaskId(current => (current === task.id ? null : task.id))
  }

  function handleTaskDeleted(taskId: string) {
    if (selectedTaskId === taskId) {
      setSelectedTaskId(null)
    }
  }

  if (sessionPending || !session?.user || onboardingChecking) {
    return <p className="p-4">Loading…</p>
  }

  if (onboardingError) {
    return (
      <main className="mx-auto w-full max-w-3xl p-4">
        <PageErrorState
          className="mt-0 p-0"
          message={onboardingError}
          title="Could not continue"
        />
      </main>
    )
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4">
      <h1 className="font-semibold text-2xl">Tasks</h1>

      {error ? (
        <div className="space-y-2">
          <InlineErrorCallout>{error}</InlineErrorCallout>
          <Button onClick={resetMutationErrors} type="button" variant="outline">
            Try again
          </Button>
        </div>
      ) : null}

      <section className="flex flex-col gap-2">
        <h2 className="font-medium text-lg">Lists</h2>
        {listsQuery.isPending ? (
          <p className="text-muted-foreground text-sm">Loading lists…</p>
        ) : null}
        {listsError ? (
          <div className="space-y-2">
            <InlineErrorCallout>{listsError}</InlineErrorCallout>
            <Button
              onClick={() => {
                listsQuery.refetch()
              }}
              type="button"
              variant="outline"
            >
              Retry
            </Button>
          </div>
        ) : null}
        <div className="flex flex-wrap gap-2">
          {lists.map(list => (
            <Button
              key={list.id}
              onClick={() => {
                setListId(list.id).then(() => undefined)
              }}
              variant={listId === list.id ? 'default' : 'outline'}
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
            disabled={isMutating || listsQuery.isError}
            onClick={handleCreateList}
          >
            Add list
          </Button>
        </div>
      </section>

      <TaskItemsSection
        listId={listId}
        onSelectTask={handleSelectTask}
        onTaskDeleted={handleTaskDeleted}
        selectedTaskId={selectedTaskId}
      />

      {selectedTaskId ? <TaskAttachmentsPanel taskId={selectedTaskId} /> : null}
    </main>
  )
}
