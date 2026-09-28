import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, MapPin, Coffee, Clock, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import bgHeroImage from "@/assets/bg-hero-hootel.jpg";

const HeroSection = () => {
  const [heroImage, setHeroImage] = useState<string | null>(null);
  const [promoText, setPromoText] = useState<string>("");

  const getDefaultPromoText = () => {
    const now = new Date();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    return `Válido até ${lastDay}/${month}`;
  };

  useEffect(() => {
    fetch('/api/settings/hero_image')
      .then(r => r.json())
      .then(d => { if (d.value) setHeroImage(d.value); })
      .catch(() => {});

    fetch('/api/settings/promo_text')
      .then(r => r.json())
      .then(d => setPromoText(d.value || getDefaultPromoText()))
      .catch(() => setPromoText(getDefaultPromoText()));
  }, []);

  return (
    <section className="relative min-h-[100dvh] flex items-end overflow-hidden" style={{ background: '#1a1015' }}>
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={heroImage || bgHeroImage}
          alt="Center Plaza Hotel — Lobby"
          className="w-full h-full object-cover"
        />
        {/* Dark wine-toned gradient from left */}
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(105deg, rgba(45,10,25,0.93) 0%, rgba(45,10,25,0.87) 35%, rgba(45,10,25,0.55) 60%, rgba(45,10,25,0.25) 100%)'
        }} />
      </div>

      {/* Content — left-aligned */}
      <div className="relative z-10 container mx-auto px-4 sm:px-8 py-16 pb-20 md:py-24">
        <div className="max-w-xl animate-fade-in-up">

          {/* Top badge — location (wine palette) */}
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 mb-6" style={{
            background: 'rgba(120,20,50,0.5)',
            border: '1px solid rgba(180,60,90,0.3)',
            backdropFilter: 'blur(8px)'
          }}>
            <MapPin className="w-3.5 h-3.5" style={{ color: '#d4a574' }} />
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,235,220,0.9)' }}>
              Bela Vista • Centro de São Paulo
            </span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-2 leading-[1.05] tracking-tight">
            Center Plaza
          </h1>
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-[1.05] tracking-tight" style={{ color: '#d4a574' }}>
            Hotel
          </h1>

          {/* Key Value Props */}
          <div className="flex flex-col gap-3 mb-8">
            {/* Promoção + Café da Manhã (Combinado) */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ 
                background: 'rgba(212,165,116,0.12)', 
                border: '1px solid rgba(212,165,116,0.25)' 
              }}>
                <Coffee className="w-5 h-5" style={{ color: '#d4a574' }} />
              </div>
              <div>
                <p className="text-white font-semibold text-base">Café da Manhã Incluso</p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  Promoção por tempo limitado! {promoText}
                </p>
              </div>
            </div>

            {/* Localização */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ 
                background: 'rgba(212,165,116,0.12)', 
                border: '1px solid rgba(212,165,116,0.25)' 
              }}>
                <MapPin className="w-5 h-5" style={{ color: '#d4a574' }} />
              </div>
              <div>
                <p className="text-white font-semibold text-base">R. Maestro Cardim, 418</p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>Bela Vista — A 350m do Metrô São Joaquim</p>
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              variant="hero"
              size="xl" 
              className="group text-base px-8 py-6 shadow-xl font-semibold"
              asChild
            >
              <Link to="/hospedagens">
                Ver Suítes
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            
            <Button 
              size="xl"
              className="text-base px-8 py-6 transition-all bg-white/10 hover:bg-white/20 text-white border border-white/25"
              asChild
            >
              <a href="https://wa.me/551132893757" target="_blank" rel="noopener noreferrer">
                <Phone className="mr-2 w-4 h-4" />
                WhatsApp
              </a>
            </Button>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 animate-bounce hidden md:flex">
        <div className="w-5 h-8 border-2 border-white/20 rounded-full flex justify-center">
          <div className="w-0.5 h-2 bg-white/30 rounded-full mt-1.5 animate-pulse" />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;