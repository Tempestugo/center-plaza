import { useState, useEffect } from 'react';
import { loadStripe, StripeError } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, AlertCircle } from 'lucide-react';
import { api } from '@/services/api'; // Assumindo que você tem uma instância do axios configurada

// Carregue a chave pública do Stripe a partir das variáveis de ambiente
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

interface CheckoutFormProps {
  reservationId: string;
  totalAmount: number;
  onSuccess: () => void;
  onBack: () => void;
}

/**
 * Formulário interno que lida com a lógica do Stripe.
 * Deve ser renderizado dentro de um componente <Elements>.
 */
const CheckoutForm = ({ reservationId, totalAmount, onSuccess, onBack }: CheckoutFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<StripeError | null>(null);
  const [processing, setProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  useEffect(() => {
    // Cria a "Intenção de Pagamento" no backend assim que o componente é montado.
    // O backend deve usar a chave secreta do Stripe para criar e retornar o clientSecret.
    const createPaymentIntent = async () => {
      try {
        const response = await api.post('/create-payment-intent', {
          reservationId,
          amount: Math.round(totalAmount * 100), // Stripe espera o valor em centavos
        });
        setClientSecret(response.data.clientSecret);
      } catch (err) {
        console.error('Erro ao criar a intenção de pagamento:', err);
        setError({
          type: 'api_error',
          message: 'Não foi possível iniciar o pagamento. Verifique sua conexão ou tente novamente.',
        } as StripeError);
      }
    };

    if (reservationId && totalAmount > 0) {
      createPaymentIntent();
    }
  }, [reservationId, totalAmount]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setProcessing(true);
    setError(null);

    if (!stripe || !elements || !clientSecret) {
      // Stripe.js ainda não carregou.
      setProcessing(false);
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setProcessing(false);
      return;
    }

    // Confirma o pagamento no frontend usando o clientSecret do backend
    const { error: paymentError } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: cardElement,
      },
    });

    if (paymentError) {
      setError(paymentError);
      setProcessing(false);
    } else {
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <CardContent className="space-y-6">
        <div>
          <label htmlFor="card-element" className="block text-sm font-medium text-gray-700 mb-2">
            Dados do Cartão de Crédito
          </label>
          <div className="p-3 border rounded-md bg-white">
             <CardElement id="card-element" />
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro no Pagamento</AlertTitle>
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button type="button" variant="outline" onClick={onBack} disabled={processing}>
          Voltar
        </Button>
        <Button type="submit" disabled={!stripe || !clientSecret || processing}>
          {processing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processando...
            </>
          ) : (
            `Pagar R$ ${totalAmount.toFixed(2)}`
          )}
        </Button>
      </CardFooter>
    </form>
  );
};

/**
 * Componente principal do passo de pagamento.
 * Ele envolve o formulário com o provider <Elements> do Stripe.
 */
const PaymentStep = ({ reservationId, totalAmount, onSuccess, onBack }: PaymentStepProps) => {
  return (
    <Card className="w-full max-w-lg mx-auto animate-in fade-in-50">
      <CardHeader>
        <CardTitle>Passo 4: Pagamento Seguro</CardTitle>
      </CardHeader>
      <Elements stripe={stripePromise}>
        <CheckoutForm
          reservationId={reservationId}
          totalAmount={totalAmount}
          onSuccess={onSuccess}
          onBack={onBack}
        />
      </Elements>
    </Card>
  );
};

export default PaymentStep;