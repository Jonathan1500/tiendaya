export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          telefono: string | null;
          nombre: string | null;
          rol: "client" | "shopkeeper";
          created_at: string;
        };
        Insert: {
          id: string;
          telefono?: string | null;
          nombre?: string | null;
          rol?: "client" | "shopkeeper";
          created_at?: string;
        };
        Update: {
          id?: string;
          telefono?: string | null;
          nombre?: string | null;
          rol?: "client" | "shopkeeper";
          created_at?: string;
        };
      };
      products: {
        Row: {
          id: string;
          nombre: string;
          descripcion: string | null;
          precio: number;
          imagen_url: string | null;
          categoria: string;
          activo: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          nombre: string;
          descripcion?: string | null;
          precio: number;
          imagen_url?: string | null;
          categoria?: string;
          activo?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          nombre?: string;
          descripcion?: string | null;
          precio?: number;
          imagen_url?: string | null;
          categoria?: string;
          activo?: boolean;
          created_at?: string;
        };
      };
      orders: {
        Row: {
          id: string;
          client_id: string;
          status: "pendiente" | "en_preparacion" | "listo" | "entregado" | "cancelado";
          total: number;
          notas: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          status?: "pendiente" | "en_preparacion" | "listo" | "entregado" | "cancelado";
          total?: number;
          notas?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          status?: "pendiente" | "en_preparacion" | "listo" | "entregado" | "cancelado";
          total?: number;
          notas?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string;
          cantidad: number;
          precio_unitario: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id: string;
          cantidad: number;
          precio_unitario: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          product_id?: string;
          cantidad?: number;
          precio_unitario?: number;
          created_at?: string;
        };
      };
      audit_log: {
        Row: {
          id: string;
          order_id: string;
          actor_id: string;
          action: string;
          old_status: string | null;
          new_status: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          actor_id: string;
          action: string;
          old_status?: string | null;
          new_status?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          actor_id?: string;
          action?: string;
          old_status?: string | null;
          new_status?: string | null;
          created_at?: string;
        };
      };
      access_codes: {
        Row: {
          id: string;
          shopkeeper_id: string;
          code: string;
          client_name: string;
          used: boolean;
          expires_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          shopkeeper_id: string;
          code: string;
          client_name: string;
          used?: boolean;
          expires_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          shopkeeper_id?: string;
          code?: string;
          client_name?: string;
          used?: boolean;
          expires_at?: string;
          created_at?: string;
        };
      };
    };
    Functions: {
      has_active_order: {
        Args: { user_id: string };
        Returns: boolean;
      };
    };
  };
}
