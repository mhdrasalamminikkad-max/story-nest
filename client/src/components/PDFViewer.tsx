import { useEffect, useRef, useState } from "react";

interface PDFViewerProps {
  pdfUrl: string;
  height?: string;
}

export function PDFViewer({ pdfUrl, height = "500px" }: PDFViewerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [blobUrl, setBlobUrl] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const loadPDF = async () => {
      try {
        const response = await fetch(pdfUrl);
        if (!response.ok) throw new Error("Failed to fetch PDF");
        
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setBlobUrl(url);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load PDF");
      } finally {
        setLoading(false);
      }
    };

    loadPDF();

    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [pdfUrl]);

  if (loading) {
    return (
      <div
        className="w-full bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center"
        style={{ height }}
        data-testid="pdf-viewer"
      >
        <div className="text-gray-600 dark:text-gray-400">Loading PDF...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="w-full bg-red-50 dark:bg-red-950 rounded-lg flex items-center justify-center p-4"
        style={{ height }}
        data-testid="pdf-viewer"
      >
        <div className="text-red-600 dark:text-red-400 text-center">{error}</div>
      </div>
    );
  }

  return (
    <iframe
      ref={iframeRef}
      src={`${blobUrl}#toolbar=0&navpanes=0&scrollbar=1`}
      className="w-full rounded-lg border-0"
      style={{ height }}
      title="Story PDF"
      data-testid="pdf-viewer"
    />
  );
}
