import { FeatureGridSection } from "@/components/sections/FeatureGridSection";
import { FinalCtaSection } from "@/components/sections/FinalCtaSection";
import { HeroSection } from "@/components/sections/HeroSection";
import { PlatformSection } from "@/components/sections/PlatformSection";
import { ProofSection } from "@/components/sections/ProofSection";
import { SiteFooter } from "@/components/sections/SiteFooter";

const WEB_APP_URL = "https://dashboardbrawlstats.pages.dev";
const IOS_DOWNLOAD_URL = "#ios-download";
const PRIVACY_URL = "#privacy";
const TERMS_URL = "#terms";

export default function Home() {
  return (
    <>
      <main className="landing-shell">
        <HeroSection webAppUrl={WEB_APP_URL} iosUrl={IOS_DOWNLOAD_URL} />
        <FeatureGridSection />
        <ProofSection />
        <PlatformSection />
        <FinalCtaSection webAppUrl={WEB_APP_URL} iosUrl={IOS_DOWNLOAD_URL} />
      </main>
      <SiteFooter privacyUrl={PRIVACY_URL} termsUrl={TERMS_URL} />
    </>
  );
}
