import { Star, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Review {
  name: string;
  avatarLetter: string;
  avatarBg: string;
  date: string;
  stars: number;
  text: string;
  highlight: string;
}

const googleReviews: Review[] = [
  {
    name: "Renato Silveira",
    avatarLetter: "R",
    avatarBg: "bg-blue-600",
    date: "Avaliação recente no Google",
    stars: 5,
    highlight: "Localização imbatível na Bela Vista",
    text: "Excelente localização! Fica a menos de 5 minutos a pé do Metrô São Joaquim e bem pertinho da Beneficência Portuguesa, o que facilitou muito minha estadia. Quarto limpo, chuveiro muito bom e café da manhã bem servido.",
  },
  {
    name: "Mariana Albuquerque",
    avatarLetter: "M",
    avatarBg: "bg-emerald-600",
    date: "Avaliação recente no Google",
    stars: 5,
    highlight: "Melhor custo-benefício da região",
    text: "O hotel tem um custo-benefício excelente para quem precisa se hospedar no centro de São Paulo. Ar condicionado silencioso e gelando bem, cama confortável e funcionários atenciosos na recepção 24h.",
  },
  {
    name: "Fabiano Antunes",
    avatarLetter: "F",
    avatarBg: "bg-amber-600",
    date: "Avaliação recente no Google",
    stars: 5,
    highlight: "Praticidade para trabalho e lazer",
    text: "Fiquei hospedado para um evento próximo à Avenida Paulista. Acesso muito fácil, Wi-Fi rápido e estável no quarto e muitas opções de restaurantes italianos e padarias ao redor no Bexiga. Recomendo!",
  },
  {
    name: "Luciana M. Fagundes",
    avatarLetter: "L",
    avatarBg: "bg-purple-600",
    date: "Avaliação recente no Google",
    stars: 5,
    highlight: "Atendimento acolhedor e seguro",
    text: "Ambiente familiar, seguro e funcionários muito prestativos. A proximidade com o bairro da Liberdade e com a Paulista torna o hotel uma escolha perfeita. Sempre que venho a SP me hospedo aqui.",
  },
];

export default function GoogleReviewsSection() {
  return (
    <section className="py-16 md:py-24 bg-stone-100/60 dark:bg-stone-900/50 border-b border-stone-200/60 dark:border-stone-800">
      <div className="container mx-auto px-4 max-w-6xl">
        
        {/* Cabeçalho de Avaliações Google */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            {/* Selo Google */}
            <div className="inline-flex items-center gap-2 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-full px-3.5 py-1.5 shadow-sm text-xs font-semibold text-stone-800 dark:text-stone-200 mb-3">
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17Z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24Z"/>
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15Z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98Z"/>
              </svg>
              <span>Avaliações Verificadas no Google</span>
            </div>

            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-stone-900 dark:text-white">
              O que dizem os nossos hóspedes
            </h2>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex text-amber-500">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <span className="font-extrabold text-stone-900 dark:text-white text-base">4.3 / 5.0</span>
              <span className="text-xs text-muted-foreground">• Centenas de hóspedes atendidos</span>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="gap-2 self-start md:self-auto border-stone-300 dark:border-stone-700 hover:bg-stone-100"
            asChild
          >
            <a
              href="https://www.google.com/maps/search/?api=1&query=Center+Plaza+Hotel+Sao+Paulo"
              target="_blank"
              rel="noopener noreferrer"
            >
              Ver perfil no Google Maps
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </Button>
        </div>

        {/* Grid de Avaliações */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {googleReviews.map((rev, index) => (
            <div
              key={index}
              className="bg-white dark:bg-stone-900 rounded-2xl p-5 border border-stone-200/80 dark:border-stone-800 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                {/* Estrelas */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex text-amber-500">
                    {[...Array(rev.stars)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  {/* Ícone sutil do Google */}
                  <svg className="w-3.5 h-3.5 opacity-70" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17Z"/>
                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24Z"/>
                    <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15Z"/>
                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98Z"/>
                  </svg>
                </div>

                <p className="font-bold text-sm text-stone-900 dark:text-white mb-2 leading-snug">
                  "{rev.highlight}"
                </p>

                <p className="text-xs text-muted-foreground leading-relaxed">
                  {rev.text}
                </p>
              </div>

              {/* Autor */}
              <div className="flex items-center gap-2.5 mt-5 pt-3.5 border-t border-stone-100 dark:border-stone-800">
                <div className={`w-8 h-8 rounded-full ${rev.avatarBg} text-white font-bold text-xs flex items-center justify-center shrink-0`}>
                  {rev.avatarLetter}
                </div>
                <div>
                  <p className="font-semibold text-xs text-stone-900 dark:text-white">
                    {rev.name}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {rev.date}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
