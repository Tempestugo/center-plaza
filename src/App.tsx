import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ReservationProvider } from "@/contexts/ReservationContext";
import { FavoritesProvider } from "@/contexts/FavoritesContext";
import AdminRoute from "@/components/AdminRoute";
import Index from "./pages/Index";
import Hospedagens from "./pages/Hospedagens";
import HospedagemDetalhes from "./pages/HospedagemDetalhes";
import ConsultarReserva from "./pages/ConsultarReserva";
import AdminLogin from "./pages/AdminLogin";
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminHospedagens = lazy(() => import("./pages/AdminHospedagens"));
const AdminReservas = lazy(() => import("./pages/AdminReservas"));
const AdminRelatorios = lazy(() => import("./pages/AdminRelatorios"));
const AdminSettings = lazy(() => import("./pages/AdminSettings"));
const AdminDisponibilidade = lazy(() => import("./pages/AdminDisponibilidade"));
import UserDashboard from "./pages/UserDashboard";
import ReservationDetails from "./pages/ReservationDetails";
import UserProfile from "./pages/UserProfile";
import NotFound from "./pages/NotFound";
import ReservaSucesso from "@/pages/ReservaSucesso";
import ReservaCancelado from "@/pages/ReservaCancelado";
import FAQ from "@/components/FAQ";
import Contato from "@/pages/Contato";
import PoliticaPrivacidade from "./pages/PoliticaPrivacidade";
import TermosUso from "./pages/TermosUso";
import PoliticaCancelamento from "./pages/PoliticaCancelamento";
import FloatingChat from "@/components/FloatingChat";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ReservationProvider>
        <FavoritesProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div></div>}>
              <Routes>
                {}
                <Route path="/" element={<Index />} />
                <Route path="/hospedagens" element={<Hospedagens />} />
                <Route path="/hospedagem/:id" element={<HospedagemDetalhes />} />
                <Route path="/consultar-reserva" element={<ConsultarReserva />} />
                <Route path="/admin" element={<AdminLogin />} />
                <Route path="/minha-conta" element={<UserDashboard />} />
                <Route path="/reserva/:id" element={<ReservationDetails />} />
                <Route path="/perfil" element={<UserProfile />} />
                <Route path="/reserva/sucesso" element={<ReservaSucesso />} />
                <Route path="/reserva/cancelado" element={<ReservaCancelado />} />
                <Route path="/faq" element={<FAQ />} />
                <Route path="/contato" element={<Contato />} />
                <Route path="/privacidade" element={<PoliticaPrivacidade />} />
                <Route path="/termos" element={<TermosUso />} />
                <Route path="/cancelamento" element={<PoliticaCancelamento />} />

                {}
                <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
                <Route path="/admin/hospedagens" element={<AdminRoute><AdminHospedagens /></AdminRoute>} />
                <Route path="/admin/reservas" element={<AdminRoute><AdminReservas /></AdminRoute>} />
                <Route path="/admin/disponibilidade" element={<AdminRoute><AdminDisponibilidade /></AdminRoute>} />
                <Route path="/admin/reservas-concluidas" element={<AdminRoute><AdminReservas onlyConfirmed={true} /></AdminRoute>} />
                <Route path="/admin/settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />
                <Route path="/admin/relatorios" element={<AdminRoute><AdminRelatorios /></AdminRoute>} />

                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
              <FloatingChat />
            </BrowserRouter>
          </TooltipProvider>
        </FavoritesProvider>
      </ReservationProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;