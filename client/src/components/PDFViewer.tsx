interface PDFViewerProps {
  pdfUrl: string;
  height?: string;
}

export function PDFViewer({ pdfUrl, height = "400px" }: PDFViewerProps) {
  return (
    <div className="w-full bg-white dark:bg-gray-700 rounded-lg overflow-hidden" style={{ height }}>
      <object
        data={pdfUrl}
        type="application/pdf"
        className="w-full h-full"
        data-testid="pdf-viewer"
      >
        <iframe
          src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0`}
          className="w-full h-full border-0"
          title="Story PDF"
        />
      </object>
    </div>
  );
}
