import Layout from "../components/Layout";

export default function Home() {
  return (
    <Layout title="Home">
      <h2 className="font-[Cormorant_Garamond] text-3xl font-semibold text-white mb-1">
        Good evening 👋
      </h2>
      <p className="text-[#9b8fc0] text-sm mb-6">
        Here's what's happening in your library
      </p>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          ["📚","Total Books","248","+12 this week"],
          ["🔖","Reading","6","2 in progress"],
          ["✅","Finished","14","This year"],
          ["⏱️","Hours Read","38","This month"],
        ].map(([icon,label,val,sub]) => (
          <div key={label} className="bg-white/4 border border-white/8 rounded-xl p-4">
            <p className="text-xs text-[#9b8fc0] mb-1">{icon} {label}</p>
            <p className="text-2xl font-medium text-white">{val}</p>
            <p className="text-xs text-[#6c5ce7] mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      <p className="text-sm text-[#9b8fc0] font-medium mb-3">Continue reading</p>
      {/* Add your reading progress cards here */}
    </Layout>
  );
}