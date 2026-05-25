import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import AdSensePlaceholder from "@/components/landing/AdSensePlaceholder";
import { ArrowLeft } from "lucide-react";
import { fetchBlogPostBySlug } from "@/services/blogService";
import { useSeoMeta } from "@/hooks/useSeoMeta";

const BlogPostSkeleton = () => (
  <div className="min-h-screen bg-[#0a0014] overflow-x-hidden relative flex items-start justify-center">
    <div className="w-full max-w-5xl mx-auto px-6 py-12 md:py-16 md:px-8 relative z-10">
      <Skeleton className="h-[400px] w-full rounded-[32px] bg-white/[0.06] mb-8 shadow-[0_0_30px_rgba(255,15,123,0.1)]" />
      <Skeleton className="h-[40px] w-3/4 rounded-xl bg-white/[0.04] mb-4" />
      <Skeleton className="h-[20px] w-full rounded-md bg-white/[0.02] mb-2" />
      <Skeleton className="h-[20px] w-5/6 rounded-md bg-white/[0.02]" />
    </div>
  </div>
);

const BlogPost = () => {
  const { slug = "" } = useParams();
  const navigate = useNavigate();

  // STRICT RULE: Business Logic Locked
  const { data: post, isLoading } = useQuery({
    queryKey: ["post", slug],
    queryFn: () => fetchBlogPostBySlug(slug),
    enabled: Boolean(slug),
    staleTime: 5 * 60 * 1000, // 5 minutes – reduce unnecessary refetches
  });

  // SEO Optimization
  useSeoMeta(
    post ? `${post.title} | BachatKaro Blog` : "BachatKaro Blog",
    post?.excerpt ?? "Read practical finance insights from BachatKaro.",
    `${window.location.origin}/blog/${slug}`
  );

  if (isLoading) return <BlogPostSkeleton />;
  
  if (!post)
    return (
      <div className="min-h-screen flex items-center justify-center !bg-[#0a0014]">
        <p className="!text-[#b3b3b3] font-mono text-xl uppercase tracking-widest border border-[rgba(255,15,123,0.3)] p-6 md:p-8 rounded-2xl bg-white/[0.02] shadow-[0_0_40px_rgba(255,15,123,0.15)]">
          Article not found
        </p>
      </div>
    );

  return (
    // Base Container with !important overrides for Deep Void background
    <div className="relative min-h-screen !bg-[#0a0014] !text-white overflow-x-hidden selection:bg-[#ff0f7b] selection:text-white pb-20 w-full">
      
      {/* Luminescent Mesh Streaks (Zero Clipping) */}
      <div className="absolute top-0 left-[-15%] w-[600px] h-[600px] bg-[#5f0a87] rounded-full mix-blend-screen filter blur-[150px] opacity-30 pointer-events-none fixed z-0"></div>
      <div className="absolute bottom-[20%] right-[-10%] w-[700px] h-[700px] bg-[#ff0f7b] rounded-full mix-blend-screen filter blur-[180px] opacity-20 pointer-events-none fixed z-0"></div>

      {/* Mobile-First Padding (p-6 to p-8) */}
      <div className="w-full max-w-6xl mx-auto px-6 py-12 md:py-20 md:px-8 relative z-10">
        
        {/* Back Button (Butter-Soft Physics) */}
        <button 
          type="button"
          onClick={() => navigate(-1)} 
          className="group flex items-center gap-3 !text-[#b3b3b3] hover:!text-white transition-all duration-500 ease-butter-soft active:scale-[0.965] mb-12 outline-none bg-white/[0.03] hover:bg-white/[0.08] px-5 py-2.5 rounded-full border border-[rgba(255,255,255,0.05)] hover:border-[rgba(255,15,123,0.35)] hover:shadow-[0_0_20px_rgba(255,15,123,0.2)] w-fit"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 group-hover:drop-shadow-[0_0_8px_rgba(255,15,123,0.8)] transition-all duration-300" />
          <span className="font-mono text-sm uppercase tracking-widest font-semibold">Back</span>
        </button>

        {/* Title (Neon Bloom) */}
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-12 !text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-[#ff0f7b] drop-shadow-[0_0_15px_rgba(255,15,123,0.4)] leading-[1.2]">
          {post.title}
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 mt-8">
          
          <div className="lg:col-span-8 w-full">
            
            {/* High-Refraction Featured Image Box - FIXED: No Crop, No Oversize */}
            {post.featured_image && (
              <div className="mb-14 w-full h-[300px] md:h-[500px] rounded-[32px] overflow-hidden border-2 border-[rgba(255,15,123,0.35)] shadow-[0_0_50px_rgba(255,15,123,0.2)] bg-[#0a0014] relative group flex items-center justify-center">
                <span className="absolute z-0 text-[#b3b3b3] font-mono text-sm tracking-widest">Loading Image...</span>
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0014] via-transparent to-transparent opacity-40 z-10 pointer-events-none"></div>
                
                <img 
                  src={post.featured_image} 
                  alt={post.title} 
                  // 👇 YAHAN MAGIC HAI: object-contain karega poori photo fit, bina kaate! 👇
                  className="w-full h-full object-contain transform transition-transform duration-1000 ease-butter-soft group-hover:scale-105 relative z-10"
                />
              </div>
            )}

            {/* Markdown Content Block (Glassmorphism + Neon Edges) */}
            <div className="bg-white/[0.04] backdrop-blur-[32px] border border-[rgba(255,255,255,0.05)] rounded-[32px] md:rounded-[40px] p-6 md:p-12 shadow-2xl w-full overflow-hidden">
              <ReactMarkdown
                components={{
                  h1: ({node, ...props}) => (
                    <h1 className="text-3xl md:text-4xl font-extrabold !text-white mt-10 mb-6 drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]" {...props} />
                  ),
                  h2: ({node, ...props}) => (
                    <h2 className="text-2xl md:text-3xl font-extrabold !text-transparent bg-clip-text bg-gradient-to-r from-white to-[#ff0f7b] mt-16 mb-8 pb-4 border-b border-[rgba(255,15,123,0.2)] drop-shadow-[0_0_8px_rgba(255,15,123,0.4)] leading-tight block" {...props} />
                  ),
                  h3: ({node, ...props}) => (
                    <h3 className="text-xl md:text-2xl font-bold !text-white mt-12 mb-6 block" {...props} />
                  ),
                  p: ({node, ...props}) => (
                    <div className="!text-[#b3b3b3] text-lg md:text-xl leading-[1.9] mb-8 tracking-wide font-medium block" {...props} />
                  ),
                  ul: ({node, ...props}) => (
                    <ul className="mt-8 mb-10 space-y-5 block" {...props} />
                  ),
                  li: ({node, ...props}) => (
                    <li className="!text-[#b3b3b3] text-lg md:text-xl flex items-start gap-3">
                      <span className="!text-[#ff0f7b] font-bold mt-1 text-xl drop-shadow-[0_0_5px_rgba(255,15,123,0.8)]">✓</span>
                      <div className="!text-[#b3b3b3]">{props.children}</div>
                    </li>
                  ),
                  strong: ({node, ...props}) => (
                    <strong className="!text-white font-extrabold bg-gradient-to-r from-[rgba(255,15,123,0.2)] to-transparent px-2 py-1 rounded-md border-l-2 border-[#ff0f7b]" {...props} />
                  ),
                  a: ({node, ...props}) => (
                    <a className="!text-[#ff0f7b] font-bold no-underline hover:underline hover:drop-shadow-[0_0_8px_rgba(255,15,123,0.8)] transition-all duration-300" {...props} />
                  ),
                  // 🔥 NEW IMAGE HANDLER 🔥
                  img: ({node, ...props}) => (
                    <span className="flex justify-center my-10 w-full relative z-10">
                      <img 
                        className="max-w-full h-auto max-h-[500px] object-contain rounded-[24px] border border-[rgba(255,15,123,0.3)] shadow-[0_0_30px_rgba(255,15,123,0.15)] bg-[#0a0014]" 
                        {...props} 
                      />
                    </span>
                  )
                }}
              >
                {post.content}
              </ReactMarkdown>
            </div>
          </div>

          {/* Sidebar Section */}
          <aside className="lg:col-span-4 space-y-10 w-full mt-10 lg:mt-0">
            <AdSensePlaceholder />
            
            <div className="sticky top-10 bg-white/[0.04] backdrop-blur-[32px] border border-[rgba(255,15,123,0.35)] rounded-[32px] p-8 shadow-[0_0_50px_rgba(255,15,123,0.15)] transition-all duration-500 hover:shadow-[0_0_60px_rgba(255,15,123,0.25)] hover:border-[rgba(255,15,123,0.5)]">
              <div className="w-16 h-16 bg-gradient-to-br from-[#ff0f7b] to-[#5f0a87] rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(255,15,123,0.4)]">
                <span className="!text-white font-extrabold text-2xl font-mono">B!</span>
              </div>
              <h4 className="text-xl font-extrabold !text-white mb-4">
                Unlock Your Financial Future
              </h4>
              <p className="!text-[#b3b3b3] text-base leading-relaxed mb-8">
                BachatKaro is an exclusive community. Secure your spot on the waitlist before the official app drops.
              </p>
              <button 
                type="button"
                onClick={() => navigate('/')} 
                className="w-full relative group overflow-hidden rounded-2xl bg-gradient-to-r from-[#ff0f7b] to-[#5f0a87] p-[1px] transition-transform duration-500 ease-butter-soft active:scale-[0.965] outline-none"
              >
                <div className="flex items-center justify-center w-full h-full bg-[#0a0014]/80 backdrop-blur-md rounded-[15px] p-4 transition-all duration-300 group-hover:bg-transparent">
                  <span className="!text-white font-mono text-sm tracking-widest font-bold group-hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.9)] transition-all duration-300 uppercase">
                    Join Waitlist
                  </span>
                </div>
              </button>
            </div>
          </aside>

        </div>
      </div>
    </div>
  );
};

export default BlogPost;
