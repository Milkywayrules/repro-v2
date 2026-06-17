import { NextResponse } from 'next/server'

import { checkApiReady, probeHeaders } from '@/lib/health'

export async function GET() {
  const api = await checkApiReady()
  const ready = api.status === 'pass'

  return NextResponse.json(
    {
      status: ready ? 'ready' : 'not_ready',
      checks: { api },
    },
    {
      status: ready ? 200 : 503,
      headers: probeHeaders,
    },
  )
}
