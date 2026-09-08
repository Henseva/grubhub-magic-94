-- ENUMS
CREATE TYPE public.app_role AS ENUM ('cliente', 'entregador', 'admin');
CREATE TYPE public.order_status AS ENUM ('criado', 'preparando', 'saiu_para_entrega', 'entregue', 'cancelado');

-- PROFILES
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  phone text,
  avatar_url text,
  cep text,
  street text,
  number text,
  neighborhood text,
  complement text,
  city text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- USER ROLES
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'cliente',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Auto-create profile + default role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'phone')
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'cliente')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- PRODUCTS
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  price numeric(10,2) NOT NULL CHECK (price >= 0),
  original_price numeric(10,2),
  image_url text,
  icon text NOT NULL DEFAULT '🛒',
  category text NOT NULL,
  section_id text NOT NULL,
  weight text NOT NULL DEFAULT '',
  tags text[] NOT NULL DEFAULT '{}',
  nutritional_tip text,
  storage_tip text,
  is_available boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.products TO anon;
GRANT SELECT ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Products are public" ON public.products FOR SELECT TO anon, authenticated USING (is_available);
CREATE POLICY "Admins manage products" ON public.products FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ORDERS
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  courier_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status public.order_status NOT NULL DEFAULT 'criado',
  customer_name text NOT NULL DEFAULT '',
  customer_phone text NOT NULL DEFAULT '',
  delivery_address text NOT NULL,
  delivery_date text,
  delivery_period text,
  subtotal numeric(10,2) NOT NULL DEFAULT 0,
  delivery_fee numeric(10,2) NOT NULL DEFAULT 0,
  discount numeric(10,2) NOT NULL DEFAULT 0,
  total numeric(10,2) NOT NULL DEFAULT 0,
  coupon_code text,
  payment_method text NOT NULL DEFAULT 'pix',
  change_for text,
  delivery_code text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Customers read own orders" ON public.orders FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Couriers read assigned orders" ON public.orders FOR SELECT TO authenticated USING (auth.uid() = courier_id);
CREATE POLICY "Admins read all orders" ON public.orders FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Customers create own orders" ON public.orders FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Customers update own orders" ON public.orders FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Couriers update assigned orders" ON public.orders FOR UPDATE TO authenticated USING (auth.uid() = courier_id);
CREATE POLICY "Admins update orders" ON public.orders FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ORDER ITEMS
CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  product_slug text,
  name text NOT NULL,
  icon text NOT NULL DEFAULT '🛒',
  image_url text,
  price numeric(10,2) NOT NULL,
  qty integer NOT NULL CHECK (qty > 0),
  notes text
);
GRANT SELECT, INSERT ON public.order_items TO authenticated;
GRANT ALL ON public.order_items TO service_role;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read items of visible orders" ON public.order_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND (o.user_id = auth.uid() OR o.courier_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))));
CREATE POLICY "Insert items in own orders" ON public.order_items FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid()));

-- COURIER LOCATIONS (realtime)
CREATE TABLE public.courier_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  courier_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  heading double precision,
  speed double precision,
  progress integer,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_courier_locations_order ON public.courier_locations (order_id, created_at DESC);
GRANT SELECT, INSERT ON public.courier_locations TO authenticated;
GRANT ALL ON public.courier_locations TO service_role;
ALTER TABLE public.courier_locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read locations of visible orders" ON public.courier_locations FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND (o.user_id = auth.uid() OR o.courier_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))));
CREATE POLICY "Couriers insert own locations" ON public.courier_locations FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = courier_id AND EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.courier_id = auth.uid()));

ALTER TABLE public.courier_locations REPLICA IDENTITY FULL;
ALTER TABLE public.orders REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.courier_locations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;

CREATE INDEX idx_orders_user ON public.orders (user_id, created_at DESC);
CREATE INDEX idx_order_items_order ON public.order_items (order_id);
