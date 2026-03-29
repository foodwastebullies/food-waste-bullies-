import { useState } from "react";
import { Hash, Pencil, Plus, Shield, Trash2, User as UserIcon } from "lucide-react";
import AddUserModal from "../components/AddUserModal";
import EditUserModal from "../components/EditUserModal";
import { formatDate } from "../utils";
import type { NewUser, UpdateUser, User } from "../types";

interface UsersPageProps {
  users: User[];
  currentUser: User;
  onAddUser: (user: NewUser) => Promise<boolean>;
  onUpdateUser: (id: string, data: UpdateUser) => Promise<boolean>;
  onDeleteUser: (id: string, name: string) => void;
}

export default function UsersPage({ users, currentUser, onAddUser, onUpdateUser, onDeleteUser }: UsersPageProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  return (
    <main className="px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Housemates</h2>
        {currentUser.admin && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold text-sm shadow-lg shadow-emerald-100"
          >
            <Plus className="w-4 h-4" /> Add User
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4">
        {users.map(user => (
          <div key={user.id} className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center text-stone-400">
                <UserIcon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold flex items-center gap-2">
                  {user.name}
                  {user.admin && <Shield className="w-3 h-3 text-emerald-600" />}
                </h3>
                <p className="text-xs text-stone-500">{user.email}</p>
                <div className="flex gap-2 mt-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded">
                    {user.role.replace('_', ' ')}
                  </span>
                  {user.slack_handle && (
                    <span className="text-[10px] font-bold text-stone-400 flex items-center gap-0.5">
                      <Hash className="w-2 h-2" />{user.slack_handle}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                {user.check_in_date && (
                  <p className="text-[10px] text-stone-400">Arrives: {formatDate(user.check_in_date)}</p>
                )}
                {user.check_out_date && (
                  <p className="text-[10px] text-stone-400">Leaves: {formatDate(user.check_out_date)}</p>
                )}
              </div>
              {currentUser.admin && (
                <div className="flex gap-1">
                  <button
                    onClick={() => setEditingUser(user)}
                    className="p-2 text-stone-400 hover:text-emerald-600 hover:bg-stone-100 rounded-lg transition-colors"
                    title="Edit user"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDeleteUser(user.id, user.name)}
                    className="p-2 text-stone-400 hover:text-red-500 hover:bg-stone-100 rounded-lg transition-colors"
                    title="Delete user"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {showAddModal && (
        <AddUserModal
          onClose={() => setShowAddModal(false)}
          onSubmit={onAddUser}
        />
      )}

      {editingUser && (
        <EditUserModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSubmit={onUpdateUser}
        />
      )}
    </main>
  );
}
