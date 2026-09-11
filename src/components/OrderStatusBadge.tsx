"use client";

interface OrderStatusBadgeProps {
  status: string;
  size?: "sm" | "md";
}

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  pendiente: { label: "Pendiente", color: "text-yellow-400", bg: "bg-yellow-400/10 border-yellow-400/20" },
  en_preparacion: { label: "En Preparación", color: "text-blue-400", bg: "bg-blue-400/10 border-blue-400/20" },
  listo: { label: "Listo para Recoger", color: "text-green-400", bg: "bg-green-400/10 border-green-400/20" },
  entregado: { label: "Entregado", color: "text-muted", bg: "bg-secondary border-card-border" },
  cancelado: { label: "Cancelado", color: "text-red-400", bg: "bg-red-400/10 border-red-400/20" },
};

export default function OrderStatusBadge({ status, size = "md" }: OrderStatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.pendiente;
  const sizeClasses = size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm";

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${config.color} ${config.bg} ${sizeClasses}`}
    >
      {status === "en_preparacion" && (
        <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
      )}
      {config.label}
    </span>
  );
}
