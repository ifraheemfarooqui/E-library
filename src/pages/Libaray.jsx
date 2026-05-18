import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";
import Layout from "../components/Layout";

const CATEGORIES = ["All","Fiction","Science","History","Technology","Philosophy","Biography"];
const COLORS = ["#2D1B69","#1a3a2a","#3a1a1a","#1a2a3a","#3a2a1a","#2a1a3a","#1a3a3a","#2a3a1a"];

export default function Library() {
  const [books, setBooks]       = useState([]);
  const [filter, setFilter]     = useState("All");
  const [search, setSearch]     = useState("");
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading]   = useState(true);

  const [title, setTitle]           = useState("");
  const [author, setAuthor]         = useState("");
  const [category, setCategory]     = useState("");
  const [description, setDescription] = useState("");
  const [coverFile, setCoverFile]   = useState(null);
  const [pdfFile, setPdfFile]       = useState(null);
  const [uploading, setUploading]   = useState(false);

  const navigate = useNavigate();

  useEffect(() => { fetchBooks(); }, []);

  const fetchBooks = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("books").select("*").order("created_at", { ascending: false });
    setBooks(data || []);
    setLoading(false);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!title || !author || !category) return;
    setUploading(true);
    let cover_url = "", file_url = "";

    if (coverFile) {
      const path = `${Date.now()}.${coverFile.name.split(".").pop()}`;
      await supabase.storage.from("covers").upload(path, coverFile);
      const { data: url } = supabase.storage.from("covers").getPublicUrl(path);
      cover_url = url.publicUrl;
    }
    if (pdfFile) {
      const path = `${Date.now()}.pdf`;
      await supabase.storage.from("books").upload(path, pdfFile);
      const { data: url } = supabase.storage.from("books").getPublicUrl(path);
      file_url = url.publicUrl;
    }

    await supabase.from("books").insert({ title, author, category, description, cover_url, file_url });
    setTitle(""); setAuthor(""); setCategory(""); setDescription("");
    setCoverFile(null); setPdfFile(null);
    setShowModal(false);
    setUploading(false);
    fetchBooks();
  };

  const filtered = books.filter(b => {
    const matchCat    = filter === "All" || b.category === filter;
    const matchSearch = !search ||
      b.title?.toLowerCase().includes(search.toLowerCase()) ||
      b.author?.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <Layout title="Library">

      {/* Header row */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-[Cormorant_Garamond] text-3xl font-semibold text-white mb-1">
            Explore the <em className="text-[#a78bfa]">library</em>
          </h2>
          <p className="text-[#9b8fc0] text-sm">Browse books, PDFs, and journals</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="bg-[#6c5ce7] hover:bg-[#7c6cf0] text-white text-sm px-4 py-2 rounded-lg flex items-center gap-2 transition">
          ↑ Upload Book
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 max-w-md mb-5">
        <span className="text-[#9b8fc0] text-sm">🔍</span>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by title, author or category..."
          className="bg-transparent outline-none text-white text-sm flex-1 placeholder-[#5a4f7a]"/>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap mb-6">
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setFilter(cat)}
            className={`px-4 py-1.5 rounded-full text-xs border transition ${
              filter === cat
                ? "bg-[#6c5ce7] border-[#6c5ce7] text-white"
                : "border-white/10 text-[#9b8fc0] hover:text-white hover:border-white/25"
            }`}>
            {cat}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
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
            <div key={book.id} onClick={() => navigate(`/reader/${book.id}`)}
              className="cursor-pointer group">
              <div className="w-full aspect-[2/3] rounded-xl mb-2 overflow-hidden relative transition-transform group-hover:-translate-y-1"
                style={{ background: COLORS[i % COLORS.length] }}>
                {book.cover_url
                  ? <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover"/>
                  : <div className="w-full h-full flex items-center justify-center text-4xl">📖</div>
                }
                <span className="absolute top-2 right-2 bg-black/40 text-white text-[10px] px-2 py-0.5 rounded-full">
                  {book.category}
                </span>
              </div>
              <p className="text-sm font-medium text-white truncate">{book.title}</p>
              <p className="text-xs text-[#9b8fc0] truncate">{book.author}</p>
            </div>
          ))
        }
      </div>

      {/* Upload Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
          <div className="bg-[#1a1730] border border-white/10 rounded-2xl p-8 w-full max-w-md">
            <h2 className="font-[Cormorant_Garamond] text-2xl font-semibold text-white mb-6">
              Upload a Book
            </h2>
            <form onSubmit={handleUpload} className="space-y-4">
              {[
                ["Title", "text", title, setTitle, "Book title"],
                ["Author", "text", author, setAuthor, "Author name"],
              ].map(([label, type, val, set, ph]) => (
                <div key={label}>
                  <label className="text-xs text-[#9b8fc0] uppercase tracking-wide block mb-1.5">{label}</label>
                  <input type={type} value={val} onChange={e => set(e.target.value)}
                    placeholder={ph} required
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-[#5a4f7a] focus:outline-none focus:border-[#6c5ce7] transition"/>
                </div>
              ))}

              <div>
                <label className="text-xs text-[#9b8fc0] uppercase tracking-wide block mb-1.5">Category</label>
                <select value={category} onChange={e => setCategory(e.target.value)} required
                  className="w-full bg-[#1a1730] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#6c5ce7] transition">
                  <option value="">Select category</option>
                  {CATEGORIES.filter(c => c !== "All").map(c => <option key={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs text-[#9b8fc0] uppercase tracking-wide block mb-1.5">Description</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-[#5a4f7a] focus:outline-none focus:border-[#6c5ce7] transition resize-none"
                  placeholder="Short description..."/>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  ["Cover Image","image/*","🖼️",coverFile,setCoverFile],
                  ["PDF File",".pdf","📄",pdfFile,setPdfFile],
                ].map(([label, accept, icon, file, setFile]) => (
                  <div key={label}>
                    <label className="text-xs text-[#9b8fc0] uppercase tracking-wide block mb-1.5">{label}</label>
                    <label className="border border-dashed border-white/20 rounded-lg p-4 flex flex-col items-center cursor-pointer hover:border-[#6c5ce7] transition">
                      <span className="text-2xl mb-1">{icon}</span>
                      <span className="text-xs text-[#9b8fc0] text-center">
                        {file ? file.name.slice(0, 14) + "..." : `Upload ${label.split(" ")[0]}`}
                      </span>
                      <input type="file" accept={accept} className="hidden"
                        onChange={e => setFile(e.target.files[0])}/>
                    </label>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-[#9b8fc0] hover:text-white transition">
                  Cancel
                </button>
                <button type="submit" disabled={uploading}
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