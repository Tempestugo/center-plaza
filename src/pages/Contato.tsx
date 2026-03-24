import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, Phone, Mail, Send } from "lucide-react";
import { toast } from "sonner";

export default function Contato() {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', message: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      if (!res.ok) throw new Error();
      toast.success("Mensagem enviada com sucesso!");
      setForm({ name: '', email: '', message: '' });
    } catch {
      toast.error("Erro ao enviar mensagem.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Fale Conosco</h1>
            <p className="text-muted-foreground text-lg">Estamos à disposição para ajudar com sua reserva ou dúvidas.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Informações de Contato</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="bg-primary/10 p-3 rounded-full"><Phone className="w-6 h-6 text-primary" /></div>
                  <div>
                    <p className="font-medium">Telefone / WhatsApp</p>
                    <a href="https://wa.me/551132893757" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">(11) 3289-3757</a>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="bg-primary/10 p-3 rounded-full"><Mail className="w-6 h-6 text-primary" /></div>
                  <div>
                    <p className="font-medium">E-mail</p>
                    <a href="mailto:contato@centerplazahotel.com.br" className="text-muted-foreground hover:text-primary">contato@centerplazahotel.com.br</a>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="bg-primary/10 p-3 rounded-full"><MapPin className="w-6 h-6 text-primary" /></div>
                  <div>
                    <p className="font-medium">Endereço</p>
                    <p className="text-muted-foreground">Rua Maestro Cardim, 418<br/>Bela Vista, São Paulo/SP</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Envie uma Mensagem</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Input placeholder="Seu nome" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                  </div>
                  <div>
                    <Input type="email" placeholder="Seu e-mail" required value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
                  </div>
                  <div>
                    <Textarea placeholder="Como podemos ajudar?" required rows={4} value={form.message} onChange={e => setForm({...form, message: e.target.value})} />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Enviando..." : <><Send className="w-4 h-4 mr-2" /> Enviar Mensagem</>}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}