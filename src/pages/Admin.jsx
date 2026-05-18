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

  if (loading) return null;

  return (
    <Layout title="Admin">
      <h2 className="font-[Cormorant_Garamond] text-3xl font-semibold text-white mb-1">
        Admin Panel
      </h2>
      <p className="text-[#9b8fc0] text-sm mb-8">Manage library content</p>

      <div className="max-w-2xl">
        <AdminUpload onUploadComplete={() => console.log("Book uploaded!")} />
      </div>
    </Layout>
  );
}