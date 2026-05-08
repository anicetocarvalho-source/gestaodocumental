import { useEffect } from "react";

interface PageMeta {
  title: string;
  description?: string;
  noindex?: boolean;
  lang?: string;
}

function setMeta(name: string, content: string) {
  let el = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("name", name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

export function usePageMeta({ title, description, noindex, lang }: PageMeta) {
  useEffect(() => {
    const prevTitle = document.title;
    const prevLang = document.documentElement.lang;
    document.title = title;
    if (lang) document.documentElement.lang = lang;
    if (description) setMeta("description", description);
    if (noindex) setMeta("robots", "noindex, nofollow");
    return () => {
      document.title = prevTitle;
      if (lang) document.documentElement.lang = prevLang;
      if (noindex) setMeta("robots", "index, follow");
    };
  }, [title, description, noindex, lang]);
}
