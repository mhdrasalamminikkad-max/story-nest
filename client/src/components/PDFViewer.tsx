interface PDFViewerProps {
  pdfUrl: string;
  height?: string;
}

export function PDFViewer({ pdfUrl, height = "600px" }: PDFViewerProps) {
  return (
    <div className="w-full" data-testid="pdf-viewer">
      <embed
        src={pdfUrl}
        type="application/pdf"
        className="w-full rounded-lg border-2 border-muted"
        style={{ height }}
        title="Story PDF"
      />
    </div>
  );
}
