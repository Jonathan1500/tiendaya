-- ============================================
-- Sistema de Pedidos - Miscelánea Guatemala
-- Esquema de base de datos para Supabase
-- ============================================

-- Extensión para teléfonos (opcional, útil para formato)
create extension if not exists "uuid-ossp";

-- ============================================
-- TABLA: profiles
-- ============================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  telefono text unique,
  nombre text,
  rol text not null default 'client' check (rol in ('client', 'shopkeeper')),
  created_at timestamptz not null default now()
);

-- RLS: Los usuarios solo ven su propio perfil
alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- ============================================
-- TABLA: products
-- ============================================
create table public.products (
  id uuid primary key default uuid_generate_v4(),
  nombre text not null,
  descripcion text,
  precio numeric(10,2) not null check (precio >= 0),
  imagen_url text,
  categoria text not null default 'general',
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

-- RLS: Cualquiera puede ver productos activos
alter table public.products enable row level security;

create policy "Anyone can view active products"
  on public.products for select
  using (activo = true);

create policy "Shopkeepers can manage products"
  on public.products for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and rol = 'shopkeeper'
    )
  );

-- ============================================
-- TABLA: orders
-- ============================================
create table public.orders (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pendiente'
    check (status in ('pendiente', 'en_preparacion', 'listo', 'entregado', 'cancelado')),
  total numeric(10,2) not null default 0 check (total >= 0),
  notas text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS
alter table public.orders enable row level security;

-- Clientes ven solo sus pedidos
create policy "Clients can view own orders"
  on public.orders for select
  using (auth.uid() = client_id);

-- Tendero ve todos los pedidos
create policy "Shopkeepers can view all orders"
  on public.orders for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and rol = 'shopkeeper'
    )
  );

-- Clientes pueden crear pedidos
create policy "Clients can create orders"
  on public.orders for insert
  with check (auth.uid() = client_id);

-- Solo tendero puede actualizar status
create policy "Shopkeepers can update order status"
  on public.orders for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and rol = 'shopkeeper'
    )
  );

-- ============================================
-- TABLA: order_items
-- ============================================
create table public.order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  cantidad integer not null check (cantidad > 0),
  precio_unitario numeric(10,2) not null check (precio_unitario >= 0),
  created_at timestamptz not null default now()
);

-- RLS
alter table public.order_items enable row level security;

-- Clientes ven items de sus pedidos
create policy "Clients can view own order items"
  on public.order_items for select
  using (
    exists (
      select 1 from public.orders
      where id = order_id and client_id = auth.uid()
    )
  );

-- Tendero ve todos los items
create policy "Shopkeepers can view all order items"
  on public.order_items for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and rol = 'shopkeeper'
    )
  );

-- Clientes pueden insertar items en sus pedidos
create policy "Clients can insert own order items"
  on public.order_items for insert
  with check (
    exists (
      select 1 from public.orders
      where id = order_id and client_id = auth.uid()
    )
  );

-- ============================================
-- TABLA: audit_log
-- ============================================
create table public.audit_log (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references public.orders(id) on delete cascade,
  actor_id uuid not null references public.profiles(id) on delete cascade,
  action text not null,
  old_status text,
  new_status text,
  created_at timestamptz not null default now()
);

-- RLS: Solo tendero puede leer el audit log
alter table public.audit_log enable row level security;

create policy "Shopkeepers can view audit log"
  on public.audit_log for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and rol = 'shopkeeper'
    )
  );

create policy "System can insert audit log"
  on public.audit_log for insert
  with check (true);

-- ============================================
-- TABLA: access_codes (códigos temporales del tendero)
-- ============================================
create table public.access_codes (
  id uuid primary key default uuid_generate_v4(),
  shopkeeper_id uuid not null references public.profiles(id) on delete cascade,
  code text not null,
  client_name text not null,
  used boolean not null default false,
  expires_at timestamptz not null default (now() + interval '30 minutes'),
  created_at timestamptz not null default now()
);

-- RLS
alter table public.access_codes enable row level security;

-- Tendero ve sus propios códigos
create policy "Shopkeepers can view own access codes"
  on public.access_codes for select
  using (auth.uid() = shopkeeper_id);

-- Tendero puede crear códigos
create policy "Shopkeepers can create access codes"
  on public.access_codes for insert
  with check (auth.uid() = shopkeeper_id);

-- Tendero puede actualizar sus códigos (marcar como usado)
create policy "Shopkeepers can update own access codes"
  on public.access_codes for update
  using (auth.uid() = shopkeeper_id);

-- Cualquiera puede leer códigos válidos (para login del cliente)
create policy "Anyone can read valid access codes"
  on public.access_codes for select
  using (used = false and expires_at > now());

-- ============================================
-- FUNCIONES Y TRIGGERS
-- ============================================

-- Función para actualizar updated_at automáticamente
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger para orders
create trigger set_updated_at
  before update on public.orders
  for each row
  execute function public.handle_updated_at();

-- Función para crear perfil automáticamente al registrarse
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, telefono, nombre, rol)
  values (
    new.id,
    new.phone,
    coalesce(new.raw_user_meta_data ->> 'nombre', ''),
    coalesce(new.raw_user_meta_data ->> 'rol', 'client')
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger para crear perfil al crear usuario
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- Función para validar un pedido activo por cliente
create or replace function public.has_active_order(user_id uuid)
returns boolean as $$
declare
  has_active boolean;
begin
  select exists(
    select 1 from public.orders
    where client_id = user_id
    and status in ('pendiente', 'en_preparacion')
  ) into has_active;
  return has_active;
end;
$$ language plpgsql security definer;

-- ============================================
-- DATOS INICIALES (productos de ejemplo)
-- ============================================
insert into public.products (nombre, descripcion, precio, categoria, imagen_url) values
-- Bebidas
('Coca-Cola 600ml', 'Refresco de cola 600ml', 8.00, 'Bebidas', '/products/coca-cola.svg'),
('Agua Purificada 600ml', 'Agua purificada botella 600ml', 5.00, 'Bebidas', '/products/agua.svg'),
('Jugo Del Valle 400ml', 'Jugo de frutas various 400ml', 7.50, 'Bebidas', '/products/jugo.svg'),
('Cerveza Gallo 330ml', 'Cerveza nacional 330ml', 12.00, 'Bebidas', '/products/cerveza.svg'),
('Café Negro', 'Café de olla tradicional', 6.00, 'Bebidas', '/products/cafe.svg'),
('Té Helado', 'Té helado.botella 500ml', 7.00, 'Bebidas', null),

-- Snacks
('Chips Jalapeño 170g', 'Papas fritas sabor jalapeño', 15.00, 'Snacks', '/products/chips.svg'),
('Gansito 65g', 'Pastelito de mermelada', 5.50, 'Snacks', '/products/gansito.svg'),
('Gomitas Regaliz 100g', 'Dulces de regaliz blandos', 8.00, 'Snacks', '/products/gomitas.svg'),
('Pulparindo 24g', 'Dulce de tamarindo picosito', 3.50, 'Snacks', '/products/pulparindo.svg'),
('Takis Fuego 290g', 'Tortillas de maíz sabor fuego', 18.00, 'Snacks', '/products/takis.svg'),

-- Abarrotes
('Jabón Dove 100g', 'Jabón de tocador suave', 12.00, 'Abarrotes', '/products/jabon.svg'),
('Papel Higiénico 4 rollos', 'Papel higiénico doble hoja', 15.00, 'Abarrotes', '/products/papel.svg'),
('Aceite Vegetal 1L', 'Aceite vegetal refinado', 28.00, 'Abarrotes', '/products/aceite.svg'),
('Arroz 1kg', 'Arroz grano largo', 18.00, 'Abarrotes', '/products/arroz.svg'),
('Frijol Negro 500g', 'Frijol negro importado', 15.00, 'Abarrotes', '/products/frijol.svg'),

-- Electrónica
('Pilas AA 4 pack', 'Pilas alcalinas AA', 20.00, 'Electrónica', '/products/pilas.svg'),
('Cable USB-C 1m', 'Cable de carga rápido', 35.00, 'Electrónica', '/products/cable.svg'),
('Audífonos Básicos', 'Audífonos con cable 3.5mm', 45.00, 'Electrónica', '/products/audifonos.svg'),
('Cargador Portátil 5000mAh', 'Power bank compacto', 85.00, 'Electrónica', '/products/cargador.svg');
