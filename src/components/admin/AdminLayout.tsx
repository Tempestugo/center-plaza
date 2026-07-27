



import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Settings, LogOut, BarChart3, Home, Calendar, TrendingUp, CheckCircle, CalendarDays } from "lucide-react";

const NAV_ITEMS = [
  { label: "Dashboard",   href: "/admin/dashboard",   icon: BarChart3   },
  { label: "Hospedagens", href: "/admin/hospedagens",  icon: Home        },
  { label: "Reservas",    href: "/admin/reservas",     icon: Calendar    },
  { label: "Disponibilidade", href: "/admin/disponibilidade", icon: CalendarDays },
  { label: "Concluídas",  href: "/admin/reservas-concluidas", icon: CheckCircle },
  { label: "Relatórios",  href: "/admin/relatorios",   icon: TrendingUp  },
];


interface AdminLayoutProps {
  children: React.ReactNode;
  headerRight?: React.ReactNode; 
}

export default function AdminLayout({ children, headerRight }: AdminLayoutProps) {
  const navigate  = useNavigate();
  const { pathname } = useLocation();
  const { logout, isAdmin } = useAuth();

  useEffect(() => {
    if (!localStorage.getItem("admin_token") && !isAdmin) navigate("/admin");
  }, [navigate, isAdmin]);

  const handleLogout = () => {
    logout();
    navigate("/admin");
  };

  return (
    <div className="min-h-screen bg-background">
      {}
      <header className="border-b bg-background/95 backdrop-blur sticky top-0 z-50">
        <div className="flex h-16 items-center justify-between px-6">
          <h1 className="text-xl font-bold text-primary">Center Plaza Admin</h1>
          <div className="flex items-center gap-2">
            {headerRight}
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-4 w-4" />
              <Badge className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center p-0 text-[10px]">
                3
              </Badge>
            </Button>
            <Button variant="ghost" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleLogout} title="Sair">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {}
        <aside className="w-56 border-r bg-background/95 h-[calc(100vh-4rem)] sticky top-16 shrink-0">
          <nav className="p-3 space-y-1">
            {NAV_ITEMS.map(({ label, href, icon: Icon }) => (
              <Button
                key={href}
                variant={pathname === href ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => navigate(href)}
              >
                <Icon className="mr-2 h-4 w-4" />
                {label}
              </Button>
            ))}
          </nav>
        </aside>

        {}
        <main className="flex-1 min-w-0 p-6">{children}</main>
      </div>
    </div>
  );
}