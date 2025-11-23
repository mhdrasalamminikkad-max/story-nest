interface PDFViewerProps {
  pdfUrl: string;
  height?: string;
}

export function PDFViewer({ pdfUrl, height = "500px" }: PDFViewerProps) {
  return (
    <iframe
      src={pdfUrl}
      className="w-full rounded-lg border-0"
      style={{ height }}
      title="Story PDF"
      data-testid="pdf-viewer"
    />
  );
}
