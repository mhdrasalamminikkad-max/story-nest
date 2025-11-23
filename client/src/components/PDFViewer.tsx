import { Button } from "./ui/button";
import { ExternalLink } from "lucide-react";

interface PDFViewerProps {
  pdfUrl: string;
  height?: string;
}

export function PDFViewer({ pdfUrl, height = "400px" }: PDFViewerProps) {
  const handleOpenPDF = () => {
    window.open(pdfUrl, '_blank');
  };

  return (
    <div 
      className="w-full bg-white dark:bg-gray-700 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center"
      style={{ height }}
      data-testid="pdf-viewer"
    >
      <div className="flex flex-col items-center gap-3">
        <div className="text-3xl">📄</div>
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">PDF Document</p>
        <Button
          onClick={handleOpenPDF}
          variant="default"
          className="gap-2"
          size="sm"
        >
          <ExternalLink className="h-4 w-4" />
          View PDF
        </Button>
      </div>
    </div>
  );
}
