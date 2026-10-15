import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowDown, MapPin, Coffee, Clock } from "lucide-react";
import bgHeroImage from "@/assets/bg-hero-hootel.jpg";

const HeroSection = () => {
  const [heroImage, setHeroImage] = useState<string | null>(null);
  const [promoText, setPromoText] = useState<string>("Válido até 30/10");

  const getDefaultPromoText = () => {
    return "Válido até 30/10";
  };

  useEffect(() => {
    fetch('/api/settings/hero_image')
      .then(r => r.json())
      .then(d => { if (d.value) setHeroImage(d.value); })
      .catch(() => {});

    fetch('/api/settings/promo_text')
      .then(r => r.json())
      .then(d => {
        if (d.value) {
          setPromoText(d.value.replace(/31\/10/g, '30/10'));
        } else {
          setPromoText("Válido até 30/10");
        }
      })
      .catch(() => setPromoText("Válido até 30/10"));
  }, []);

  const scrollToAccommodations = () => {
    const element = document.getElementById("acomodacoes");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const scrollToLocation = () => {
    const element = document.getElementById("localizacao");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="relative min-h-[88dvh] md:min-h-[100dvh] flex items-center md:items-end overflow-hidden pt-16 md:pt-0" style={{ background: '#1a1015' }}>
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={heroImage || bgHeroImage}
          alt="Center Plaza Hotel — Lobby"
          className="w-full h-full object-cover"
        />
        {/* Dark wine-toned gradient from left */}
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(105deg, rgba(45,10,25,0.94) 0%, rgba(45,10,25,0.88) 38%, rgba(45,10,25,0.58) 65%, rgba(45,10,25,0.28) 100%)'
        }} />
      </div>

      {/* Content — left-aligned */}
      <div className="relative z-10 container mx-auto px-4 sm:px-8 py-8 pb-16 md:py-24">
        <div className="max-w-xl animate-fade-in-up">

          {/* Heading */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-1 leading-[1.05] tracking-tight">
            Center Plaza
          </h1>
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-3 leading-[1.05] tracking-tight" style={{ color: '#d4a574' }}>
            Hotel
          </h1>

          {/* Subtítulo solicitado */}
          <p className="text-base sm:text-lg md:text-xl text-stone-200 font-light mb-6 leading-relaxed">
            Uma estadia confortável em uma localização privilegiada
          </p>

          {/* Key Value Props — Interativos com scroll suave */}
          <div className="flex flex-col gap-2.5 mb-8">
            {/* Promoção + Café da Manhã (Clicável: rola direto para os quartos) */}
            <button
              type="button"
              onClick={scrollToAccommodations}
              className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 active:bg-white/10 transition-all text-left group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform" style={{ 
                background: 'rgba(212,165,116,0.18)', 
                border: '1px solid rgba(212,165,116,0.4)' 
              }}>
                <Coffee className="w-5 h-5" style={{ color: '#d4a574' }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-white font-semibold text-base group-hover:text-amber-200 transition-colors">Café da Manhã Incluso</p>
                  <span className="text-[10px] bg-amber-500/25 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-medium shrink-0">Ver quartos ↓</span>
                </div>
                <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.7)' }}>
                  Em suítes selecionadas • {promoText}
                </p>
              </div>
            </button>

            {/* Localização (Clicável: rola para o mapa) */}
            <button
              type="button"
              onClick={scrollToLocation}
              className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 active:bg-white/10 transition-all text-left group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform" style={{ 
                background: 'rgba(212,165,116,0.18)', 
                border: '1px solid rgba(212,165,116,0.4)' 
              }}>
                <MapPin className="w-5 h-5" style={{ color: '#d4a574' }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-white font-semibold text-base group-hover:text-amber-200 transition-colors">R. Maestro Cardim, 418</p>
                  <span className="text-[10px] bg-white/10 text-stone-300 border border-white/20 px-2 py-0.5 rounded-full font-medium shrink-0">Ver mapa ↓</span>
                </div>
                <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.7)' }}>Bela Vista — A 350m do Metrô São Joaquim</p>
              </div>
            </button>
          </div>

          {/* CTA Button — Tamanho reduzido, elegante e perfeitamente proporcional */}
          <div className="pt-2 sm:pt-3">
            <Button 
              size="lg" 
              className="w-full sm:w-auto group text-sm sm:text-base px-7 py-3.5 sm:py-4 font-bold shadow-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-stone-950 border border-amber-300/40 shadow-amber-500/25 hover:shadow-amber-500/40 rounded-xl"
              onClick={scrollToAccommodations}
            >
              Ver Acomodações & Preços
              <ArrowDown className="ml-2 w-4 h-4 group-hover:translate-y-0.5 transition-transform text-stone-950" />
            </Button>
          </div>

        </div>
      </div>
    </section>
  );
};

export default HeroSection;