import { supabase } from "@/integrations/supabase/client";
import { safeJsonParse } from "@/utils/jsonUtils";

const TABLE = "merchant_category_map";
const CONFIDENCE_INCREMENT = 0.1;
const CONFIDENCE_THRESHOLD = 0.7;
const LOCAL_MAP_KEY = "bk:merchant-category-map";

export type LearnedCategory = {
  merchant_name: string;
  category: string;
  confidence_score: number;
  last_used: string;
};

const normalizeMerchant = (value?: string) => {
  if (!value) return "";
  const trimmed = value.trim().toLowerCase();
  return trimmed.replace(/^[“”"']+|[“”"']+$/g, "").replace(/[^\w\s&.-]/g, "").trim();
};

const localCache = new Map<string, string>();

const loadLocalCache = () => {
  if (localCache.size > 0) return;
  try {
    const stored = localStorage.getItem(LOCAL_MAP_KEY);
    if (stored) {
      const parsed = safeJsonParse<Record<string, string>>(stored, {});
      Object.entries(parsed).forEach(([merchant, category]) => {
        localCache.set(merchant, category);
      });
    }
  } catch {
    // ignore
  }
};

const persistLocalCache = () => {
  const obj: Record<string, string> = {};
  localCache.forEach((category, merchant) => {
    obj[merchant] = category;
  });
  localStorage.setItem(LOCAL_MAP_KEY, JSON.stringify(obj));
};

let backendAvailable = true;

export const learnMerchant = async ({
  merchant,
  category,
}: {
  merchant?: string;
  category?: string;
}): Promise<LearnedCategory | null> => {
  const normalized = normalizeMerchant(merchant);
  if (!normalized || !category) return null;

  console.log("[intelligence] merchant learned", { merchant: normalized, category });
  if (!backendAvailable) {
    localCache.set(normalized, category);
    persistLocalCache();
    return {
      merchant_name: normalized,
      category,
      confidence_score: 1,
      last_used: new Date().toISOString(),
    };
  }

  try {
    const { data: existing } = await supabase
      .from(TABLE)
      .select("*")
      .eq("merchant_name", normalized)
      .maybeSingle();

    if (!existing) {
      const { data, error } = await supabase
        .from(TABLE)
        .insert({
          merchant_name: normalized,
          category,
          confidence_score: CONFIDENCE_INCREMENT,
          last_used: new Date().toISOString(),
        })
        .select()
        .single();

      if (error || !data) {
        if (error?.status === 404) {
          backendAvailable = false;
          localCache.set(normalized, category);
          persistLocalCache();
        }
        return null;
      }
      return data as LearnedCategory;
    }

    const updatedConfidence = Math.min(1, (existing.confidence_score || 0) + CONFIDENCE_INCREMENT);
    const { data, error } = await supabase
      .from(TABLE)
      .update({
        category,
        confidence_score: updatedConfidence,
        last_used: new Date().toISOString(),
      })
      .eq("merchant_name", normalized)
      .select()
      .single();

    if (error) {
      if (error?.status === 404) {
        backendAvailable = false;
        localCache.set(normalized, category);
        persistLocalCache();
      }
      return null;
    }

    return data as LearnedCategory;
  } catch (error: any) {
    console.error("[intelligence] learnMerchant error", error);
    if (error?.status === 404) {
      backendAvailable = false;
      localCache.set(normalized, category);
      persistLocalCache();
    }
    return null;
  }
};

export const getLearnedCategory = async (merchant?: string): Promise<string | null> => {
  const normalized = normalizeMerchant(merchant);
  if (!normalized) return null;

  loadLocalCache();
  if (localCache.has(normalized)) {
    const cached = localCache.get(normalized)!;
    console.log("[intelligence] learned category applied (local)", { merchant: normalized, category: cached });
    return cached;
  }

  try {
    const { data } = await supabase
      .from(TABLE)
      .select("*")
      .eq("merchant_name", normalized)
      .maybeSingle();

    if (data && data.confidence_score >= CONFIDENCE_THRESHOLD) {
      console.log("[intelligence] learned category applied", { merchant: normalized, category: data.category });
      return data.category;
    }
  } catch (error) {
    console.error("[intelligence] getLearnedCategory error", error);
    if ((error as any)?.status === 404) {
      backendAvailable = false;
    }
  }

  return null;
};
