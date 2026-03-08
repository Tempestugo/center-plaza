import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Calendar as CalendarIcon, Check, ArrowLeft, ArrowRight, MapPin } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth } from "@/contexts/AuthContext";

interface BookingFlowProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accommodation: {
    id: number | string;
    name: string;
    location: string;
    price: number;
    maxGuests: number;
    image: string;
    amenities: string[];
  };
}

type BookingStep = "dates" | "guests" | "details";

const STEPS: { id: BookingStep; title: string }[] = [
  { id: "dates",        title: "Datas"        },
  { id: "guests",       title: "Hóspedes"     },
  { id: "details",      title: "Detalhes"     },
];

const STEP_ORDER: BookingStep[] = ["dates", "guests", "details"];

export function BookingFlow({ open, onOpenChange, accommodation }: BookingFlowProps) {
  const { user } = useAuth();

  const [currentStep, setCurrentStep] = useState<BookingStep>("dates");
  const [loading,     setLoading]     = useState(false);

  // Dados da reserva
  const [checkIn,  setCheckIn]  = useState<Date | undefined>();
  const [checkOut, setCheckOut] = useState<Date | undefined>();
  const [guests,   setGuests]   = useState(2);
  const [guestDetails, setGuestDetails] = useState({
    name:            user?.name  ?? "",
    email:           user?.email ?? "",
    phone:           "",
    document:        "",
    specialRequests: "",
  });
  const [blockedDates, setBlockedDates] = useState<string[]>([]);

  useEffect(() => {
    if (!accommodation?.id) return;
    fetch('/api/rooms/' + accommodation.id + '/blocked-dates')
      .then(r => r.json())
      .then(data => setBlockedDates(data.blocked_dates || []))
      .catch(() => {});
  }, [String(accommodation?.id)]);

  const isDateBlocked = (date: Date): boolean => {
    const str = date.toISOString().split('T')[0];
    return blockedDates.includes(str);
  };


  // Cálculos
  const nights     = checkIn && checkOut ? differenceInDays(checkOut, checkIn) : 0;
  const subtotal   = nights * accommodation.price;
  const serviceFee = subtotal * 0.1;
  const total      = subtotal + serviceFee;

  const currentStepIndex = STEP_ORDER.indexOf(currentStep);

  const canProceed = {
    dates:   !!(checkIn && checkOut && nights > 0),
    guests:  guests > 0 && guests <= accommodation.maxGuests,
    details: !!(guestDetails.name && guestDetails.email && guestDetails.phone && guestDetails.document),
  };

  // ── Navegar para frente (no passo "details" → cria a reserva no backend) ────
  const handleNext = async () => {
    // Ao sair de "details", criar reserva E redirecionar para Stripe Checkout
    if (currentStep === "details") {
      setLoading(true);
      try {
        const response = await fetch('/api/create-checkout-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            hotel_id: 1,
            room_type_id: accommodation.id,
            guest_name: guestDetails.name,
            guest_email: guestDetails.email,
            guest_phone: guestDetails.phone,
            guest_document: guestDetails.document,
            check_in_date: format(checkIn!, 'yyyy-MM-dd'),
            check_out_date: format(checkOut!, 'yyyy-MM-dd'),
            number_of_guests: guests,
            special_requests: guestDetails.specialRequests,
          }),
        });

        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error || 'Erro ao criar sessão de pagamento');
        }

        const { url } = await response.json();
        window.location.href = url; // Redireciona para o Stripe Checkout
      } catch (err: any) {
        toast.error(err.message || "Erro ao processar. Tente novamente.");
      } finally {
        setLoading(false);
      }
      return;
    }

    const idx = STEP_ORDER.indexOf(currentStep);
    if (idx < STEP_ORDER.length - 1) setCurrentStep(STEP_ORDER[idx + 1]);
  };

  const handlePrevious = () => {
    const idx = STEP_ORDER.indexOf(currentStep);
    if (idx > 0) setCurrentStep(STEP_ORDER[idx - 1]);
  };

  const resetBooking = () => {
    setCurrentStep("dates");
    setCheckIn(undefined);
    setCheckOut(undefined);
    setGuests(2);
    setGuestDetails({ name: user?.name ?? "", email: user?.email ?? "", phone: "", document: "", specialRequests: "" });
  };

  const handleClose = () => { resetBooking(); onOpenChange(false); };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Finalizar Reserva</DialogTitle>
        </DialogHeader>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* ── Resumo lateral ──────────────────────────────────────────────── */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader><CardTitle className="text-lg">Resumo da Reserva</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <img src={accommodation.image} alt={accommodation.name} className="w-full h-32 object-cover rounded-lg mb-3" />
                  <h3 className="font-semibold">{accommodation.name}</h3>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" />{accommodation.location}
                  </p>
                </div>

                {checkIn && checkOut && (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span>Check-in:</span><span>{format(checkIn, "dd/MM/yyyy", { locale: ptBR })}</span></div>
                    <div className="flex justify-between"><span>Check-out:</span><span>{format(checkOut, "dd/MM/yyyy", { locale: ptBR })}</span></div>
                    <div className="flex justify-between"><span>Noites:</span><span>{nights}</span></div>
                    <div className="flex justify-between"><span>Hóspedes:</span><span>{guests}</span></div>
                  </div>
                )}

                {nights > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>R$ {accommodation.price} x {nights} noite{nights > 1 ? "s" : ""}</span>
                        <span>R$ {subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between"><span>Taxa de serviço</span><span>R$ {serviceFee.toFixed(2)}</span></div>
                      <Separator />
                      <div className="flex justify-between font-semibold">
                        <span>Total</span><span>R$ {total.toFixed(2)}</span>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ── Conteúdo principal ──────────────────────────────────────────── */}
          <div className="lg:col-span-2">
            {/* Progress indicator */}
            <div className="flex items-center justify-between mb-6">
              {STEPS.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                    index < currentStepIndex
                      ? "bg-primary text-primary-foreground"
                      : index === currentStepIndex
                        ? "bg-primary text-primary-foreground ring-2 ring-primary/30"
                        : "bg-muted text-muted-foreground"
                  }`}>
                    {index < currentStepIndex ? <Check className="h-4 w-4" /> : index + 1}
                  </div>
                  {index < STEPS.length - 1 && (
                    <div className={`w-10 h-0.5 mx-1.5 transition-colors ${index < currentStepIndex ? "bg-primary" : "bg-muted"}`} />
                  )}
                </div>
              ))}
            </div>

            {/* ── Passo 1: Datas ────────────────────────────────────────────── */}
            {currentStep === "dates" && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Selecione as datas da sua estadia</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Data de Check-in</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {checkIn ? format(checkIn, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar data"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" selected={checkIn} onSelect={setCheckIn} disabled={d => d < new Date() || isDateBlocked(d)} initialFocus />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <Label>Data de Check-out</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {checkOut ? format(checkOut, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar data"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" selected={checkOut} onSelect={setCheckOut} disabled={d => d <= (checkIn || new Date()) || isDateBlocked(d)} initialFocus />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>
            )}

            {/* ── Passo 2: Hóspedes ─────────────────────────────────────────── */}
            {currentStep === "guests" && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Quantos hóspedes?</h3>
                <div>
                  <Label>Número de hóspedes (máximo {accommodation.maxGuests})</Label>
                  <Select value={guests.toString()} onValueChange={v => setGuests(parseInt(v))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: accommodation.maxGuests }, (_, i) => i + 1).map(num => (
                        <SelectItem key={num} value={num.toString()}>
                          {num} {num === 1 ? "hóspede" : "hóspedes"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* ── Passo 3: Detalhes ─────────────────────────────────────────── */}
            {currentStep === "details" && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Informações do hóspede principal</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Nome Completo *</Label>
                    <Input id="name" value={guestDetails.name} onChange={e => setGuestDetails(p => ({ ...p, name: e.target.value }))} placeholder="Seu nome completo" />
                  </div>
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input id="email" type="email" value={guestDetails.email} onChange={e => setGuestDetails(p => ({ ...p, email: e.target.value }))} placeholder="seu@email.com" />
                  </div>
                  <div>
                    <Label htmlFor="phone">Telefone *</Label>
                    <Input id="phone" value={guestDetails.phone} onChange={e => setGuestDetails(p => ({ ...p, phone: e.target.value }))} placeholder="(11) 99999-9999" />
                  </div>
                  <div>
                    <Label htmlFor="document">CPF *</Label>
                    <Input id="document" value={guestDetails.document} onChange={e => setGuestDetails(p => ({ ...p, document: e.target.value }))} placeholder="000.000.000-00" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="requests">Solicitações especiais (opcional)</Label>
                  <Textarea id="requests" value={guestDetails.specialRequests} onChange={e => setGuestDetails(p => ({ ...p, specialRequests: e.target.value }))} placeholder="Alguma solicitação especial?" rows={3} />
                </div>
              </div>
            )}

            {/* ── Botões de navegação ───────────────────────────────────────── */}
            {
              <div className="flex justify-between mt-8">
                <Button variant="outline" onClick={handlePrevious} disabled={currentStep === "dates"}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
                </Button>
                <Button
                  onClick={handleNext}
                  disabled={loading || !canProceed[currentStep]}
                >
                  {loading
                    ? "Redirecionando..."
                    : currentStep === "details"
                    ? "Ir para Pagamento →"
                    : "Continuar"}
                  {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
                </Button>
              </div>
            }
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default BookingFlow;