export const routes = {
  home: '/',
  dashboard: '/dashboard',
  tasks: '/tasks',
  login: '/login',
} as const

export type AppRoute = (typeof routes)[keyof typeof routes]
