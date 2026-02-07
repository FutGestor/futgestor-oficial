import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

interface SlugCheckResult {
  isChecking: boolean;
  isAvailable: boolean | null;
  suggestions: string[];
}

export function useSlugCheck(slug: string, debounceMs = 500): SlugCheckResult {
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!slug || slug.length < 3) {
      setIsAvailable(null);
      setSuggestions([]);
      return;
    }

    setIsChecking(true);
    setIsAvailable(null);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(async () => {
      try {
        const { data } = await supabase
          .from("teams")
          .select("slug")
          .eq("slug", slug)
          .maybeSingle();

        if (!data) {
          setIsAvailable(true);
          setSuggestions([]);
        } else {
          setIsAvailable(false);
          // Generate alternatives
          const alts = [`${slug}-01`, `${slug}-02`, `${slug}-fc`];
          // Check which alternatives are available
          const { data: taken } = await supabase
            .from("teams")
            .select("slug")
            .in("slug", alts);
          const takenSlugs = new Set((taken || []).map((t) => t.slug));
          setSuggestions(alts.filter((a) => !takenSlugs.has(a)));
        }
      } catch {
        setIsAvailable(null);
        setSuggestions([]);
      } finally {
        setIsChecking(false);
      }
    }, debounceMs);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [slug, debounceMs]);

  return { isChecking, isAvailable, suggestions };
}
