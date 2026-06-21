import { useEffect } from 'react'

import type { TaskList } from '@repro-v2/api-client'

interface UseSyncSelectedListIdOptions {
  listId: string | null
  lists: TaskList[]
  listsPending: boolean
  setListId: (value: string | null) => Promise<URLSearchParams>
}

export function useSyncSelectedListId({
  listId,
  lists,
  listsPending,
  setListId,
}: UseSyncSelectedListIdOptions) {
  useEffect(() => {
    if (listsPending) {
      return
    }

    if (lists.length === 0) {
      if (listId !== null) {
        setListId(null).then(() => undefined)
      }
      return
    }

    if (listId !== null && lists.some(list => list.id === listId)) {
      return
    }

    setListId(lists[0]?.id ?? null).then(() => undefined)
  }, [listId, lists, listsPending, setListId])
}
