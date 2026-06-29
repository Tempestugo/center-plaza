import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
}

const FAQ_SECTIONS = [
  {
    title: "Reservas",
    icon: "📅",
    items: [
      {
        question: "Como faço uma reserva?",
        answer: "Acesse a página de Hospedagens, escolha o quarto desejado, selecione as datas de check-in e check-out, informe o número de hóspedes e clique em Reservar. Você será direcionado para o preenchimento dos dados pessoais e, em seguida, para o pagamento seguro via Stripe.",
      },
      {
        question: "Posso reservar para outra pessoa?",
        answer: "Sim. Ao preencher os dados da reserva, informe o nome e documento do hóspede que vai se hospedar. O email de confirmação será enviado para o endereço informado no cadastro.",
      },
      {
        question: "Como consulto minha reserva?",
        answer: "Faça login na sua conta e acesse 'Minha Conta'. Todas as suas reservas ativas e histórico estarão disponíveis lá. Você também pode usar o chat de suporte para tirar dúvidas sobre uma reserva específica.",
      },
      {
        question: "Posso modificar as datas da minha reserva?",
        answer: "Alterações de datas devem ser solicitadas com pelo menos 48h de antecedência, sujeitas à disponibilidade. Entre em contato conosco pelo chat ou WhatsApp para verificar possibilidades.",
      },
    ],
  },
  {
    title: "Cancelamento e Reembolso",
    icon: "↩️",
    items: [
      {
        question: "Qual é a política de cancelamento?",
        answer: "Oferecemos cancelamento gratuito para solicitações feitas com pelo menos 24 horas de antecedência ao check-in. Cancelamentos realizados dentro deste prazo podem estar sujeitos à cobrança de uma taxa equivalente a 1 diária.",
      },
      {
        question: "Como cancelo minha reserva?",
        answer: "Acesse 'Minha Conta', localize a reserva desejada e clique em 'Ver Detalhes'. Na página de detalhes, você encontrará a opção de cancelamento com informação sobre se ainda está dentro do prazo gratuito.",
      },
      {
        question: "Em quanto tempo recebo o reembolso?",
        answer: "Reembolsos para cancelamentos dentro do prazo gratuito são processados em até 5 dias úteis, dependendo da operadora do cartão. O crédito aparecerá na fatura seguinte.",
      },
      {
        question: "O que acontece se o hotel cancelar minha reserva?",
        answer: "Em caso de cancelamento por parte do hotel, você receberá reembolso integral e notificação imediata por email. Nossa equipe entrará em contato para oferecer alternativas de hospedagem.",
      },
    ],
  },
  {
    title: "Check-in e Check-out",
    icon: "🏨",
    items: [
      {
        question: "Qual é o horário de check-in?",
        answer: "O check-in padrão é a partir das 14h. Caso precise de um horário diferente, entre em contato com antecedência pelo chat ou WhatsApp e verificaremos a disponibilidade de early check-in.",
      },
      {
        question: "Qual é o horário de check-out?",
        answer: "O check-out deve ser realizado até as 12h. Late check-out pode ser solicitado com antecedência e está sujeito à disponibilidade e possível cobrança adicional.",
      },
      {
        question: "Preciso levar algum documento?",
        answer: "Sim. É obrigatória a apresentação de documento de identidade com foto (RG, CNH ou Passaporte) no momento do check-in. O documento deve ser o mesmo informado na reserva.",
      },
    ],
  },
  {
    title: "Pagamento",
    icon: "💳",
    items: [
      {
        question: "Quais formas de pagamento são aceitas?",
        answer: "Aceitamos cartões de crédito e débito das principais bandeiras (Visa, Mastercard, Elo, American Express) processados de forma segura pelo Stripe. O pagamento é realizado no momento da reserva.",
      },
      {
        question: "O pagamento é seguro?",
        answer: "Sim. Utilizamos o Stripe, uma das plataformas de pagamento mais seguras do mundo, com certificação PCI DSS. Seus dados de cartão nunca são armazenados em nossos servidores.",
      },
      {
        question: "Recebo comprovante de pagamento?",
        answer: "Sim. Após a confirmação do pagamento, você receberá um email de confirmação com todos os detalhes da reserva e comprovante de pagamento emitido pelo Stripe.",
      },
    ],
  },
  {
    title: "Estrutura e Serviços",
    icon: "🛎️",
    items: [
      {
        question: "O hotel tem estacionamento?",
        answer: "Sim, disponibilizamos estacionamento para hóspedes. Consulte disponibilidade e valores no momento da reserva ou entre em contato conosco.",
      },
      {
        question: "O café da manhã está incluso?",
        answer: "O café da manhã está incluso em determinadas categorias de quarto. Verifique as informações do quarto escolhido na página de Hospedagens.",
      },
      {
        question: "Aceitam pets?",
        answer: "Nossa política de pets varia conforme o tipo de quarto. Consulte a disponibilidade no momento da reserva ou entre em contato pelo WhatsApp para verificar as condições.",
      },
      {
        question: "Tem Wi-Fi gratuito?",
        answer: "Sim, todos os quartos e áreas comuns possuem Wi-Fi de alta velocidade gratuito para hóspedes.",
      },
    ],
  },
];

function FAQSection({ title, icon, items }: { title: string; icon: string; items: FAQItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="mb-8">
      <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
        <span>{icon}</span>
        {title}
      </h2>
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={index} className="border rounded-lg overflow-hidden">
            <button
              className="w-full text-left px-4 py-3 flex items-center justify-between hover:bg-muted/30 transition-colors"
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
            >
              <span className="font-medium text-sm pr-4">{item.question}</span>
              {openIndex === index
                ? <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
                : <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />}
            </button>
            {openIndex === index && (
              <div className="px-4 pb-4 pt-1 text-sm text-muted-foreground border-t bg-muted/10">
                {item.answer}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function FAQ() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="pt-20">
        {/* Hero */}
        <section className="bg-primary text-primary-foreground py-12">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-3xl font-bold mb-3">Perguntas Frequentes</h1>
            <p className="text-primary-foreground/80 max-w-xl mx-auto">
              Encontre respostas para as principais dúvidas sobre hospedagem, reservas e políticas do Center Plaza Hotel.
            </p>
          </div>
        </section>

        {/* Política de cancelamento em destaque */}
        <section className="border-b bg-green-50">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-start gap-4 max-w-2xl mx-auto">
              <div className="text-3xl">✅</div>
              <div>
                <h2 className="font-bold text-green-800 mb-1">Cancelamento Gratuito</h2>
                <p className="text-green-700 text-sm">
                  Cancele sua reserva sem custo até <strong>24 horas antes do check-in</strong>.
                  Reservas canceladas dentro deste prazo recebem reembolso integral.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Sections */}
        <section className="container mx-auto px-4 py-10 max-w-3xl">
          {FAQ_SECTIONS.map(section => (
            <FAQSection key={section.title} {...section} />
          ))}

          {/* Contato */}
          <div className="mt-8 p-6 bg-muted/30 rounded-xl text-center border">
            <h2 className="font-bold text-lg mb-2">Não encontrou o que procurava?</h2>
            <p className="text-muted-foreground text-sm mb-4">
              Nossa equipe está disponível para ajudar via WhatsApp ou chat no site.
            </p>
            <a
              href="https://wa.me/551132893757"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg font-medium text-sm transition-colors"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.118 1.523 5.847L0 24l6.347-1.496A11.935 11.935 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.794 9.794 0 01-5.001-1.37l-.36-.214-3.713.876.938-3.591-.235-.371A9.795 9.795 0 012.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z"/>
              </svg>
              Falar no WhatsApp
            </a>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}