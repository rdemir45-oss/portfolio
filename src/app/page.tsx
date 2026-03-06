import Hero from "@/components/Hero";
import Indicators from "@/components/Indicators";
import Platforms from "@/components/Platforms";
import Announcements from "@/components/Announcements";
import StockScanner from "@/components/StockScanner";
import About from "@/components/About";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <>
      <Hero />
      <Indicators />
      <Platforms />
      <StockScanner />
      <Announcements />
      <About />
      <Contact />
      <Footer />
    </>
  );
}
