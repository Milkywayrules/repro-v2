import { Loader2 } from 'lucide-react'

export function Loader() {
  return (
    <div
      aria-live="polite"
      className="flex h-full items-center justify-center pt-8"
      role="status"
    >
      <Loader2 aria-hidden className="animate-spin" />
      <span className="sr-only">Loading</span>
    </div>
  )
}
