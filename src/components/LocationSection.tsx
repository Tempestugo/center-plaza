import { MapPin, Train, Utensils, Building2, ShieldCheck } from "lucide-react";

const landmarks = [
  { icon: Train, label: "Metrô São Joaquim", distance: "350m" },
  { icon: Utensils, label: "Roteiro Gastronômico do Bexiga", distance: "5 min" },
  { icon: Building2, label: "Av. Paulista", distance: "1,2 km" },
  { icon: ShieldCheck, label: "Hospital Beneficência Portuguesa", distance: "400m" },
];

const LocationSection = () => {
  return (
    <section className="py-16 bg-stone-50 dark:bg-stone-950/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 text-amber-600 mb-3">
            <MapPin className="w-5 h-5" />
            <span className="text-sm font-semibold uppercase tracking-widest">Localização Privilegiada</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-3">
            No coração de São Paulo
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Bairro da Bela Vista — a poucos passos do metrô, restaurantes e dos principais pontos turísticos.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center max-w-5xl mx-auto">
          {/* Map */}
          <div className="rounded-2xl overflow-hidden shadow-lg border border-stone-200 dark:border-stone-800 aspect-[4/3]">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3657.1!2d-46.6395!3d-23.5610!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94ce59b0e6e5e1a7%3A0x123456789!2sR.+Maestro+Cardim%2C+418+-+Bela+Vista%2C+S%C3%A3o+Paulo+-+SP%2C+01323-000!5e0!3m2!1spt-BR!2sbr!4v1700000000000!5m2!1spt-BR!2sbr"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Localização do Center Plaza Hotel"
            />
          </div>

          {/* Landmarks */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-5">O que tem por perto</h3>
            {landmarks.map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center">
                  <item.icon className="w-5 h-5 text-amber-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{item.label}</p>
                </div>
                <span className="text-sm font-semibold text-amber-600 bg-amber-50 dark:bg-amber-950/30 px-3 py-1 rounded-full">
                  {item.distance}
                </span>
              </div>
            ))}

            <div className="pt-4 text-center lg:text-left">
              <a
                href="https://maps.google.com/?q=Rua+Maestro+Cardim+418+Bela+Vista+São+Paulo"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium text-amber-600 hover:text-amber-700 transition-colors"
              >
                <MapPin className="w-4 h-4" />
                Abrir no Google Maps →
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LocationSection;
