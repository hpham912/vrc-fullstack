// Shared download service — the one place that knows how to trigger a
// file download in the browser. The UI (which button, which icon, which
// label) is the caller's job; the export logic lives here so any screen
// can download a file by calling one function, without duplicating the
// temporary-anchor dance.
//
// Two entry points, both synchronous and dependency-free:
// - downloadFromUrl(url, filename): download a file that already exists
//   at a URL (e.g. a static asset in public/, or a signed URL from the
//   server). The browser saves it under `filename`.
// - downloadText(content, filename, mimeType): download generated text
//   content as a file (e.g. an exported CSV built from data in memory).
//   The content is wrapped in a Blob, so the caller never touches URLs.
//
// In the app WebView a download may open the file on screen instead of
// saving it — that is platform behaviour, not something this service
// can change. In a desktop/mobile browser it saves the file.
function triggerDownload(href: string, filename: string, revokeUrl?: string): void {
  const link = document.createElement('a');
  link.href = href;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  if (revokeUrl) {
    URL.revokeObjectURL(revokeUrl);
  }
}

export function downloadFromUrl(url: string, filename: string): void {
  triggerDownload(url, filename);
}

export function downloadText(
  content: string,
  filename: string,
  mimeType = 'text/csv;charset=utf-8'
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  triggerDownload(url, filename, url);
}
