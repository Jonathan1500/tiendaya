"use client";

import { useState, useCallback } from "react";

export interface CartItem {
  product_id: string;
  nombre: string;
  precio: number;
  cantidad: number;
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = useCallback((product: { id: string; nombre: string; precio: number }) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.product_id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product_id === product.id
            ? { ...i, cantidad: i.cantidad + 1 }
            : i
        );
      }
      return [
        ...prev,
        {
          product_id: product.id,
          nombre: product.nombre,
          precio: product.precio,
          cantidad: 1,
        },
      ];
    });
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.product_id !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, cantidad: number) => {
    if (cantidad <= 0) {
      setItems((prev) => prev.filter((i) => i.product_id !== productId));
      return;
    }
    setItems((prev) =>
      prev.map((i) =>
        i.product_id === productId ? { ...i, cantidad } : i
      )
    );
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const total = items.reduce((sum, i) => sum + i.precio * i.cantidad, 0);
  const itemCount = items.reduce((sum, i) => sum + i.cantidad, 0);

  return { items, addItem, removeItem, updateQuantity, clearCart, total, itemCount };
}
