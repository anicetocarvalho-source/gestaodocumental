import { useEffect } from "react";

const BASE_TITLE = "NODOC";

/**
 * Sets the document title dynamically for SEO and browser tab clarity.
 * @param title - Page-specific title (e.g. "Documentos")
 */
export function usePageTitle(title: string) {
  useEffect(() => {
    document.title = title ? `${title} | ${BASE_TITLE}` : BASE_TITLE;
    return () => {
      document.title = BASE_TITLE;
    };
  }, [title]);
}
