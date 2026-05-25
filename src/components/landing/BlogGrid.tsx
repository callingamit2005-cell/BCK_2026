import AdPlaceholder from "@/components/AdPlaceholder";
import { blogPostMocks } from "@/data/blogPosts";
import { Link } from "react-router-dom";

const BlogGrid = () => (
  <section className="py-16 px-6" id="blog">
    <div className="max-w-6xl mx-auto">
      <h2 className="text-3xl md:text-4xl font-bold font-display text-center mb-12 text-foreground">
        Latest from the <span className="gradient-brand-text">Blog</span>
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
          {blogPostMocks.map((b) => (
            <Link
              key={b.id}
              to={`/blog/${b.slug}`}
              className="block glass-card rounded-xl p-6 hover:glow-brand-sm transition-all hover:scale-[1.02] group cursor-pointer"
            >
              <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold font-body gradient-brand text-primary-foreground mb-3">
                {b.tag}
              </span>
              <h3 className="text-lg font-bold font-display text-foreground mb-2 group-hover:gradient-brand-text transition-colors">
                {b.title}
              </h3>
              <p className="text-sm text-muted-foreground font-body mb-3">{b.excerpt}</p>
              <span className="text-xs text-muted-foreground font-body">{b.date}</span>
            </Link>
          ))}
        </div>

        <div className="space-y-6">
          <AdPlaceholder className="min-h-[300px]" />
          <div className="glass-card rounded-xl p-6">
            <h4 className="font-display font-bold text-foreground mb-3">Newsletter</h4>
            <p className="text-sm text-muted-foreground font-body mb-4">Get weekly money tips straight to your inbox.</p>
            <input
              type="email"
              placeholder="your@email.com"
              className="w-full px-4 py-3 rounded-lg bg-input border border-border text-foreground font-body text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary mb-3"
            />
            <button className="w-full gradient-brand text-primary-foreground font-display font-semibold py-3 rounded-lg text-sm hover:scale-105 transition-transform">
              Subscribe
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default BlogGrid;
