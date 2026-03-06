import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import StockScanner from "@/components/StockScanner";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Hisse Formasyon Tarayıcı | TheBigShort",
  description:
    "BIST hisseleri her saat otomatik taranır. İkili dip, trend kırılımı, RSI sinyalleri ve daha fazlası.",
};

export default function HisseTaramaPage() {
  return (
    <div className="min-h-screen bg-[#050a0e] text-white">
      <Navbar />
      <div className="pt-16">
        <StockScanner />
      </div>
      <Footer />
    </div>
  );
}
