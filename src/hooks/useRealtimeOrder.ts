"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface OrderUpdate {
  id: string;
  status: string;
  updated_at: string;
}

export function useRealtimeOrder(orderId: string | null) {
  const [order, setOrder] = useState<OrderUpdate | null>(null);
  const [status, setStatus] = useState<string>("");

  useEffect(() => {
    if (!orderId) return;

    const supabase = createClient();
    const fetchOrder = async () => {
      const { data } = await supabase
        .from("orders")
        .select("id, status, updated_at")
        .eq("id", orderId)
        .single();

      if (data) {
        setOrder(data);
        setStatus(data.status);
      }
    };

    fetchOrder();

    const channel = supabase
      .channel(`order-${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          const newOrder = payload.new as OrderUpdate;
          setOrder(newOrder);
          setStatus(newOrder.status);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  return { order, status };
}
