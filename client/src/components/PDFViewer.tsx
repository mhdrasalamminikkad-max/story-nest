interface PDFViewerProps {
  pdfUrl: string;
  height?: string;
}

export function PDFViewer({ pdfUrl, height = "400px" }: PDFViewerProps) {
  return (
    <embed
      src={pdfUrl}
      type="application/pdf"
      className="w-full rounded-lg"
      style={{ height, display: "block" }}
      data-testid="pdf-viewer"
    />
  );
}
