import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Wallet, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";

const BlogPost = () => {
  const { slug } = useParams();
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("blog_posts")
          .select("*")
          .eq("slug", slug)
          .single();

        if (error) throw error;
        setPost(data);
      } catch (err: any) {
        console.error("Error fetching blog post:", err.message);
        setError("Article not found.");
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [slug]);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden relative flex items-start justify-center">
      
      {/* Dynamic Background Surface (Themed) */}
      <div className="absolute inset-0 bg-background pointer-events-none z-0" />

      {error ? (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="p-10 rounded-premium bg-surface border border-border/40 text-center shadow-premium">
            <p className="text-foreground font-black uppercase tracking-widest">{error}</p>
          </div>
        </div>
      ) : loading || !post ? (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Loader2 className="h-10 w-10 animate-spin text-institutional-blue opacity-40" />
        </div>
      ) : (
        <div className="relative min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-institutional-blue/10 pb-20 w-full">
          {/* Institutional Glow (Themed) */}
          <div className="absolute bottom-[20%] right-[-10%] w-[700px] h-[700px] bg-institutional-blue rounded-full mix-blend-soft-light filter blur-[180px] opacity-10 pointer-events-none fixed z-0"></div>

          <article className="relative z-10 max-w-4xl mx-auto px-6 pt-24 md:pt-32">
            {/* Back Navigation */}
            <Link 
              to="/blog" 
              className="inline-flex items-center gap-2 text-text-muted hover:text-foreground font-black text-[10px] uppercase tracking-[0.2em] mb-12 transition-all group"
            >
              <ArrowLeft className="h-3 w-3 group-hover:-translate-x-1 transition-transform" />
              Back to Library
            </Link>

            {/* Title (Institutional Style) */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter mb-12 text-foreground uppercase drop-shadow-sm leading-[1.1]">
              {post.title}
            </h1>

            {/* Featured Image Container */}
            {post.image_url && (
              <div className="mb-14 w-full h-[300px] md:h-[500px] rounded-modal overflow-hidden border border-border/40 shadow-premium bg-surface relative group flex items-center justify-center">
                <img 
                  src={post.image_url} 
                  alt={post.title} 
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent opacity-40 z-10 pointer-events-none"></div>
              </div>
            )}

            {/* Markdown Content Block (Consolidated Design System) */}
            <div className="prose prose-invert max-w-none prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tighter prose-p:text-text-secondary prose-p:leading-relaxed prose-strong:text-foreground prose-strong:font-black">
              <ReactMarkdown 
                components={{
                  h2: ({node, ...props}) => (
                    <h2 className="text-2xl md:text-3xl font-black text-foreground mt-16 mb-8 pb-4 border-b border-border/40 tracking-tighter uppercase" {...props} />
                  ),
                  li: ({node, ...props}) => (
                    <li className="flex gap-4 items-start mb-4">
                      <span className="text-institutional-blue font-black mt-1 text-xl">✓</span>
                      <span {...props} />
                    </li>
                  ),
                  strong: ({node, ...props}) => (
                    <strong className="text-foreground font-black bg-secondary/50 px-2 py-0.5 rounded-md border-l-2 border-institutional-blue" {...props} />
                  ),
                  a: ({node, ...props}) => (
                    <a className="text-institutional-blue font-black no-underline hover:underline transition-all duration-300" {...props} />
                  ),
                  img: ({node, ...props}) => (
                    <img 
                      className="max-w-full h-auto max-h-[500px] object-contain rounded-premium border border-border/40 shadow-premium bg-surface"
                      {...props} 
                    />
                  ),
                }}
              >
                {post.content}
              </ReactMarkdown>
            </div>

            {/* Social Footer */}
            <div className="mt-24 pt-12 border-t border-border/40">
               <div className="flex flex-col md:flex-row justify-between items-center gap-10">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-secondary rounded-2xl flex items-center justify-center shadow-premium">
                      <Wallet className="h-8 w-8 text-foreground" />
                    </div>
                    <div>
                      <p className="text-lg font-black text-foreground uppercase tracking-tight">Join the Mission</p>
                      <p className="text-xs font-black text-text-muted uppercase tracking-widest opacity-60">Precision Wealth for India</p>
                    </div>
                  </div>

                  <Link 
                    to="/auth"
                    className="w-full md:w-auto flex items-center justify-center bg-primary text-primary-foreground rounded-xl px-12 py-4 font-black uppercase text-xs tracking-widest shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-300"
                  >
                    Secure Access
                  </Link>
               </div>
            </div>
          </article>
        </div>
      )}
    </div>
  );
};

export default BlogPost;
