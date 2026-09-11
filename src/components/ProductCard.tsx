"use client";

interface ProductCardProps {
  id: string;
  nombre: string;
  descripcion: string | null;
  precio: number;
  imagen_url: string | null;
  categoria: string;
  onAdd: (product: { id: string; nombre: string; precio: number }) => void;
}

export default function ProductCard({
  id,
  nombre,
  descripcion,
  precio,
  imagen_url,
  onAdd,
}: ProductCardProps) {
  return (
    <div className="bg-card border border-card-border rounded-xl p-4 hover:border-primary/30 transition-all duration-200 group">
      <div className="aspect-square bg-secondary rounded-lg mb-3 flex items-center justify-center overflow-hidden">
        {imagen_url ? (
          <div className="w-full h-full flex items-center justify-center text-4xl">
            📦
          </div>
        ) : (
          <div className="text-muted text-3xl">📦</div>
        )}
      </div>

      <h3 className="font-semibold text-foreground text-sm leading-tight mb-1 line-clamp-2">
        {nombre}
      </h3>

      {descripcion && (
        <p className="text-muted text-xs mb-2 line-clamp-1">{descripcion}</p>
      )}

      <div className="flex items-center justify-between mt-3">
        <span className="text-lg font-bold text-primary">
          Q{precio.toFixed(2)}
        </span>
        <button
          onClick={() => onAdd({ id, nombre, precio })}
          className="bg-primary text-primary-foreground px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-primary-hover active:scale-95 transition-all"
        >
          + Agregar
        </button>
      </div>
    </div>
  );
}
