import React, { useState } from "react";
import Modal from "./Modal";
import type { Fridge, NewFoodItem, Shelf, User } from "../types";

interface AddFoodModalProps {
  currentUser: User;
  users: User[];
  fridges: Fridge[];
  shelves: Shelf[];
  onClose: () => void;
  onSubmit: (item: NewFoodItem) => Promise<boolean>;
}

const emptyForm = {
  name: "",
  user_id: "",
  shelf_id: "",
  serving_number: 1,
  expiry_date: "",
  image_url: "",
};

export default function AddFoodModal({ currentUser, users, fridges, shelves, onClose, onSubmit }: AddFoodModalProps) {
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);

  const isValid = !!(form.name.trim() && form.expiry_date && form.shelf_id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const userId = form.user_id || currentUser.id;
    if (!userId || !form.name || !form.shelf_id || !form.expiry_date) return;

    const item: NewFoodItem = {
      id: crypto.randomUUID(),
      name: form.name,
      user_id: userId,
      image_url: form.image_url || `https://picsum.photos/seed/${form.name}/400/300`,
      shelf_id: form.shelf_id,
      expiry_date: form.expiry_date,
      serving_number: form.serving_number,
    };

    setLoading(true);
    const success = await onSubmit(item);
    setLoading(false);
    if (success) {
      setForm(emptyForm);
      onClose();
    }
  };

  return (
    <Modal title="Log Food" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-5">
        {currentUser.admin ? (
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase text-stone-500">Owner</label>
            <select
              required
              className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
              value={form.user_id || currentUser.id}
              onChange={(e) => setForm({ ...form, user_id: e.target.value })}
            >
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.name}{u.id === currentUser.id ? " (You)" : ""}</option>
              ))}
            </select>
          </div>
        ) : (
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase text-stone-500">Owner</label>
            <div className="w-full px-4 py-3 bg-stone-100 border border-stone-200 rounded-xl text-stone-600 text-sm">
              {currentUser.name} (You)
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase text-stone-500">Food Name</label>
          <input
            required
            type="text"
            placeholder="What are you leaving?"
            className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase text-stone-500">Expiry Date</label>
            <input
              required
              type="date"
              className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
              value={form.expiry_date}
              onChange={(e) => setForm({ ...form, expiry_date: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase text-stone-500">Servings</label>
            <input
              type="number"
              min="1"
              className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
              value={form.serving_number}
              onChange={(e) => setForm({ ...form, serving_number: parseInt(e.target.value) })}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase text-stone-500">Location</label>
          <select
            required
            className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
            value={form.shelf_id}
            onChange={(e) => setForm({ ...form, shelf_id: e.target.value })}
          >
            <option value="">Select Shelf</option>
            {fridges.map(fridge => (
              <optgroup key={fridge.id} label={fridge.name}>
                {shelves.filter(s => s.fridge_id === fridge.id).map(shelf => (
                  <option key={shelf.id} value={shelf.id}>
                    {shelf.name}{shelf.freezer ? " (Freezer)" : ""}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={!isValid || loading}
          className="w-full py-4 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 active:scale-[0.98] transition-all shadow-lg shadow-emerald-100 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              Logging...
            </>
          ) : "Log Food Item"}
        </button>
      </form>
    </Modal>
  );
}
