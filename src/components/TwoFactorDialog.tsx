import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface TwoFactorDialogProps {
  open: boolean;
  userId: string;
  deviceId: string;
  onVerified: () => void;
  onCancel: () => void;
}

export default function TwoFactorDialog({ 
  open, 
  userId, 
  deviceId, 
  onVerified, 
  onCancel 
}: TwoFactorDialogProps) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleVerify = async () => {
    if (code.length !== 6) {
      toast({
        variant: "destructive",
        title: "Code invalide",
        description: "Le code doit contenir 6 chiffres",
      });
      return;
    }

    setLoading(true);

    try {
      // Verify code in database
      const { data: codeData, error: fetchError } = await supabase
        .from('two_factor_codes')
        .select('*')
        .eq('user_id', userId)
        .eq('device_id', deviceId)
        .eq('code', code)
        .eq('verified', false)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (fetchError || !codeData) {
        toast({
          variant: "destructive",
          title: "Code invalide",
          description: "Le code est incorrect ou expiré",
        });
        setLoading(false);
        return;
      }

      // Mark code as verified
      const { error: updateError } = await supabase
        .from('two_factor_codes')
        .update({ verified: true })
        .eq('id', codeData.id);

      if (updateError) throw updateError;

      // Add device to trusted devices
      const { error: trustError } = await supabase
        .from('trusted_devices')
        .upsert({
          user_id: userId,
          device_id: deviceId,
          last_used_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,device_id',
        });

      if (trustError) throw trustError;

      toast({
        title: "Vérification réussie",
        description: "Cet appareil est maintenant de confiance",
      });

      onVerified();
    } catch (error: any) {
      console.error('Verification error:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message || "Une erreur est survenue",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Vérification en deux étapes</DialogTitle>
          <DialogDescription>
            Un code de vérification a été envoyé sur votre Telegram. Veuillez le saisir ci-dessous.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">Code de vérification</Label>
            <Input
              id="code"
              type="text"
              placeholder="123456"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              maxLength={6}
              autoFocus
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleVerify} disabled={loading || code.length !== 6} className="flex-1">
              {loading ? "Vérification..." : "Vérifier"}
            </Button>
            <Button variant="outline" onClick={onCancel} disabled={loading}>
              Annuler
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}