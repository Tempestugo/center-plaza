import { CheckCircle2, ShieldCheck, ArrowDown, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DirectBookingBanner() {
  const scrollToAccommodations = () => {
    const el = document.getElementById("acomodacoes");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="py-12 bg-stone-50/80 dark:bg-stone-900/60 border-y border-stone-200/70 dark:border-stone-800/80">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
          
          {/* Texto explicativo */}
          <div className="flex-1 text-center lg:text-left space-y-3">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 dark:text-white">
              Reserve por aqui e economize até <span className="text-primary font-extrabold">18% em sua reserva</span>
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-xl">
              Plataformas intermediárias cobram taxas e comissões que encarecem a sua diária. 
              Aqui no canal oficial do Center Plaza você garante a menor tarifa e atendimento direto sem intermediários.
            </p>

            {/* Benefícios diretos (sem menção a café da manhã) */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-5 pt-1 text-xs sm:text-sm text-stone-700 dark:text-stone-300 font-medium">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Até 18% mais barato</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
                <span>Sem taxas ocultas</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Confirmação imediata</span>
              </div>
            </div>
          </div>

          {/* Marcas das OTAs + Ação */}
          <div className="w-full lg:w-auto shrink-0 flex flex-col items-center lg:items-end gap-4">
            
            {/* Logos reais das plataformas */}
            <div className="bg-white dark:bg-stone-900 px-5 py-3.5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm flex items-center gap-5 sm:gap-7">
              {/* Booking.com */}
              <div className="flex items-center gap-1 opacity-80 hover:opacity-100 transition-opacity" title="Booking.com">
                <svg className="h-5 sm:h-6 w-auto" viewBox="0 0 140 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="140" height="30" rx="4" fill="#003580"/>
                  <text x="12" y="20" fill="white" fontFamily="sans-serif" fontSize="13" fontWeight="bold" letterSpacing="-0.5">Booking.com</text>
                </svg>
              </div>

              {/* Airbnb */}
              <div className="flex items-center gap-1 opacity-80 hover:opacity-100 transition-opacity" title="Airbnb">
                <svg className="h-5 sm:h-6 w-auto" viewBox="0 0 100 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12.5 18.2C11.8 17.1 11.2 15.6 11.2 13.8C11.2 9.5 14.5 6 18.8 6C23 6 26.3 9.5 26.3 13.8C26.3 15.6 25.7 17.1 25 18.2L18.8 27L12.5 18.2ZM18.8 16.5C20.2 16.5 21.3 15.3 21.3 13.8C21.3 12.4 20.2 11.2 18.8 11.2C17.3 11.2 16.2 12.4 16.2 13.8C16.2 15.3 17.3 16.5 18.8 16.5Z" fill="#FF5A5F"/>
                  <text x="32" y="20" fill="#FF5A5F" fontFamily="sans-serif" fontSize="15" fontWeight="bold" letterSpacing="-0.5">airbnb</text>
                </svg>
              </div>

              {/* Expedia */}
              <div className="flex items-center gap-1 opacity-80 hover:opacity-100 transition-opacity" title="Expedia">
                <svg className="h-5 sm:h-6 w-auto" viewBox="0 0 100 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="15" cy="15" r="9" fill="#00355F"/>
                  <path d="M12 11L18 15L12 19V11Z" fill="#FFCC00"/>
                  <text x="30" y="20" fill="#00355F" fontFamily="sans-serif" fontSize="14" fontWeight="bold">Expedia</text>
                </svg>
              </div>

              {/* Agoda */}
              <div className="flex items-center gap-1 opacity-80 hover:opacity-100 transition-opacity" title="Agoda">
                <div className="flex items-center gap-1.5 font-bold text-stone-800 dark:text-stone-200 text-sm">
                  <div className="flex -space-x-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#E11A2B]" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#FF8200]" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#53B848]" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#2B72BA]" />
                  </div>
                  <span className="font-semibold text-xs text-stone-700 dark:text-stone-300">agoda</span>
                </div>
              </div>
            </div>

            {/* CTA direto */}
            <Button
              onClick={scrollToAccommodations}
              size="lg"
              className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 shadow-md transition-all cursor-pointer group"
            >
              Ver Quartos com Desconto Direto
              <ArrowDown className="ml-2 w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
            </Button>
          </div>

        </div>
      </div>
    </section>
  );
}
