import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, Package, Send, LogOut, Bell } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";

interface Order {
  id: string;
  order_number: string;
  telegram_user_id: string;
  telegram_username?: string;
  subject: string;
  academic_level: string;
  length_pages: number;
  urgency: string;
  final_price: number;
  status: string;
  payment_proof_url?: string;
  created_at: string;
}

interface Message {
  id: string;
  telegram_user_id: string;
  telegram_username?: string;
  message_text: string;
  is_from_admin: boolean;
  admin_name?: string;
  thread_date: string;
  created_at: string;
}

const Admin = () => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const { toast } = useToast();
  const { permission, requestPermission, isSupported } = useNotifications();

  useEffect(() => {
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (isAdmin) {
      loadOrders();
      loadMessages();

      // Subscribe to new messages
      const channel = supabase
        .channel('support_messages_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'support_messages'
          },
          () => {
            loadMessages();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [isAdmin]);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      // Check if user has admin role
      const { data: roleData, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (error || !roleData) {
        toast({
          variant: "destructive",
          title: "Accès refusé",
          description: "Vous n'avez pas les permissions nécessaires",
        });
        await supabase.auth.signOut();
        navigate("/auth");
        return;
      }

      setIsAdmin(true);
    } catch (error) {
      console.error("Auth check error:", error);
      navigate("/auth");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const loadOrders = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading orders:', error);
      return;
    }

    setOrders(data || []);
  };

  const loadMessages = async () => {
    const { data, error } = await supabase
      .from('support_messages')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading messages:', error);
      return;
    }

    setMessages(data || []);
  };

  const sendReply = async () => {
    if (!selectedUserId || !replyText.trim()) return;

    // Send via edge function to Telegram
    const { error: funcError } = await supabase.functions.invoke('send-admin-message', {
      body: {
        telegram_user_id: selectedUserId,
        message_text: replyText,
        admin_name: 'Enrico'
      }
    });

    if (funcError) {
      toast({
        title: "Erreur Telegram",
        description: "Impossible d'envoyer le message sur Telegram",
        variant: "destructive"
      });
      return;
    }

    // Save to database
    const { error } = await supabase.from('support_messages').insert({
      telegram_user_id: selectedUserId,
      message_text: replyText,
      is_from_admin: true,
      admin_name: 'Enrico'
    });

    if (error) {
      toast({
        title: "Erreur",
        description: "Message envoyé sur Telegram mais pas sauvegardé",
        variant: "destructive"
      });
    }

    setReplyText("");
    toast({
      title: "Message envoyé",
      description: "Votre réponse a été envoyée avec succès"
    });

    loadMessages();
  };

  const updateOrderStatus = async (orderId: string, newStatus: 'pending' | 'paid' | 'in_progress' | 'review' | 'completed' | 'cancelled') => {
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId);

    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Statut mis à jour",
      description: "Le statut de la commande a été mis à jour"
    });

    loadOrders();
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-500',
      paid: 'bg-blue-500',
      in_progress: 'bg-purple-500',
      review: 'bg-orange-500',
      completed: 'bg-green-500',
      cancelled: 'bg-red-500'
    };
    return colors[status] || 'bg-gray-500';
  };

  const groupedMessages = messages.reduce((acc, msg) => {
    if (!acc[msg.telegram_user_id]) {
      acc[msg.telegram_user_id] = [];
    }
    acc[msg.telegram_user_id].push(msg);
    return acc;
  }, {} as Record<string, Message[]>);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-slate-400">Vérification des permissions...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-white">Admin FlashGrade</h1>
            <p className="text-slate-400 text-sm">Gestion des commandes et support</p>
          </div>
          <div className="flex gap-2">
            {isSupported && permission !== 'granted' && (
              <Button 
                onClick={requestPermission}
                variant="outline"
                className="bg-blue-600 hover:bg-blue-700 text-white border-blue-500"
              >
                <Bell className="w-4 h-4 mr-2" />
                🔔 Activer les notifications
              </Button>
            )}
            <Button 
              onClick={handleLogout}
              variant="outline"
              className="bg-slate-800 hover:bg-slate-700 text-white border-slate-600"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Déconnexion
            </Button>
          </div>
        </div>

        <Tabs defaultValue="messages" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 bg-slate-800 border-slate-700">
            <TabsTrigger value="messages" className="data-[state=active]:bg-blue-600">
              <MessageSquare className="w-4 h-4 mr-2" />
              Support ({Object.keys(groupedMessages).length})
            </TabsTrigger>
            <TabsTrigger value="orders" className="data-[state=active]:bg-blue-600">
              <Package className="w-4 h-4 mr-2" />
              Commandes ({orders.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="messages" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              <Card className="lg:col-span-1 bg-slate-800 border-slate-700 p-4 max-h-[calc(100vh-240px)] overflow-y-auto">
                <h3 className="font-semibold text-white mb-3 sticky top-0 bg-slate-800 pb-2">
                  Conversations actives
                </h3>
                <div className="space-y-2">
                  {Object.entries(groupedMessages)
                    .sort(([, a], [, b]) => 
                      new Date(b[0].created_at).getTime() - new Date(a[0].created_at).getTime()
                    )
                    .map(([userId, userMessages]) => {
                      const lastMsg = userMessages[0];
                      const hasNewMsg = !lastMsg.is_from_admin;
                      
                      return (
                        <button
                          key={userId}
                          onClick={() => setSelectedUserId(userId)}
                          className={`w-full text-left p-3 rounded-lg transition-all ${
                            selectedUserId === userId
                              ? 'bg-blue-600 text-white shadow-lg'
                              : hasNewMsg
                              ? 'bg-slate-700 text-white border-l-4 border-blue-500'
                              : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-1">
                            <div className="font-medium text-sm truncate">
                              {userMessages[0].telegram_username ? (
                                <span>@{userMessages[0].telegram_username}</span>
                              ) : (
                                `User ${userId.slice(0, 8)}`
                              )}
                            </div>
                            {hasNewMsg && selectedUserId !== userId && (
                              <span className="bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                                Nouveau
                              </span>
                            )}
                          </div>
                          <div className="text-xs opacity-70 truncate">
                            {lastMsg.message_text.substring(0, 40)}...
                          </div>
                          <div className="text-xs opacity-50 mt-1">
                            {new Date(lastMsg.created_at).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </button>
                      );
                    })}
                </div>
              </Card>

              <Card className="lg:col-span-3 bg-slate-800 border-slate-700 p-4 flex flex-col max-h-[calc(100vh-240px)]">
                {selectedUserId ? (
                  <>
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-700">
                      <div>
                        <h3 className="font-semibold text-white">
                          {groupedMessages[selectedUserId]?.[0]?.telegram_username ? (
                            <a 
                              href={`https://t.me/${groupedMessages[selectedUserId][0].telegram_username}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:underline text-blue-400"
                            >
                              @{groupedMessages[selectedUserId][0].telegram_username}
                            </a>
                          ) : (
                            <span>User {selectedUserId.slice(0, 8)}</span>
                          )}
                        </h3>
                        <p className="text-xs text-slate-400">
                          {groupedMessages[selectedUserId]?.length} message(s)
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto space-y-3 mb-4">
                      {groupedMessages[selectedUserId]
                        ?.slice()
                        .reverse()
                        .map((msg) => (
                          <div
                            key={msg.id}
                            className={`flex ${msg.is_from_admin ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[75%] p-3 rounded-lg ${
                                msg.is_from_admin
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-slate-700 text-white'
                              }`}
                            >
                              <div className="text-xs opacity-75 mb-1">
                                {msg.is_from_admin 
                                  ? `Support ${msg.admin_name ? `- ${msg.admin_name}` : ''}` 
                                  : msg.telegram_username || 'Client'}
                              </div>
                              <div className="text-sm whitespace-pre-wrap">{msg.message_text}</div>
                              <div className="text-xs opacity-60 mt-1">
                                {new Date(msg.created_at).toLocaleTimeString('fr-FR', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                    
                    <div className="space-y-2">
                      <Textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Répondre au client..."
                        className="bg-slate-700 border-slate-600 text-white resize-none"
                        rows={3}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            sendReply();
                          }
                        }}
                      />
                      <Button 
                        onClick={sendReply} 
                        className="w-full bg-blue-600 hover:bg-blue-700"
                        disabled={!replyText.trim()}
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Envoyer sur Telegram
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-slate-400">
                    <div className="text-center">
                      <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p>Sélectionnez une conversation</p>
                    </div>
                  </div>
                )}
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="orders" className="space-y-4">
            <div className="grid gap-3">
              {orders
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .map((order) => (
                <Card key={order.id} className="bg-slate-800 border-slate-700 p-4 hover:border-slate-600 transition-colors">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-bold text-white">{order.order_number}</h3>
                            <Badge className={getStatusColor(order.status)}>
                              {order.status}
                            </Badge>
                            {order.payment_proof_url && (
                              <a
                                href={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/payment-proofs/${order.payment_proof_url}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded"
                              >
                                📷 Voir preuve
                              </a>
                            )}
                          </div>
                          <p className="text-sm text-slate-400">
                            {order.telegram_username ? (
                              <a 
                                href={`https://t.me/${order.telegram_username}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:underline text-blue-400"
                              >
                                @{order.telegram_username}
                              </a>
                            ) : (
                              <span className="text-slate-500">ID: {order.telegram_user_id}</span>
                            )}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-white">{order.final_price}€</div>
                          <div className="text-xs text-slate-400">
                            {new Date(order.created_at).toLocaleDateString('fr-FR')}
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                        <div className="bg-slate-700/50 p-2 rounded">
                          <span className="text-slate-400 text-xs">Sujet</span>
                          <p className="text-white font-medium truncate">{order.subject}</p>
                        </div>
                        <div className="bg-slate-700/50 p-2 rounded">
                          <span className="text-slate-400 text-xs">Niveau</span>
                          <p className="text-white font-medium">{order.academic_level}</p>
                        </div>
                        <div className="bg-slate-700/50 p-2 rounded">
                          <span className="text-slate-400 text-xs">Pages</span>
                          <p className="text-white font-medium">{order.length_pages}</p>
                        </div>
                        <div className="bg-slate-700/50 p-2 rounded">
                          <span className="text-slate-400 text-xs">Urgence</span>
                          <p className="text-white font-medium text-xs">{order.urgency}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap lg:flex-col gap-2 lg:w-48">
                      {order.status === 'pending' && (
                        <Button
                          size="sm"
                          onClick={() => updateOrderStatus(order.id, 'paid')}
                          className="flex-1 bg-blue-600 hover:bg-blue-700"
                        >
                          ✓ Marquer payé
                        </Button>
                      )}
                      {order.status === 'paid' && (
                        <Button
                          size="sm"
                          onClick={() => updateOrderStatus(order.id, 'in_progress')}
                          className="flex-1 bg-purple-600 hover:bg-purple-700"
                        >
                          ⚡ Démarrer
                        </Button>
                      )}
                      {order.status === 'in_progress' && (
                        <Button
                          size="sm"
                          onClick={() => updateOrderStatus(order.id, 'completed')}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          ✓ Terminer
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedUserId(order.telegram_user_id);
                          const tabsTrigger = document.querySelector('[value="messages"]') as HTMLButtonElement;
                          tabsTrigger?.click();
                        }}
                        className="flex-1 border-slate-600 bg-black text-white hover:bg-slate-900"
                      >
                        💬 Contacter
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
