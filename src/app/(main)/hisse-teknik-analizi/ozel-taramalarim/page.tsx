import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AssignedScanManager from "./AssignedScanManager";

export const metadata = {
  title: "Size Özel Taramalar | RdAlgo",
  description: "Yöneticiniz tarafından hesabınıza özel olarak atanmış teknik analiz taramaları.",
};

export default function OzelTaramaPage() {
  return (
    <div className="min-h-screen bg-[#050a0e] text-white">
      <Navbar />
      <div className="pt-20 pb-16">
        <AssignedScanManager />
      </div>
      <Footer />
    </div>
  );
}
