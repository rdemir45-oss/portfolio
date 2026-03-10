import Hero from "@/components/Hero";
import SiteFeatures from "@/components/SiteFeatures";
import Indicators from "@/components/Indicators";
import Pricing from "@/components/Pricing";
import Platforms from "@/components/Platforms";
import Announcements from "@/components/Announcements";
import About from "@/components/About";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import LiveStreamBanner from "@/components/LiveStreamBanner";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <>
      <LiveStreamBanner />
      <Hero />
      <SiteFeatures />
      <Indicators />
      <Pricing />
      <Platforms />
      <Announcements />
      <About />
      <Contact />
      <Footer />
    </>
  );
}
