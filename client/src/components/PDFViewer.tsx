import { useEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./ui/button";

// Set up the worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface PDFViewerProps {
  pdfUrl: string;
  height?: string;
}

export function PDFViewer({ pdfUrl, height = "400px" }: PDFViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pdf, setPdf] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPdf = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch the PDF from the proxy endpoint
        const response = await fetch(pdfUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch PDF: ${response.status}`);
        }
        
        const arrayBuffer = await response.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        
        setPdf(pdf);
        setTotalPages(pdf.numPages);
        setCurrentPage(1);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load PDF");
        console.error("PDF loading error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadPdf();
  }, [pdfUrl]);

  // Render the current page
  useEffect(() => {
    if (!pdf || !canvasRef.current) return;

    const renderPage = async () => {
      try {
        const page = await pdf.getPage(currentPage);
        const viewport = page.getViewport({ scale: 2 });
        
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const context = canvas.getContext("2d");
        if (!context) return;
        
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        
        await page.render({
          canvasContext: context,
          viewport: viewport,
        }).promise;
      } catch (err) {
        console.error("Page rendering error:", err);
      }
    };

    renderPage();
  }, [pdf, currentPage]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center w-full" style={{ height }}>
        <div className="text-gray-500">Loading PDF...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center w-full bg-red-50 dark:bg-red-950 rounded-lg p-4" style={{ height }}>
        <div className="text-red-600 dark:text-red-400 text-center">{error}</div>
      </div>
    );
  }

  return (
    <div className="w-full bg-white dark:bg-gray-700 rounded-lg overflow-hidden flex flex-col">
      <div className="flex-1 overflow-auto flex justify-center" style={{ height }}>
        <canvas ref={canvasRef} className="max-w-full" />
      </div>
      
      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-2 p-3 border-t dark:border-gray-600 bg-gray-50 dark:bg-gray-800">
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
