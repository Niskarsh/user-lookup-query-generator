/**
 * buildEmailLookupQuery:
 * - Wraps each raw email with `%…%` for “contains” matching.
 * - Returns SQL text and values array for `$1::text[]`.
 */
export function buildEmailLookupQuery(emails: string[]): {
    text: string
    values: string[][]
  } {
    const patterns = emails
      .map(e => e.trim().toLowerCase())
      .filter(e => e)
      .map(e => `%${e}%`)
  
    const text = `
      SELECT *
      FROM public."user"
      WHERE email ILIKE ANY($1::text[])
    `
    return { text, values: [patterns] }
  }
  