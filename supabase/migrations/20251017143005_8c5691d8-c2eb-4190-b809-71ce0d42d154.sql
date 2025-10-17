-- Create enum for academic levels
CREATE TYPE academic_level AS ENUM ('college', 'highschool', 'university', 'master', 'phd');

-- Create enum for order status
CREATE TYPE order_status AS ENUM ('pending', 'paid', 'in_progress', 'review', 'completed', 'cancelled');

-- Create enum for urgency levels
CREATE TYPE urgency_level AS ENUM ('ultra_express', 'express', 'urgent', 'rapid', 'standard', 'economic');

-- Create orders table
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  telegram_user_id TEXT NOT NULL,
  telegram_username TEXT,
  subject TEXT NOT NULL,
  academic_level academic_level NOT NULL,
  length_pages INTEGER NOT NULL,
  urgency urgency_level NOT NULL,
  base_price DECIMAL(10,2) NOT NULL,
  urgency_multiplier DECIMAL(3,1) NOT NULL,
  final_price DECIMAL(10,2) NOT NULL,
  status order_status DEFAULT 'pending',
  payment_crypto_type TEXT,
  payment_address TEXT,
  session_token TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create messages table for support system
CREATE TABLE support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_user_id TEXT NOT NULL,
  telegram_username TEXT,
  message_text TEXT NOT NULL,
  is_from_admin BOOLEAN DEFAULT false,
  thread_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create telegram users table
CREATE TABLE telegram_users (
  telegram_user_id TEXT PRIMARY KEY,
  username TEXT,
  first_name TEXT,
  last_name TEXT,
  first_seen_at TIMESTAMPTZ DEFAULT now(),
  last_interaction_at TIMESTAMPTZ DEFAULT now()
);

-- Create conversation state table for navigation stack
CREATE TABLE conversation_state (
  telegram_user_id TEXT PRIMARY KEY,
  current_step TEXT NOT NULL,
  navigation_stack JSONB DEFAULT '[]',
  order_draft JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE telegram_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_state ENABLE ROW LEVEL SECURITY;

-- Create policies for orders (admin access only for now)
CREATE POLICY "Enable read access for all users" ON orders FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON orders FOR UPDATE USING (true);

-- Create policies for support messages
CREATE POLICY "Enable read access for all users" ON support_messages FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON support_messages FOR INSERT WITH CHECK (true);

-- Create policies for telegram users
CREATE POLICY "Enable read access for all users" ON telegram_users FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON telegram_users FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON telegram_users FOR UPDATE USING (true);

-- Create policies for conversation state
CREATE POLICY "Enable all access for all users" ON conversation_state FOR ALL USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversation_state_updated_at BEFORE UPDATE ON conversation_state
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_orders_telegram_user_id ON orders(telegram_user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_support_messages_telegram_user_id ON support_messages(telegram_user_id);
CREATE INDEX idx_support_messages_thread_date ON support_messages(thread_date);
CREATE INDEX idx_support_messages_created_at ON support_messages(created_at DESC);