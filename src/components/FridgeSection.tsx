import { Refrigerator } from "lucide-react";
import FoodItemCard from "./FoodItemCard";
import type { Fridge, FoodItem, User } from "../types";

interface FridgeSectionProps {
  fridge: Fridge;
  items: FoodItem[];
  currentUser: User;
  claimAmounts: Record<string, number>;
  onClaimAmountChange: (itemId: string, amount: number) => void;
  onClaim: (itemId: string, servings: number) => void;
  onDelete: (itemId: string) => void;
}

export default function FridgeSection({
  fridge,
  items,
  currentUser,
  claimAmounts,
  onClaimAmountChange,
  onClaim,
  onDelete,
}: FridgeSectionProps) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-500 flex items-center gap-2">
          <Refrigerator className="w-4 h-4" />
          {fridge.name}
        </h2>
        <span className="text-xs font-medium bg-stone-200 text-stone-600 px-2 py-0.5 rounded-full">
          {items.length} items
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {items.length > 0 ? (
          items.map(item => (
            <div key={item.id}>
              <FoodItemCard
                item={item}
                currentUser={currentUser}
                claimAmount={claimAmounts[item.id] ?? 1}
                onClaimAmountChange={(amount) => onClaimAmountChange(item.id, amount)}
                onClaim={() => onClaim(item.id, claimAmounts[item.id] ?? 1)}
                onDelete={() => onDelete(item.id)}
              />
            </div>
          ))
        ) : (
          <div className="py-6 text-center border-2 border-dashed border-stone-200 rounded-2xl">
            <p className="text-stone-400 text-sm">Empty</p>
          </div>
        )}
      </div>
    </section>
  );
}
