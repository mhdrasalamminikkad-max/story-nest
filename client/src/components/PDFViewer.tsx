import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown, Loader2, Maximize, Minimize } from "lucide-react";
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

interface PDFViewerProps {
  pdfUrl: string;
  height?: string;
  fillScreen?: boolean;
  onPdfLoaded?: () => void;
}

// Static cache for PDF documents to enable instant loading
const pdfCache = new Map<string, any>();

export function PDFViewer({ pdfUrl, height = "600px", fillScreen = false, onPdfLoaded }: PDFViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pdfContainerRef = useRef<HTMLDivElement>(null);
  const canvasesRef = useRef<Map<number, HTMLCanvasElement>>(new Map());
  const [pdf, setPdf] = useState<any>(pdfCache.get(pdfUrl) || null);
  const [totalPages, setTotalPages] = useState(pdfCache.get(pdfUrl)?.numPages || 0);
  const [loading, setLoading] = useState(!pdfCache.has(pdfUrl));
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState(1.2);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [renderedPages, setRenderedPages] = useState<Set<number>>(new Set());

  useEffect(() => {
    let isMounted = true;
    let loadingTask: any = null;

    const loadPDF = async () => {
      // If already in cache, just update the state and return
      if (pdfCache.has(pdfUrl)) {
        const cachedPdf = pdfCache.get(pdfUrl);
        setPdf(cachedPdf);
        setTotalPages(cachedPdf.numPages);
        setLoading(false);
        if (onPdfLoaded) onPdfLoaded();
        return;
      }

      try {
        setLoading(true);
        setError(null);

        loadingTask = pdfjsLib.getDocument({
          url: pdfUrl,
          withCredentials: false,
          isEvalSupported: false,
          cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/',
          // Optimization: Disable font face for faster loading if possible
          disableFontFace: true,
        });
        
        const pdfDoc = await loadingTask.promise;

        if (isMounted) {
          pdfCache.set(pdfUrl, pdfDoc);
          setPdf(pdfDoc);
          setTotalPages(pdfDoc.numPages);
          setLoading(false);
          if (onPdfLoaded) {
            setTimeout(onPdfLoaded, 0);
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setError(`Unable to load PDF: ${err?.message || 'Unknown error'}`);
          setLoading(false);
        }
      }
    };

    loadPDF();

    return () => {
      isMounted = false;
    };
  }, [pdfUrl, onPdfLoaded]);

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const calculatedScale = Math.max(1, containerWidth / 500);
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

  // Render all pages in scrollable container
  useEffect(() => {
    if (!pdf) return;

    const renderAllPages = async () => {
      const newRendered = new Set<number>();
      
      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        if (renderedPages.has(pageNum)) {
          newRendered.add(pageNum);
          continue;
        }

        try {
          const canvas = canvasesRef.current.get(pageNum);
          if (!canvas) continue;

          const page = await pdf.getPage(pageNum);
          const context = canvas.getContext('2d');
          if (!context) continue;

          const viewport = page.getViewport({ scale });

          canvas.height = viewport.height;
          canvas.width = viewport.width;

          const renderContext = {
            canvasContext: context,
            viewport: viewport,
          };

          await page.render(renderContext).promise;
          newRendered.add(pageNum);
        } catch (err) {
          console.error(`Error rendering page ${pageNum}:`, err);
        }
      }

      setRenderedPages(newRendered);
    };

    renderAllPages();
  }, [pdf, totalPages, scale]);

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

  const scrollToTop = () => {
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const scrollToBottom = () => {
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: containerRef.current.scrollHeight, behavior: 'smooth' });
    }
  };

  const containerHeight = fillScreen ? 'calc(100vh - 120px)' : height;
  const containerClasses = fillScreen 
    ? 'w-full flex flex-col flex-1' 
    : 'w-full flex flex-col gap-4';

  if (loading) {
    return (
      <div 
        className={`w-full flex flex-col items-center justify-center ${fillScreen ? 'flex-1' : 'bg-muted/30 rounded-lg p-8'}`} 
        style={{ height: fillScreen ? undefined : height }} 
        data-testid="pdf-viewer"
      >
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Loading PDF...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div 
        className={`w-full flex flex-col items-center justify-center ${fillScreen ? 'flex-1' : 'bg-destructive/10 rounded-lg p-8'}`} 
        style={{ height: fillScreen ? undefined : height }} 
        data-testid="pdf-viewer"
      >
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <div 
      ref={pdfContainerRef} 
      className={`${containerClasses} ${isFullscreen ? 'bg-background p-4' : ''}`} 
      data-testid="pdf-viewer"
    >
      <div className="flex items-center justify-between gap-4 px-2 py-2 sticky top-0 bg-background z-10 border-b">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {totalPages} pages
          </span>
          
          <Button
            size="icon"
            variant="outline"
            onClick={scrollToTop}
            title="Scroll to top"
            data-testid="button-scroll-top"
          >
            <ChevronUp className="w-4 h-4" />
          </Button>
          
          <Button
            size="icon"
            variant="outline"
            onClick={scrollToBottom}
            title="Scroll to bottom"
            data-testid="button-scroll-bottom"
          >
            <ChevronDown className="w-4 h-4" />
          </Button>
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
        className={`w-full overflow-y-auto overflow-x-hidden flex flex-col items-center gap-4 ${fillScreen ? 'flex-1' : 'bg-muted/30 rounded-lg p-4'} ${isFullscreen ? 'flex-1' : ''}`} 
        style={{ height: isFullscreen ? 'calc(100vh - 80px)' : (fillScreen ? undefined : height) }}
      >
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
          <canvas 
            key={pageNum}
            ref={(el) => {
              if (el) {
                canvasesRef.current.set(pageNum, el);
              }
            }}
            className="max-w-full h-auto shadow-md border border-border rounded"
          />
        ))}
      </div>
    </div>
  );
}
