import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.js?url';

// Set the worker source to the correct version
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

interface PDFViewerProps {
  pdfUrl: string;
  height?: string;
}

export function PDFViewer({ pdfUrl, height = "600px" }: PDFViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pdf, setPdf] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    let loadingTask: any = null;

    const loadPDF = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('Loading PDF from:', pdfUrl);

        loadingTask = pdfjsLib.getDocument({
          url: pdfUrl,
          withCredentials: false,
          isEvalSupported: false,
          cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/',
        });
        
        const pdfDoc = await loadingTask.promise;

        if (isMounted) {
          console.log('PDF loaded successfully, pages:', pdfDoc.numPages);
          setPdf(pdfDoc);
          setTotalPages(pdfDoc.numPages);
          setLoading(false);
        }
      } catch (err: any) {
        if (isMounted) {
          const errorMsg = err?.message || JSON.stringify(err) || 'Unknown error';
          console.error('Error loading PDF - Full Error:', err);
          console.error('Error Message:', errorMsg);
          setError(`Unable to load PDF: ${errorMsg}`);
          setLoading(false);
        }
      }
    };

    loadPDF();

    return () => {
      isMounted = false;
      if (loadingTask) {
        loadingTask.destroy();
      }
    };
  }, [pdfUrl]);

  useEffect(() => {
    if (!pdf || !canvasRef.current) return;

    const renderPage = async () => {
      try {
        const page = await pdf.getPage(currentPage);
        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext('2d');
        if (!context) return;

        const viewport = page.getViewport({ scale: 1.5 });

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        await page.render(renderContext).promise;
      } catch (err) {
        console.error('Error rendering page:', err);
      }
    };

    renderPage();
  }, [pdf, currentPage]);

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  if (loading) {
    return (
      <div className="w-full flex flex-col items-center justify-center bg-muted/30 rounded-lg p-8" style={{ height }} data-testid="pdf-viewer">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Loading PDF...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full flex flex-col items-center justify-center bg-destructive/10 rounded-lg p-8" style={{ height }} data-testid="pdf-viewer">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-4" data-testid="pdf-viewer">
      <div className="w-full overflow-auto bg-muted/30 rounded-lg flex items-center justify-center p-4" style={{ height }}>
        <canvas ref={canvasRef} className="max-w-full h-auto" />
      </div>
      
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <Button
            size="icon"
            variant="outline"
            onClick={goToPrevPage}
            disabled={currentPage === 1}
            data-testid="button-prev-page"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          
          <Button
            size="icon"
            variant="outline"
            onClick={goToNextPage}
            disabled={currentPage === totalPages}
            data-testid="button-next-page"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
