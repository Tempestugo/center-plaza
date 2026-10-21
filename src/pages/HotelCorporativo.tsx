import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Building2, 
  Users, 
  MapPin, 
  Coffee, 
  Wifi, 
  ShieldCheck, 
  Briefcase, 
  CalendarCheck, 
  FileText, 
  Clock, 
  PhoneCall, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight,
  Train,
  Utensils,
  Receipt
} from "lucide-react";
import { toast } from "sonner";
import bgHero from "@/assets/bg-hero-hootel.jpg";

export default function HotelCorporativo() {
  const [form, setForm] = useState({
    empresa: "",
    nomeContato: "",
    email: "",
    telefone: "",
    hospedesQtd: "",
    dataPrevisao: "",
    observacoes: ""
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const mensagemFormatada = `
[SOLICITAÇÃO DE RESERVA CORPORATIVA]
Empresa: ${form.empresa}
Contato: ${form.nomeContato}
E-mail: ${form.email}
Telefone/WhatsApp: ${form.telefone}
Previsão de Hóspedes / Quartos: ${form.hospedesQtd}
Previsão de Datas: ${form.dataPrevisao}
Detalhes / Necessidades:
${form.observacoes || "Nenhuma observação informada"}
    `.trim();

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${form.nomeContato} (${form.empresa})`,
          email: form.email,
          message: mensagemFormatada
        })
      });

      if (!res.ok) throw new Error();

      toast.success("Solicitação corporativa enviada! Nossa equipe entrará em contato rapidamente.");
      setForm({
        empresa: "",
        nomeContato: "",
        email: "",
        telefone: "",
        hospedesQtd: "",
        dataPrevisao: "",
        observacoes: ""
      });
    } catch {
      toast.error("Erro ao enviar mensagem pelo site. Tentando abrir WhatsApp...");
      const textWa = encodeURIComponent(`Olá! Gostaria de uma cotação corporativa para a empresa *${form.empresa}* (${form.hospedesQtd} pessoas/quartos).`);
      window.open(`https://wa.me/551132893757?text=${textWa}`, '_blank');
    } finally {
      setLoading(false);
    }
  };

  const openWhatsAppCorporate = () => {
    const text = encodeURIComponent("Olá! Gostaria de falar com o setor comercial do Center Plaza Hotel sobre tarifas e reservas corporativas para minha empresa.");
    window.open(`https://wa.me/551132893757?text=${text}`, '_blank');
  };

  const corporateBenefits = [
    {
      icon: Building2,
      title: "Capacidade para Grupos (+50 Quartos)",
      desc: "Estrutura ampla e flexível para acomodar desde executivos individuais até equipes inteiras, convenções e projetos especiais em SP."
    },
    {
      icon: Receipt,
      title: "Faturamento Direto & Nota Fiscal",
      desc: "Emissão simplificada de NF-e e condições facilitadas de pagamento/faturamento para contas de pessoa jurídica (PJ)."
    },
    {
      icon: MapPin,
      title: "Localização Estratégica (Centro & Paulista)",
      desc: "Na Bela Vista, a 350m do Metrô São Joaquim, a 1,2 km da Av. Paulista e ao lado dos maiores polos comerciais e hospitalares."
    },
    {
      icon: Coffee,
      title: "Café da Manhã Completo Incluso",
      desc: "Buffet com frutas, sucos, pães frescos e café quentinho para seus colaboradores começarem o dia com energia e produtividade."
    },
    {
      icon: Wifi,
      title: "Wi-Fi Rápido & Ambiente Silencioso",
      desc: "Internet de alta velocidade em todos os apartamentos e áreas comuns para trabalho remoto, reuniões online e repouso tranquilo."
    },
    {
      icon: Clock,
      title: "Recepção 24h & Apoio Ágil",
      desc: "Flexibilidade para check-in tardio de voos noturnos, portaria segura 24h e suporte dedicado às rotinas empresariais."
    }
  ];

  const nearbyLocations = [
    { icon: Building2, name: "Av. Paulista & Centros Empresariais", dist: "1,2 km" },
    { icon: Train, name: "Metrô São Joaquim (Linha 1 - Azul)", dist: "350 m (4 min a pé)" },
    { icon: ShieldCheck, name: "Polo Médico / Beneficência Portuguesa", dist: "400 m" },
    { icon: Utensils, name: "Polo Gastronômico do Bexiga & Conveniências", dist: "5 min" },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 pt-20">
        {/* HERO SECTION CORPORATIVO */}
        <section className="relative min-h-[500px] md:min-h-[560px] flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 z-0">
            <img
              src={bgHero}
              alt="Center Plaza Hotel Corporativo"
              className="w-full h-full object-cover"
            />
            <div 
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(105deg, rgba(35,8,20,0.94) 0%, rgba(35,8,20,0.88) 40%, rgba(20,5,12,0.75) 100%)'
              }}
            />
          </div>

          <div className="container relative z-10 mx-auto px-4 py-16 text-center text-white max-w-4xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs sm:text-sm font-semibold mb-6 uppercase tracking-wider backdrop-blur-sm">
              <Briefcase className="w-4 h-4" /> Hotel Corporativo & Hospedagem para Empresas em SP
            </div>
            
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold leading-tight mb-6">
              A Parceria Ideal para a <br className="hidden sm:inline" />
              <span className="text-amber-400">Hospedagem da sua Empresa</span>
            </h1>

            <p className="text-base sm:text-lg md:text-xl text-stone-200 mb-8 max-w-2xl mx-auto leading-relaxed">
              Mais de 50 quartos equipados no coração de São Paulo. Conectividade, café da manhã incluso, tarifas corporativas diferenciadas e faturamento facilitado para seu time.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                size="lg"
                variant="hero"
                className="w-full sm:w-auto px-8 py-6 text-base font-semibold shadow-xl cursor-pointer"
                onClick={() => {
                  const formEl = document.getElementById("cotacao-form");
                  if (formEl) formEl.scrollIntoView({ behavior: "smooth" });
                }}
              >
                Solicitar Cotação Corporativa
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>

              <Button
                size="lg"
                className="w-full sm:w-auto px-8 py-6 text-base font-semibold bg-[#25D366] hover:bg-[#20ba5a] text-white shadow-xl cursor-pointer border-0"
                onClick={openWhatsAppCorporate}
              >
                Falar com Consultor Corporativo
              </Button>
            </div>
          </div>
        </section>

        {/* METRICS BAR */}
        <section className="bg-primary text-primary-foreground py-6 border-y border-amber-500/20">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div>
                <p className="text-2xl sm:text-3xl font-extrabold text-amber-300">+50</p>
                <p className="text-xs sm:text-sm text-stone-200">Quartos para Empresas</p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-extrabold text-amber-300">350m</p>
                <p className="text-xs sm:text-sm text-stone-200">Do Metrô São Joaquim</p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-extrabold text-amber-300">100%</p>
                <p className="text-xs sm:text-sm text-stone-200">Café da Manhã Incluso</p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-extrabold text-amber-300">NF-e</p>
                <p className="text-xs sm:text-sm text-stone-200">Faturamento Direto PJ</p>
              </div>
            </div>
          </div>
        </section>

        {/* DIFERENCIAIS CORPORATIVOS */}
        <section className="py-16 md:py-24 bg-stone-50 dark:bg-stone-950/40">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="text-amber-600 font-semibold text-sm uppercase tracking-wider">
                Vantagens para Recursos Humanos & Compras
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold mt-2 mb-4">
                Por que hospedar seus colaboradores no Center Plaza?
              </h2>
              <p className="text-muted-foreground">
                Oferecemos toda a agilidade e conveniência que a rotina corporativa exige, com custos previsíveis e excelente custo-benefício.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {corporateBenefits.map((b, idx) => (
                <Card key={idx} className="border hover:border-amber-500/50 transition-all hover:shadow-lg bg-card">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-5">
                      <b.icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-bold mb-2">{b.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{b.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* LOCALIZAÇÃO E LOGÍSTICA PARA EMPRESAS */}
        <section className="py-16 bg-background border-t">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-5xl mx-auto">
              <div>
                <div className="inline-flex items-center gap-2 text-amber-600 mb-3">
                  <MapPin className="w-5 h-5" />
                  <span className="text-sm font-semibold uppercase tracking-wider">Logística & Mobilidade</span>
                </div>
                <h2 className="text-3xl font-bold mb-4">
                  Mobilidade sem stress para o seu time
                </h2>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  Tempo em São Paulo é precioso. O Center Plaza Hotel fica na <strong>Rua Maestro Cardim, 418 (Bela Vista)</strong>, permitindo que seus colaboradores acessem os principais eixos corporativos da cidade em minutos.
                </p>

                <div className="space-y-3.5 mb-8">
                  {nearbyLocations.map((loc, i) => (
                    <div key={i} className="flex items-center justify-between p-3.5 rounded-xl bg-stone-50 dark:bg-stone-900 border">
                      <div className="flex items-center gap-3">
                        <loc.icon className="w-5 h-5 text-amber-600" />
                        <span className="text-sm font-medium">{loc.name}</span>
                      </div>
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                        {loc.dist}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs sm:text-sm text-amber-900 dark:text-amber-200 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    Fácil acesso para táxis, carros de aplicativo e metrô com conexão rápida para centros de convenções (Expo Center Norte, Anhembi e São Paulo Expo).
                  </span>
                </div>
              </div>

              {/* MAPA EMBEDDED */}
              <div className="rounded-2xl overflow-hidden shadow-xl border aspect-[4/3] bg-muted">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3657.1!2d-46.6395!3d-23.5610!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94ce59b0e6e5e1a7%3A0x123456789!2sR.+Maestro+Cardim%2C+418+-+Bela+Vista%2C+S%C3%A3o+Paulo+-+SP%2C+01323-000!5e0!3m2!1spt-BR!2sbr!4v1700000000000!5m2!1spt-BR!2sbr"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  title="Localização Corporativa do Center Plaza Hotel"
                />
              </div>
            </div>
          </div>
        </section>

        {/* FORMULÁRIO DE COTAÇÃO CORPORATIVA */}
        <section id="cotacao-form" className="py-16 md:py-24 bg-stone-50 dark:bg-stone-950/50 scroll-mt-10 border-t">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-10">
                <span className="text-amber-600 font-semibold text-sm uppercase tracking-wider">
                  Atendimento Comercial Especializado
                </span>
                <h2 className="text-3xl font-bold mt-1 mb-3">
                  Solicite um Acordo ou Cotação Corporativa
                </h2>
                <p className="text-muted-foreground text-sm sm:text-base">
                  Preencha os dados abaixo e nosso time de contas corporativas enviará uma proposta personalizada com tarifas reduzidas para sua empresa.
                </p>
              </div>

              <Card className="shadow-xl border-stone-200 dark:border-stone-800">
                <CardContent className="p-6 sm:p-8">
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="text-sm font-medium mb-1.5 block">Nome da Empresa (Razão Social ou Fantasia) *</label>
                        <Input
                          required
                          placeholder="Ex: Minha Empresa S/A"
                          value={form.empresa}
                          onChange={e => setForm({ ...form, empresa: e.target.value })}
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-1.5 block">Nome do Responsável / Contato *</label>
                        <Input
                          required
                          placeholder="Ex: João Ferreira"
                          value={form.nomeContato}
                          onChange={e => setForm({ ...form, nomeContato: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="text-sm font-medium mb-1.5 block">E-mail Corporativo *</label>
                        <Input
                          type="email"
                          required
                          placeholder="contato@empresa.com.br"
                          value={form.email}
                          onChange={e => setForm({ ...form, email: e.target.value })}
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-1.5 block">Telefone / WhatsApp *</label>
                        <Input
                          required
                          placeholder="(11) 99999-9999"
                          value={form.telefone}
                          onChange={e => setForm({ ...form, telefone: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="text-sm font-medium mb-1.5 block">Estimativa de Hóspedes / Quartos</label>
                        <Input
                          placeholder="Ex: 5 quartos / 8 hóspedes"
                          value={form.hospedesQtd}
                          onChange={e => setForm({ ...form, hospedesQtd: e.target.value })}
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-1.5 block">Período / Previsão de Datas</label>
                        <Input
                          placeholder="Ex: 10 a 15 de Novembro"
                          value={form.dataPrevisao}
                          onChange={e => setForm({ ...form, dataPrevisao: e.target.value })}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-1.5 block">Observações ou Necessidades Específicas</label>
                      <Textarea
                        rows={3}
                        placeholder="Informe detalhes sobre check-in antecipado, tipo de faturamento, perfil de quarto (individual, duplo) ou frequência de viagens..."
                        value={form.observacoes}
                        onChange={e => setForm({ ...form, observacoes: e.target.value })}
                      />
                    </div>

                    <div className="pt-2">
                      <Button
                        type="submit"
                        size="lg"
                        variant="hero"
                        disabled={loading}
                        className="w-full text-base font-semibold py-6 cursor-pointer"
                      >
                        {loading ? "Enviando proposta..." : "Enviar Solicitação de Cotação"}
                      </Button>
                    </div>

                    <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>Seus dados são protegidos e tratados exclusivamente para cotação corporativa.</span>
                    </div>
                  </form>
                </CardContent>
              </Card>

              {/* CONTATO DIRETO RÁPIDO */}
              <div className="mt-8 text-center bg-card border rounded-2xl p-6">
                <p className="text-sm font-medium text-muted-foreground mb-3">
                  Precisa de resposta urgente para hospedagem de hoje ou desta semana?
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <a
                    href="https://wa.me/551132893757?text=Ol%C3%A1!%20Preciso%20de%20uma%20reserva%20corporativa%20urgente%20no%20Center%20Plaza%20Hotel."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#25D366] hover:bg-[#20ba5a] text-white font-semibold text-sm transition-transform hover:scale-105"
                  >
                    <PhoneCall className="w-4 h-4" /> WhatsApp Comercial: (11) 3289-3757
                  </a>
                  <a
                    href="mailto:contato@centerplazahotel.com.br?subject=Cotacao%20Corporativa%20Center%20Plaza"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-foreground font-semibold text-sm transition-colors"
                  >
                    contato@centerplazahotel.com.br
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
