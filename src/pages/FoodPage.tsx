import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import AddFoodModal from "../components/AddFoodModal";
import FridgeSection from "../components/FridgeSection";
import type { Fridge, FoodItem, NewFoodItem, Shelf, User } from "../types";

interface FoodPageProps {
  fridges: Fridge[];
  shelves: Shelf[];
  items: FoodItem[];
  users: User[];
  currentUser: User;
  onAddItem: (item: NewFoodItem) => Promise<boolean>;
  onClaim: (itemId: string, servings: number) => Promise<void>;
  onDelete: (itemId: string) => Promise<void>;
}

export default function FoodPage({
  fridges,
  shelves,
  items,
  users,
  currentUser,
  onAddItem,
  onClaim,
  onDelete,
}: FoodPageProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [claimAmounts, setClaimAmounts] = useState<Record<string, number>>({});

  const filteredItems = useMemo(() => {
    return items.filter(item =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.fridge_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.owner_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [items, searchQuery]);

  const itemsByFridge = useMemo(() => {
    const groups: Record<string, FoodItem[]> = {};
    filteredItems.forEach(item => {
      const key = item.fridge_id ?? "";
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });
    return groups;
  }, [filteredItems]);

  const handleClaimAmountChange = (itemId: string, amount: number) => {
    setClaimAmounts(prev => ({ ...prev, [itemId]: amount }));
  };

  const handleClaim = async (itemId: string, servings: number) => {
    await onClaim(itemId, servings);
    setClaimAmounts(prev => { const next = { ...prev }; delete next[itemId]; return next; });
  };

  return (
    <>
      <div className="px-4 py-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            placeholder="Search food, owners, or fridges..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-stone-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none shadow-sm transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <main className="px-4 space-y-8">
        {fridges.map(fridge => {
          const fridgeItems = itemsByFridge[fridge.id] || [];
          if (searchQuery && fridgeItems.length === 0) return null;
          return (
            <div key={fridge.id}>
              <FridgeSection
                fridge={fridge}
                items={fridgeItems}
                currentUser={currentUser}
                claimAmounts={claimAmounts}
                onClaimAmountChange={handleClaimAmountChange}
                onClaim={handleClaim}
                onDelete={onDelete}
              />
            </div>
          );
        })}
      </main>

      <button
        onClick={() => setShowModal(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-emerald-600 text-white rounded-full shadow-lg shadow-emerald-200 flex items-center justify-center hover:bg-emerald-700 active:scale-90 transition-all z-40"
      >
        <Plus className="w-7 h-7" />
      </button>

      {showModal && (
        <AddFoodModal
          currentUser={currentUser}
          users={users}
          fridges={fridges}
          shelves={shelves}
          onClose={() => setShowModal(false)}
          onSubmit={onAddItem}
        />
      )}
    </>
  );
}
