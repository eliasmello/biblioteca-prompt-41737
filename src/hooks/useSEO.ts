import { useEffect } from "react";

interface UseSEOOptions {
  title: string;
  description?: string;
  canonicalPath?: string; // e.g. "/dashboard"
}

export function useSEO({ title, description, canonicalPath }: UseSEOOptions) {
  useEffect(() => {
    if (title) document.title = title.slice(0, 60);

    if (description) {
      let meta = document.querySelector('meta[name="description"]');
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', 'description');
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', description.slice(0, 160));
    }

    if (canonicalPath) {
      const href = window.location.origin + canonicalPath;
      let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
      if (!canonical) {
        canonical = document.createElement('link');
        canonical.setAttribute('rel', 'canonical');
        document.head.appendChild(canonical);
      }
      canonical.href = href;
    }
  }, [title, description, canonicalPath]);
}
