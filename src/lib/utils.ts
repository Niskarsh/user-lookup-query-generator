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
SELECT
  u.*,
  COALESCE(array_agg(s.name) FILTER (WHERE s.name IS NOT NULL), '{}') AS pos_skills
FROM public."user" u
JOIN entity e
  ON e.user_id = u.id
LEFT JOIN proof_of_skill pos
  ON pos.user_id  = u.id
LEFT JOIN skills s
  ON s.id         = pos.skill_id
WHERE u.email ILIKE ANY(${arrayLiteral})
and e.deleted_at IS NULL
and s.deleted_at is null
GROUP BY u.id
;
  `.trim();
}
