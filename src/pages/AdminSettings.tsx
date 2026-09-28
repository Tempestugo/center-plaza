import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Lock, Mail, Shield, Type, Clock } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import bgHeroImage from "@/assets/bg-hero-hootel.jpg";

export default function AdminSettings() {
  const [loading, setSaving] = useState(false);
  const [form, setForm] = useState({
    current_password: "",
    new_username: "",
    new_password: "",
    confirm_password: "",
  });

  const [heroFile, setHeroFile] = useState<File | null>(null);
  const [heroPreview, setHeroPreview] = useState<string>(bgHeroImage);
  const [uploadingHero, setUploadingHero] = useState(false);

  // Promo text state
  const [promoText, setPromoText] = useState("");
  const [savingPromo, setSavingPromo] = useState(false);

  const getDefaultPromoText = () => {
    const now = new Date();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    return `Válido até ${lastDay}/${month}`;
  };

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    // Load current promo text
    fetch("/api/settings/promo_text")
      .then(r => r.json())
      .then(d => setPromoText(d.value || ""))
      .catch(() => {});
    // Load current hero image
    fetch("/api/settings/hero_image")
      .then(r => r.json())
      .then(d => { if (d.value) setHeroPreview(d.value); })
      .catch(() => {});
  }, []);

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

  const handleHeroChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setHeroFile(e.target.files[0]);
      setHeroPreview(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleSaveHero = async () => {
    if (!heroFile) return toast.error("Selecione uma imagem de capa");
    setUploadingHero(true);
    try {
      const token = localStorage.getItem("admin_token");
      const formData = new FormData();
      formData.append("image", heroFile);
      const res = await fetch("/api/admin/hero-image", {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Imagem de capa atualizada com sucesso!");
      setHeroFile(null);
    } catch (err: any) {
      toast.error(err.message || "Erro ao atualizar a imagem");
    } finally {
      setUploadingHero(false);
    }
  };

  const handleSavePromo = async () => {
    setSavingPromo(true);
    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch("/api/settings/promo_text", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ value: promoText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Texto promocional atualizado!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar");
    } finally {
      setSavingPromo(false);
    }
  };

  const handleResetPromo = () => {
    setPromoText("");
    toast.info("Texto resetado. O banner usará o cálculo automático (último dia do mês). Clique em 'Salvar' para confirmar.");
  };

  return (
    <AdminLayout>
      <div className="max-w-lg mx-auto py-8">
        <div className="flex items-center gap-3 mb-8">
          <Shield className="h-7 w-7 text-primary" />
          <h1 className="text-2xl font-bold">Configurações</h1>
        </div>

        {/* PROMO TEXT SECTION */}
        <Card className="mb-8 border-amber-200 dark:border-amber-900/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Type className="h-4 w-4 text-amber-600" />
              Texto Promocional do Banner
            </CardTitle>
            <CardDescription className="text-xs">
              Texto exibido no banner principal da homepage. Se deixado em branco, será calculado automaticamente como "Válido até [último dia do mês]".
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="flex items-center gap-2 mb-2">
                <Clock className="h-3.5 w-3.5" /> Texto do Banner
              </Label>
              <Input
                value={promoText}
                onChange={e => setPromoText(e.target.value)}
                placeholder={getDefaultPromoText() + " (automático)"}
                className="text-sm"
              />
              <p className="text-xs text-muted-foreground mt-1.5">
                Valor automático atual: <strong>{getDefaultPromoText()}</strong>
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSavePromo} disabled={savingPromo} className="flex-1 bg-amber-600 hover:bg-amber-700 text-white" size="sm">
                {savingPromo ? "Salvando..." : "Salvar Texto"}
              </Button>
              <Button onClick={handleResetPromo} variant="outline" size="sm">
                Resetar (Automático)
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* HERO IMAGE SECTION */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-base">Imagem de Capa Principal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-4">
              <img 
                src={heroPreview} 
                alt="Preview Capa" 
                className="w-full rounded-md object-cover aspect-video border"
              />
              <Label className="text-muted-foreground text-xs">
                Proporção ideal: 16:9 (1920×1080px)
              </Label>
              <Input type="file" accept="image/*" onChange={handleHeroChange} />
              <Button onClick={handleSaveHero} disabled={!heroFile || uploadingHero}>
                {uploadingHero ? "Salvando..." : "Salvar Nova Capa"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* CREDENTIALS SECTION */}
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
          Após salvar credenciais, você será redirecionado para o login.
        </p>
      </div>
    </AdminLayout>
  );
}
