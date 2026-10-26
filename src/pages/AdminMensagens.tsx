import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Building2, 
  Mail, 
  Phone, 
  Calendar, 
  Users, 
  Trash2, 
  RefreshCw, 
  Search, 
  MessageSquare,
  Clock,
  ExternalLink,
  Briefcase
} from "lucide-react";
import { toast } from "sonner";

interface ContactMessage {
  id: number;
  name: string;
  email: string;
  message: string;
  created_at: string;
}

export default function AdminMensagens() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "corporate" | "standard">("all");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch("/api/contacts", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error("Erro ao carregar mensagens");
      const data = await res.json();
      setMessages(data || []);
    } catch (err: any) {
      toast.error(err.message || "Erro de conexão ao buscar mensagens");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const handleDelete = async (id: number) => {
    if (!window.confirm("Deseja realmente excluir esta mensagem?")) return;
    setDeletingId(id);
    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch(`/api/contacts/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error("Falha ao excluir");
      toast.success("Mensagem excluída com sucesso");
      setMessages(prev => prev.filter(m => m.id !== id));
    } catch (err: any) {
      toast.error(err.message || "Erro ao excluir mensagem");
    } finally {
      setDeletingId(null);
    }
  };

  // Helper para extrair dados estruturados de mensagens corporativas
  const parseCorporateMessage = (text: string) => {
    const isCorporate = text.includes("[SOLICITAÇÃO DE RESERVA CORPORATIVA]");
    if (!isCorporate) return null;

    const getField = (label: string) => {
      const regex = new RegExp(`${label}:?\\s*(.*)`, "i");
      const match = text.match(regex);
      return match ? match[1].trim() : "";
    };

    const empresa = getField("Empresa");
    const contato = getField("Contato");
    const email = getField("E-mail");
    const telefone = getField("Telefone/WhatsApp") || getField("Telefone");
    const hospedes = getField("Previsão de Hóspedes / Quartos") || getField("Hóspedes");
    const datas = getField("Previsão de Datas") || getField("Datas");

    // Extrair observações após Detalhes / Necessidades:
    let observacoes = "";
    const obsIndex = text.indexOf("Detalhes / Necessidades:");
    if (obsIndex !== -1) {
      observacoes = text.substring(obsIndex + "Detalhes / Necessidades:".length).trim();
    }

    return {
      empresa,
      contato,
      email,
      telefone,
      hospedes,
      datas,
      observacoes
    };
  };

  // Filtragem
  const filteredMessages = messages.filter(item => {
    const isCorporate = item.message?.includes("[SOLICITAÇÃO DE RESERVA CORPORATIVA]");
    if (filter === "corporate" && !isCorporate) return false;
    if (filter === "standard" && isCorporate) return false;

    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      item.name?.toLowerCase().includes(term) ||
      item.email?.toLowerCase().includes(term) ||
      item.message?.toLowerCase().includes(term)
    );
  });

  const corporateCount = messages.filter(m => m.message?.includes("[SOLICITAÇÃO DE RESERVA CORPORATIVA]")).length;
  const standardCount = messages.length - corporateCount;

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Cabeçalho da Página */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
              <MessageSquare className="w-7 h-7 text-primary" />
              Mensagens & Cotações
            </h1>
            <p className="text-muted-foreground text-sm">
              Gerencie solicitações corporativas de empresas e contatos recebidos pelo site
            </p>
          </div>

          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchMessages} 
            disabled={loading}
            className="gap-2 self-start sm:self-auto cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
        </div>

        {/* Métricas Rápidas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card 
            className={`cursor-pointer transition-all ${filter === "all" ? "border-primary shadow-sm bg-primary/5" : "hover:border-stone-400"}`}
            onClick={() => setFilter("all")}
          >
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase">Todas as Mensagens</p>
                <p className="text-2xl font-bold">{messages.length}</p>
              </div>
              <MessageSquare className="w-8 h-8 text-muted-foreground/40" />
            </CardContent>
          </Card>

          <Card 
            className={`cursor-pointer transition-all ${filter === "corporate" ? "border-amber-500 shadow-sm bg-amber-500/10" : "hover:border-stone-400"}`}
            onClick={() => setFilter("corporate")}
          >
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-amber-700 dark:text-amber-400 font-semibold uppercase">Cotações Corporativas</p>
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{corporateCount}</p>
              </div>
              <Building2 className="w-8 h-8 text-amber-600/40" />
            </CardContent>
          </Card>

          <Card 
            className={`cursor-pointer transition-all ${filter === "standard" ? "border-blue-500 shadow-sm bg-blue-500/10" : "hover:border-stone-400"}`}
            onClick={() => setFilter("standard")}
          >
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-blue-700 dark:text-blue-400 font-semibold uppercase">Fale Conosco / Geral</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{standardCount}</p>
              </div>
              <Mail className="w-8 h-8 text-blue-600/40" />
            </CardContent>
          </Card>
        </div>

        {/* Barra de Pesquisa e Filtros */}
        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, empresa, e-mail ou palavras da mensagem..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          {search && (
            <Button variant="ghost" size="sm" onClick={() => setSearch("")}>
              Limpar busca
            </Button>
          )}
        </div>

        {/* Lista de Mensagens */}
        {loading ? (
          <div className="py-16 text-center text-muted-foreground">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-primary" />
            <p>Carregando mensagens recebidas...</p>
          </div>
        ) : filteredMessages.length === 0 ? (
          <Card className="text-center py-16 border-dashed">
            <CardContent className="space-y-3">
              <MessageSquare className="w-12 h-12 text-muted-foreground/30 mx-auto" />
              <h3 className="font-semibold text-lg">Nenhuma mensagem encontrada</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                {search 
                  ? "Nenhum resultado corresponde à sua pesquisa." 
                  : filter === "corporate" 
                    ? "Nenhuma cotação corporativa recebida ainda." 
                    : "As mensagens enviadas pelos formulários do site aparecerão aqui."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredMessages.map(item => {
              const corporateData = parseCorporateMessage(item.message);
              const isCorporate = !!corporateData;
              const dateFormatted = new Date(item.created_at).toLocaleString("pt-BR", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
              });

              // Limpar telefone para link do WhatsApp
              const rawPhone = corporateData?.telefone || "";
              let cleanPhone = rawPhone.replace(/\D/g, "");
              if (cleanPhone.startsWith("0")) cleanPhone = cleanPhone.substring(1);
              if (cleanPhone.length === 10 || cleanPhone.length === 11) cleanPhone = "55" + cleanPhone;

              const whatsappText = encodeURIComponent(
                `Olá${corporateData?.contato ? ` ${corporateData.contato}` : ""}! Recebemos sua solicitação de cotação corporativa${corporateData?.empresa ? ` para a *${corporateData.empresa}*` : ""} no Center Plaza Hotel. Gostaria de entender melhor suas necessidades para enviarmos nossa proposta com tarifas especiais.`
              );

              return (
                <Card 
                  key={item.id} 
                  className={`overflow-hidden transition-shadow hover:shadow-md ${isCorporate ? "border-amber-400/60 dark:border-amber-500/40 bg-gradient-to-r from-amber-50/40 to-transparent dark:from-amber-950/20" : ""}`}
                >
                  <CardHeader className="p-4 sm:p-5 border-b bg-stone-50/50 dark:bg-stone-900/50">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        {isCorporate ? (
                          <Badge className="bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold gap-1 px-2.5 py-0.5">
                            <Briefcase className="w-3.5 h-3.5" />
                            Cotação Corporativa
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="gap-1 border-blue-400 text-blue-700 dark:text-blue-400">
                            <Mail className="w-3.5 h-3.5" />
                            Fale Conosco
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {dateFormatted}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {cleanPhone && (
                          <Button
                            size="sm"
                            className="bg-[#25D366] hover:bg-[#20ba5a] text-white text-xs font-semibold gap-1.5 h-8 px-3 cursor-pointer shadow-sm border-0"
                            asChild
                          >
                            <a
                              href={`https://wa.me/${cleanPhone}?text=${whatsappText}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Phone className="w-3.5 h-3.5" />
                              Chamar no WhatsApp
                            </a>
                          </Button>
                        )}

                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs gap-1.5 h-8 px-3 cursor-pointer"
                          asChild
                        >
                          <a href={`mailto:${item.email}?subject=${encodeURIComponent(isCorporate ? "Proposta Comercial - Center Plaza Hotel" : "Contato Center Plaza Hotel")}`}>
                            <Mail className="w-3.5 h-3.5" />
                            Responder E-mail
                          </a>
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-stone-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
                          onClick={() => handleDelete(item.id)}
                          disabled={deletingId === item.id}
                          title="Excluir mensagem"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-4 sm:p-5 space-y-4">
                    {/* Linha de Dados do Solicitante */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div>
                        <span className="text-xs text-muted-foreground block font-medium">Nome do Contato</span>
                        <span className="font-semibold">{item.name}</span>
                      </div>

                      <div>
                        <span className="text-xs text-muted-foreground block font-medium">E-mail</span>
                        <a href={`mailto:${item.email}`} className="text-primary hover:underline font-medium text-xs sm:text-sm">
                          {item.email}
                        </a>
                      </div>

                      {corporateData?.empresa && (
                        <div>
                          <span className="text-xs text-muted-foreground block font-medium">Empresa</span>
                          <span className="font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5" />
                            {corporateData.empresa}
                          </span>
                        </div>
                      )}

                      {corporateData?.telefone && (
                        <div>
                          <span className="text-xs text-muted-foreground block font-medium">Telefone / WhatsApp</span>
                          <span className="font-medium">{corporateData.telefone}</span>
                        </div>
                      )}
                    </div>

                    {/* Dados Adicionais de Cotação Corporativa */}
                    {isCorporate && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs sm:text-sm">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-amber-600 shrink-0" />
                          <div>
                            <span className="text-muted-foreground font-medium">Hóspedes / Quartos: </span>
                            <span className="font-bold text-amber-950 dark:text-amber-200">
                              {corporateData.hospedes || "Não informado"}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-amber-600 shrink-0" />
                          <div>
                            <span className="text-muted-foreground font-medium">Previsão de Datas: </span>
                            <span className="font-bold text-amber-950 dark:text-amber-200">
                              {corporateData.datas || "Não informado"}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Conteúdo / Observações */}
                    <div>
                      <span className="text-xs text-muted-foreground block font-medium mb-1">
                        {isCorporate ? "Observações e Necessidades da Empresa:" : "Mensagem:"}
                      </span>
                      <div className="p-3.5 rounded-xl bg-stone-100 dark:bg-stone-900 text-sm leading-relaxed whitespace-pre-wrap font-sans border">
                        {isCorporate 
                          ? (corporateData.observacoes || "Nenhuma observação informada.")
                          : item.message}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
