import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Loader2, ShieldCheck, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ?? "";
const stripePromise = PUBLISHABLE_KEY.startsWith("pk_") ? loadStripe(PUBLISHABLE_KEY) : null;

function CheckoutForm({ reservationId, totalAmount, onSuccess, onBack, isMock }: {
  reservationId: number; totalAmount: number; onSuccess: () => void; onBack: () => void; isMock: boolean;
}) {
  const stripeHook = useStripe();
  const elementsHook = useElements();
  const stripe = isMock ? null : stripeHook;
  const elements = isMock ? null : elementsHook;
  const { toast } = useToast();
  const [processing, setProcessing] = useState(false);
  const fmt = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isMock) {
      setProcessing(true);
      try {
        await fetch("/api/reservations/" + reservationId + "/status", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "confirmed" }),
        });
        toast({ title: "Reserva confirmada! (modo teste)" });
        onSuccess();
      } catch {
        toast({ title: "Erro ao confirmar", variant: "destructive" });
      } finally {
        setProcessing(false);
      }
      return;
    }
    if (!stripe || !elements) return;
    setProcessing(true);
    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin + "/reserva/" + reservationId + "?payment=success",
        },
        redirect: "if_required",
      });
      if (error) {
        toast({ title: "Pagamento recusado", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Pagamento realizado!", description: "Reserva confirmada." });
        onSuccess();
      }
    } catch {
      toast({ title: "Erro no pagamento", variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="rounded-lg border bg-muted/30 p-4 flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Total a pagar</span>
        <span className="text-xl font-bold text-primary">{fmt(totalAmount)}</span>
      </div>
      {isMock ? (
        <div className="rounded-lg border border-dashed border-yellow-300 bg-yellow-50 p-4">
          <p className="text-sm font-medium text-yellow-800">Modo Teste</p>
          <p className="text-xs text-yellow-700 mt-1">
            Stripe não configurado. Clique em Confirmar para simular.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-sm font-medium">Dados de pagamento</p>
          <div className="rounded-lg border p-3">
            <PaymentElement
              options={{
                layout: "tabs",
                defaultValues: { billingDetails: { address: { country: "BR" } } },
              }}
            />
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-green-600" />
            Pagamento processado com segurança pelo Stripe.
          </div>
        </div>
      )}
      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={onBack} disabled={processing}>
          <ArrowLeft className="h-4 w-4 mr-1.5" /> Voltar
        </Button>
        <Button
          type="submit"
          className="flex-1"
          disabled={processing || (!isMock && (!stripe || !elements))}
        >
          {processing ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processando...</>
          ) : isMock ? (
            "Confirmar (Modo Teste)"
          ) : (
            "Pagar " + fmt(totalAmount)
          )}
        </Button>
      </div>
    </form>
  );
}

interface PaymentStepProps {
  reservationId: number;
  totalAmount: number;
  onSuccess: () => void;
  onBack: () => void;
}

export default function PaymentStep({ reservationId, totalAmount, onSuccess, onBack }: PaymentStepProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isMock, setIsMock] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetch("/api/stripe/payment-intent-for-reservation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reservation_id: reservationId }),
    })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        setClientSecret(data.clientSecret);
        setIsMock(!!data.mock);
      })
      .catch(function () {
        setError("Erro ao iniciar pagamento. Tente novamente.");
        toast({ title: "Erro ao iniciar pagamento", variant: "destructive" });
      });
  }, [reservationId]);

  if (!clientSecret && !error) return (
    <div className="flex flex-col items-center justify-center py-12 gap-3">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      <p className="text-sm text-muted-foreground">Preparando pagamento...</p>
    </div>
  );

  if (error) return (
    <div className="text-center py-8 space-y-3">
      <p className="text-sm text-destructive">{error}</p>
      <Button variant="outline" onClick={onBack}>
        <ArrowLeft className="h-4 w-4 mr-1.5" /> Voltar
      </Button>
    </div>
  );

  if (isMock || !stripePromise || !clientSecret || !clientSecret.startsWith("pi_")) {
    return (
      <Elements stripe={stripePromise ?? loadStripe("") as any} options={{}}>
        <CheckoutForm reservationId={reservationId} totalAmount={totalAmount} onSuccess={onSuccess} onBack={onBack} isMock={true} />
      </Elements>
    );
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret: clientSecret,
        locale: "pt-BR",
        appearance: {
          theme: "stripe",
          variables: { colorPrimary: "#7c1d3f", borderRadius: "8px" },
        },
      }}
    >
      <CheckoutForm
        reservationId={reservationId}
        totalAmount={totalAmount}
        onSuccess={onSuccess}
        onBack={onBack}
        isMock={false}
      />
    </Elements>
  );
}