import Hero from "@/components/Hero";
import SiteFeatures from "@/components/SiteFeatures";
import Indicators from "@/components/Indicators";
import Pricing from "@/components/Pricing";
import Platforms from "@/components/Platforms";
import Announcements from "@/components/Announcements";
import About from "@/components/About";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <>
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
