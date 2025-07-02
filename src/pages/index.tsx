import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import Papa from 'papaparse'

export default function Home() {
  const [sqlText, setSqlText] = useState('')
  const [sqlValues, setSqlValues] = useState<string[][]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const onDrop = useCallback((files: File[]) => {
    setError('')
    setLoading(true)
    const file = files[0]

    Papa.parse<string[]>(file, {
      skipEmptyLines: true,
      complete: async result => {
        const cells = result.data.flat()
        const emailRegex = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i
        const emails = Array.from(
          new Set(
            cells
              .map(cell => {
                const m = cell.match(emailRegex)
                return m?.[0].toLowerCase() ?? null
              })
              .filter((e): e is string => !!e)
          )
        )
        if (emails.length === 0) {
          setError('No emails found in CSV.')
          setLoading(false)
          return
        }

        try {
          const resp = await fetch('/api/generate-query', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ emails }),
          })
          const data = await resp.json()
          if (!resp.ok) throw new Error(data.error || 'Unknown error')
          setSqlText(data.text.trim())
          setSqlValues(data.values)
        } catch (e: unknown) {
          if (e instanceof Error) {
            setError(e instanceof Error ? e.message : 'An unknown error occurred.')
          } else {
            setError('An unknown error occurred.')
          }
          if (e instanceof Error) {
            setError(e.message)
          } else {
            setError('An unknown error occurred.')
          }
        } finally {
          setLoading(false)
        }
      },
    })
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv']
    },
    multiple: false,
  });

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-2xl font-semibold mb-4">
        CSV → SQL Query Generator
      </h1>
      <div
        {...getRootProps()}
        className={`border-2 border-dashed p-6 text-center rounded ${
          isDragActive ? 'border-blue-400' : 'border-gray-300'
        }`}
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <p>Drop CSV here …</p>
        ) : (
          <p>Drag & drop a CSV, or click to select one.</p>
        )}
      </div>

      {loading && <p className="mt-4">Processing…</p>}
      {error && <p className="mt-4 text-red-600">{error}</p>}

      {sqlText && (
        <div className="mt-6 bg-white p-4 rounded shadow">
          <h2 className="font-medium">Generated SQL:</h2>
          <pre className="mt-2 whitespace-pre-wrap">{sqlText}</pre>

          <h2 className="font-medium mt-4">Values Array:</h2>
          <pre className="mt-2">{JSON.stringify(sqlValues, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}
