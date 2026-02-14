import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { 
  Calendar as CalendarIcon, 
  Users, 
  CreditCard, 
  Check, 
  ArrowLeft, 
  ArrowRight,
  MapPin,
  Clock,
  Shield,
  Wifi,
  Car,
  Coffee
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth } from "@/contexts/AuthContext";
import { useReservations } from "@/contexts/ReservationContext";

interface BookingFlowProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accommodation: {
    id: number;
    name: string;
    location: string;
    price: number;
    maxGuests: number;
    image: string;
    amenities: string[];
  };
}

type BookingStep = "dates" | "guests" | "details" | "payment" | "confirmation";

export const BookingFlow = ({ open, onOpenChange, accommodation }: BookingFlowProps) => {
  const { user, isAuthenticated } = useAuth();
  const { addReservation } = useReservations();
  const [currentStep, setCurrentStep] = useState<BookingStep>("dates");
  const [loading, setLoading] = useState(false);
  
  // Booking data
  const [checkIn, setCheckIn] = useState<Date | undefined>();
  const [checkOut, setCheckOut] = useState<Date | undefined>();
  const [guests, setGuests] = useState(2);
  const [guestDetails, setGuestDetails] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: "",
    document: "",
    specialRequests: ""
  });
  const [paymentMethod, setPaymentMethod] = useState("");
  const [cardData, setCardData] = useState({
    number: "",
    name: "",
    expiry: "",
    cvv: ""
  });
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [bookingId, setBookingId] = useState("");

  const nights = checkIn && checkOut ? differenceInDays(checkOut, checkIn) : 0;
  const subtotal = nights * accommodation.price;
  const serviceFee = subtotal * 0.1; // 10% taxa de serviço
  const total = subtotal + serviceFee;

  const steps = [
    { id: "dates", title: "Datas", description: "Selecione as datas" },
    { id: "guests", title: "Hóspedes", description: "Número de pessoas" },
    { id: "details", title: "Detalhes", description: "Informações pessoais" },
    { id: "payment", title: "Pagamento", description: "Forma de pagamento" },
    { id: "confirmation", title: "Confirmação", description: "Reserva confirmada" }
  ];

  const currentStepIndex = steps.findIndex(step => step.id === currentStep);

  const canProceedFromDates = checkIn && checkOut && nights > 0;
  const canProceedFromGuests = guests > 0 && guests <= accommodation.maxGuests;
  const canProceedFromDetails = guestDetails.name && guestDetails.email && guestDetails.phone && guestDetails.document;
  const canProceedFromPayment = paymentMethod && acceptTerms && 
    (paymentMethod === "pix" || (cardData.number && cardData.name && cardData.expiry && cardData.cvv));

  const handleNext = () => {
    const stepOrder: BookingStep[] = ["dates", "guests", "details", "payment", "confirmation"];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex < stepOrder.length - 1) {
      setCurrentStep(stepOrder[currentIndex + 1]);
    }
  };

  const handlePrevious = () => {
    const stepOrder: BookingStep[] = ["dates", "guests", "details", "payment", "confirmation"];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(stepOrder[currentIndex - 1]);
    }
  };

  const handleConfirmBooking = async () => {
    setLoading(true);
    try {
      // Processamento do pagamento (em produção, integrar com gateway de pagamento)
      
      // Criar dados da reserva
      const reservationData = {
        accommodationId: accommodation.id,
        accommodationName: accommodation.name,
        accommodationImage: accommodation.image,
        location: accommodation.location,
        checkIn: checkIn!.toISOString(),
        checkOut: checkOut!.toISOString(),
        guests,
        nights,
        pricePerNight: accommodation.price,
        subtotal,
        serviceFee,
        total: paymentMethod === 'pix' ? total * 0.95 : total, // Desconto de 5% para PIX
        guestName: guestDetails.name,
        email: guestDetails.email,
        phone: guestDetails.phone,
        document: guestDetails.document,
        specialRequests: guestDetails.specialRequests,
        paymentMethod,
        status: 'confirmada' as const,
        paymentStatus: 'pago' as const,
        amenities: accommodation.amenities,
      };
      
      // Salvar reserva no contexto (agora é assíncrono)
      const newBookingId = await addReservation(reservationData);
      setBookingId(newBookingId);
      
      setCurrentStep("confirmation");
      toast.success("Reserva confirmada com sucesso!");
    } catch (error) {
      console.error('Erro ao confirmar reserva:', error);
      toast.error("Erro ao processar reserva. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const resetBooking = () => {
    setCurrentStep("dates");
    setCheckIn(undefined);
    setCheckOut(undefined);
    setGuests(2);
    setGuestDetails({
      name: user?.name || "",
      email: user?.email || "",
      phone: "",
      document: "",
      specialRequests: ""
    });
    setPaymentMethod("");
    setCardData({ number: "", name: "", expiry: "", cvv: "" });
    setAcceptTerms(false);
    setBookingId("");
  };

  const handleClose = () => {
    resetBooking();
    onOpenChange(false);
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Finalizar Reserva</DialogTitle>
        </DialogHeader>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Resumo da Reserva */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Resumo da Reserva</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <img 
                    src={accommodation.image} 
                    alt={accommodation.name}
                    className="w-full h-32 object-cover rounded-lg mb-3"
                  />
                  <h3 className="font-semibold">{accommodation.name}</h3>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {accommodation.location}
                  </p>
                </div>

                {checkIn && checkOut && (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Check-in:</span>
                      <span>{format(checkIn, "dd/MM/yyyy", { locale: ptBR })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Check-out:</span>
                      <span>{format(checkOut, "dd/MM/yyyy", { locale: ptBR })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Noites:</span>
                      <span>{nights}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Hóspedes:</span>
                      <span>{guests}</span>
                    </div>
                  </div>
                )}

                {nights > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>R$ {accommodation.price} x {nights} noites</span>
                        <span>R$ {subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Taxa de serviço</span>
                        <span>R$ {serviceFee.toFixed(2)}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-semibold">
                        <span>Total</span>
                        <span>R$ {total.toFixed(2)}</span>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Formulário de Reserva */}
          <div className="lg:col-span-2">
            {/* Progress Steps */}
            <div className="flex items-center justify-between mb-6">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                    index <= currentStepIndex 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-muted text-muted-foreground"
                  }`}>
                    {index < currentStepIndex ? <Check className="h-4 w-4" /> : index + 1}
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-12 h-0.5 mx-2 ${
                      index < currentStepIndex ? "bg-primary" : "bg-muted"
                    }`} />
                  )}
                </div>
              ))}
            </div>

            {/* Step Content */}
            <div className="space-y-6">
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
                          <Calendar
                            mode="single"
                            selected={checkIn}
                            onSelect={setCheckIn}
                            disabled={(date) => date < new Date()}
                            initialFocus
                          />
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
                          <Calendar
                            mode="single"
                            selected={checkOut}
                            onSelect={setCheckOut}
                            disabled={(date) => date <= (checkIn || new Date())}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === "guests" && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Quantos hóspedes?</h3>
                  <div>
                    <Label>Número de hóspedes (máximo {accommodation.maxGuests})</Label>
                    <Select value={guests.toString()} onValueChange={(value) => setGuests(parseInt(value))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: accommodation.maxGuests }, (_, i) => i + 1).map((num) => (
                          <SelectItem key={num} value={num.toString()}>
                            {num} {num === 1 ? "hóspede" : "hóspedes"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {currentStep === "details" && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Informações do hóspede principal</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Nome Completo *</Label>
                      <Input
                        id="name"
                        value={guestDetails.name}
                        onChange={(e) => setGuestDetails({ ...guestDetails, name: e.target.value })}
                        placeholder="Seu nome completo"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={guestDetails.email}
                        onChange={(e) => setGuestDetails({ ...guestDetails, email: e.target.value })}
                        placeholder="seu@email.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Telefone *</Label>
                      <Input
                        id="phone"
                        value={guestDetails.phone}
                        onChange={(e) => setGuestDetails({ ...guestDetails, phone: e.target.value })}
                        placeholder="(11) 99999-9999"
                      />
                    </div>
                    <div>
                      <Label htmlFor="document">CPF *</Label>
                      <Input
                        id="document"
                        value={guestDetails.document}
                        onChange={(e) => setGuestDetails({ ...guestDetails, document: e.target.value })}
                        placeholder="000.000.000-00"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="requests">Solicitações especiais (opcional)</Label>
                    <Textarea
                      id="requests"
                      value={guestDetails.specialRequests}
                      onChange={(e) => setGuestDetails({ ...guestDetails, specialRequests: e.target.value })}
                      placeholder="Alguma solicitação especial para sua estadia?"
                      rows={3}
                    />
                  </div>
                </div>
              )}

              {currentStep === "payment" && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold">Forma de pagamento</h3>
                  
                  <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                    <div className="flex items-center space-x-2 p-4 border rounded-lg">
                      <RadioGroupItem value="pix" id="pix" />
                      <Label htmlFor="pix" className="flex-1 cursor-pointer">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">PIX</p>
                            <p className="text-sm text-muted-foreground">Pagamento instantâneo</p>
                          </div>
                          <Badge variant="secondary">Desconto 5%</Badge>
                        </div>
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2 p-4 border rounded-lg">
                      <RadioGroupItem value="credit" id="credit" />
                      <Label htmlFor="credit" className="flex-1 cursor-pointer">
                        <div>
                          <p className="font-medium">Cartão de Crédito</p>
                          <p className="text-sm text-muted-foreground">Visa, Mastercard, Elo</p>
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>

                  {paymentMethod === "credit" && (
                    <div className="space-y-4 p-4 border rounded-lg">
                      <h4 className="font-medium">Dados do cartão</h4>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                          <Label htmlFor="cardNumber">Número do cartão</Label>
                          <Input
                            id="cardNumber"
                            value={cardData.number}
                            onChange={(e) => setCardData({ ...cardData, number: e.target.value })}
                            placeholder="0000 0000 0000 0000"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <Label htmlFor="cardName">Nome no cartão</Label>
                          <Input
                            id="cardName"
                            value={cardData.name}
                            onChange={(e) => setCardData({ ...cardData, name: e.target.value })}
                            placeholder="Nome como está no cartão"
                          />
                        </div>
                        <div>
                          <Label htmlFor="cardExpiry">Validade</Label>
                          <Input
                            id="cardExpiry"
                            value={cardData.expiry}
                            onChange={(e) => setCardData({ ...cardData, expiry: e.target.value })}
                            placeholder="MM/AA"
                          />
                        </div>
                        <div>
                          <Label htmlFor="cardCvv">CVV</Label>
                          <Input
                            id="cardCvv"
                            value={cardData.cvv}
                            onChange={(e) => setCardData({ ...cardData, cvv: e.target.value })}
                            placeholder="000"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="terms" 
                      checked={acceptTerms}
                      onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
                    />
                    <Label htmlFor="terms" className="text-sm">
                      Aceito os <a href="#" className="text-primary underline">termos e condições</a> e a <a href="#" className="text-primary underline">política de privacidade</a>
                    </Label>
                  </div>
                </div>
              )}

              {currentStep === "confirmation" && (
                <div className="text-center space-y-6">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <Check className="h-8 w-8 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-green-600 mb-2">Reserva Confirmada!</h3>
                    <p className="text-muted-foreground">Sua reserva foi processada com sucesso</p>
                  </div>
                  
                  <Card>
                    <CardContent className="p-6">
                      <div className="space-y-3 text-left">
                        <div className="flex justify-between">
                          <span className="font-medium">Número da reserva:</span>
                          <span className="font-mono">{bookingId}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Hospedagem:</span>
                          <span>{accommodation.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Check-in:</span>
                          <span>{checkIn && format(checkIn, "dd/MM/yyyy", { locale: ptBR })}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Check-out:</span>
                          <span>{checkOut && format(checkOut, "dd/MM/yyyy", { locale: ptBR })}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Total pago:</span>
                          <span className="font-semibold">R$ {total.toFixed(2)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <p className="text-sm text-muted-foreground">
                    Um email de confirmação foi enviado para {guestDetails.email}
                  </p>
                </div>
              )}
            </div>

            {/* Navigation Buttons */}
            {currentStep !== "confirmation" && (
              <div className="flex justify-between mt-8">
                <Button 
                  variant="outline" 
                  onClick={handlePrevious}
                  disabled={currentStep === "dates"}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar
                </Button>
                
                {currentStep === "payment" ? (
                  <Button 
                    onClick={handleConfirmBooking}
                    disabled={!canProceedFromPayment || loading}
                  >
                    {loading ? "Processando..." : "Confirmar Reserva"}
                  </Button>
                ) : (
                  <Button 
                    onClick={handleNext}
                    disabled={
                      (currentStep === "dates" && !canProceedFromDates) ||
                      (currentStep === "guests" && !canProceedFromGuests) ||
                      (currentStep === "details" && !canProceedFromDetails)
                    }
                  >
                    Continuar
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>
            )}

            {currentStep === "confirmation" && (
              <div className="flex justify-center mt-8">
                <Button onClick={handleClose}>
                  Fechar
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};