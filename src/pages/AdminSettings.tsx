import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Lock, Mail, Shield } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";

export default function AdminSettings() {
  const [loading, setSaving] = useState(false);
  const [form, setForm] = useState({
    current_password: "",
    new_username: "",
    new_password: "",
    confirm_password: "",
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.new_password && form.new_password !== form.confirm_password) {
      toast.error("As senhas não coincidem");
      return;
    }
    if (!form.current_password) {
      toast.error("Informe a senha atual");
      return;
    }
    setSaving(true);
    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch("/api/auth/change-credentials", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          current_password: form.current_password,
          new_username: form.new_username || undefined,
          new_password: form.new_password || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Credenciais atualizadas! Faça login novamente.");
      // Limpar sessão para forçar novo login
      setTimeout(() => {
        localStorage.removeItem("admin_token");
        localStorage.removeItem("user");
        window.location.href = "/admin";
      }, 2000);
    } catch (err: any) {
      toast.error(err.message || "Erro ao atualizar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-lg mx-auto py-8">
        <div className="flex items-center gap-3 mb-8">
          <Shield className="h-7 w-7 text-primary" />
          <h1 className="text-2xl font-bold">Configurações de Segurança</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Alterar Credenciais de Acesso</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <Label className="flex items-center gap-2">
                  <Lock className="h-4 w-4" /> Senha Atual *
                </Label>
                <Input
                  type="password"
                  value={form.current_password}
                  onChange={e => setForm(p => ({ ...p, current_password: e.target.value }))}
                  placeholder="Sua senha atual"
                  required
                />
              </div>

              <div>
                <Label className="flex items-center gap-2">
                  <Mail className="h-4 w-4" /> Novo Email / Usuário
                </Label>
                <Input
                  type="email"
                  value={form.new_username}
                  onChange={e => setForm(p => ({ ...p, new_username: e.target.value }))}
                  placeholder="novo@email.com (deixe em branco para não alterar)"
                />
              </div>

              <div>
                <Label className="flex items-center gap-2">
                  <Lock className="h-4 w-4" /> Nova Senha
                </Label>
                <Input
                  type="password"
                  value={form.new_password}
                  onChange={e => setForm(p => ({ ...p, new_password: e.target.value }))}
                  placeholder="Nova senha (deixe em branco para não alterar)"
                />
              </div>

              <div>
                <Label>Confirmar Nova Senha</Label>
                <Input
                  type="password"
                  value={form.confirm_password}
                  onChange={e => setForm(p => ({ ...p, confirm_password: e.target.value }))}
                  placeholder="Repita a nova senha"
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground text-center mt-4">
          Após salvar, você será redirecionado para o login com as novas credenciais.
        </p>
      </div>
    </AdminLayout>
  );
}
