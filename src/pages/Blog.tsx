import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/layout/Footer";
import { fetchBlogPosts } from "@/services/blogService";
import { useSeoMeta } from "@/hooks/useSeoMeta";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles } from "lucide-react";

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
    <div className="min-h-screen bg-background text-foreground selection:bg-institutional-blue/10 overflow-x-hidden relative font-sans">
      <Navbar />
      <main className="relative z-10 max-w-6xl mx-auto px-6 pt-32 pb-20">
        <div className="mb-14 animate-in fade-in slide-in-from-top-4 duration-700">
          <h1 className="text-4xl md:text-6xl font-black text-foreground uppercase tracking-tighter mb-4 drop-shadow-sm">BachatKaro Library</h1>
          <p className="text-text-muted font-black text-[10px] uppercase tracking-[0.2em] opacity-60">Actionable finance insights and money-saving playbooks.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {isLoading
            ? Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="bg-surface border border-border/40 p-10 rounded-premium animate-pulse shadow-premium">
                  <Skeleton className="h-4 w-24 mb-6 bg-foreground/5 rounded-full" />
                  <Skeleton className="h-10 w-full mb-4 bg-foreground/5" />
                  <Skeleton className="h-6 w-full mb-2 bg-foreground/5 opacity-50" />
                  <Skeleton className="h-6 w-3/4 bg-foreground/5 opacity-50" />
                </div>
              ))
            : posts.map((post) => (
                <Link
                  key={post.slug}
                  to={`/blog/${post.slug}`}
                  className="group block bg-surface border border-border/40 p-10 rounded-premium hover:border-institutional-blue/20 transition-all duration-700 ease-butter-soft shadow-premium hover:shadow-institutional relative overflow-hidden"
                >
                  <div className="relative z-10">
                    <span className="inline-block px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest bg-background border border-border/40 text-text-secondary mb-6 shadow-sm transition-all group-hover:bg-institutional-blue group-hover:text-white group-hover:border-institutional-blue">
                      {post.tag}
                    </span>
                    <h2 className="text-2xl md:text-3xl font-black mb-4 text-foreground uppercase tracking-tighter leading-tight group-hover:text-institutional-blue transition-colors">{post.title}</h2>
                    <p className="text-text-secondary text-sm font-bold leading-relaxed mb-6 opacity-80 group-hover:opacity-100 transition-opacity line-clamp-2">{post.excerpt}</p>
                    
                    <div className="flex items-center gap-3 pt-6 border-t border-border/20">
                       <span className="text-[10px] font-black text-text-muted uppercase tracking-widest opacity-40">{post.date}</span>
                    </div>
                  </div>
                  
                  {/* Subtle Background Glow on Hover */}
                  <div className="absolute top-0 right-0 p-10 opacity-0 group-hover:opacity-5 transition-opacity duration-1000 scale-150 rotate-12">
                    <Sparkles size={120} className="text-institutional-blue" />
                  </div>
                </Link>
              ))}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Blog;
