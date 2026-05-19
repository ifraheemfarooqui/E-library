import { useState } from "react";
import { supabase } from "../supabase";
import { useAdmin } from "../hooks/useAdmin";

const CATEGORIES = ["Fiction","Science","History","Technology","Philosophy","Biography"];

export default function AdminUpload({ onUploadComplete }) {
  const { isAdmin } = useAdmin();

  const [title, setTitle]           = useState("");
  const [author, setAuthor]         = useState("");
  const [category, setCategory]     = useState("");
  const [description, setDescription] = useState("");
  const [coverFile, setCoverFile]   = useState(null);
  const [pdfFile, setPdfFile]       = useState(null);
  const [uploading, setUploading]   = useState(false);
  const [progress, setProgress]     = useState("");
  const [error, setError]           = useState("");
  const [success, setSuccess]       = useState("");

  if (!isAdmin) return null;

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!title || !author || !category) return;
    if (!pdfFile) return setError("PDF file is required.");

    setUploading(true);
    setError("");
    setSuccess("");

    try {
      let cover_url = "";
      let file_url  = "";

      // Upload cover image
      if (coverFile) {
        setProgress("Uploading cover image...");
        const ext  = coverFile.name.split(".").pop();
        const path = `covers/${Date.now()}.${ext}`;
        const { error: coverError } = await supabase.storage
          .from("cover")
          .upload(path, coverFile, { cacheControl: "3600", upsert: false });

        if (coverError) throw new Error("Cover upload failed: " + coverError.message);

        const { data: coverUrl } = supabase.storage
          .from("cover")
          .getPublicUrl(path);
        cover_url = coverUrl.publicUrl;
      }

      // Upload PDF
      setProgress("Uploading PDF file...");
      const pdfPath = `pdfs/${Date.now()}.pdf`;
      const { error: pdfError } = await supabase.storage
        .from("books")
        .upload(pdfPath, pdfFile, { cacheControl: "3600", upsert: false });

      if (pdfError) throw new Error("PDF upload failed: " + pdfError.message);

      const { data: pdfUrl } = supabase.storage
        .from("books")
        .getPublicUrl(pdfPath);
      file_url = pdfUrl.publicUrl;

      // Save to database
      setProgress("Saving book details...");
      const { error: dbError } = await supabase
        .from("books")
        .insert({ title, author, category, description, cover_url, file_url });

      if (dbError) throw new Error("Database error: " + dbError.message);

      // Reset
      setSuccess(`"${title}" uploaded successfully!`);
      setTitle(""); setAuthor(""); setCategory("");
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
    <div className="bg-[#1a1730] border border-white/10 rounded-2xl p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 bg-[#6c5ce7] rounded-lg flex items-center justify-center text-sm">
          ↑
        </div>
        <div>
          <h2 className="font-[Cormorant_Garamond] text-xl font-semibold text-white">
            Upload New Book
          </h2>
          <p className="text-xs text-[#9b8fc0]">Admin only</p>
        </div>
      </div>

      {error   && <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2.5 text-xs text-[#f09595] mb-4">{error}</div>}
      {success && <div className="bg-green-500/10 border border-green-500/30 rounded-lg px-4 py-2.5 text-xs text-green-400 mb-4">✓ {success}</div>}
      {progress && (
        <div className="bg-[#6c5ce7]/10 border border-[#6c5ce7]/30 rounded-lg px-4 py-2.5 text-xs text-[#a78bfa] mb-4 flex items-center gap-2">
          <span className="animate-spin">⟳</span> {progress}
        </div>
      )}

      <form onSubmit={handleUpload} className="space-y-4">

        {/* Title & Author */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-[#9b8fc0] uppercase tracking-wide block mb-1.5">
              Title <span className="text-red-400">*</span>
            </label>
            <input value={title} onChange={e => setTitle(e.target.value)}
              placeholder="Book title" required
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-[#5a4f7a] focus:outline-none focus:border-[#6c5ce7] transition"/>
          </div>
          <div>
            <label className="text-xs text-[#9b8fc0] uppercase tracking-wide block mb-1.5">
              Author <span className="text-red-400">*</span>
            </label>
            <input value={author} onChange={e => setAuthor(e.target.value)}
              placeholder="Author name" required
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-[#5a4f7a] focus:outline-none focus:border-[#6c5ce7] transition"/>
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="text-xs text-[#9b8fc0] uppercase tracking-wide block mb-1.5">
            Category <span className="text-red-400">*</span>
          </label>
          <select value={category} onChange={e => setCategory(e.target.value)} required
            className="w-full bg-[#13102b] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#6c5ce7] transition">
            <option value="">Select a category</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Description */}
        <div>
          <label className="text-xs text-[#9b8fc0] uppercase tracking-wide block mb-1.5">
            Description
          </label>
          <textarea value={description} onChange={e => setDescription(e.target.value)}
            placeholder="Brief description of the book..." rows={3}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-[#5a4f7a] focus:outline-none focus:border-[#6c5ce7] transition resize-none"/>
        </div>

        {/* File uploads */}
        <div className="grid grid-cols-2 gap-4">

          {/* Cover image */}
          <div>
            <label className="text-xs text-[#9b8fc0] uppercase tracking-wide block mb-1.5">
              Cover Image
            </label>
            <label className={`flex flex-col items-center justify-center border border-dashed rounded-xl p-5 cursor-pointer transition ${
              coverFile ? "border-[#6c5ce7] bg-[#6c5ce7]/10" : "border-white/15 hover:border-[#6c5ce7]/50"
            }`}>
              {coverFile ? (
                <div className="text-center">
                  <div className="text-2xl mb-1">🖼️</div>
                  <p className="text-xs text-[#a78bfa] font-medium truncate max-w-[120px]">
                    {coverFile.name}
                  </p>
                  <p className="text-[10px] text-[#9b8fc0] mt-0.5">
                    {(coverFile.size / 1024).toFixed(0)} KB
                  </p>
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
            <label className={`flex flex-col items-center justify-center border border-dashed rounded-xl p-5 cursor-pointer transition ${
              pdfFile ? "border-[#6c5ce7] bg-[#6c5ce7]/10" : "border-white/15 hover:border-[#6c5ce7]/50"
            }`}>
              {pdfFile ? (
                <div className="text-center">
                  <div className="text-2xl mb-1">📄</div>
                  <p className="text-xs text-[#a78bfa] font-medium truncate max-w-[120px]">
                    {pdfFile.name}
                  </p>
                  <p className="text-[10px] text-[#9b8fc0] mt-0.5">
                    {(pdfFile.size / 1024 / 1024).toFixed(1)} MB
                  </p>
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

        {/* Preview */}
        {coverFile && (
          <div className="flex items-center gap-4 bg-white/4 border border-white/8 rounded-xl p-3">
            <img
              src={URL.createObjectURL(coverFile)}
              alt="Cover preview"
              className="w-12 h-16 object-cover rounded-lg flex-shrink-0"
            />
            <div>
              <p className="text-sm font-medium text-white">{title || "Untitled"}</p>
              <p className="text-xs text-[#9b8fc0]">{author || "Unknown author"}</p>
              <span className="text-[10px] bg-[#6c5ce7]/20 text-[#a78bfa] px-2 py-0.5 rounded-full mt-1 inline-block">
                {category || "No category"}
              </span>
            </div>
          </div>
        )}

        {/* Submit */}
        <button type="submit" disabled={uploading}
          className="w-full py-3 bg-[#6c5ce7] hover:bg-[#7c6cf0] disabled:opacity-50 text-white rounded-xl text-sm font-medium transition flex items-center justify-center gap-2">
          {uploading ? (
            <><span className="animate-spin">⟳</span> Uploading...</>
          ) : (
            <> ↑ Upload Book</>
          )}
        </button>
      </form>
    </div>
  );
}