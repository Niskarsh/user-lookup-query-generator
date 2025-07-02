import type { NextApiRequest, NextApiResponse } from "next";
import { buildSqlQuery } from "../../lib/utils";

type Data =
  | { query: string; count: number }
  | { error: string };

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  const { emails } = req.body;
  if (!Array.isArray(emails) || emails.length === 0) {
    return res.status(400).json({ error: "No emails provided" });
  }

  const query = buildSqlQuery(emails);
  const count = Array.from(new Set(emails.map((e) => e.trim().toLowerCase())))
    .filter((e) => e.length > 0).length;

  if (!query) {
    return res.status(400).json({ error: "No valid emails extracted" });
  }

  res.status(200).json({ query, count });
}
