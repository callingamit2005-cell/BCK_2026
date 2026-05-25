import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/layout/Footer";
import { fetchBlogPosts } from "@/services/blogService";
import { useSeoMeta } from "@/hooks/useSeoMeta";
import { Skeleton } from "@/components/ui/skeleton";

const Blog = () => {
  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["blog-posts-live"],
    queryFn: fetchBlogPosts,
    staleTime: 1000 * 60 * 5,
  });

  // SEO Optimization
  useSeoMeta(
    "BachatKaro Blog | Money Saving Tips",
    "Read practical guides on saving, budgeting, investing, and financial planning.",
    `${window.location.origin}/blog`
  );

  return (
    <div className="dark">
      <div className="min-h-screen bg-[#0D0B14] text-white selection:bg-pink-500/30 overflow-x-hidden relative font-sans">
        <Navbar />
        <main className="relative z-10 max-w-6xl mx-auto px-6 pt-32 pb-20">
          <h1 className="text-4xl md:text-6xl font-black mb-4">BachatKaro Blog</h1>
          <p className="text-slate-400 text-lg mb-12">Actionable finance insights and money-saving playbooks.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {isLoading
              ? Array.from({ length: 4 }).map((_, idx) => (
                  <div key={idx} className="bg-white/[0.03] border border-white/10 p-6 rounded-2xl">
                    <Skeleton className="h-5 w-24 mb-4 bg-white/10" />
                    <Skeleton className="h-8 w-full mb-3 bg-white/10" />
                    <Skeleton className="h-4 w-full mb-2 bg-white/10" />
                    <Skeleton className="h-4 w-3/4 bg-white/10" />
                  </div>
                ))
              : posts.map((post) => (
                  <Link
                    key={post.slug}
                    to={`/blog/${post.slug}`}
                    className="block bg-white/[0.03] border border-white/10 p-6 rounded-2xl hover:bg-white/[0.06] transition-all"
                  >
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-[#7C3AED] to-[#EC4899] text-white mb-3">
                      {post.tag}
                    </span>
                    <h2 className="text-2xl font-bold mb-2 text-white">{post.title}</h2>
                    <p className="text-slate-400 mb-3">{post.excerpt}</p>
                    <span className="text-xs text-slate-500">{post.date}</span>
                  </Link>
                ))}
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default Blog;
