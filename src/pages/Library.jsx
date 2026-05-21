import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";
import Layout from "../components/Layout";

const CATEGORIES = [
  "All","Fiction","Science","History","Technology",
  "Philosophy","Biography","Fantasy","Mystery","Thriller",
  "Romance","Horror","Adventure","Self-Help","Psychology",
  "Business","Economics","Politics","Religion","Poetry",
  "Comics","Graphic Novels","Young Adult","Children","Education",
  "Programming","Artificial Intelligence","Classic Literature",
  "Contemporary Fiction","Literary Fiction","Historical Fiction",
  "Science Fiction","Dystopian","Crime Fiction","Detective Fiction",
  "Coming of Age","Satire","Adventure Fiction"
];
const COLORS = ["#2D1B69","#1a3a2a","#3a1a1a","#1a2a3a","#3a2a1a","#2a1a3a","#1a3a3a","#2a3a1a"];

export default function Library() {
  const [books, setBooks]         = useState([]);
  const [filter, setFilter]       = useState("All");
  const [search, setSearch]       = useState("");
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading]     = useState(true);
  const [uploadError, setUploadError] = useState("");

  const [title, setTitle]             = useState("");
  const [author, setAuthor]           = useState("");
  const [categories, setCategories]   = useState([]);  // ✅ array
  const [description, setDescription] = useState("");
  const [coverFile, setCoverFile]     = useState(null);
  const [pdfFile, setPdfFile]         = useState(null);
  const [uploading, setUploading]     = useState(false);

  const navigate = useNavigate();

  useEffect(() => { fetchBooks(); }, []);

  const fetchBooks = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("books").select("*").order("created_at", { ascending: false });
    setBooks(data || []);
    setLoading(false);
  };

  // ✅ toggleCategory at top level
  const toggleCategory = (cat) => {
    setCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

const handleUpload = async (e) => {
  e.preventDefault();
  if (!title || !author || categories.length === 0) {
    setUploadError("Please fill in all required fields.");
    return;
  }
  if (!pdfFile) { setUploadError("PDF file is required."); return; }

  setUploading(true);
  setUploadError("");
  let cover_url = "", file_url = "";

  try {
    if (coverFile) {
      const path = `${Date.now()}.${coverFile.name.split(".").pop()}`;
      const { error: coverErr } = await supabase.storage
        .from("cover").upload(path, coverFile);
      if (coverErr) throw new Error("Cover upload failed: " + coverErr.message);
      const { data: urlData } = supabase.storage.from("cover").getPublicUrl(path);
      cover_url = urlData.publicUrl;
    }

    const pdfPath = `${Date.now()}.pdf`;
    const { error: pdfErr } = await supabase.storage
      .from("books").upload(pdfPath, pdfFile);
    if (pdfErr) throw new Error("PDF upload failed: " + pdfErr.message);
    const { data: pdfUrlData } = supabase.storage.from("books").getPublicUrl(pdfPath);
    file_url = pdfUrlData.publicUrl;

    const { error: dbErr } = await supabase.from("books").insert({
      title, author, category: categories, description, cover_url, file_url
    });
    if (dbErr) throw new Error("Database error: " + dbErr.message);

    setTitle(""); setAuthor(""); setCategories([]);
    setDescription(""); setCoverFile(null); setPdfFile(null);
    setShowModal(false);
    fetchBooks();

  } catch (err) {
    setUploadError(err.message);
  } finally {
    setUploading(false);
  }
};

  // ✅ correct array filter
  const filtered = books.filter(b => {
    const matchCat    = filter === "All" || b.category?.includes(filter);
    const matchSearch = !search ||
      b.title?.toLowerCase().includes(search.toLowerCase()) ||
      b.author?.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <Layout title="Library">

      {/* Header — stacks on mobile */}
<div className="flex items-center justify-center mb-4 sm:mb-6">
  <div className="text-center">
    <h2 className="font-[Cormorant_Garamond] text-xl sm:text-2xl md:text-3xl font-semibold text-white mb-0.5">
      Explore the <em className="text-[#a78bfa]">library</em>
    </h2>
    <p className="text-[#9b8fc0] text-xs sm:text-sm">Browse books, PDFs, and journals</p>
  </div>
</div>

      {/* Search */}
<div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 w-full max-w-md mb-4">
  <span className="text-[#9b8fc0] text-sm flex-shrink-0">🔍</span>
  <input
    value={search} onChange={e => setSearch(e.target.value)}
    placeholder="Search title, author, category..."
    className="bg-transparent outline-none text-white text-xs sm:text-sm flex-1 placeholder-[#5a4f7a] min-w-0"/>
</div>


      {/* ✅ Filters — scrollable on mobile */}
    <div className="flex gap-1.5 sm:gap-2 mb-4 sm:mb-6 overflow-x-auto pb-2 scrollbar-none">
  {CATEGORIES.map(cat => (
    <button
      key={cat}
      onClick={() => setFilter(cat)}
      className={`px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs border transition flex-shrink-0 ${
        filter === cat
          ? "bg-[#6c5ce7] border-[#6c5ce7] text-white"
          : "border-white/10 text-[#9b8fc0] hover:text-white hover:border-white/25"
      }`}>
      {cat}
    </button>
  ))}
</div>

      {/* Grid */}
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-4 md:gap-5">
        {loading
          ? Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="w-full aspect-[2/3] bg-white/5 rounded-xl mb-2"/>
                <div className="h-3 bg-white/5 rounded mb-1"/>
                <div className="h-3 bg-white/5 rounded w-2/3"/>
              </div>
            ))
          : filtered.length === 0
          ? (
            <div className="col-span-full text-center py-20 text-[#9b8fc0]">
              <div className="text-5xl mb-4 opacity-30">📭</div>
              <p>No books found</p>
            </div>
          )
          : filtered.map((book, i) => (
            <div
              key={book.id}
              onClick={() => navigate(`/reader/${book.id}`)}
              className="cursor-pointer group">
              <div
                className="w-full aspect-[2/3] rounded-xl mb-2 overflow-hidden relative transition-transform group-hover:-translate-y-1"
                style={{ background: COLORS[i % COLORS.length] }}>
                {book.cover_url
                  ? <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover"/>
                  : <div className="w-full h-full flex items-center justify-center text-4xl">📖</div>
                }
                {/* ✅ Show category array badges */}
                <div className="absolute top-2 right-2 flex flex-col gap-1">
                  {(Array.isArray(book.category) ? book.category : [book.category])
                    .slice(0, 2)
                    .map(cat => (
                      <span key={cat} className="bg-black/40 text-white text-[10px] px-2 py-0.5 rounded-full">
                        {cat}
                      </span>
                    ))
                  }
                </div>
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                  <span className="bg-[#6c5ce7] text-white text-xs px-3 py-1.5 rounded-lg">
                    Open Reader
                  </span>
                </div>
              </div>
              <p className="text-sm font-medium text-white truncate">{book.title}</p>
              <p className="text-xs text-[#9b8fc0] truncate">{book.author}</p>
            </div>
          ))
        }
      </div>

      {/* Upload Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50 px-0 sm:px-4">
          <div className="bg-[#1a1730] border border-white/10 rounded-t-2xl sm:rounded-2xl p-5 sm:p-8 w-full sm:max-w-md max-h-[90vh] overflow-y-auto">

            <div className="flex items-center justify-between mb-6">
              <h2 className="font-[Cormorant_Garamond] text-xl sm:text-2xl font-semibold text-white">
                Upload a Book
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-[#9b8fc0] hover:text-white text-xl transition">
                ✕
              </button>
            </div>

            {uploadError && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2.5 text-xs text-[#f09595] mb-4">
                {uploadError}
              </div>
            )}

            <form onSubmit={handleUpload} className="space-y-4">

              {/* Title & Author */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-[#9b8fc0] uppercase tracking-wide block mb-1.5">Title *</label>
                  <input
                    value={title} onChange={e => setTitle(e.target.value)}
                    placeholder="Book title" required
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-[#5a4f7a] focus:outline-none focus:border-[#6c5ce7] transition"/>
                </div>
                <div>
                  <label className="text-xs text-[#9b8fc0] uppercase tracking-wide block mb-1.5">Author *</label>
                  <input
                    value={author} onChange={e => setAuthor(e.target.value)}
                    placeholder="Author name" required
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-[#5a4f7a] focus:outline-none focus:border-[#6c5ce7] transition"/>
                </div>
              </div>

              {/* ✅ Category toggle buttons */}
              <div>
                <label className="text-xs text-[#9b8fc0] uppercase tracking-wide block mb-1.5">
                  Categories *
                </label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.filter(c => c !== "All").map(cat => (
                    <button
                      type="button"
                      key={cat}
                      onClick={() => toggleCategory(cat)}
                      className={`px-3 py-1.5 rounded-full text-xs border transition ${
                        categories.includes(cat)
                          ? "bg-[#6c5ce7] border-[#6c5ce7] text-white"
                          : "border-white/10 text-[#9b8fc0] hover:text-white hover:border-white/25"
                      }`}>
                      {cat}
                    </button>
                  ))}
                </div>
                {categories.length === 0 && (
                  <p className="text-[11px] text-[#f09595] mt-1">Select at least one category</p>
                )}
                {categories.length > 0 && (
                  <p className="text-[11px] text-[#a78bfa] mt-1">
                    Selected: {categories.join(", ")}
                  </p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="text-xs text-[#9b8fc0] uppercase tracking-wide block mb-1.5">Description</label>
                <textarea
                  value={description} onChange={e => setDescription(e.target.value)} rows={2}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-[#5a4f7a] focus:outline-none focus:border-[#6c5ce7] transition resize-none"
                  placeholder="Short description..."/>
              </div>

              {/* File uploads */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  ["Cover Image","image/*","🖼️",coverFile,setCoverFile],
                  ["PDF File",".pdf","📄",pdfFile,setPdfFile],
                ].map(([label, accept, icon, file, setFile]) => (
                  <div key={label}>
                    <label className="text-xs text-[#9b8fc0] uppercase tracking-wide block mb-1.5">
                      {label}{label === "PDF File" && " *"}
                    </label>
                    <label className={`border border-dashed rounded-lg p-4 flex flex-col items-center cursor-pointer transition min-h-[90px] justify-center ${
                      file ? "border-[#6c5ce7] bg-[#6c5ce7]/10" : "border-white/20 hover:border-[#6c5ce7]/50"
                    }`}>
                      <span className="text-2xl mb-1">{icon}</span>
                      <span className="text-xs text-[#9b8fc0] text-center truncate max-w-full px-1">
                        {file ? file.name.slice(0, 12) + "..." : `Upload ${label.split(" ")[0]}`}
                      </span>
                      <input type="file" accept={accept} className="hidden"
                        onChange={e => setFile(e.target.files[0])}/>
                    </label>
                  </div>
                ))}
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button" onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-[#9b8fc0] hover:text-white transition">
                  Cancel
                </button>
                <button
                  type="submit" disabled={uploading}
                  className="flex-[2] py-2.5 bg-[#6c5ce7] hover:bg-[#7c6cf0] rounded-lg text-sm font-medium text-white transition disabled:opacity-50">
                  {uploading ? "Uploading..." : "Upload Book"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}