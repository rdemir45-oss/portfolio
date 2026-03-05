import { createClient } from "@/lib/supabase";
import { indicators as staticIndicators } from "@/data/indicators";
import IndicatorsClient, { type IndicatorItem } from "./IndicatorsClient";

async function getIndicators(): Promise<IndicatorItem[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("indicators")
      .select("slug, title, platform, short_desc, tags, badge, badge_color, cover_image")
      .order("sort_order", { ascending: true });
    if (!error && data && data.length > 0) {
      return data.map((d) => ({
        slug: d.slug,
        title: d.title,
        platform: d.platform,
        shortDesc: d.short_desc,
        tags: d.tags ?? [],
        badge: d.badge ?? undefined,
        badgeColor: d.badge_color ?? undefined,
        cover_image: d.cover_image ?? undefined,
      }));
    }
  } catch {}
  return staticIndicators.map((ind) => ({
    slug: ind.slug,
    title: ind.title,
    platform: ind.platform,
    shortDesc: ind.shortDesc,
    tags: ind.tags,
    badge: ind.badge,
    badgeColor: ind.badgeColor,
    cover_image: undefined,
  }));
}

export default async function Indicators() {
  const items = await getIndicators();
  return <IndicatorsClient indicators={items} />;
}
