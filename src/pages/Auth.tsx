import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff } from "lucide-react";
import TwoFactorDialog from "@/components/TwoFactorDialog";

// Generate or retrieve device ID
const getDeviceId = () => {
  let deviceId = localStorage.getItem('deviceId');
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem('deviceId', deviceId);
  }
  return deviceId;
};

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [show2FA, setShow2FA] = useState(false);
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is already authenticated
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/admin");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        navigate("/admin");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (!data.user) throw new Error("User not found");

      const deviceId = getDeviceId();

      // Check if device is trusted
      const { data: trustedDevice } = await supabase
        .from('trusted_devices')
        .select('*')
        .eq('user_id', data.user.id)
        .eq('device_id', deviceId)
        .single();

      if (trustedDevice) {
        // Device is trusted, update last_used_at
        await supabase
          .from('trusted_devices')
          .update({ last_used_at: new Date().toISOString() })
          .eq('id', trustedDevice.id);

        toast({
          title: "Connexion réussie",
          description: "Bienvenue sur FlashGrade",
        });
        
        setLoading(false);
        return;
      }

      // Device not trusted, need 2FA
      // First, get telegram_user_id from telegram_users table
      const { data: telegramUser } = await supabase
        .from('telegram_users')
        .select('telegram_user_id')
        .eq('user_id', data.user.id)
        .single();

      if (!telegramUser) {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Aucun compte Telegram lié. Contactez le support.",
        });
        setLoading(false);
        return;
      }

      // Send 2FA code
      const { error: functionError } = await supabase.functions.invoke('send-2fa-code', {
        body: {
          userId: data.user.id,
          deviceId: deviceId,
          telegramUserId: telegramUser.telegram_user_id,
        },
      });

      if (functionError) {
        console.error('Error sending 2FA code:', functionError);
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Impossible d'envoyer le code de vérification",
        });
        setLoading(false);
        return;
      }

      setPendingUserId(data.user.id);
      setShow2FA(true);
      setLoading(false);

    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur de connexion",
        description: error.message,
      });
      setLoading(false);
    }
  };

  const handle2FAVerified = () => {
    setShow2FA(false);
    setPendingUserId(null);
    toast({
      title: "Connexion réussie",
      description: "Bienvenue sur FlashGrade",
    });
  };

  const handle2FACancel = async () => {
    setShow2FA(false);
    setPendingUserId(null);
    // Sign out the user since they didn't complete 2FA
    await supabase.auth.signOut();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">FlashGrade Admin</CardTitle>
          <CardDescription className="text-center">
            Connectez-vous pour accéder au panneau d'administration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@flashgrade.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked as boolean)}
              />
              <Label htmlFor="remember" className="text-sm font-normal cursor-pointer">
                Se souvenir de moi
              </Label>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Connexion..." : "Se connecter"}
            </Button>
          </form>
        </CardContent>
      </Card>
      {pendingUserId && (
        <TwoFactorDialog
          open={show2FA}
          userId={pendingUserId}
          deviceId={getDeviceId()}
          onVerified={handle2FAVerified}
          onCancel={handle2FACancel}
        />
      )}
    </div>
  );
}
