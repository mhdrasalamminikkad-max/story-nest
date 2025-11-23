import { FileDown } from "lucide-react";
import { Button } from "./ui/button";

interface PDFViewerProps {
  pdfUrl: string;
  storyId?: string;
}

export function PDFViewer({ pdfUrl, storyId }: PDFViewerProps) {
  const handleDownload = async () => {
    try {
      const response = await fetch(pdfUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `story-${storyId || "pdf"}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  return (
    <div className="w-full bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
      <div className="flex flex-col items-center justify-center gap-4">
        <div className="text-4xl">📄</div>
        <div className="text-center">
          <p className="font-semibold text-gray-900 dark:text-white mb-2">PDF Story Available</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Click below to download and read the PDF version of this story
          </p>
        </div>
        <Button
          onClick={handleDownload}
          className="gap-2"
          data-testid="button-download-pdf"
        >
          <FileDown className="h-4 w-4" />
          Download PDF
        </Button>
      </div>
    </div>
  );
}
