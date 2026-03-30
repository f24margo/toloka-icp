import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { type Lang, type TKey, getT } from "../i18n";

interface LanguageContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: TKey) => string;
}

export const LanguageContext = createContext<LanguageContextValue>({
  lang: "uk",
  setLang: () => {},
  t: getT("uk"),
});

export function useLanguage() {
  return useContext(LanguageContext);
}

export function createLanguageProviderValue(): LanguageContextValue {
  const stored =
    typeof window !== "undefined"
      ? (localStorage.getItem("lang") as Lang | null)
      : null;
  const initial: Lang = stored === "en" ? "en" : "uk";
  return {
    lang: initial,
    setLang: () => {},
    t: getT(initial),
  };
}

// Hook to manage language state — used internally by LanguageProviderWrapper
export function useLanguageState() {
  const stored =
    typeof window !== "undefined"
      ? (localStorage.getItem("lang") as Lang | null)
      : null;
  const [lang, setLangState] = useState<Lang>(stored === "en" ? "en" : "uk");

  useEffect(() => {
    localStorage.setItem("lang", lang);
  }, [lang]);

  const setLang = useCallback((l: Lang) => setLangState(l), []);
  const t = useMemo(() => getT(lang), [lang]);

  return { lang, setLang, t };
}
