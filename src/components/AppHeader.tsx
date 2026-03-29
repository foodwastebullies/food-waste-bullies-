import {
  LogOut,
  Refrigerator,
  User as UserIcon,
  Users as UsersIcon,
} from "lucide-react";
import type { User } from "../types";

interface AppHeaderProps {
  currentUser: User;
  view: "food" | "users";
  onToggleView: () => void;
  onLogout: () => void;
}

export default function AppHeader({
  currentUser,
  view,
  onToggleView,
  onLogout,
}: AppHeaderProps) {
  const isAdmin = currentUser.admin;
  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-stone-200 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="bg-emerald-600 p-1.5 rounded-lg">
          <Refrigerator className="text-white w-5 h-5" />
        </div>
        <h1 className="text-xl font-bold tracking-tight">FridgeShare</h1>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleView}
          className="p-2 hover:bg-stone-100 rounded-full transition-colors text-stone-500"
          title={view === "food" ? "Manage Users" : "View Fridge"}
        >
          {view === "food" && isAdmin ? (
            <UsersIcon className="w-5 h-5" />
          ) : (
            <Refrigerator className="w-5 h-5" />
          )}
        </button>
        <button
          onClick={onLogout}
          className="p-2 hover:bg-stone-100 rounded-full transition-colors text-stone-500"
          title="Logout"
        >
          <LogOut className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 bg-stone-100 px-3 py-1.5 rounded-full">
          <UserIcon className="w-4 h-4 text-stone-500" />
          <span className="text-xs font-bold">{currentUser.name}</span>
        </div>
      </div>
    </header>
  );
}
