import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Phone, Mail, Clock, MessageCircle } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function Contato() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-3xl font-bold mb-2">Entre em Contato</h1>
        <p className="text-muted-foreground mb-10">Estamos aqui para ajudar. Fale conosco por qualquer canal abaixo.</p>

        <div className="grid md:grid-cols-2 gap-6 mb-10">
          <Card>
            <CardContent className="p-6 flex gap-4">
              <MapPin className="h-6 w-6 text-primary shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">Endereço</h3>
                <p className="text-muted-foreground text-sm">Rua Maestro Cardim, 418</p>
                <p className="text-muted-foreground text-sm">Bela Vista, São Paulo/SP</p>
                <p className="text-muted-foreground text-sm">CEP 01323-000</p>
                
                  href="https://maps.google.com/?q=Rua+Maestro+Cardim+418+Bela+Vista+São+Paulo"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary text-sm underline mt-2 inline-block"
                >
                  Ver no Google Maps
                </a>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 flex gap-4">
              <Clock className="h-6 w-6 text-primary shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">Horários</h3>
                <p className="text-muted-foreground text-sm">Check-in: 14h00 às 17h00</p>
                <p className="text-muted-foreground text-sm">Check-out: até 12h00</p>
                <p className="text-muted-foreground text-sm">Recepção: 24 horas</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 flex gap-4">
              <Phone className="h-6 w-6 text-primary shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">Telefone</h3>
                <a href="tel:+551132893757" className="text-muted-foreground text-sm hover:text-primary">
                  (11) 3289-3757
                </a>
                <div className="mt-2">
                  
                    href="https://wa.me/551132893757?text=Olá! Gostaria de mais informações sobre o Center Plaza Hotel."
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button size="sm" variant="outline" className="text-green-600 border-green-300 hover:bg-green-50 mt-1">
                      <MessageCircle className="mr-2 h-4 w-4" />
                      WhatsApp
                    </Button>
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 flex gap-4">
              <Mail className="h-6 w-6 text-primary shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">E-mail</h3>
                
                  href="mailto:contato@centerplazahotel.com.br"
                  className="text-muted-foreground text-sm hover:text-primary"
                >
                  contato@centerplazahotel.com.br
                </a>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="rounded-xl overflow-hidden h-80 border">
          <iframe
            title="Localização Center Plaza Hotel"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3657.1!2d-46.6432!3d-23.5632!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2sRua+Maestro+Cardim%2C+418%2C+Bela+Vista%2C+S%C3%A3o+Paulo!5e0!3m2!1spt!2sbr!4v1"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
          />
        </div>
      </main>
      <Footer />
    </div>
  );
}
