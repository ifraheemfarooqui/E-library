import { useState } from "react";
import { supabase } from "../supabase";
import { useAdmin } from "../hooks/useAdmin";

const CATEGORIES = [
  "Fiction",
  "Science",
  "History",
  "Technology",
  "Philosophy",
  "Biography",
  "Fantasy",
  "Mystery",
  "Thriller",
  "Romance",
  "Horror",
  "Adventure",
  "Self-Help",
  "Psychology",
  "Business",
  "Economics",
  "Politics",
  "Religion",
  "Poetry",
  "Comics",
  "Graphic Novels",
  "Young Adult",
  "Children",
  "Education",
  "Programming",
  "Artificial Intelligence",

  // Novel-specific / literature categories
  "Classic Literature",
  "Contemporary Fiction",
  "Literary Fiction",
  "Historical Fiction",
  "Science Fiction",
  "Dystopian",
  "Utopian",
  "Urban Fantasy",
  "Epic Fantasy",
  "Dark Fantasy",
  "Magical Realism",
  "Crime Fiction",
  "Detective Fiction",
  "Noir",
  "Slice of Life",
  "Coming of Age",
  "Satire",
  "Paranormal Romance",
  "Adventure Fiction"
];

export default function AdminUpload({ onUploadComplete }) {
  const { isAdmin } = useAdmin();

  const [title, setTitle]             = useState("");
  const [author, setAuthor]           = useState("");
  const [description, setDescription] = useState("");
  const [coverFile, setCoverFile]     = useState(null);
  const [pdfFile, setPdfFile]         = useState(null);
  const [uploading, setUploading]     = useState(false);
  const [progress, setProgress]       = useState("");
  const [error, setError]             = useState("");
  const [success, setSuccess]         = useState("");
  const [categories, setCategories]   = useState([]);

  if (!isAdmin) return null;

  // ✅ toggleCategory is at the TOP LEVEL — not inside handleUpload
  const toggleCategory = (cat) => {
    setCategories(prev =>
      prev.includes(cat)
        ? prev.filter(c => c !== cat)
        : [...prev, cat]
    );
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!title || !author || categories.length === 0) {
      setError("Please fill in all required fields.");
      return;
    }
    if (!pdfFile) return setError("PDF file is required.");

    setUploading(true);
    setError("");
    setSuccess("");

    try {
      let cover_url = "";
      let file_url  = "";

      if (coverFile) {
        setProgress("Uploading cover image...");
        const ext  = coverFile.name.split(".").pop();
        const path = `covers/${Date.now()}.${ext}`;
        const { error: coverError } = await supabase.storage
          .from("cover")
          .upload(path, coverFile, { cacheControl: "3600", upsert: false });
        if (coverError) throw new Error("Cover upload failed: " + coverError.message);
        const { data: coverUrl } = supabase.storage.from("cover").getPublicUrl(path);
        cover_url = coverUrl.publicUrl;
      }

      setProgress("Uploading PDF file...");
      const pdfPath = `pdfs/${Date.now()}.pdf`;
      const { error: pdfError } = await supabase.storage
        .from("books")
        .upload(pdfPath, pdfFile, { cacheControl: "3600", upsert: false });
      if (pdfError) throw new Error("PDF upload failed: " + pdfError.message);
      const { data: pdfUrl } = supabase.storage.from("books").getPublicUrl(pdfPath);
      file_url = pdfUrl.publicUrl;

      setProgress("Saving book details...");
      const { error: dbError } = await supabase.from("books").insert({
        title, author,
        category: categories,
        description, cover_url, file_url
      });
      if (dbError) throw new Error("Database error: " + dbError.message);

      setSuccess(`"${title}" uploaded successfully!`);
      setTitle(""); setAuthor(""); setCategories([]);
      setDescription(""); setCoverFile(null); setPdfFile(null);
      setProgress("");
      if (onUploadComplete) onUploadComplete();

    } catch (err) {
      setError(err.message);
      setProgress("");
    } finally {
      setUploading(false);
    }
  };

  return (
    // ✅ Responsive: full width on mobile, max-w-2xl on desktop
    <div className="w-full max-w-2xl mx-auto bg-[#1a1730] border border-white/10 rounded-2xl p-4 sm:p-6 md:p-8">

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 bg-[#6c5ce7] rounded-lg flex items-center justify-center text-sm flex-shrink-0">↑</div>
        <div>
          <h2 className="font-[Cormorant_Garamond] text-lg sm:text-xl font-semibold text-white">
            Upload New Book
          </h2>
          <p className="text-xs text-[#9b8fc0]">Admin only</p>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2.5 text-xs text-[#f09595] mb-4">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg px-4 py-2.5 text-xs text-green-400 mb-4">
          ✓ {success}
        </div>
      )}
      {progress && (
        <div className="bg-[#6c5ce7]/10 border border-[#6c5ce7]/30 rounded-lg px-4 py-2.5 text-xs text-[#a78bfa] mb-4 flex items-center gap-2">
          <span className="animate-spin">⟳</span> {progress}
        </div>
      )}

      <form onSubmit={handleUpload} className="space-y-4">

        {/* Title & Author — stack on mobile, side by side on sm+ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-[#9b8fc0] uppercase tracking-wide block mb-1.5">
              Title <span className="text-red-400">*</span>
            </label>
            <input
              value={title} onChange={e => setTitle(e.target.value)}
              placeholder="Book title" required
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-[#5a4f7a] focus:outline-none focus:border-[#6c5ce7] transition"/>
          </div>
          <div>
            <label className="text-xs text-[#9b8fc0] uppercase tracking-wide block mb-1.5">
              Author <span className="text-red-400">*</span>
            </label>
            <input
              value={author} onChange={e => setAuthor(e.target.value)}
              placeholder="Author name" required
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-[#5a4f7a] focus:outline-none focus:border-[#6c5ce7] transition"/>
          </div>
        </div>

        {/* Categories */}
        <div>
          <label className="text-xs text-[#9b8fc0] uppercase tracking-wide block mb-1.5">
            Categories <span className="text-red-400">*</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(cat => (
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
          <label className="text-xs text-[#9b8fc0] uppercase tracking-wide block mb-1.5">
            Description
          </label>
          <textarea
            value={description} onChange={e => setDescription(e.target.value)}
            placeholder="Brief description of the book..." rows={3}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-[#5a4f7a] focus:outline-none focus:border-[#6c5ce7] transition resize-none"/>
        </div>

        {/* File uploads — stack on mobile, side by side on sm+ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* Cover image */}
          <div>
            <label className="text-xs text-[#9b8fc0] uppercase tracking-wide block mb-1.5">
              Cover Image
            </label>
            <label className={`flex flex-col items-center justify-center border border-dashed rounded-xl p-5 cursor-pointer transition min-h-[100px] ${
              coverFile ? "border-[#6c5ce7] bg-[#6c5ce7]/10" : "border-white/15 hover:border-[#6c5ce7]/50"
            }`}>
              {coverFile ? (
                <div className="text-center">
                  <div className="text-2xl mb-1">🖼️</div>
                  <p className="text-xs text-[#a78bfa] font-medium truncate max-w-[120px]">{coverFile.name}</p>
                  <p className="text-[10px] text-[#9b8fc0] mt-0.5">{(coverFile.size / 1024).toFixed(0)} KB</p>
                </div>
              ) : (
                <div className="text-center">
                  <div className="text-2xl mb-1 opacity-50">🖼️</div>
                  <p className="text-xs text-[#9b8fc0]">Click to upload</p>
                  <p className="text-[10px] text-[#5a4f7a] mt-0.5">PNG, JPG, WEBP</p>
                </div>
              )}
              <input type="file" accept="image/*" className="hidden"
                onChange={e => setCoverFile(e.target.files[0])}/>
            </label>
          </div>

          {/* PDF */}
          <div>
            <label className="text-xs text-[#9b8fc0] uppercase tracking-wide block mb-1.5">
              PDF File <span className="text-red-400">*</span>
            </label>
            <label className={`flex flex-col items-center justify-center border border-dashed rounded-xl p-5 cursor-pointer transition min-h-[100px] ${
              pdfFile ? "border-[#6c5ce7] bg-[#6c5ce7]/10" : "border-white/15 hover:border-[#6c5ce7]/50"
            }`}>
              {pdfFile ? (
                <div className="text-center">
                  <div className="text-2xl mb-1">📄</div>
                  <p className="text-xs text-[#a78bfa] font-medium truncate max-w-[120px]">{pdfFile.name}</p>
                  <p className="text-[10px] text-[#9b8fc0] mt-0.5">{(pdfFile.size / 1024 / 1024).toFixed(1)} MB</p>
                </div>
              ) : (
                <div className="text-center">
                  <div className="text-2xl mb-1 opacity-50">📄</div>
                  <p className="text-xs text-[#9b8fc0]">Click to upload</p>
                  <p className="text-[10px] text-[#5a4f7a] mt-0.5">PDF only</p>
                </div>
              )}
              <input type="file" accept=".pdf" className="hidden"
                onChange={e => setPdfFile(e.target.files[0])}/>
            </label>
          </div>
        </div>

        {/* Cover preview */}
        {coverFile && (
          <div className="flex items-center gap-4 bg-white/4 border border-white/8 rounded-xl p-3">
            <img
              src={URL.createObjectURL(coverFile)}
              alt="Cover preview"
              className="w-12 h-16 object-cover rounded-lg flex-shrink-0"/>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{title || "Untitled"}</p>
              <p className="text-xs text-[#9b8fc0] truncate">{author || "Unknown author"}</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {categories.length > 0
                  ? categories.map(c => (
                      <span key={c} className="text-[10px] bg-[#6c5ce7]/20 text-[#a78bfa] px-2 py-0.5 rounded-full">
                        {c}
                      </span>
                    ))
                  : <span className="text-[10px] text-[#5a4f7a]">No category</span>
                }
              </div>
            </div>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit" disabled={uploading}
          className="w-full py-3 bg-[#6c5ce7] hover:bg-[#7c6cf0] disabled:opacity-50 text-white rounded-xl text-sm font-medium transition flex items-center justify-center gap-2">
          {uploading
            ? <><span className="animate-spin">⟳</span> Uploading...</>
            : <>↑ Upload Book</>
          }
        </button>
      </form>
    </div>
  );
}