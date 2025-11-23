import { Button } from "@/components/ui/button";
import { FileText, ExternalLink } from "lucide-react";

interface PDFViewerProps {
  pdfUrl: string;
  height?: string;
}

export function PDFViewer({ pdfUrl, height = "500px" }: PDFViewerProps) {
  const handleOpenPDF = () => {
    window.open(pdfUrl, '_blank');
  };

  const handleDownloadPDF = () => {
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = 'story.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full" data-testid="pdf-viewer">
      <object
        data={pdfUrl}
        type="application/pdf"
        className="w-full rounded-lg border-2 border-muted"
        style={{ height }}
        title="Story PDF"
      >
        <div className="flex flex-col items-center justify-center gap-4 p-8 bg-muted/30 rounded-lg" style={{ height }}>
          <FileText className="w-16 h-16 text-muted-foreground" />
          <p className="text-muted-foreground text-center">
            PDF viewer not available in your browser
          </p>
          <div className="flex gap-3">
            <Button onClick={handleOpenPDF} variant="default" data-testid="button-open-pdf">
              <ExternalLink className="w-4 h-4 mr-2" />
              Open PDF
            </Button>
            <Button onClick={handleDownloadPDF} variant="outline" data-testid="button-download-pdf">
              <FileText className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
          </div>
        </div>
      </object>
    </div>
  );
}
