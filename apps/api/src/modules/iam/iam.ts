import { db } from '@repro-v2/db'
import { createIam } from '@repro-v2/iam'

export const iam = createIam(db)
