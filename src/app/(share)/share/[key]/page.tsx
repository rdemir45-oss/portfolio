import type { Metadata } from "next";
import { redirect } from "next/navigation";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://recepdemirborsa.com";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ key: string }>;
}): Promise<Metadata> {
  const { key } = await params;
  const imageUrl = `${SITE_URL}/api/scan/share/${key}`;

  return {
    title: "RdAlgo — Hisse Teknik Analizi Sinyalleri",
    description:
      "BIST hisse teknik tarama sinyalleri. RdAlgo tarafından otomatik taranmaktadır.",
    openGraph: {
      type: "website",
      url: `${SITE_URL}/share/${key}`,
      title: "RdAlgo — Hisse Teknik Analizi Sinyalleri",
      description:
        "BIST hisse teknik tarama sinyalleri. RdAlgo tarafından otomatik taranmaktadır.",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: "Hisse Tarama Sinyalleri",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "RdAlgo — Hisse Teknik Analizi Sinyalleri",
      description: "BIST hisse teknik tarama sinyalleri.",
      images: [imageUrl],
    },
  };
}

export default async function SharePage({
  params,
}: {
  params: Promise<{ key: string }>;
}) {
  await params;
  redirect("/hisse-teknik-analizi");
}
