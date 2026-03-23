import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function PoliticaPrivacidade() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
        <h1 className="text-3xl font-bold mb-2">Política de Privacidade</h1>
        <p className="text-muted-foreground mb-8">Última atualização: março de 2026</p>

        <div className="prose prose-slate max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. Identificação do Responsável</h2>
            <p className="text-muted-foreground">
              Esta Política de Privacidade é aplicada pelo <strong>Center Plaza Hotel</strong>,
              pessoa jurídica de direito privado inscrita no CNPJ sob o nº 29.769.881/0001-91,
              com sede na Rua Maestro Cardim, 418, Bela Vista, São Paulo/SP, CEP 01323-000.
              Dúvidas: <a href="mailto:contato@centerplazahotel.com.br" className="text-primary underline">contato@centerplazahotel.com.br</a>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. Dados Coletados</h2>
            <p className="text-muted-foreground">Coletamos os seguintes dados pessoais para processar sua reserva:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1 mt-2">
              <li>Nome completo</li>
              <li>Endereço de e-mail</li>
              <li>Número de telefone</li>
              <li>CPF (documento de identificação)</li>
              <li>Datas de check-in e check-out</li>
              <li>Informações de pagamento (processadas com segurança pelo Stripe)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. Finalidade do Tratamento</h2>
            <p className="text-muted-foreground">Seus dados são utilizados exclusivamente para:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1 mt-2">
              <li>Processar e confirmar reservas</li>
              <li>Enviar confirmações e comunicações sobre sua estadia</li>
              <li>Cumprir obrigações legais e fiscais</li>
              <li>Melhorar nossos serviços</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. Compartilhamento de Dados</h2>
            <p className="text-muted-foreground">
              Não vendemos nem compartilhamos seus dados pessoais com terceiros para fins comerciais.
              Seus dados de pagamento são processados pelo Stripe, que possui certificação PCI DSS.
              Podemos compartilhar dados quando exigido por lei ou autoridade competente.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. Armazenamento e Segurança</h2>
            <p className="text-muted-foreground">
              Seus dados são armazenados em servidores seguros e protegidos por criptografia.
              Mantemos seus dados pelo período necessário para cumprir as finalidades descritas
              nesta política ou conforme exigido por lei (até 5 anos para fins fiscais).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. Seus Direitos (LGPD)</h2>
            <p className="text-muted-foreground">Conforme a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), você tem direito a:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1 mt-2">
              <li>Acessar seus dados pessoais</li>
              <li>Corrigir dados incompletos ou desatualizados</li>
              <li>Solicitar a exclusão dos seus dados</li>
              <li>Revogar o consentimento a qualquer momento</li>
            </ul>
            <p className="text-muted-foreground mt-2">
              Para exercer esses direitos, entre em contato: <a href="mailto:contato@centerplazahotel.com.br" className="text-primary underline">contato@centerplazahotel.com.br</a>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. Cookies</h2>
            <p className="text-muted-foreground">
              Utilizamos cookies essenciais para o funcionamento do site. Não utilizamos cookies
              de rastreamento ou publicidade de terceiros.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}