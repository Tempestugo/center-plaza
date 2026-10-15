import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import DirectBookingBanner from "@/components/DirectBookingBanner";
import FeaturedAccommodations from "@/components/FeaturedAccommodations";
import GoogleReviewsSection from "@/components/GoogleReviewsSection";
import LocationSection from "@/components/LocationSection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <HeroSection />
        <DirectBookingBanner />
        <FeaturedAccommodations />
        <GoogleReviewsSection />
        <LocationSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
