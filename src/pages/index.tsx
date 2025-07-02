import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import Papa from "papaparse";
import styles from "../styles/Home.module.css";

type ApiResponse = { query: string; count: number };

export default function Home() {
  const [sql, setSql] = useState("");
  const [count, setCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const onDrop = useCallback((files: File[]) => {
    setError(null);
    setLoading(true);
    const file = files[0];

    Papa.parse<string[]>(file, {
      skipEmptyLines: true,
      complete: async (res) => {
        const emailRe = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
        const all = res.data.flat();
        const emails = Array.from(
          new Set(
            all
              .map((cell) => {
                const m = cell.match(emailRe);
                return m ? m[0].toLowerCase() : null;
              })
              .filter((e): e is string => !!e)
          )
        );

        if (emails.length === 0) {
          setError("No valid emails found in the CSV.");
          setLoading(false);
          return;
        }

        try {
          const resp = await fetch("/api/generate-query", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ emails }),
          });
          const data = (await resp.json()) as ApiResponse;
          if (!resp.ok) throw new Error((data as any).error || "Error");
          setSql(data.query);
          setCount(data.count);
        } catch (e: any) {
          setError(e.message);
        } finally {
          setLoading(false);
        }
      },
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "text/csv": [".csv"] },
    multiple: false,
  });

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>CSV → PostgreSQL Query Generator</h1>

      <div
        {...getRootProps()}
        className={`${styles.dropzone} ${
          isDragActive ? styles.dropzoneActive : ""
        }`}
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <p>Drop your CSV here…</p>
        ) : (
          <p>Drag & drop a CSV, or click to select one</p>
        )}
      </div>

      {loading && <p className={styles.status}>Processing…</p>}
      {error && <p className={styles.error}>{error}</p>}

      {sql && (
        <div className={styles.results}>
          <div className={styles.resultsHeader}>
            <span>
              Emails captured: <strong>{count}</strong>
            </span>
            <button
              onClick={copyToClipboard}
              className={`${styles.copyBtn} ${
                copied ? styles.copyBtnActive : ""
              }`}
              aria-live="polite"
            >
              {copied ? "Copied!" : "Copy PostgreSQL"}
            </button>
          </div>
          <pre className={styles.sqlBlock}>{sql}</pre>
        </div>
      )}
    </div>
  );
}
