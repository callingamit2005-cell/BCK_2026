import { blogPostMocks, type BlogPostMock } from "@/data/blogPosts";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import { withRetry } from "@/lib/retry";

export type BlogPostModel = BlogPostMock & {
  categoryName?: string;
  featured_image?: string | null; // Nayi chain (pocket) photo rakhne ke liye
};

const normalizePost = (row: any): BlogPostModel => ({
  id: Number(row.id),
  slug: String(row.slug),
  title: String(row.title),
  tag: row.blog_categories?.name ?? row.tag ?? "Blog",
  date: new Date(row.created_at ?? Date.now()).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }),
  excerpt: String(row.excerpt ?? ""),
  content: String(row.content ?? ""),
  categoryName: row.blog_categories?.name,
  // Delivery Boy ke bag mein photo pack karna 👇
  featured_image: row.featured_image ? String(row.featured_image) : null, 
});

export const fetchBlogPosts = async (): Promise<BlogPostModel[]> => {
  try {
    const data = await withRetry(async () => {
      const { data: rows, error } = await supabase
        .from("blog_posts")
        // Delivery Boy ki parchi mein 'featured_image' jod diya 👇
        .select("id, slug, title, excerpt, content, featured_image, created_at, blog_categories(name)")
        .eq("status", "published")
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      return (rows ?? []).map(normalizePost);
    }, { retries: 2, delayMs: 250, factor: 2 });

    if (data.length > 0) {
      return data;
    }

    logger.warn("Blog query returned no rows, using fallback mock posts");
    return blogPostMocks;
  } catch (error) {
    logger.error("Failed to fetch blog posts from Supabase, using fallback", error);
    return blogPostMocks;
  }
};

export const fetchBlogPostBySlug = async (slug: string): Promise<BlogPostModel | null> => {
  try {
    const post = await withRetry(async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        // Yahan bhi Delivery Boy ki parchi mein 'featured_image' jod diya 👇
        .select("id, slug, title, excerpt, content, featured_image, created_at, blog_categories(name)")
        .eq("slug", slug)
        .eq("status", "published")
        .maybeSingle();

      if (error) {
        throw error;
      }

      return data ? normalizePost(data) : null;
    }, { retries: 2, delayMs: 250, factor: 2 });

    if (post) {
      return post;
    }
  } catch (error) {
    logger.error("Failed to fetch blog post from Supabase, using fallback", error, { slug });
  }

  return blogPostMocks.find((item) => item.slug === slug) ?? null;
};
