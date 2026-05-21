import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabase";
import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

export default function Reader() {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const canvasRef          = useRef(null);
  const scrollContainerRef = useRef(null);
  const renderTask         = useRef(null);

  const [book, setBook]               = useState(null);
  const [pdfDoc, setPdfDoc]           = useState(null);
  const [pageNumber, setPageNumber]   = useState(1);
  const [numPages, setNumPages]       = useState(null);
  const [zoom, setZoom]               = useState(1.2);
  const [viewMode, setViewMode]       = useState("paginated");
const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);
  const [loading, setLoading]         = useState(true);
  const [rendering, setRendering]     = useState(false);
  const [error, setError]             = useState("");

  const isRendering = useRef(false);
  const zoomRef = useRef(zoom);

  // Load book on mount
useEffect(() => {
  fetchBook();
}, [id]);

// Render page ONLY when pageNumber changes
useEffect(() => {
  if (pdfDoc && viewMode === "paginated") {
    renderPage(pageNumber);
  }
}, [pdfDoc, pageNumber]);

useEffect(() => {
  if (!pdfDoc) return;
  if (viewMode === "paginated") {
    renderPage(pageNumber, zoom);
  } else {
    renderAllPages();
  }
}, [zoom]);

// View mode switched
useEffect(() => {
  if (!pdfDoc) return;
  if (viewMode === "scroll") {
    isRendering.current = false; // reset lock
    setTimeout(() => renderAllPages(), 100);
  } else {
    setTimeout(() => renderPage(pageNumber), 100);
  }
}, [viewMode]);

// Save progress
useEffect(() => {
  if (book?.id && pageNumber && numPages) {
    saveProgress(book.id, pageNumber, numPages);
  }
}, [pageNumber, numPages, book]);

  const fetchBook = async () => {
    const { data, error } = await supabase
      .from("books")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      setError("Book not found.");
      setLoading(false);
      return;
    }

    setBook(data);
    setLoading(false);
    if (data.file_url) loadPDF(data.file_url);
  };

const loadPDF = async (url) => {
  try {
    // ✅ Step 1 — get saved page first
    const savedPage = await loadProgress(id);

    // ✅ Step 2 — load the PDF
    const loadingTask = pdfjsLib.getDocument({ url, withCredentials: false });
    const pdf = await loadingTask.promise;

    // ✅ Step 3 — set page number BEFORE pdfDoc
    setNumPages(pdf.numPages);
    if (savedPage > 1) setPageNumber(savedPage);

    // ✅ Step 4 — set pdfDoc LAST so useEffect fires with correct page
    setPdfDoc(pdf);

  } catch (err) {
    console.error("PDF load error:", err);
    setError("Failed to load PDF: " + err.message);
  }
};

 const renderPage = async (num) => {
    if (!pdfDoc || !canvasRef.current) return;

    if (renderTask.current) {
      renderTask.current.cancel();
      renderTask.current = null;
    }

    setRendering(true);
    try {
      const page     = await pdfDoc.getPage(num);
      const viewport = page.getViewport({ scale: zoom });
      const canvas   = canvasRef.current;
      const ctx      = canvas.getContext("2d");

      canvas.width  = viewport.width;
      canvas.height = viewport.height;


      canvas.style.width = `${viewport.width}px`;
canvas.style.height = `${viewport.height}px`;

      const task = page.render({ canvasContext: ctx, viewport });
      renderTask.current = task;
      await task.promise;
    } catch (err) {
      if (err?.name !== "RenderingCancelledException") {
        console.error("Render error:", err);
      }
    } finally {
      setRendering(false);
    }
  };

 const renderAllPages = async () => {
  if (!pdfDoc || !scrollContainerRef.current) return;
  if (isRendering.current) return; // ✅ prevent duplicate calls

  isRendering.current = true;
  const container = scrollContainerRef.current;
  container.innerHTML = "";
  setRendering(true);

  const totalPages = pdfDoc.numPages;
  const canvases = [];
  

  for (let i = 1; i <= totalPages; i++) {
    const wrapper         = document.createElement("div");
    wrapper.style.cssText = "margin-bottom:16px;position:relative;display:flex;justify-content:center;";

    const canvas          = document.createElement("canvas");
    canvas.style.cssText  = "display:block;box-shadow:0 4px 24px rgba(0,0,0,0.4);";

    const badge           = document.createElement("div");
    badge.textContent     = `Page ${i}`;
    badge.style.cssText   = "position:absolute;bottom:8px;right:8px;background:rgba(0,0,0,0.5);color:#fff;font-size:11px;padding:2px 8px;border-radius:4px;font-family:Outfit,sans-serif;pointer-events:none;";

    wrapper.appendChild(canvas);
    wrapper.appendChild(badge);
    container.appendChild(wrapper);
    canvases.push({ canvas, pageNum: i });
  }

  for (const { canvas, pageNum } of canvases) {
    try {
      const page     = await pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale: zoom });
      canvas.width   = viewport.width;
      canvas.height  = viewport.height;
      const ctx      = canvas.getContext("2d");
      await page.render({ canvasContext: ctx, viewport }).promise;
    } catch (err) {
      console.error(`Error rendering page ${pageNum}:`, err);
    }
  }

  isRendering.current = false; // ✅ release lock
  setRendering(false);
};

  const handleViewMode = (v) => {
    setViewMode(v);
    if (v === "scroll" && pdfDoc) {
      setTimeout(() => renderAllPages(), 100);
    }
    if (v === "paginated" && pdfDoc) {
      setTimeout(() => renderPage(pageNumber), 100);
    }
  };

const loadProgress = async (bookId) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 1;
  const { data } = await supabase
    .from("user_books")
    .select("last_page")
    .eq("user_id", user.id)
    .eq("book_id", bookId)
    .single();
  return data?.last_page || 1; // ✅ return the page instead of setting it
};



const saveProgress = async (bookId, page, totalPages) => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const progress = totalPages ? Math.round((page / totalPages) * 100) : 0;

  const { error } = await supabase
    .from("user_books")
    .upsert(
      {
        user_id: user.id,
        book_id: bookId,
        last_page: page,
        progress: progress, // ✅ added
        last_read: new Date(),
      },
      {
        onConflict: "user_id,book_id",
      }
    );

  if (error) {
    console.error("Save progress failed:", error);
  }
};
  const goToPage = (n) => {
    const p = Math.max(1, Math.min(Number(n), numPages || 1));
    setPageNumber(p);
  };
const zoomIn  = () => {
  const newZoom = Math.min(3.0, parseFloat((zoom + 0.2).toFixed(1)));
  setZoom(newZoom);
  zoomRef.current = newZoom; // ✅ always up to date
};

const zoomOut = () => {
  const newZoom = Math.max(0.5, parseFloat((zoom - 0.2).toFixed(1)));
  setZoom(newZoom);
  zoomRef.current = newZoom; // ✅ always up to date
};

  // ── Loading screen ──────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen bg-[#0e0c1a] flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-[#6c5ce7] border-t-transparent rounded-full animate-spin mx-auto mb-3"/>
        <p className="text-[#9b8fc0] text-sm">Loading book...</p>
      </div>
    </div>
  );

  // ── Error screen ─────────────────────────────────────────────────
  if (error) return (
    <div className="min-h-screen bg-[#0e0c1a] flex items-center justify-center">
      <div className="text-center">
        <p className="text-5xl mb-4">📄</p>
        <p className="text-[#f09595] mb-4">{error}</p>
        <button onClick={() => navigate("/library")}
          className="bg-[#6c5ce7] text-white px-5 py-2 rounded-lg text-sm hover:bg-[#7c6cf0] transition">
          Back to Library
        </button>
      </div>
    </div>
  );

  // ── Main reader ───────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen bg-[#0e0c1a] font-[Outfit] text-white overflow-hidden">

      {/* ── Top bar ── */}
<div className="flex items-center justify-between px-3 py-2.5 bg-[#13102b] border-b border-white/8 flex-shrink-0">
  <button onClick={() => navigate("/library")}
    className="flex items-center gap-1 text-[#9b8fc0] hover:text-white text-xs sm:text-sm transition flex-shrink-0">
    ← <span className="hidden sm:inline">Library</span>
  </button>
  <div className="text-center flex-1 px-2 min-w-0">
    <p className="font-[Cormorant_Garamond] text-sm sm:text-base font-semibold truncate">{book?.title}</p>
    <p className="text-[10px] sm:text-xs text-[#9b8fc0] hidden sm:block truncate">{book?.author}</p>
  </div>
  <div className="flex items-center gap-1.5 flex-shrink-0">
    <button onClick={() => setSidebarOpen(!sidebarOpen)}
      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg border text-xs sm:text-sm flex items-center justify-center transition ${
        sidebarOpen ? "bg-[#6c5ce7] border-[#6c5ce7] text-white" : "bg-white/5 border-white/10 text-[#9b8fc0]"
      }`}>≡</button>
    <a href={book?.file_url} target="_blank" rel="noreferrer"
      className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white/5 border border-white/10 text-[#9b8fc0] hover:text-white text-xs sm:text-sm flex items-center justify-center transition">
      ↓
    </a>
  </div>
</div>

      {/* ── Toolbar ── */}
      <div className="flex items-center px-3 py-1.5 sm:py-2 bg-[#0e0c1a] border-b border-white/5 flex-shrink-0 gap-2 overflow-x-auto scrollbar-none">

        {/* View toggle */}
    <div className="flex bg-white/5 border border-white/10 rounded-lg p-0.5 gap-0.5 flex-shrink-0">
    {["paginated","scroll"].map(v => (
      <button key={v} onClick={() => handleViewMode(v)}
        className={`px-2 py-0.5 sm:py-1 rounded-md text-[10px] sm:text-xs capitalize transition ${
          viewMode === v ? "bg-[#6c5ce7] text-white" : "text-[#9b8fc0] hover:text-white"
        }`}>
        {v}
      </button>
    ))}
  </div>

        {/* Page navigation — paginated only */}
  {viewMode === "paginated" && (
    <div className="flex items-center gap-1 flex-shrink-0">
      <button onClick={() => goToPage(pageNumber - 1)} disabled={pageNumber <= 1}
        className="w-6 h-6 sm:w-7 sm:h-7 bg-white/5 border border-white/10 rounded-lg text-xs text-[#9b8fc0] hover:text-white disabled:opacity-30 transition flex items-center justify-center">
        ‹
      </button>
      <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-[10px] sm:text-xs">
        <input type="number" value={pageNumber} min={1} max={numPages || 1}
          onChange={e => goToPage(e.target.value)}
          className="bg-transparent outline-none text-white w-6 sm:w-8 text-center text-[10px] sm:text-xs"/>
        <span className="text-[#9b8fc0]">/ {numPages || "—"}</span>
      </div>
      <button onClick={() => goToPage(pageNumber + 1)} disabled={pageNumber >= (numPages || 1)}
        className="w-6 h-6 sm:w-7 sm:h-7 bg-white/5 border border-white/10 rounded-lg text-xs text-[#9b8fc0] hover:text-white disabled:opacity-30 transition flex items-center justify-center">
        ›
      </button>
    </div>
  )}

  {viewMode === "scroll" && (
    <p className="text-[10px] sm:text-xs text-[#9b8fc0] flex-shrink-0">
      {rendering ? "Rendering..." : `${numPages || "—"} pages`}
    </p>
  )}

        {/* Zoom */}
  <div className="flex items-center gap-1 flex-shrink-0 ml-auto">
    <button onClick={zoomOut} disabled={zoom <= 0.5}
      className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-white/5 border border-white/10 text-[#9b8fc0] hover:text-white disabled:opacity-30 transition flex items-center justify-center text-xs">
      −
    </button>
    <span className="text-[10px] sm:text-xs text-white min-w-[36px] text-center">{Math.round(zoom * 100)}%</span>
    <button onClick={zoomIn} disabled={zoom >= 3.0}
      className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-white/5 border border-white/10 text-[#9b8fc0] hover:text-white disabled:opacity-30 transition flex items-center justify-center text-xs">
      +
    </button>
  </div>
</div>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar */}
        {sidebarOpen && (
          <div className="w-52 bg-[#13102b] border-r border-white/5 flex flex-col flex-shrink-0 overflow-y-auto">
            <p className="text-[10px] text-[#9b8fc0] uppercase tracking-widest px-4 py-3 border-b border-white/5">
              Book info
            </p>
            <div className="p-4 border-b border-white/5">
              {book?.cover_url
                ? <img src={book.cover_url} alt={book.title}
                    className="w-full aspect-[2/3] object-cover rounded-lg mb-3"/>
                : <div className="w-full aspect-[2/3] bg-[#2D1B69] rounded-lg flex items-center justify-center text-3xl mb-3">
                    📖
                  </div>
              }
              <p className="text-sm font-medium text-white">{book?.title}</p>
              <p className="text-xs text-[#9b8fc0] mt-0.5 mb-2">{book?.author}</p>
              <span className="text-[10px] bg-[#6c5ce7]/20 text-[#a78bfa] px-2 py-0.5 rounded-full">
                {book?.category}
              </span>
            </div>
            {numPages && (
              <div className="p-4">
                <p className="text-[10px] text-[#9b8fc0] uppercase tracking-widest mb-2">Progress</p>
                <div className="h-1 bg-white/10 rounded-full overflow-hidden mb-1">
                  <div
                    className="h-full bg-[#6c5ce7] rounded-full transition-all"
                    style={{ width: `${Math.round((pageNumber / numPages) * 100)}%` }}/>
                </div>
                <p className="text-xs text-[#9b8fc0]">
                  {Math.round((pageNumber / numPages) * 100)}% · p.{pageNumber} of {numPages}
                </p>
              </div>
            )}
            {/* Description */}
            {book?.description && (
              <div className="p-4 border-t border-white/5">
                <p className="text-[10px] text-[#9b8fc0] uppercase tracking-widest mb-2">About</p>
                <p className="text-xs text-[#9b8fc0] leading-relaxed">{book.description}</p>
              </div>
            )}
          </div>
        )}

        {/* ── Canvas area ── */}
        <div className="flex-1 overflow-auto bg-[#1a1728] flex justify-center p-8 relative">

          {/* Rendering indicator */}
          {rendering && (
            <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-lg z-10">
              <div className="w-3 h-3 border border-[#6c5ce7] border-t-transparent rounded-full animate-spin"/>
              <span className="text-xs text-[#9b8fc0]">Rendering...</span>
            </div>
          )}

          {pdfDoc ? (
            viewMode === "paginated" ? (
              <canvas
                ref={canvasRef}
                style={{ maxWidth: "100%", display: "block", boxShadow: "0 4px 32px rgba(0,0,0,0.5)" }}
              />
            ) : (
              <div ref={scrollContainerRef} className="flex flex-col items-center w-full"/>
            )
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-[#6c5ce7] border-t-transparent rounded-full animate-spin mx-auto mb-3"/>
                <p className="text-xs text-[#9b8fc0]">Loading PDF...</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Progress bar ── */}
      {numPages && (
        <div className="h-0.5 bg-white/5 flex-shrink-0">
          <div
            className="h-full bg-[#6c5ce7] transition-all duration-300"
            style={{ width: `${Math.round((pageNumber / numPages) * 100)}%` }}/>
        </div>
      )}

      {/* ── Status bar ── */}
      <div className="flex items-center justify-between px-5 py-2 bg-[#13102b] border-t border-white/5 flex-shrink-0">
        <span className="text-xs text-[#9b8fc0]">
          {viewMode === "paginated"
            ? `Page ${pageNumber} of ${numPages || "—"} · ${book?.category || ""}`
            : `${numPages || "—"} pages · ${book?.category || ""}`
          }
        </span>
        <span className="text-xs text-[#9b8fc0]">
          {numPages && viewMode === "paginated"
            ? `~${Math.round((numPages - pageNumber) * 2)} min left`
            : ""
          }
        </span>
      </div>
    </div>
  );
}