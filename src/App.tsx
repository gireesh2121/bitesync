import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  UtensilsCrossed,
  ShieldCheck,
  RotateCcw,
  RefreshCw,
  Database,
  CloudLightning,
  AlertTriangle,
  Sparkles
} from "lucide-react";
import { MenuItem, Order } from "./types";
import { INITIAL_MENU_ITEMS, INITIAL_ORDERS } from "./data";
import CustomerView from "./components/CustomerView";
import AdminView from "./components/AdminView";

export default function App() {
  // Global view: 'customer' or 'admin'
  const [activeView, setActiveView] = useState<"customer" | "admin">("customer");

  // Core Data States
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Connection config
  const [webAppUrl, setWebAppUrl] = useState<string>("");
  const [syncStatus, setSyncStatus] = useState<"synced" | "local" | "error">("local");
  const [syncError, setSyncError] = useState<string>("");

  // Load configuration and data on boot
  useEffect(() => {
    // 1. Read URL from local storage
    const defaultUrl = "";
    let storedUrl = localStorage.getItem("bitesync_sheets_url");
    
    // Clear out the stale/expired default URL if it was previously saved in the user's browser
    if (storedUrl === "https://script.google.com/macros/s/AKfycbyhe7mrbgdMK7qrRic7q-8G-YW20DM2Ofj-M9W-qnL1jw0y85MjOdm8C3sWLdfC229l/exec") {
      storedUrl = null;
      localStorage.removeItem("bitesync_sheets_url");
    }

    const savedUrl = storedUrl !== null ? (storedUrl || "") : defaultUrl;
    setWebAppUrl(savedUrl);
    if (localStorage.getItem("bitesync_sheets_url") === null) {
      localStorage.setItem("bitesync_sheets_url", defaultUrl);
    }

    // 2. Read database content from localStorage or fallbacks
    const storedMenu = localStorage.getItem("bitesync_menu_items");
    const storedOrders = localStorage.getItem("bitesync_orders_log");

    const initialMenu = storedMenu ? JSON.parse(storedMenu) : INITIAL_MENU_ITEMS;
    const initialOrders = storedOrders ? JSON.parse(storedOrders) : INITIAL_ORDERS;

    setMenuItems(initialMenu);
    setOrders(initialOrders);

    // Save defaults to localStorage if empty
    if (!storedMenu) localStorage.setItem("bitesync_menu_items", JSON.stringify(INITIAL_MENU_ITEMS));
    if (!storedOrders) localStorage.setItem("bitesync_orders_log", JSON.stringify(INITIAL_ORDERS));

    // 3. If there is a Web App URL, fetch from Google Spreadsheet
    if (savedUrl) {
      syncWithSpreadsheet(savedUrl, initialMenu, initialOrders);
    } else {
      setLoading(false);
    }
  }, []);

  // Sync data with Google Apps Script
  const syncWithSpreadsheet = async (url: string, fallbackMenu?: MenuItem[], fallbackOrders?: Order[]) => {
    setLoading(true);
    setSyncError("");
    try {
      // Fetch current menu via server-side proxy
      const menuRes = await fetch(`/api/sheets-proxy?url=${encodeURIComponent(url)}&action=getMenu`);
      const menuText = await menuRes.text();
      let menuData: any = null;
      try {
        menuData = JSON.parse(menuText);
      } catch (e) {
        if (menuText.trim().startsWith("<") || menuText.includes("<!DOCTYPE") || menuText.includes("<html") || menuText.includes("<!doctype")) {
          throw new Error("The Sheets Web App URL returned HTML instead of JSON. Make sure you deployed the script as a Web App (under 'Deploy' -> 'New deployment') and that 'Who has access' is set to 'Anyone'.");
        }
        throw new Error(`Invalid response from Sheets Web App: ${menuText.slice(0, 100)}...`);
      }

      if (!menuRes.ok) {
        throw new Error(menuData?.error || `HTTP ${menuRes.status} error fetching menu`);
      }

      // Fetch current orders via server-side proxy
      const ordersRes = await fetch(`/api/sheets-proxy?url=${encodeURIComponent(url)}&action=getOrders`);
      const ordersText = await ordersRes.text();
      let ordersData: any = null;
      try {
        ordersData = JSON.parse(ordersText);
      } catch (e) {
        if (ordersText.trim().startsWith("<") || ordersText.includes("<!DOCTYPE") || ordersText.includes("<html") || ordersText.includes("<!doctype")) {
          throw new Error("The Sheets Web App URL returned HTML instead of JSON when fetching orders. Check your Apps Script setup.");
        }
        throw new Error(`Invalid response when fetching orders: ${ordersText.slice(0, 100)}...`);
      }

      if (!ordersRes.ok) {
        throw new Error(ordersData?.error || `HTTP ${ordersRes.status} error fetching orders`);
      }

      if (menuData?.menu && Array.isArray(menuData.menu)) {
        setMenuItems(menuData.menu);
        localStorage.setItem("bitesync_menu_items", JSON.stringify(menuData.menu));
      }
      if (ordersData?.orders && Array.isArray(ordersData.orders)) {
        // Sort orders newest first
        const sorted = ordersData.orders;
        setOrders(sorted);
        localStorage.setItem("bitesync_orders_log", JSON.stringify(sorted));
      }

      setSyncStatus("synced");
      setSyncError("");
    } catch (err: any) {
      console.error("Failed to fetch from Google Sheets:", err);
      setSyncStatus("error");
      setSyncError(err.message || "Failed to fetch from Google Sheets");
      
      // Load fallbacks if first fetch
      if (fallbackMenu) setMenuItems(fallbackMenu);
      if (fallbackOrders) setOrders(fallbackOrders);
    } finally {
      setLoading(false);
    }
  };

  // Trigger manual sync refresh
  const handleManualRefresh = () => {
    if (webAppUrl) {
      syncWithSpreadsheet(webAppUrl);
    } else {
      // Simulate quick load
      setLoading(true);
      setTimeout(() => setLoading(false), 500);
    }
  };

  // Test the Google Sheets connection (Ping action)
  const handleTestConnection = async (): Promise<boolean> => {
    if (!webAppUrl) return false;
    try {
      const res = await fetch(`/api/sheets-proxy?url=${encodeURIComponent(webAppUrl)}&action=getMenu`);
      if (!res.ok) return false;
      const text = await res.text();
      const data = JSON.parse(text);
      return !!(data && data.menu);
    } catch (err) {
      return false;
    }
  };

  // Save Apps Script Web App URL
  const handleSaveUrl = (url: string) => {
    setWebAppUrl(url);
    localStorage.setItem("bitesync_sheets_url", url);
    if (url) {
      syncWithSpreadsheet(url);
    } else {
      setSyncStatus("local");
    }
  };

  // Helper helper to write and sync changes to backend
  const updateLocalAndBackend = async (
    newMenu: MenuItem[],
    newOrders: Order[],
    actionDetails?: {
      action: "saveMenuItem" | "deleteMenuItem" | "createOrder" | "updateOrderStatus";
      payload: any;
    }
  ) => {
    // 1. Update React state instantly
    setMenuItems(newMenu);
    setOrders(newOrders);

    // 2. Update local storage instantly
    localStorage.setItem("bitesync_menu_items", JSON.stringify(newMenu));
    localStorage.setItem("bitesync_orders_log", JSON.stringify(newOrders));

    // 3. Write to Spreadsheet Web App in background via proxy
    if (webAppUrl && actionDetails) {
      try {
        const response = await fetch(`/api/sheets-proxy?url=${encodeURIComponent(webAppUrl)}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: actionDetails.action,
            ...actionDetails.payload
          })
        });
        if (response.ok) {
          setSyncStatus("synced");
        } else {
          setSyncStatus("error");
        }
      } catch (err) {
        console.error("Spreadsheet write error:", err);
        setSyncStatus("error");
      }
    }
  };

  // Customer: Place a new order
  const handlePlaceOrder = async (orderData: Omit<Order, "id" | "status" | "timestamp">): Promise<Order> => {
    // Generate a beautiful, unique order reference
    const orderId = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
    const newOrder: Order = {
      ...orderData,
      id: orderId,
      status: "Pending",
      timestamp: new Date().toISOString()
    };

    const updatedOrders = [newOrder, ...orders];
    await updateLocalAndBackend(menuItems, updatedOrders, {
      action: "createOrder",
      payload: { order: newOrder }
    });

    return newOrder;
  };

  // Customer / Admin: Cancel an active order
  const handleCancelOrder = async (id: string) => {
    const updated = orders.map((o) => (o.id === id ? { ...o, status: "Cancelled" as const } : o));
    await updateLocalAndBackend(menuItems, updated, {
      action: "updateOrderStatus",
      payload: { id, status: "Cancelled" }
    });
  };

  // Admin: Add a brand new dish
  const handleAddMenuItem = async (item: Omit<MenuItem, "id">) => {
    const newId = `m${Date.now()}`;
    const newItem: MenuItem = { ...item, id: newId };
    const updatedMenu = [...menuItems, newItem];
    await updateLocalAndBackend(updatedMenu, orders, {
      action: "saveMenuItem",
      payload: { item: newItem }
    });
  };

  // Admin: Edit an existing dish details
  const handleEditMenuItem = async (item: MenuItem) => {
    const updatedMenu = menuItems.map((mi) => (mi.id === item.id ? item : mi));
    await updateLocalAndBackend(updatedMenu, orders, {
      action: "saveMenuItem",
      payload: { item }
    });
  };

  // Admin: Delete a dish from the list
  const handleDeleteMenuItem = async (id: string) => {
    const updatedMenu = menuItems.filter((mi) => mi.id !== id);
    await updateLocalAndBackend(updatedMenu, orders, {
      action: "deleteMenuItem",
      payload: { id }
    });
  };

  // Admin: Update order status transition
  const handleUpdateOrderStatus = async (id: string, status: Order["status"]) => {
    const updatedOrders = orders.map((o) => (o.id === id ? { ...o, status } : o));
    await updateLocalAndBackend(menuItems, updatedOrders, {
      action: "updateOrderStatus",
      payload: { id, status }
    });
  };

  return (
    <div id="main-app-container" className="min-h-screen bg-vibrant-peach flex flex-col font-sans selection:bg-vibrant-yellow selection:text-vibrant-orange text-vibrant-slate">
      
      {/* Top utility sync panel */}
      <div className="bg-vibrant-slate border-b border-vibrant-border/10 px-6 py-2.5 text-white flex flex-col sm:flex-row items-center justify-between gap-3 text-xs z-50">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 font-medium">
            <span className={`w-2 h-2 rounded-full ${
              syncStatus === "synced" ? "bg-emerald-400 animate-pulse" : syncStatus === "error" ? "bg-rose-500" : "bg-vibrant-yellow"
            }`} />
            {syncStatus === "synced" && <span className="text-gray-300">Spreadsheet synchronized</span>}
            {syncStatus === "local" && <span className="text-gray-400">Offline-first local mode</span>}
            {syncStatus === "error" && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-1.5">
                <span className="text-rose-400 font-semibold">Sync error (Fallback mode)</span>
                {syncError && (
                  <span className="text-rose-300/80 text-[10px] sm:ml-2 font-normal line-clamp-1 max-w-xs md:max-w-md lg:max-w-lg" title={syncError}>
                    ({syncError})
                  </span>
                )}
              </div>
            )}
          </div>

          <button
            id="manual-refresh-btn"
            onClick={handleManualRefresh}
            disabled={loading}
            className="p-1 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
            title="Refresh database"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Dynamic Dual view toggler */}
        <div className="flex items-center bg-black/20 p-1 rounded-xl border border-white/5 shrink-0">
          <button
            id="toggle-view-customer-btn"
            onClick={() => setActiveView("customer")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeView === "customer"
                ? "bg-vibrant-orange text-white shadow-md"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <UtensilsCrossed className="w-3.5 h-3.5" />
            <span>Customer View</span>
          </button>
          
          <button
            id="toggle-view-admin-btn"
            onClick={() => setActiveView("admin")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeView === "admin"
                ? "bg-vibrant-orange text-white shadow-md"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Admin Control Panel</span>
          </button>
        </div>
      </div>

      {/* Main Container screen */}
      <div className="flex-1 flex flex-col min-h-0 relative">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-vibrant-peach/90 backdrop-blur-xs flex flex-col items-center justify-center gap-3.5 z-30"
            >
              <div className="relative flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-vibrant-border border-t-vibrant-orange rounded-full animate-spin" />
                <UtensilsCrossed className="w-5 h-5 text-vibrant-orange absolute" />
              </div>
              <div className="text-center">
                <p className="text-xs font-bold text-vibrant-slate tracking-wide uppercase">Connecting database...</p>
                <p className="text-[10px] text-vibrant-gray mt-0.5 font-medium">Fetching sheets from your Google Spreadsheet backend</p>
              </div>
            </motion.div>
          ) : null}

          {activeView === "customer" ? (
            <motion.div
              key="customer-screen"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex-1 flex flex-col"
            >
              <CustomerView
                menuItems={menuItems}
                onPlaceOrder={handlePlaceOrder}
                activeOrders={orders}
                onCancelOrder={handleCancelOrder}
              />
            </motion.div>
          ) : (
            <motion.div
              key="admin-screen"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex-1 flex flex-col"
            >
              <AdminView
                menuItems={menuItems}
                orders={orders}
                webAppUrl={webAppUrl}
                onSaveUrl={handleSaveUrl}
                onTestConnection={handleTestConnection}
                onAddMenuItem={handleAddMenuItem}
                onEditMenuItem={handleEditMenuItem}
                onDeleteMenuItem={handleDeleteMenuItem}
                onUpdateOrderStatus={handleUpdateOrderStatus}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
