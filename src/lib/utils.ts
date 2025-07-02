/**
 * Given a list of emails, returns a single SQL string
 * you can copy & run. No wildcards—pure ILIKE matching.
 */
export function buildSqlQuery(emails: string[]): string {
  // dedupe + trim + lowercase
  const uniq = Array.from(
    new Set(
      emails
        .map((e) => e.trim().toLowerCase())
        .filter((e) => e.length > 0)
    )
  );

  // If no emails, return empty
  if (uniq.length === 0) return "";

  // Escape single quotes in emails (defensive)
  const escaped = uniq.map((e) => e.replace(/'/g, "''"));

  // Build the ARRAY['a','b',...] literal
  const arrayLiteral = `ARRAY[${escaped
    .map((e) => `'${e}'`)
    .join(", ")}]::text[]`;

  // Final SQL
  return `
SELECT *
FROM public."user"
WHERE email ILIKE ANY(${arrayLiteral});
  `.trim();
}
