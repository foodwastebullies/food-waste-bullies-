import { useState, useEffect } from "react";
import { AnimatePresence } from "motion/react";
import AppHeader from "./components/AppHeader";
import Notification from "./components/Notification";
import LoginPage from "./pages/LoginPage";
import FoodPage from "./pages/FoodPage";
import UsersPage from "./pages/UsersPage";
import type {
  Fridge,
  FoodItem,
  NewFoodItem,
  NewUser,
  UpdateUser,
  Shelf,
  User,
} from "./types";

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem("token"),
  );
  const [view, setView] = useState<"food" | "users">("food");
  const [fridges, setFridges] = useState<Fridge[]>([]);
  const [shelves, setShelves] = useState<Shelf[]>([]);
  const [items, setItems] = useState<FoodItem[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const showNotification = (
    message: string,
    type: "success" | "error" = "success",
  ) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const authFetch = (url: string, options: RequestInit = {}) => {
    return fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers as object),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    }).then((res) => {
      if (res.status === 401) handleLogout();
      return res;
    });
  };

  useEffect(() => {
    if (!token) return;
    fetch("/api/me", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => (res.ok ? res.json() : null))
      .then((user) => {
        if (user) setCurrentUser(user);
        else handleLogout();
      })
      .catch(() => handleLogout());
  }, []);

  useEffect(() => {
    if (currentUser) fetchData();
  }, [currentUser]);

  const fetchData = async () => {
    try {
      const [fRes, sRes, iRes, uRes] = await Promise.all([
        authFetch("/api/fridges"),
        authFetch("/api/shelves"),
        authFetch("/api/food-items"),
        authFetch("/api/users"),
      ]);
      const [f, s, i, u] = await Promise.all([
        fRes.json(),
        sRes.json(),
        iRes.json(),
        uRes.json(),
      ]);
      setFridges(f);
      setShelves(s);
      setItems(i);
      setUsers(u);
    } catch (err) {
      console.error("Failed to fetch data", err);
    }
  };

  const handleLoginSuccess = (newToken: string, user: User) => {
    setToken(newToken);
    setCurrentUser(user);
    showNotification(`Welcome back, ${user.name}!`);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setCurrentUser(null);
    setView("food");
  };

  const handleAddItem = async (item: NewFoodItem): Promise<boolean> => {
    try {
      const res = await authFetch("/api/food-items", {
        method: "POST",
        body: JSON.stringify(item),
      });
      if (res.ok) {
        showNotification(`Logged ${item.name}!`);
        fetchData();
        return true;
      }
      return false;
    } catch {
      showNotification("Failed to add item", "error");
      return false;
    }
  };

  const handleAddUser = async (user: NewUser): Promise<boolean> => {
    try {
      const res = await authFetch("/api/users", {
        method: "POST",
        body: JSON.stringify(user),
      });
      if (res.ok) {
        showNotification(`User ${user.name} added!`);
        fetchData();
        return true;
      }
      return false;
    } catch {
      showNotification("Failed to add user", "error");
      return false;
    }
  };

  const handleUpdateUser = async (
    id: string,
    data: UpdateUser,
  ): Promise<boolean> => {
    try {
      const res = await authFetch(`/api/users/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
      if (res.ok) {
        showNotification(`${data.name} updated!`);
        fetchData();
        return true;
      }
      return false;
    } catch {
      showNotification("Failed to update user", "error");
      return false;
    }
  };

  const handleDeleteUser = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;
    try {
      const res = await authFetch(`/api/users/${id}`, { method: "DELETE" });
      if (res.ok) {
        showNotification(`${name} removed.`);
        fetchData();
      }
    } catch {
      showNotification("Failed to delete user", "error");
    }
  };

  const handleClaim = async (itemId: string, servings: number) => {
    if (!currentUser) return;
    try {
      const res = await authFetch(`/api/food-items/${itemId}/claim`, {
        method: "PATCH",
        body: JSON.stringify({ servings, user_id: currentUser.id }),
      });
      if (res.ok) {
        showNotification(`Claimed ${servings} serving(s).`);
        fetchData();
      }
    } catch {
      showNotification("Failed to claim item", "error");
    }
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    try {
      const res = await authFetch(`/api/food-items/${itemId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        showNotification("Item deleted.");
        fetchData();
      }
    } catch {
      showNotification("Failed to delete item", "error");
    }
  };

  if (!currentUser) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  const toggleView = () => {
    const isAdmin = currentUser.admin;
    if (!isAdmin) return;
    setView(view === "food" ? "users" : "food");
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans pb-24">
      <AppHeader
        currentUser={currentUser}
        view={view}
        onToggleView={toggleView}
        onLogout={handleLogout}
      />

      {view === "food" ? (
        <FoodPage
          fridges={fridges}
          shelves={shelves}
          items={items}
          users={users}
          currentUser={currentUser}
          onAddItem={handleAddItem}
          onClaim={handleClaim}
          onDelete={handleDelete}
        />
      ) : (
        <UsersPage
          users={users}
          currentUser={currentUser}
          onAddUser={handleAddUser}
          onUpdateUser={handleUpdateUser}
          onDeleteUser={handleDeleteUser}
        />
      )}

      <AnimatePresence>
        {notification && (
          <Notification
            message={notification.message}
            type={notification.type}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
