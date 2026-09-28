import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import FeaturedAccommodations from "@/components/FeaturedAccommodations";
import LocationSection from "@/components/LocationSection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <HeroSection />
        <FeaturedAccommodations />
        <LocationSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
