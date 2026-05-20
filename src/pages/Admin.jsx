import Layout from "../components/Layout";
import AdminUpload from "../components/AdminUpload";
import { useAdmin } from "../hooks/useAdmin";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

export default function Admin() {
  const { isAdmin, loading } = useAdmin();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !isAdmin) navigate("/home");
  }, [isAdmin, loading]);

  if (loading) return (
    <div className="min-h-screen bg-[#0e0c1a] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#6c5ce7] border-t-transparent rounded-full animate-spin"/>
    </div>
  );

  return (
    <Layout title="Admin">
      <h2 className="font-[Cormorant_Garamond] text-2xl sm:text-3xl font-semibold text-white mb-1">
        Admin Panel
      </h2>
      <p className="text-[#9b8fc0] text-sm mb-6 sm:mb-8">Manage library content</p>
      <AdminUpload onUploadComplete={() => console.log("Book uploaded!")} />
    </Layout>
  );
}