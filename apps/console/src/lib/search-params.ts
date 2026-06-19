export const searchParams = {
  listId: 'listId',
} as const

export type SearchParamName = (typeof searchParams)[keyof typeof searchParams]
