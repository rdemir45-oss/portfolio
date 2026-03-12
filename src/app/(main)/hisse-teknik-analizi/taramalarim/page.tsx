import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CustomScanManager from "./CustomScanManager";

export const metadata = {
  title: "Özel Taramalarım | RdAlgo",
  description: "Kendi teknik analiz taramalarını oluştur ve çalıştır.",
};

export default function CustomScansPage() {
  return (
    <div className="min-h-screen bg-[#050a0e] text-white">
      <Navbar />
      <div className="pt-20 pb-16">
        <CustomScanManager />
      </div>
      <Footer />
    </div>
  );
}
