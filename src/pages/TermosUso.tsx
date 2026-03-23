import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function TermosUso() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
        <h1 className="text-3xl font-bold mb-2">Termos de Uso</h1>
        <p className="text-muted-foreground mb-8">Última atualização: março de 2026</p>

        <div className="prose prose-slate max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. Aceitação dos Termos</h2>
            <p className="text-muted-foreground">
              Ao acessar e utilizar o site do <strong>Center Plaza Hotel</strong> (CNPJ 29.769.881/0001-91),
              você concorda com estes Termos de Uso. Caso não concorde, por favor não utilize nossos serviços.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. Serviços Oferecidos</h2>
            <p className="text-muted-foreground">
              O Center Plaza Hotel oferece serviços de hospedagem em São Paulo/SP, com check-in entre
              14h e 17h e check-out até 12h. Estamos localizados na Rua Maestro Cardim, 418, Bela Vista,
              São Paulo/SP — a 1 km da Avenida Paulista.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. Reservas e Pagamentos</h2>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Reservas são confirmadas somente após o pagamento completo</li>
              <li>Os pagamentos são processados com segurança pelo Stripe</li>
              <li>Preços exibidos incluem todos os impostos e taxas aplicáveis</li>
              <li>O estacionamento privativo custa R$ 35,00 por dia e necessita de reserva prévia</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. Política de Cancelamento</h2>
            <p className="text-muted-foreground">
              O hóspede pode cancelar sua reserva a qualquer momento, desde que o check-in ainda
              não tenha ocorrido. Cancelamentos realizados após o horário de check-in (14h00) do
              dia da entrada não darão direito a reembolso. Para cancelamentos antecipados, o
              reembolso será processado integralmente no mesmo método de pagamento utilizado,
              em até 10 dias úteis.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. Regras da Acomodação</h2>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>É proibido fumar em todas as áreas do hotel</li>
              <li>Animais de estimação não são permitidos</li>
              <li>Crianças de qualquer idade são bem-vindas</li>
              <li>A partir de 18 anos, hóspedes são cobrados como adultos</li>
              <li>Berços disponíveis mediante solicitação prévia (gratuito)</li>
              <li>Grupos acima de 4 quartos estão sujeitos a políticas diferenciadas</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. Responsabilidades</h2>
            <p className="text-muted-foreground">
              O Center Plaza Hotel não se responsabiliza por pertences deixados nas acomodações.
              O hóspede é responsável por danos causados às instalações durante sua estadia.
              Em caso de danos, o valor correspondente será cobrado do hóspede.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. Contato</h2>
            <p className="text-muted-foreground">
              Center Plaza Hotel — CNPJ 29.769.881/0001-91<br />
              Rua Maestro Cardim, 418, Bela Vista, São Paulo/SP, CEP 01323-000<br />
              Tel: (11) 3289-3757<br />
              E-mail: <a href="mailto:contato@centerplazahotel.com.br" className="text-primary underline">contato@centerplazahotel.com.br</a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}