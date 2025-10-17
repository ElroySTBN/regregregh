import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, Package, Send } from "lucide-react";

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
  created_at: string;
}

interface Message {
  id: string;
  telegram_user_id: string;
  telegram_username?: string;
  message_text: string;
  is_from_admin: boolean;
  thread_date: string;
  created_at: string;
}

const Admin = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const { toast } = useToast();

  useEffect(() => {
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
  }, []);

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

    const { error } = await supabase.from('support_messages').insert({
      telegram_user_id: selectedUserId,
      message_text: replyText,
      is_from_admin: true
    });

    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer le message",
        variant: "destructive"
      });
      return;
    }

    // Send via Telegram
    const TELEGRAM_BOT_TOKEN = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
    if (TELEGRAM_BOT_TOKEN) {
      await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: selectedUserId,
          text: `<b>Enrico 🧑‍💼 (Support):</b>\n\n${replyText}`,
          parse_mode: 'HTML'
        })
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-white mb-2">MasterEDU Admin</h1>
          <p className="text-slate-300">Interface de gestion premium</p>
        </div>

        <Tabs defaultValue="messages" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 bg-slate-800 border-slate-700">
            <TabsTrigger value="messages" className="data-[state=active]:bg-blue-600">
              <MessageSquare className="w-4 h-4 mr-2" />
              Messages
            </TabsTrigger>
            <TabsTrigger value="orders" className="data-[state=active]:bg-blue-600">
              <Package className="w-4 h-4 mr-2" />
              Commandes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="messages" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card className="lg:col-span-1 bg-slate-800 border-slate-700 p-4">
                <h3 className="font-semibold text-white mb-4">Conversations</h3>
                <div className="space-y-2">
                  {Object.entries(groupedMessages).map(([userId, userMessages]) => (
                    <button
                      key={userId}
                      onClick={() => setSelectedUserId(userId)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        selectedUserId === userId
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      <div className="font-medium">
                        {userMessages[0].telegram_username || `User ${userId.slice(0, 8)}`}
                      </div>
                      <div className="text-sm opacity-75">
                        {userMessages.length} message(s)
                      </div>
                    </button>
                  ))}
                </div>
              </Card>

              <Card className="lg:col-span-2 bg-slate-800 border-slate-700 p-4">
                {selectedUserId ? (
                  <>
                    <div className="mb-4 space-y-3 max-h-96 overflow-y-auto">
                      {groupedMessages[selectedUserId]?.map((msg) => (
                        <div
                          key={msg.id}
                          className={`p-3 rounded-lg ${
                            msg.is_from_admin
                              ? 'bg-blue-600 ml-auto max-w-[80%]'
                              : 'bg-slate-700 mr-auto max-w-[80%]'
                          }`}
                        >
                          <div className="text-xs text-slate-300 mb-1">
                            {msg.is_from_admin ? 'Vous' : msg.telegram_username || 'Client'}
                          </div>
                          <div className="text-white">{msg.message_text}</div>
                          <div className="text-xs text-slate-400 mt-1">
                            {new Date(msg.created_at).toLocaleString('fr-FR')}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Votre réponse..."
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                      <Button onClick={sendReply} className="bg-blue-600 hover:bg-blue-700">
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-400">
                    Sélectionnez une conversation
                  </div>
                )}
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="orders" className="space-y-4">
            <div className="grid gap-4">
              {orders.map((order) => (
                <Card key={order.id} className="bg-slate-800 border-slate-700 p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-white">{order.order_number}</h3>
                      <p className="text-slate-400">
                        {order.telegram_username || `User ${order.telegram_user_id.slice(0, 8)}`}
                      </p>
                    </div>
                    <Badge className={getStatusColor(order.status)}>
                      {order.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                    <div>
                      <span className="text-slate-400">Sujet:</span>
                      <p className="text-white">{order.subject}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Niveau:</span>
                      <p className="text-white">{order.academic_level}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Pages:</span>
                      <p className="text-white">{order.length_pages}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Prix:</span>
                      <p className="text-white">{order.final_price}€</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateOrderStatus(order.id, 'paid')}
                      className="border-blue-600 text-blue-400 hover:bg-blue-600 hover:text-white"
                    >
                      Marquer payé
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateOrderStatus(order.id, 'in_progress')}
                      className="border-purple-600 text-purple-400 hover:bg-purple-600 hover:text-white"
                    >
                      En cours
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateOrderStatus(order.id, 'completed')}
                      className="border-green-600 text-green-400 hover:bg-green-600 hover:text-white"
                    >
                      Terminé
                    </Button>
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
