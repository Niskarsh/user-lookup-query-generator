import type { NextApiRequest, NextApiResponse } from 'next'
import { buildEmailLookupQuery } from '../../lib/utils'

type ResponseData =
  | { text: string; values: string[][] }
  | { error: string }

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== 'POST')
    return res.status(405).json({ error: 'Method not allowed' })

  const { emails } = req.body
  if (!Array.isArray(emails) || emails.length === 0) {
    return res.status(400).json({ error: 'No emails provided' })
  }

  try {
    const { text, values } = buildEmailLookupQuery(emails)
    return res.status(200).json({ text, values })
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (err: unknown) {
    return res.status(500).json({ error: 'Query generation failed' })
  }
}
