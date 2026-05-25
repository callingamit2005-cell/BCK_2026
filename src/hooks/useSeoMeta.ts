import { useEffect } from "react";

const setMeta = (selector: string, content: string) => {
  if (typeof window === "undefined") return;
  
  const element = document.querySelector(selector);
  if (element) {
    element.setAttribute("content", content);
    return;
  }

  const meta = document.createElement("meta");
  const match = selector.match(/(name|property)=\"([^\"]+)\"/);
  if (!match) return;
  meta.setAttribute(match[1], match[2]);
  meta.setAttribute("content", content);
  document.head.appendChild(meta);
};

export const useSeoMeta = (title: string, description: string, canonicalUrl?: string) => {
  useEffect(() => {
    if (typeof window === "undefined") return;

    document.title = title;
    setMeta('meta[name="description"]', description);
    setMeta('meta[property="og:title"]', title);
    setMeta('meta[property="og:description"]', description);
    setMeta('meta[property="twitter:title"]', title);
    setMeta('meta[property="twitter:description"]', description);

    if (canonicalUrl) {
      setMeta('meta[property="og:url"]', canonicalUrl);
      setMeta('meta[property="twitter:url"]', canonicalUrl);
      let canonical = document.querySelector('link[rel="canonical"]');
      if (!canonical) {
        canonical = document.createElement("link");
        canonical.setAttribute("rel", "canonical");
        document.head.appendChild(canonical);
      }
      canonical.setAttribute("href", canonicalUrl);
    }
  }, [title, description, canonicalUrl]);
};
