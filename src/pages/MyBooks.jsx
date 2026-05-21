import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";
import Layout from "../components/Layout";

const COLORS = ["#2D1B69","#1a3a2a","#3a1a1a","#1a2a3a","#3a2a1a","#2a1a3a"];

export default function MyBooks() {
  const [myBooks, setMyBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => { fetchMyBooks(); }, []);

  const fetchMyBooks = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("user_books").select("*, books(*)")
      .eq("user_id", user.id)
      .order("last_read", { ascending: false });
    setMyBooks(data || []);
    setLoading(false);
  };

  const inProgress = myBooks.filter(b => b.progress < 100);
  const finished   = myBooks.filter(b => b.progress === 100);

  const BookCard = ({ item, i }) => {
    const book = item.books;
    if (!book) return null;
    return (
      <div onClick={() => navigate(`/reader/${book.id}`)}
        className="flex items-center gap-3 bg-white/4 border border-white/8 rounded-xl p-3 cursor-pointer hover:border-[#6c5ce7]/40 transition group">
        <div className="w-10 h-14 sm:w-12 sm:h-16 rounded-lg flex items-center justify-center text-lg flex-shrink-0 overflow-hidden"
          style={{ background: COLORS[i % COLORS.length] }}>
          {book.cover_url
            ? <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover rounded-lg"/>
            : "📖"
          }
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium text-white truncate mb-0.5">{book.title}</p>
          <p className="text-[11px] sm:text-xs text-[#9b8fc0] mb-2 truncate">{book.author}</p>
          <div className="h-1 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-[#6c5ce7] rounded-full transition-all"
              style={{ width: `${item.progress || 0}%` }}/>
          </div>
          <p className="text-[10px] sm:text-[11px] text-[#9b8fc0] mt-1">
            {item.progress === 100 ? "✓ Completed" : `${item.progress || 0}% · Page ${item.last_page || 1}`}
          </p>
        </div>
        <span className="text-[#9b8fc0] group-hover:text-white transition flex-shrink-0">›</span>
      </div>
    );
  };

  return (
    <Layout title="My Books">
      <h2 className="font-[Cormorant_Garamond] text-xl sm:text-2xl md:text-3xl font-semibold text-white mb-1">
        My Books
      </h2>
      <p className="text-[#9b8fc0] text-xs sm:text-sm mb-6">Your reading list and progress</p>

      {loading ? (
        <div className="space-y-2 sm:space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 sm:h-20 bg-white/5 rounded-xl animate-pulse"/>
          ))}
        </div>
      ) : myBooks.length === 0 ? (
        <div className="text-center py-12 text-[#9b8fc0]">
          <div className="text-4xl mb-3 opacity-30">📚</div>
          <p className="text-sm mb-1">No books yet</p>
          <p className="text-xs mb-4">Go to the Library and start reading!</p>
          <button onClick={() => navigate("/library")}
            className="bg-[#6c5ce7] text-white text-sm px-4 py-2 rounded-lg hover:bg-[#7c6cf0] transition">
            Browse Library
          </button>
        </div>
      ) : (
        <div className="space-y-6 sm:space-y-8">
          {inProgress.length > 0 && (
            <div>
              <p className="text-xs sm:text-sm text-[#9b8fc0] font-medium mb-2 sm:mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#6c5ce7] inline-block"/>
                In Progress ({inProgress.length})
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3">
                {inProgress.map((item, i) => <BookCard key={item.id} item={item} i={i}/>)}
              </div>
            </div>
          )}
          {finished.length > 0 && (
            <div>
              <p className="text-xs sm:text-sm text-[#9b8fc0] font-medium mb-2 sm:mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#1D9E75] inline-block"/>
                Finished ({finished.length})
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3">
                {finished.map((item, i) => <BookCard key={item.id} item={item} i={i}/>)}
              </div>
            </div>
          )}
        </div>
      )}
    </Layout>
  );
}