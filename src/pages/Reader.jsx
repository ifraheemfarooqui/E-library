import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Document, Page, pdfjs } from "react-pdf";
import { supabase } from "../supabase";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Required worker setup
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

export default function Reader() {
  const { id }       = useParams();
  const navigate     = useNavigate();

  const [book, setBook]           = useState(null);
  const [numPages, setNumPages]   = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [zoom, setZoom]           = useState(1.0);
  const [viewMode, setViewMode]   = useState("paginated"); // paginated | scroll
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");

  useEffect(() => {
    fetchBook();
  }, [id]);

  // Save progress when page changes
  useEffect(() => {
    if (book && numPages) saveProgress();
  }, [pageNumber]);

  const fetchBook = async () => {
    const { data, error } = await supabase
      .from("books").select("*").eq("id", id).single();
    if (error) { setError("Book not found."); return; }
    setBook(data);
    setLoading(false);
    await loadProgress(data.id);
  };

  const loadProgress = async (bookId) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("user_books")
      .select("last_page")
      .eq("user_id", user.id)
      .eq("book_id", bookId)
      .single();
    if (data?.last_page) setPageNumber(data.last_page);
  };

  const saveProgress = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !book) return;
    const progress = Math.round((pageNumber / numPages) * 100);
    await supabase.from("user_books").upsert({
      user_id:   user.id,
      book_id:   book.id,
      last_page: pageNumber,
      progress,
      last_read: new Date().toISOString(),
    }, { onConflict: "user_id,book_id" });
  };

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  const goToPage = (n) => {
    const p = Math.max(1, Math.min(n, numPages || 1));
    setPageNumber(p);
  };

  const zoomIn  = () => setZoom(z => Math.min(2.0, parseFloat((z + 0.25).toFixed(2))));
  const zoomOut = () => setZoom(z => Math.max(0.5, parseFloat((z - 0.25).toFixed(2))));

  if (loading) return (
    <div className="min-h-screen bg-[#0e0c1a] flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-[#6c5ce7] border-t-transparent rounded-full animate-spin mx-auto mb-3"/>
        <p className="text-[#9b8fc0] text-sm">Loading book...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-[#0e0c1a] flex items-center justify-center">
      <div className="text-center">
        <p className="text-[#f09595] mb-4">{error}</p>
        <button onClick={() => navigate("/library")}
          className="bg-[#6c5ce7] text-white px-4 py-2 rounded-lg text-sm">
          Back to Library
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-[#0e0c1a] font-[Outfit] text-white overflow-hidden">

      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-3 bg-[#13102b] border-b border-white/8 flex-shrink-0">
        <button onClick={() => navigate("/library")}
          className="flex items-center gap-2 text-[#9b8fc0] hover:text-white text-sm transition">
          ← Library
        </button>
        <div className="text-center flex-1 px-4">
          <p className="font-[Cormorant_Garamond] text-base font-semibold truncate">{book?.title}</p>
          <p className="text-xs text-[#9b8fc0]">{book?.author}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`w-8 h-8 rounded-lg border text-sm flex items-center justify-center transition ${
              sidebarOpen ? "bg-[#6c5ce7] border-[#6c5ce7] text-white" : "bg-white/5 border-white/10 text-[#9b8fc0] hover:text-white"
            }`}>≡</button>
          <a href={book?.file_url} download
            className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-[#9b8fc0] hover:text-white text-sm flex items-center justify-center transition">
            ↓
          </a>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between px-5 py-2 bg-[#0e0c1a] border-b border-white/5 flex-shrink-0 gap-4">

        {/* View toggle */}
        <div className="flex bg-white/5 border border-white/10 rounded-lg p-0.5 gap-0.5">
          {["paginated","scroll"].map(v => (
            <button key={v} onClick={() => setViewMode(v)}
              className={`px-3 py-1 rounded-md text-xs capitalize transition ${
                viewMode === v ? "bg-[#6c5ce7] text-white" : "text-[#9b8fc0] hover:text-white"
              }`}>
              {v}
            </button>
          ))}
        </div>

        {/* Page navigation */}
        {viewMode === "paginated" && (
          <div className="flex items-center gap-2">
            <button onClick={() => goToPage(pageNumber - 1)} disabled={pageNumber <= 1}
              className="flex items-center gap-1 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-[#9b8fc0] hover:text-white disabled:opacity-30 transition">
              ‹ Prev
            </button>
            <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs">
              <input
                type="number" value={pageNumber} min={1} max={numPages || 1}
                onChange={e => goToPage(parseInt(e.target.value))}
                className="bg-transparent outline-none text-white w-8 text-center text-xs"/>
              <span className="text-[#9b8fc0]">/ {numPages || "—"}</span>
            </div>
            <button onClick={() => goToPage(pageNumber + 1)} disabled={pageNumber >= (numPages || 1)}
              className="flex items-center gap-1 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-[#9b8fc0] hover:text-white disabled:opacity-30 transition">
              Next ›
            </button>
          </div>
        )}

        {/* Zoom controls */}
        <div className="flex items-center gap-2">
          <button onClick={zoomOut} disabled={zoom <= 0.5}
            className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 text-[#9b8fc0] hover:text-white disabled:opacity-30 transition flex items-center justify-center text-sm">
            −
          </button>
          <span className="text-xs text-white min-w-[44px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button onClick={zoomIn} disabled={zoom >= 2.0}
            className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 text-[#9b8fc0] hover:text-white disabled:opacity-30 transition flex items-center justify-center text-sm">
            +
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar */}
        {sidebarOpen && (
          <div className="w-52 bg-[#13102b] border-r border-white/5 flex flex-col flex-shrink-0 overflow-hidden">
            <p className="text-[10px] text-[#9b8fc0] uppercase tracking-widest px-4 py-3 border-b border-white/5">
              Book info
            </p>
            <div className="p-4 border-b border-white/5">
              {book?.cover_url
                ? <img src={book.cover_url} alt={book.title}
                    className="w-full aspect-[2/3] object-cover rounded-lg mb-3"/>
                : <div className="w-full aspect-[2/3] bg-[#2D1B69] rounded-lg flex items-center justify-center text-3xl mb-3">📖</div>
              }
              <p className="text-sm font-medium text-white">{book?.title}</p>
              <p className="text-xs text-[#9b8fc0] mt-0.5">{book?.author}</p>
              <span className="text-[10px] bg-[#6c5ce7]/20 text-[#a78bfa] px-2 py-0.5 rounded-full mt-2 inline-block">
                {book?.category}
              </span>
            </div>
            {numPages && (
              <div className="p-4">
                <p className="text-[10px] text-[#9b8fc0] uppercase tracking-widest mb-2">Progress</p>
                <div className="h-1 bg-white/10 rounded-full overflow-hidden mb-1">
                  <div className="h-full bg-[#6c5ce7] rounded-full transition-all"
                    style={{ width: `${Math.round((pageNumber / numPages) * 100)}%` }}/>
                </div>
                <p className="text-xs text-[#9b8fc0]">
                  {Math.round((pageNumber / numPages) * 100)}% · p.{pageNumber} of {numPages}
                </p>
              </div>
            )}
          </div>
        )}

        {/* PDF Canvas */}
        <div className="flex-1 overflow-auto bg-[#1a1728] flex justify-center p-8">
          {book?.file_url ? (
            <Document
              file={book.file_url}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={() => setError("Failed to load PDF.")}
              loading={
                <div className="flex items-center justify-center h-64">
                  <div className="w-8 h-8 border-2 border-[#6c5ce7] border-t-transparent rounded-full animate-spin"/>
                </div>
              }>
              {viewMode === "paginated" ? (
                <Page
                  pageNumber={pageNumber}
                  scale={zoom}
                  renderTextLayer={true}
                  renderAnnotationLayer={true}
                  className="shadow-2xl rounded-sm"
                />
              ) : (
                Array.from({ length: numPages || 0 }, (_, i) => (
                  <div key={i + 1} className="mb-4">
                    <Page
                      pageNumber={i + 1}
                      scale={zoom}
                      renderTextLayer={true}
                      renderAnnotationLayer={true}
                      className="shadow-2xl rounded-sm"
                    />
                  </div>
                ))
              )}
            </Document>
          ) : (
            <div className="text-center text-[#9b8fc0] py-20">
              <p className="text-4xl mb-4 opacity-30">📄</p>
              <p>No PDF file available for this book</p>
            </div>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {numPages && (
        <div className="h-0.5 bg-white/5 flex-shrink-0">
          <div className="h-full bg-[#6c5ce7] transition-all"
            style={{ width: `${Math.round((pageNumber / numPages) * 100)}%` }}/>
        </div>
      )}

      {/* Status bar */}
      <div className="flex items-center justify-between px-5 py-2 bg-[#13102b] border-t border-white/5 flex-shrink-0">
        <span className="text-xs text-[#9b8fc0]">
          Page {pageNumber} of {numPages || "—"} · {book?.category}
        </span>
        <span className="text-xs text-[#9b8fc0]">
          {numPages ? `~${Math.round(((numPages - pageNumber) * 2))} min left` : ""}
        </span>
      </div>
    </div>
  );
}