import { Clock, Hash, Refrigerator, Trash2, User as UserIcon, Utensils } from "lucide-react";
import { motion } from "motion/react";
import { formatDate } from "../utils";
import type { FoodItem, User } from "../types";

interface FoodItemCardProps {
  item: FoodItem;
  currentUser: User;
  claimAmount: number;
  onClaimAmountChange: (amount: number) => void;
  onClaim: () => void;
  onDelete: () => void;
}

export default function FoodItemCard({
  item,
  currentUser,
  claimAmount,
  onClaimAmountChange,
  onClaim,
  onDelete,
}: FoodItemCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden flex"
    >
      <div className="w-28 h-28 flex-shrink-0 bg-stone-100">
        <img
          src={item.image_url}
          alt={item.name}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
      </div>
      <div className="flex-1 p-3 flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-start">
            <h3 className="font-bold text-stone-800 leading-tight">{item.name}</h3>
            {currentUser.admin && (
              <button onClick={onDelete} className="text-stone-300 hover:text-red-500 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="space-y-1 mt-1">
            <div className="flex items-center gap-2 text-xs text-stone-500">
              <UserIcon className="w-3 h-3" />
              <span>{item.owner_name}</span>
              {item.owner_slack && (
                <span className="flex items-center gap-0.5 text-[10px] bg-stone-100 px-1 rounded">
                  <Hash className="w-2 h-2" />{item.owner_slack}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-stone-400">
              <Refrigerator className="w-3 h-3" />
              <span>{item.shelf_name}</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-amber-600">
              <Clock className="w-3 h-3" />
              <span>Expires: {formatDate(item.expiry_date)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mt-2">
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
            {item.serving_number} servings
          </span>
          <div className="flex items-center gap-1.5">
            <div className="flex items-center border border-stone-200 rounded-lg overflow-hidden">
              <button
                onClick={() => onClaimAmountChange(Math.max(1, claimAmount - 1))}
                className="px-2 py-1 text-stone-500 hover:bg-stone-100 active:bg-stone-200 transition-colors text-sm font-bold"
              >−</button>
              <span className="px-2 text-xs font-bold text-stone-700 min-w-[1.5rem] text-center">
                {claimAmount}
              </span>
              <button
                onClick={() => onClaimAmountChange(Math.min(item.serving_number, claimAmount + 1))}
                className="px-2 py-1 text-stone-500 hover:bg-stone-100 active:bg-stone-200 transition-colors text-sm font-bold"
              >+</button>
            </div>
            <button
              onClick={onClaim}
              className="text-xs font-bold text-white bg-emerald-600 px-3 py-1.5 rounded-lg hover:bg-emerald-700 active:scale-95 transition-all flex items-center gap-1 shadow-sm"
            >
              <Utensils className="w-3 h-3" /> Claim
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
