import { useEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./ui/button";

// Setup worker from node_modules
if (typeof window !== "undefined" && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `/pdfjs-worker-${pdfjsLib.version}.min.js`;
}

interface PDFViewerProps {
  pdfUrl: string;
  height?: string;
}

export function PDFViewer({ pdfUrl, height = "500px" }: PDFViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pdf, setPdf] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const loadPDF = async () => {
      try {
        const response = await fetch(pdfUrl);
        if (!response.ok) throw new Error("Failed to fetch PDF");
        
        const arrayBuffer = await response.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        
        const doc = await loadingTask.promise;
        setPdf(doc);
        setTotalPages(doc.numPages);
        setCurrentPage(1);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load PDF");
      } finally {
        setLoading(false);
      }
    };

    loadPDF();
  }, [pdfUrl]);

  useEffect(() => {
    if (!pdf || !canvasRef.current) return;

    const renderPage = async () => {
      try {
        const page = await pdf.getPage(currentPage);
        const viewport = page.getViewport({ scale: 1.5 });
        
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        
        const context = canvas.getContext("2d");
        if (!context) return;

        await page.render({
          canvasContext: context,
          viewport: viewport,
        }).promise;
      } catch (err) {
        setError("Failed to render page");
      }
    };

    renderPage();
  }, [pdf, currentPage]);

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
    <div
      className="w-full bg-white dark:bg-gray-800 rounded-lg overflow-hidden flex flex-col"
      style={{ height }}
      data-testid="pdf-viewer"
    >
      <div className="flex-1 overflow-auto flex justify-center items-start bg-gray-100 dark:bg-gray-900 p-4">
        <canvas ref={canvasRef} className="shadow-lg" />
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-2 p-3 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            data-testid="button-pdf-prev"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="text-sm text-gray-600 dark:text-gray-400">
            Page {currentPage} of {totalPages}
          </div>

          <Button
            size="icon"
            variant="ghost"
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            data-testid="button-pdf-next"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
