import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { 
  Mail, 
  MessageCircle, 
  Facebook, 
  Copy, 
  Link,
  Twitter,
  Instagram
} from "lucide-react";
import { useState } from "react";

interface ShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accommodationName: string;
  accommodationUrl: string;
}

export const ShareModal = ({ open, onOpenChange, accommodationName, accommodationUrl }: ShareModalProps) => {
  const [email, setEmail] = useState("");
  
  const shareText = `Confira esta hospedagem incrível: ${accommodationName}`;
  const fullUrl = `${window.location.origin}${accommodationUrl}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      toast.success("Link copiado para a área de transferência!");
    } catch (error) {
      toast.error("Erro ao copiar link");
    }
  };

  const handleEmailShare = () => {
    if (!email) {
      toast.error("Por favor, insira um email válido");
      return;
    }
    
    const subject = encodeURIComponent(`Confira esta hospedagem: ${accommodationName}`);
    const body = encodeURIComponent(
      `Olá!\n\nEncontrei esta hospedagem incrível e pensei que você poderia gostar:\n\n${accommodationName}\n\nConfira em: ${fullUrl}\n\nAbraços!`
    );
    
    const mailtoUrl = `mailto:${email}?subject=${subject}&body=${body}`;
    window.open(mailtoUrl, '_blank');
    
    toast.success("Email de compartilhamento aberto!");
    setEmail("");
  };

  const handleWhatsAppShare = () => {
    const message = encodeURIComponent(
      `${shareText}\n\nConfira em: ${fullUrl}`
    );
    const whatsappUrl = `https://wa.me/?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleFacebookShare = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullUrl)}&quote=${encodeURIComponent(shareText)}`;
    window.open(facebookUrl, '_blank', 'width=600,height=400');
  };

  const handleTwitterShare = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(fullUrl)}`;
    window.open(twitterUrl, '_blank', 'width=600,height=400');
  };

  const handleInstagramShare = () => {
    // Instagram não permite compartilhamento direto de links via URL
    // Vamos copiar o link e orientar o usuário
    handleCopyLink();
    toast.info("Link copiado! Cole no Instagram Stories ou posts.");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link className="h-5 w-5" />
            Compartilhar Hospedagem
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Link direto */}
          <div className="space-y-2">
            <Label>Link direto</Label>
            <div className="flex gap-2">
              <Input 
                value={fullUrl} 
                readOnly 
                className="flex-1"
              />
              <Button 
                variant="outline" 
                size="icon"
                onClick={handleCopyLink}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Separator />

          {/* Redes sociais */}
          <div className="space-y-3">
            <Label>Compartilhar em redes sociais</Label>
            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                className="flex items-center gap-2 h-12"
                onClick={handleWhatsAppShare}
              >
                <MessageCircle className="h-5 w-5 text-green-600" />
                WhatsApp
              </Button>
              
              <Button 
                variant="outline" 
                className="flex items-center gap-2 h-12"
                onClick={handleFacebookShare}
              >
                <Facebook className="h-5 w-5 text-blue-600" />
                Facebook
              </Button>
              
              <Button 
                variant="outline" 
                className="flex items-center gap-2 h-12"
                onClick={handleTwitterShare}
              >
                <Twitter className="h-5 w-5 text-blue-400" />
                Twitter
              </Button>
              
              <Button 
                variant="outline" 
                className="flex items-center gap-2 h-12"
                onClick={handleInstagramShare}
              >
                <Instagram className="h-5 w-5 text-pink-600" />
                Instagram
              </Button>
            </div>
          </div>

          <Separator />

          {/* Compartilhar por email */}
          <div className="space-y-3">
            <Label>Enviar por email</Label>
            <div className="flex gap-2">
              <Input 
                type="email"
                placeholder="email@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1"
              />
              <Button 
                onClick={handleEmailShare}
                className="flex items-center gap-2"
              >
                <Mail className="h-4 w-4" />
                Enviar
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};