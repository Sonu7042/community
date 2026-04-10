import { useMemo, useState } from 'react';

const isCloudinaryUrl = (url = '') => url.includes('/res.cloudinary.com/');

const getCloudinaryPagePreviewUrl = (url, page) => {
  if (!isCloudinaryUrl(url) || !url.includes('/upload/')) {
    return '';
  }

  return url.replace('/upload/', `/upload/pg_${page},f_jpg,q_auto:good,w_1200/`);
};

const getCloudinaryDownloadUrl = (url) => {
  if (!isCloudinaryUrl(url) || !url.includes('/upload/')) {
    return url;
  }

  return url.replace('/upload/', '/upload/fl_attachment/');
};

function PdfPreview({ pdfUrl, pdfName, downloadUrl = '', className = '' }) {
  const [currentPage, setCurrentPage] = useState(1);

  const pagePreviewUrl = useMemo(
    () => getCloudinaryPagePreviewUrl(pdfUrl, currentPage),
    [currentPage, pdfUrl]
  );

  const resolvedDownloadUrl = useMemo(() => {
    if (downloadUrl) {
      return downloadUrl;
    }

    return getCloudinaryDownloadUrl(pdfUrl);
  }, [downloadUrl, pdfUrl]);

  const handleDownload = () => {
    if (!resolvedDownloadUrl) {
      return;
    }

    const link = document.createElement('a');
    link.href = resolvedDownloadUrl;
    link.rel = 'noopener';
    link.download = pdfName || 'document.pdf';

    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className={`overflow-hidden rounded-2xl border border-stroke bg-[#1f1f1f] ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stroke/70 px-4 py-3">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.18em] text-red-300">PDF</p>
          <p className="mt-1 truncate text-sm font-semibold text-white">
            {pdfName || 'PDF document'}
          </p>
          <p className="mt-1 text-xs text-textSoft">Page {currentPage} preview</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            className="rounded-full border border-stroke px-3 py-1 text-xs font-semibold text-white transition hover:border-sky-500 hover:text-sky-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Page 1
          </button>
          <button
            type="button"
            onClick={() => setCurrentPage(2)}
            disabled={currentPage === 2}
            className="rounded-full border border-stroke px-3 py-1 text-xs font-semibold text-white transition hover:border-sky-500 hover:text-sky-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Page 2
          </button>
          <button
            type="button"
            onClick={handleDownload}
            disabled={!resolvedDownloadUrl}
            className="rounded-full bg-[#313131] px-3 py-1 text-xs font-semibold text-white transition hover:bg-[#3a3a3a] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Download
          </button>
        </div>
      </div>

      <div className="px-3 pb-3 pt-3">
        {pagePreviewUrl ? (
          <img
            src={pagePreviewUrl}
            alt={`${pdfName || 'PDF'} page ${currentPage}`}
            className="h-auto w-full rounded-xl border border-stroke bg-[#151515] object-contain"
          />
        ) : (
          <div className="rounded-xl border border-stroke bg-[#151515] p-5 text-sm text-textSoft">
            PDF preview is unavailable for this file. Use Download.
          </div>
        )}
      </div>
    </div>
  );
}

export default PdfPreview;
