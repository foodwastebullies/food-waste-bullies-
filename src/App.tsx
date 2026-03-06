import React, { useState, useEffect, useMemo } from "react";
import { 
  Plus, 
  Search, 
  Trash2, 
  User as UserIcon, 
  Refrigerator, 
  Clock, 
  Utensils, 
  AlertCircle,
  CheckCircle2,
  X,
  Calendar,
  Users as UsersIcon,
  LogOut,
  Shield,
  Hash
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import type { Fridge, FoodItem, User } from "./types";

export default function App() {
  const [fridges, setFridges] = useState<Fridge[]>([]);
  const [items, setItems] = useState<FoodItem[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [view, setView] = useState<'food' | 'users'>('food');
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  // Login state
  const [loginForm, setLoginForm] = useState({ name: "", email: "" });

  // Food Form state
  const [newItem, setNewItem] = useState({
    name: "",
    user_id: "",
    fridge_id: "",
    serving_number: 1,
    expiry_date: "",
    image_url: ""
  });

  // User Form state
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    slack_handle: "",
    role: 'housemate' as 'housemate' | 'food_police',
    admin: false
  });

  useEffect(() => {
    if (currentUser) {
      fetchData();
    }
  }, [currentUser]);

  const fetchData = async () => {
    try {
      const [fRes, iRes, uRes] = await Promise.all([
        fetch("/api/fridges"),
        fetch("/api/food-items"),
        fetch("/api/users")
      ]);
      const [f, i, u] = await Promise.all([fRes.json(), iRes.json(), uRes.json()]);
      setFridges(f);
      setItems(i);
      setUsers(u);
    } catch (err) {
      console.error("Failed to fetch data", err);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginForm)
      });
      if (res.ok) {
        const user = await res.json();
        setCurrentUser(user);
        showNotification(`Welcome back, ${user.name}!`);
      } else {
        showNotification("Invalid credentials", "error");
      }
    } catch (err) {
      showNotification("Login failed", "error");
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setView('food');
  };

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    const userId = newItem.user_id || currentUser?.id;
    if (!userId || !newItem.name || !newItem.fridge_id || !newItem.expiry_date) return;

    const itemData = {
      id: crypto.randomUUID(),
      name: newItem.name,
      user_id: userId,
      image_url: newItem.image_url || `https://picsum.photos/seed/${newItem.name}/400/300`,
      fridge_id: newItem.fridge_id,
      expiry_date: newItem.expiry_date,
      serving_number: newItem.serving_number
    };

    try {
      const res = await fetch("/api/food-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(itemData)
      });
      if (res.ok) {
        showNotification(`Logged ${newItem.name}!`);
        setShowAddItemModal(false);
        setNewItem({ 
          name: "", 
          user_id: "",
          fridge_id: "", 
          serving_number: 1, 
          expiry_date: "", 
          image_url: ""
        });
        fetchData();
      }
    } catch (err) {
      showNotification("Failed to add item", "error");
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newUser, id: crypto.randomUUID() })
      });
      if (res.ok) {
        showNotification(`User ${newUser.name} added!`);
        setShowAddUserModal(false);
        setNewUser({ name: "", email: "", slack_handle: "", role: 'housemate', admin: false });
        fetchData();
      }
    } catch (err) {
      showNotification("Failed to add user", "error");
    }
  };

  const handleClaim = async (id: string, servings: number) => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/food-items/${id}/claim`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ servings, user_id: currentUser.id })
      });
      if (res.ok) {
        showNotification(`Claimed ${servings} serving(s).`);
        fetchData();
      }
    } catch (err) {
      showNotification("Failed to claim item", "error");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    try {
      const res = await fetch(`/api/food-items/${id}`, { method: "DELETE" });
      if (res.ok) {
        showNotification("Item deleted.");
        fetchData();
      }
    } catch (err) {
      showNotification("Failed to delete item", "error");
    }
  };

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
      const key = item.fridge_id;
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });
    return groups;
  }, [filteredItems]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4 font-sans">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-stone-200 p-8 space-y-8"
        >
          <div className="text-center space-y-2">
            <div className="inline-block bg-emerald-600 p-3 rounded-2xl mb-2">
              <Refrigerator className="text-white w-8 h-8" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">FridgeShare</h1>
            <p className="text-stone-500">Sign in to manage the house fridge</p>
            <div className="mt-4 p-3 bg-stone-50 rounded-xl border border-stone-100 text-left">
              <p className="text-[10px] font-bold uppercase text-stone-400 mb-1">Sample Credentials</p>
              <p className="text-xs text-stone-600">Name: <span className="font-mono">Admin User</span></p>
              <p className="text-xs text-stone-600">Email: <span className="font-mono">admin@example.com</span></p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-stone-500">Name</label>
              <input 
                required
                type="text" 
                placeholder="Your name"
                className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                value={loginForm.name}
                onChange={(e) => setLoginForm({...loginForm, name: e.target.value})}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-stone-500">Email</label>
              <input 
                required
                type="email" 
                placeholder="your@email.com"
                className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                value={loginForm.email}
                onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
              />
            </div>
            <button 
              type="submit"
              className="w-full py-4 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 active:scale-[0.98] transition-all shadow-lg shadow-emerald-100"
            >
              Sign In
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans pb-24">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-stone-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-emerald-600 p-1.5 rounded-lg">
            <Refrigerator className="text-white w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">FridgeShare</h1>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setView(view === 'food' ? 'users' : 'food')}
            className="p-2 hover:bg-stone-100 rounded-full transition-colors text-stone-500"
            title={view === 'food' ? 'Manage Users' : 'View Fridge'}
          >
            {view === 'food' ? <UsersIcon className="w-5 h-5" /> : <Refrigerator className="w-5 h-5" />}
          </button>
          <button 
            onClick={handleLogout}
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

      {view === 'food' ? (
        <>
          {/* Search */}
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

          {/* Main Content */}
          <main className="px-4 space-y-8">
            {fridges.map(fridge => {
              const fridgeItems = itemsByFridge[fridge.id] || [];
              if (searchQuery && fridgeItems.length === 0) return null;

              return (
                <section key={fridge.id} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-500 flex items-center gap-2">
                      <Refrigerator className="w-4 h-4" />
                      {fridge.name} {fridge.freezer && "(Freezer)"}
                    </h2>
                    <span className="text-xs font-medium bg-stone-200 text-stone-600 px-2 py-0.5 rounded-full">
                      {fridgeItems.length} items
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {fridgeItems.length > 0 ? (
                      fridgeItems.map(item => (
                        <motion.div 
                          layout
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          key={item.id}
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
                                <div className="flex gap-1">
                                  {currentUser.admin && (
                                    <button 
                                      onClick={() => handleDelete(item.id)}
                                      className="text-stone-300 hover:text-red-500 transition-colors"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
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
                                <div className="flex items-center gap-2 text-xs font-bold text-amber-600">
                                  <Clock className="w-3 h-3" /> <span>Expires: {formatDate(item.expiry_date)}</span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                                {item.serving_number} servings
                              </span>
                              <button 
                                onClick={() => handleClaim(item.id, 1)}
                                className="text-xs font-bold text-white bg-emerald-600 px-3 py-1.5 rounded-lg hover:bg-emerald-700 active:scale-95 transition-all flex items-center gap-1 shadow-sm"
                              >
                                <Utensils className="w-3 h-3" /> Claim
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className="py-6 text-center border-2 border-dashed border-stone-200 rounded-2xl">
                        <p className="text-stone-400 text-sm">Empty</p>
                      </div>
                    )}
                  </div>
                </section>
              );
            })}
          </main>
        </>
      ) : (
        <main className="px-4 py-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Housemates</h2>
            {currentUser.admin && (
              <button 
                onClick={() => setShowAddUserModal(true)}
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
                <div className="text-right">
                  {user.check_out_date && (
                    <p className="text-[10px] text-stone-400">Leaves: {formatDate(user.check_out_date)}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </main>
      )}

      {/* Floating Action Button */}
      {view === 'food' && (
        <button 
          onClick={() => setShowAddItemModal(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-emerald-600 text-white rounded-full shadow-lg shadow-emerald-200 flex items-center justify-center hover:bg-emerald-700 active:scale-90 transition-all z-40"
        >
          <Plus className="w-7 h-7" />
        </button>
      )}

      {/* Add Item Modal */}
      <AnimatePresence>
        {showAddItemModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddItemModal(false)}
              className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="relative w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 space-y-6 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold">Log Food</h2>
                  <button onClick={() => setShowAddItemModal(false)} className="p-2 hover:bg-stone-100 rounded-full">
                    <X className="w-5 h-5 text-stone-400" />
                  </button>
                </div>

                <form onSubmit={handleAddItem} className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-stone-500">Owner</label>
                    <select 
                      required
                      className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                      value={newItem.user_id || currentUser.id}
                      onChange={(e) => setNewItem({...newItem, user_id: e.target.value})}
                    >
                      {users.map(u => (
                        <option key={u.id} value={u.id}>{u.name} {u.id === currentUser.id ? "(You)" : ""}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-stone-500">Food Name</label>
                    <input 
                      required
                      type="text" 
                      placeholder="What are you leaving?"
                      className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                      value={newItem.name}
                      onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase text-stone-500">Expiry Date</label>
                      <input 
                        required
                        type="date" 
                        className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                        value={newItem.expiry_date}
                        onChange={(e) => setNewItem({...newItem, expiry_date: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase text-stone-500">Servings</label>
                      <input 
                        type="number" 
                        min="1"
                        className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                        value={newItem.serving_number}
                        onChange={(e) => setNewItem({...newItem, serving_number: parseInt(e.target.value)})}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-stone-500">Location</label>
                    <select 
                      required
                      className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                      value={newItem.fridge_id}
                      onChange={(e) => setNewItem({...newItem, fridge_id: e.target.value})}
                    >
                      <option value="">Select Location</option>
                      {fridges.map(f => (
                        <option key={f.id} value={f.id}>{f.name} {f.shelf ? `- ${f.shelf}` : ""}</option>
                      ))}
                    </select>
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-4 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 active:scale-[0.98] transition-all shadow-lg shadow-emerald-100"
                  >
                    Log Food Item
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add User Modal */}
      <AnimatePresence>
        {showAddUserModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddUserModal(false)}
              className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="relative w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 space-y-6 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold">Add Housemate</h2>
                  <button onClick={() => setShowAddUserModal(false)} className="p-2 hover:bg-stone-100 rounded-full">
                    <X className="w-5 h-5 text-stone-400" />
                  </button>
                </div>

                <form onSubmit={handleAddUser} className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-stone-500">Full Name</label>
                    <input 
                      required
                      type="text" 
                      placeholder="John Doe"
                      className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                      value={newUser.name}
                      onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-stone-500">Email</label>
                    <input 
                      required
                      type="email" 
                      placeholder="john@example.com"
                      className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                      value={newUser.email}
                      onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-stone-500">Slack Handle</label>
                    <input 
                      type="text" 
                      placeholder="johndoe"
                      className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                      value={newUser.slack_handle}
                      onChange={(e) => setNewUser({...newUser, slack_handle: e.target.value})}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase text-stone-500">Role</label>
                      <select 
                        className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                        value={newUser.role}
                        onChange={(e) => setNewUser({...newUser, role: e.target.value as any})}
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
                        checked={newUser.admin}
                        onChange={(e) => setNewUser({...newUser, admin: e.target.checked})}
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
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Notifications */}
      <AnimatePresence>
        {notification && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 left-4 right-4 z-50"
          >
            <div className={`p-4 rounded-2xl shadow-lg flex items-center gap-3 ${
              notification.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
            }`}>
              {notification.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              <p className="text-sm font-medium">{notification.message}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
