import AdPlaceholder from "@/components/AdPlaceholder";
import { blogPostMocks } from "@/data/blogPosts";
import { Link } from "react-router-dom";

const BlogGrid = () => (
  <section className="py-24 px-6 bg-background antialiased" id="blog">
    <div className="max-w-6xl mx-auto">
      <h2 className="text-3xl md:text-5xl font-black text-center mb-16 text-white tracking-tighter uppercase">
        System <span className="text-white/40">Updates</span>
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
          {blogPostMocks.map((b) => (
            <Link
              key={b.id}
              to={`/blog/${b.slug}`}
              className="block bg-surface border border-white/5 rounded-[24px] p-8 hover:bg-white/[0.03] transition-all active:scale-[0.98] group cursor-pointer"
            >
              <span className="inline-block px-3 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest bg-white/5 text-white/40 border border-white/10 mb-6 group-hover:text-white transition-colors">
                {b.tag}
              </span>
              <h3 className="text-xl font-black text-white mb-3 tracking-tighter uppercase leading-tight">
                {b.title}
              </h3>
              <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest leading-relaxed mb-4">{b.excerpt}</p>
              <span className="text-[9px] font-mono text-white/20 uppercase tracking-widest">{b.date}</span>
            </Link>
          ))}
        </div>

        <div className="space-y-6">
          <AdPlaceholder className="min-h-[300px] bg-white/[0.01] border-white/5" />
          <div className="bg-surface border border-white/5 rounded-[24px] p-8">
            <h4 className="text-sm font-black text-white mb-2 uppercase tracking-widest">Newsletter</h4>
            <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mb-6 leading-relaxed">Financial intelligence dispatched weekly.</p>
            <input
              type="email"
              placeholder="operator@network.com"
              className="w-full h-14 px-5 rounded-xl bg-background border border-white/5 text-white font-mono text-xs placeholder:text-white/20 focus:outline-none focus:border-white/20 mb-4 transition-all"
            />
            <button className="w-full h-14 bg-white text-background font-black uppercase text-xs tracking-widest rounded-xl hover:bg-white/90 active:scale-[0.98] transition-all">
              Join Network
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default BlogGrid;
