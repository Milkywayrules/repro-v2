import { createAuth } from '@repro-v2/auth'
import { db } from '@repro-v2/db'

export const auth = createAuth(db)
