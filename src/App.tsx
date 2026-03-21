import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
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
import AdminDashboard from "./pages/AdminDashboard";
import AdminHospedagens from "./pages/AdminHospedagens";
import AdminReservas from "./pages/AdminReservas";
import AdminRelatorios from "./pages/AdminRelatorios";
const AdminSettings = lazy(() => import("./pages/AdminSettings"));
import UserDashboard from "./pages/UserDashboard";
import ReservationDetails from "./pages/ReservationDetails";
import UserProfile from "./pages/UserProfile";
import NotFound from "./pages/NotFound";
import ReservaSucesso from "@/pages/ReservaSucesso";
import ReservaCancelado from "@/pages/ReservaCancelado";
import FAQ from "@/components/FAQ";
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
              <Routes>
                {/* Rotas públicas */}
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

                {/* Rotas admin — protegidas por AdminRoute */}
                <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
                <Route path="/admin/hospedagens" element={<AdminRoute><AdminHospedagens /></AdminRoute>} />
                <Route path="/admin/reservas" element={<AdminRoute><AdminReservas /></AdminRoute>} />
                <Route path="/admin/settings" element={<Suspense fallback={<div/>}><AdminRoute><AdminSettings /></AdminRoute></Suspense>} />
                <Route path="/admin/relatorios" element={<AdminRoute><AdminRelatorios /></AdminRoute>} />

                <Route path="*" element={<NotFound />} />
              </Routes>
              <FloatingChat />
            </BrowserRouter>
          </TooltipProvider>
        </FavoritesProvider>
      </ReservationProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;