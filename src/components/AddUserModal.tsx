import React, { useState } from "react";
import Modal from "./Modal";
import type { NewUser } from "../types";

interface AddUserModalProps {
  onClose: () => void;
  onSubmit: (user: NewUser) => Promise<boolean>;
}

const emptyForm = {
  name: "",
  email: "",
  password: "",
  slack_handle: "",
  role: 'housemate' as 'housemate' | 'food_police',
  admin: false,
  check_in_date: "",
  check_out_date: "",
};

export default function AddUserModal({ onClose, onSubmit }: AddUserModalProps) {
  const [form, setForm] = useState(emptyForm);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const user: NewUser = { id: crypto.randomUUID(), ...form };
    const success = await onSubmit(user);
    if (success) {
      setForm(emptyForm);
      onClose();
    }
  };

  return (
    <Modal title="Add Housemate" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase text-stone-500">Full Name</label>
          <input
            required
            type="text"
            placeholder="John Doe"
            className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase text-stone-500">Email</label>
          <input
            required
            type="email"
            placeholder="john@example.com"
            className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase text-stone-500">Password</label>
          <input
            required
            type="password"
            placeholder="Set a password"
            className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase text-stone-500">Slack Handle</label>
          <input
            type="text"
            placeholder="johndoe"
            className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
            value={form.slack_handle}
            onChange={(e) => setForm({ ...form, slack_handle: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase text-stone-500">Check In Date</label>
            <input
              type="date"
              className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
              value={form.check_in_date}
              onChange={(e) => setForm({ ...form, check_in_date: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase text-stone-500">Check Out Date</label>
            <input
              type="date"
              className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
              value={form.check_out_date}
              onChange={(e) => setForm({ ...form, check_out_date: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase text-stone-500">Role</label>
            <select
              className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value as 'housemate' | 'food_police' })}
            >
              <option value="housemate">Housemate</option>
              <option value="food_police">Food Police</option>
            </select>
          </div>
          <div className="flex items-center gap-2 pt-6">
            <input
              type="checkbox"
              id="isAdmin"
              className="w-5 h-5 rounded border-stone-300 text-emerald-600 focus:ring-emerald-500"
              checked={form.admin}
              onChange={(e) => setForm({ ...form, admin: e.target.checked })}
            />
            <label htmlFor="isAdmin" className="text-sm font-bold text-stone-700">Admin Access</label>
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-4 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 active:scale-[0.98] transition-all shadow-lg shadow-emerald-100"
        >
          Create User
        </button>
      </form>
    </Modal>
  );
}
