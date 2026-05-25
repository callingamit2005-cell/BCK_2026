import { useEffect } from "react";
import { loadNamespaces } from "@/i18n";

export const useI18nNamespaces = (namespaces: readonly string[]) => {
  useEffect(() => {
    void loadNamespaces(namespaces);
  }, [namespaces.join("|")]);
};

