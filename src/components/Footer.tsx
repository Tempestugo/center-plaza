import { MapPin, Phone, Mail } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 py-16">
          {/* Brand Section */}
          <div className="space-y-4">
            <h3 className="text-2xl font-bold">Center Plaza</h3>
            <p className="text-primary-foreground/80 leading-relaxed">
              Experiências únicas de hospedagem na serra, onde o conforto 
              encontra a natureza em perfeita harmonia.
            </p>

          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Links Rápidos</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-primary-foreground/80 hover:text-accent-warm transition-colors">
                  Início
                </Link>
              </li>
              <li>
                <Link to="/hospedagens" className="text-primary-foreground/80 hover:text-accent-warm transition-colors">
                  Hospedagens
                </Link>
              </li>
              <li>
                <Link to="/consultar-reserva" className="text-primary-foreground/80 hover:text-accent-warm transition-colors">
                  Consultar Reserva
                </Link>
              </li>
              <li>
                <Link to="/contato" className="text-primary-foreground/80 hover:text-accent-warm transition-colors">
                  Contato
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-primary-foreground/80 hover:text-accent-warm transition-colors">
                  Perguntas Frequentes
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Serviços</h4>
            <ul className="space-y-2 text-primary-foreground/80">
              <li>Acomodações Confortáveis</li>
              <li>Wi-Fi Gratuito</li>
              <li>Estacionamento Privativo</li>
              <li>Café da Manhã</li>
              <li>Recepção 24 Horas</li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Contato</h4>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 mt-0.5 text-accent-warm" />
                <span className="text-primary-foreground/80">
                  Rua Maestro Cardim, 418<br />
                  Bela Vista, São Paulo/SP — CEP 01323-000
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-accent-warm" />
                <span className="text-primary-foreground/80">
                  (11) 3289-3757
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-accent-warm" />
                <span className="text-primary-foreground/80">
                  contato@centerplazahotel.com.br
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-primary-foreground/20 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-primary-foreground/60 text-sm">
              © 2026 Center Plaza Hotel. Todos os direitos reservados.
            </p>
            <div className="flex gap-6 text-sm">
              <Link to="/privacidade" className="text-primary-foreground/60 hover:text-accent-warm transition-colors">
                Política de Privacidade
              </Link>
              <Link to="/termos" className="text-primary-foreground/60 hover:text-accent-warm transition-colors">
                Termos de Uso
              </Link>
              <Link to="/cancelamento" className="text-primary-foreground/60 hover:text-accent-warm transition-colors">
                Cancelamento
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;