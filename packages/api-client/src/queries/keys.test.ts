import { describe, expect, test } from 'bun:test'

import { taskKeys, taskListKeys } from './keys'

describe('taskListKeys', () => {
  test('builds hierarchical keys', () => {
    expect(taskListKeys.all).toEqual(['task-lists'])
    expect(taskListKeys.lists()).toEqual(['task-lists', 'list'])
  })
})

describe('taskKeys', () => {
  test('scopes list queries by listId', () => {
    expect(taskKeys.list('abc')).toEqual(['tasks', 'list', { listId: 'abc' }])
  })
})
