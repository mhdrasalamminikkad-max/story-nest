import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Loader2, Maximize, Minimize } from "lucide-react";
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

interface PDFViewerProps {
  pdfUrl: string;
  height?: string;
}

export function PDFViewer({ pdfUrl, height = "600px" }: PDFViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pdfContainerRef = useRef<HTMLDivElement>(null);
  const [pdf, setPdf] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState(1.5);
  const [isFullscreen, setIsFullscreen] = useState(false);

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
    const handleResize = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const calculatedScale = Math.max(1, containerWidth / 400);
        setScale(calculatedScale);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    if (!pdf || !canvasRef.current) return;

    const renderPage = async () => {
      try {
        const page = await pdf.getPage(currentPage);
        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext('2d');
        if (!context) return;

        const viewport = page.getViewport({ scale });

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
  }, [pdf, currentPage, scale]);

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

  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement && pdfContainerRef.current) {
        await pdfContainerRef.current.requestFullscreen();
      } else if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error('Fullscreen error:', err);
    }
  }, []);

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
    <div 
      ref={pdfContainerRef} 
      className={`w-full flex flex-col gap-4 ${isFullscreen ? 'bg-background p-4' : ''}`} 
      data-testid="pdf-viewer"
    >
      <div className="flex items-center justify-between gap-4 px-2">
        <div className="flex items-center gap-2">
          {totalPages > 1 && (
            <>
              <Button
                size="icon"
                variant="outline"
                onClick={goToPrevPage}
                disabled={currentPage === 1}
                data-testid="button-prev-page"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              
              <span className="text-sm text-muted-foreground min-w-[80px] text-center">
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
            </>
          )}
        </div>
        
        <Button
          size="icon"
          variant="outline"
          onClick={toggleFullscreen}
          data-testid="button-fullscreen"
        >
          {isFullscreen ? (
            <Minimize className="w-4 h-4" />
          ) : (
            <Maximize className="w-4 h-4" />
          )}
        </Button>
      </div>

      <div 
        ref={containerRef} 
        className={`w-full overflow-auto bg-muted/30 rounded-lg flex items-start justify-center p-4 ${isFullscreen ? 'flex-1' : ''}`} 
        style={{ height: isFullscreen ? 'calc(100vh - 80px)' : height }}
      >
        <canvas ref={canvasRef} className="max-w-full h-auto" />
      </div>
    </div>
  );
}
