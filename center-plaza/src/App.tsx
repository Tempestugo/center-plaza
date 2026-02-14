import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ReservationProvider } from "@/contexts/ReservationContext";
import { FavoritesProvider } from "@/contexts/FavoritesContext";
import Index from "./pages/Index";
import Hospedagens from "./pages/Hospedagens";
import HospedagemDetalhes from "./pages/HospedagemDetalhes";
import ConsultarReserva from "./pages/ConsultarReserva";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminHospedagens from "./pages/AdminHospedagens";
import AdminReservas from "./pages/AdminReservas";
import AdminRelatorios from "./pages/AdminRelatorios";

import UserDashboard from "./pages/UserDashboard";
import ReservationDetails from "./pages/ReservationDetails";
import UserProfile from "./pages/UserProfile";
import NotFound from "./pages/NotFound";

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
            <Route path="/" element={<Index />} />
            <Route path="/hospedagens" element={<Hospedagens />} />
            <Route path="/hospedagem/:id" element={<HospedagemDetalhes />} />
            <Route path="/consultar-reserva" element={<ConsultarReserva />} />
            <Route path="/admin" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/hospedagens" element={<AdminHospedagens />} />
            <Route path="/admin/reservas" element={<AdminReservas />} />

            <Route path="/admin/relatorios" element={<AdminRelatorios />} />
            <Route path="/minha-conta" element={<UserDashboard />} />
            <Route path="/reserva/:id" element={<ReservationDetails />} />
            <Route path="/perfil" element={<UserProfile />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
          </TooltipProvider>
        </FavoritesProvider>
      </ReservationProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
