import { NextResponse } from 'next/server'

import { probeHeaders } from '@/lib/health'

export function GET() {
  return NextResponse.json({ status: 'ok' }, { headers: probeHeaders })
}
