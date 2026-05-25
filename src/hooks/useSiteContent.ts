/**
 * CMS Hook - BachatKaro Dynamic Content
 * Logic: Fetches landing page text and blog posts from Supabase
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Landing Page Section Fetch Karne Ke Liye (Hero, Features, etc.)
export const useSiteContent = (sectionName: string) => {
  return useQuery({
    queryKey: ['site-content', sectionName],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_content')
        .select('content_json')
        .eq('section_name', sectionName)
        .maybeSingle(); // .single() ki jagah .maybeSingle() use karein taaki error na aaye agar data khali ho
      
      if (error) throw error;
      return data?.content_json || null;
    }
  });
};

// Blog Posts Fetch Karne Ke Liye (SEO Friendly)
export const useBlogPosts = () => {
  return useQuery({
    queryKey: ['blog-posts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*, blog_categories(name)')
        .eq('status', 'published')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });
};