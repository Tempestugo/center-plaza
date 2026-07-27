import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, User, Eye, EyeOff, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? null;

const AdminLogin = () => {
  const [email,        setEmail]        = useState("");
  const [password,     setPassword]     = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading,    setIsLoading]    = useState(false);
  const { toast }  = useToast();
  const navigate   = useNavigate();
  const { isAuthenticated, isAdmin, setUser } = useAuth();

  useEffect(() => {
    const adminToken = localStorage.getItem("admin_token");
    if ((isAuthenticated && isAdmin) || adminToken) {
      navigate("/admin/dashboard", { replace: true });
    }
  }, [isAuthenticated, isAdmin, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast({ title: "Preencha todos os campos", variant: "destructive" });
      return;
    }

    setIsLoading(true);

    try {
      let token: string | null = null;

      console.log('API_BASE_URL:', API_BASE_URL);
      if (API_BASE_URL) {
        try {
          console.log('Tentando login em:', `${API_BASE_URL}/login`);
          const res = await fetch(`${API_BASE_URL}/login`, {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify({ username: email, password }),
          });

          if (res.ok) {
            const data = await res.json();
            token = data.token ?? "api-token";
          }
        } catch (err: any) {
          console.error('ERRO NO LOGIN:', err.message, err);
        }
      }

      if (token) {
        const adminUser = { id: "admin", name: "Administrador", email: "admin@centerplaza.com", role: "admin" };
        localStorage.setItem("admin_token", token);
        localStorage.setItem("user", JSON.stringify(adminUser));
        setUser(adminUser);
        toast({ title: "Login realizado com sucesso!" });
        navigate("/admin/dashboard", { replace: true });
      } else {
        toast({
          title: "Credenciais inválidas",
          description: "E-mail ou senha incorretos. Verifique seus dados e tente novamente.",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Erro ao fazer login",
        description: "Tente novamente em instantes.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary/80 to-primary/60 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary-foreground mb-1">Center Plaza</h1>
          <p className="text-primary-foreground/75">Painel Administrativo</p>
        </div>

        <Card>
          <CardHeader className="text-center pb-2">
            <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <Lock className="w-7 h-7 text-primary" />
            </div>
            <CardTitle className="text-xl">Fazer Login</CardTitle>
            <CardDescription>Acesse o painel de administração</CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {}
              <div className="space-y-1.5">
                <label htmlFor="email" className="text-sm font-medium">E-mail</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="pl-9"
                    autoComplete="email"
                  />
                </div>
              </div>

              {}
              <div className="space-y-1.5">
                <label htmlFor="password" className="text-sm font-medium">Senha</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="pl-9 pr-10"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading
                  ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Entrando...</>
                  : "Entrar no Painel"
                }
              </Button>
            </form>

            <div className="mt-5 p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground">
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-5">
          <a href="/" className="text-sm text-primary-foreground/75 hover:text-primary-foreground transition-colors">
            ← Voltar ao site
          </a>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;