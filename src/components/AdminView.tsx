import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  TrendingUp,
  ShoppingBag,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  MapPin,
  Phone,
  User,
  Clock,
  ArrowRight,
  Database,
  BarChart3,
  Calendar,
  AlertCircle,
  FileText,
  IndianRupee
} from "lucide-react";
import { MenuItem, Order, SalesReport, PopularItem } from "../types";
import { playAudioNotification } from "../utils/audio";
import AppsScriptSetup from "./AppsScriptSetup";

interface AdminViewProps {
  menuItems: MenuItem[];
  orders: Order[];
  webAppUrl: string;
  onSaveUrl: (url: string) => void;
  onTestConnection: () => Promise<boolean>;
  onAddMenuItem: (item: Omit<MenuItem, "id">) => Promise<void>;
  onEditMenuItem: (item: MenuItem) => Promise<void>;
  onDeleteMenuItem: (id: string) => Promise<void>;
  onUpdateOrderStatus: (id: string, status: Order["status"]) => Promise<void>;
}

export default function AdminView({
  menuItems,
  orders,
  webAppUrl,
  onSaveUrl,
  onTestConnection,
  onAddMenuItem,
  onEditMenuItem,
  onDeleteMenuItem,
  onUpdateOrderStatus,
}: AdminViewProps) {
  // Navigation
  const [activeSubTab, setActiveSubTab] = useState<"orders" | "menu" | "stats" | "sheets">("orders");

  // Track order IDs we have already seen to trigger sounds only on fresh incoming entries
  const [knownOrderIds, setKnownOrderIds] = useState<string[]>(() =>
    orders.map((o) => o.id)
  );

  useEffect(() => {
    const currentIds = orders.map((o) => o.id);
    const newIds = currentIds.filter((id) => !knownOrderIds.includes(id));

    if (newIds.length > 0) {
      // Play synthesized audio chime for administrative notification
      playAudioNotification("admin-alert");
      setKnownOrderIds(currentIds);
    } else if (currentIds.length !== knownOrderIds.length) {
      // Keep synchronized in case orders are cleared or deleted
      setKnownOrderIds(currentIds);
    }
  }, [orders, knownOrderIds]);

  // Orders sub-navigation
  const [orderFilter, setOrderFilter] = useState<"active" | "all" | "Pending" | "Preparing" | "Out for Delivery" | "Delivered" | "Cancelled">("active");

  // Menu item modal state
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  // Menu Form Inputs
  const [mName, setMName] = useState("");
  const [mPrice, setMPrice] = useState("");
  const [mCategory, setMCategory] = useState("Mains");
  const [mDescription, setMDescription] = useState("");
  const [mImage, setMImage] = useState("");
  const [mAvailable, setMAvailable] = useState(true);
  const [menuFormError, setMenuFormError] = useState("");
  const [isSubmittingMenu, setIsSubmittingMenu] = useState(false);

  // Statistics calculation
  const stats = useMemo(() => {
    // 1. Core KPIs
    let totalRevenue = 0;
    let completedOrders = 0;
    let cancelledOrders = 0;
    const popularItemsMap: Record<string, { quantity: number; revenue: number }> = {};
    const categorySalesMap: Record<string, number> = {
      Starters: 0,
      Mains: 0,
      Desserts: 0,
      Beverages: 0,
    };

    // Calculate revenue for last 7 days
    const dailySalesMap: Record<string, { revenue: number; count: number }> = {};
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
      dailySalesMap[dateStr] = { revenue: 0, count: 0 };
    }

    orders.forEach((o) => {
      const isDelivered = o.status === "Delivered";
      const isCancelled = o.status === "Cancelled";

      if (isDelivered) {
        totalRevenue += o.total;
        completedOrders += 1;

        // Populate items popularity & categories
        o.items.forEach((item) => {
          // Find item category from menu items list (fallback to Mains if missing)
          const category = menuItems.find((mi) => mi.id === item.menuItemId)?.category || "Mains";
          categorySalesMap[category] = (categorySalesMap[category] || 0) + item.price * item.quantity;

          if (!popularItemsMap[item.name]) {
            popularItemsMap[item.name] = { quantity: 0, revenue: 0 };
          }
          popularItemsMap[item.name].quantity += item.quantity;
          popularItemsMap[item.name].revenue += item.price * item.quantity;
        });
      }

      if (isCancelled) {
        cancelledOrders += 1;
      }

      // Add to Daily Revenue if delivered
      if (isDelivered) {
        const orderDate = new Date(o.timestamp);
        const dateStr = orderDate.toLocaleDateString(undefined, { month: "short", day: "numeric" });
        if (dailySalesMap[dateStr] !== undefined) {
          dailySalesMap[dateStr].revenue += o.total;
          dailySalesMap[dateStr].count += 1;
        }
      }
    });

    const averageOrderValue = completedOrders > 0 ? parseFloat((totalRevenue / completedOrders).toFixed(2)) : 0;

    // Format Daily Sales Report
    const dailyRevenueReport: SalesReport[] = Object.keys(dailySalesMap).map((date) => ({
      date,
      revenue: parseFloat(dailySalesMap[date].revenue.toFixed(2)),
      orderCount: dailySalesMap[date].count,
    }));

    // Format Popular Items
    const popularItemsReport: PopularItem[] = Object.keys(popularItemsMap)
      .map((name) => ({
        name,
        quantity: popularItemsMap[name].quantity,
        revenue: parseFloat(popularItemsMap[name].revenue.toFixed(2)),
      }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    return {
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      completedOrders,
      cancelledOrders,
      averageOrderValue,
      dailyRevenueReport,
      popularItemsReport,
      categorySales: categorySalesMap,
    };
  }, [orders, menuItems]);

  // Handle menu modal open for Edit vs. Create
  const openMenuModal = (item: MenuItem | null) => {
    if (item) {
      setEditingItem(item);
      setMName(item.name);
      setMPrice(String(item.price));
      setMCategory(item.category);
      setMDescription(item.description);
      setMImage(item.image);
      setMAvailable(item.available);
    } else {
      setEditingItem(null);
      setMName("");
      setMPrice("");
      setMCategory("Mains");
      setMDescription("");
      setMImage("");
      setMAvailable(true);
    }
    setMenuFormError("");
    setIsMenuModalOpen(true);
  };

  // Submit Menu Form
  const handleMenuSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mName.trim() || !mPrice.trim() || !mDescription.trim()) {
      setMenuFormError("Required fields: Name, Price, and Description.");
      return;
    }
    const priceNum = parseFloat(mPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      setMenuFormError("Please enter a valid positive number for price.");
      return;
    }

    setIsSubmittingMenu(true);
    setMenuFormError("");

    try {
      // Default placeholder if image is empty
      const imageUrl = mImage.trim() || "https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=600";

      if (editingItem) {
        await onEditMenuItem({
          id: editingItem.id,
          name: mName.trim(),
          price: priceNum,
          category: mCategory,
          description: mDescription.trim(),
          image: imageUrl,
          available: mAvailable,
        });
      } else {
        await onAddMenuItem({
          name: mName.trim(),
          price: priceNum,
          category: mCategory,
          description: mDescription.trim(),
          image: imageUrl,
          available: mAvailable,
        });
      }
      setIsMenuModalOpen(false);
    } catch (err) {
      setMenuFormError("Database writing error. Review Spreadsheet integration setup.");
    } finally {
      setIsSubmittingMenu(false);
    }
  };

  // Handle delete menu item with confirmation
  const handleDeleteItem = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}" from the menu?`)) {
      try {
        await onDeleteMenuItem(id);
      } catch (err) {
        alert("Failed to delete item from spreadsheet backend.");
      }
    }
  };

  // Filter orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (orderFilter === "all") return true;
      if (orderFilter === "active") {
        return ["Pending", "Preparing", "Out for Delivery"].includes(o.status);
      }
      return o.status === orderFilter;
    }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [orders, orderFilter]);

  // Order status next-step helper details
  const getNextStatusAction = (status: Order["status"]) => {
    switch (status) {
      case "Pending":
        return { label: "Prepare Food", next: "Preparing" as const, color: "bg-vibrant-orange hover:bg-vibrant-orange-dark" };
      case "Preparing":
        return { label: "Ship Order", next: "Out for Delivery" as const, color: "bg-vibrant-slate hover:bg-vibrant-slate/95" };
      case "Out for Delivery":
        return { label: "Deliver", next: "Delivered" as const, color: "bg-[#FFEE93] text-vibrant-orange-dark hover:bg-[#FFEE93]/90 font-black" };
      default:
        return null;
    }
  };

  // SVG Chart Dimensions & math
  const chartHeight = 220;
  const chartWidth = 550;
  const maxRevenueVal = useMemo(() => {
    const maxVal = Math.max(...stats.dailyRevenueReport.map((r) => r.revenue), 10);
    return Math.ceil(maxVal / 10) * 10;
  }, [stats.dailyRevenueReport]);

  return (
    <div id="admin-view-root" className="min-h-screen bg-vibrant-peach flex">
      {/* Sidebar navigation */}
      <aside className="w-64 bg-vibrant-orange text-white border-r border-vibrant-orange-dark flex flex-col justify-between hidden md:flex shrink-0">
        <div className="p-6 space-y-6">
          <div className="flex items-center gap-2.5">
            <div className="bg-white text-vibrant-orange p-2.5 rounded-xl shadow-md">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight text-white leading-none">BiteSync</h2>
              <span className="text-[10px] text-white/70 tracking-wider font-bold">Kitchen Controller</span>
            </div>
          </div>

          <nav className="space-y-1.5 text-xs font-bold">
            <button
              id="admin-nav-orders"
              onClick={() => setActiveSubTab("orders")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeSubTab === "orders" ? "bg-[#EF5D28] text-white shadow-inner" : "text-white/85 hover:bg-white/10"
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Incoming Orders</span>
              {orders.filter(o => o.status === "Pending").length > 0 && (
                <span className="ml-auto bg-vibrant-yellow text-vibrant-orange text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center animate-pulse shadow-md">
                  {orders.filter(o => o.status === "Pending").length}
                </span>
              )}
            </button>

            <button
              id="admin-nav-menu"
              onClick={() => setActiveSubTab("menu")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeSubTab === "menu" ? "bg-[#EF5D28] text-white shadow-inner" : "text-white/85 hover:bg-white/10"
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Menu Management</span>
            </button>

            <button
              id="admin-nav-stats"
              onClick={() => setActiveSubTab("stats")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeSubTab === "stats" ? "bg-[#EF5D28] text-white shadow-inner" : "text-white/85 hover:bg-white/10"
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Sales Statistics</span>
            </button>

            <button
              id="admin-nav-sheets"
              onClick={() => setActiveSubTab("sheets")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeSubTab === "sheets" ? "bg-[#EF5D28] text-white shadow-inner" : "text-white/85 hover:bg-white/10"
              }`}
            >
              <Database className="w-4 h-4" />
              <span>Google Sheets Sync</span>
              {!webAppUrl && (
                <span className="ml-auto w-2 h-2 bg-vibrant-yellow rounded-full" />
              )}
            </button>
          </nav>
        </div>

        <div className="p-6 border-t border-white/20 text-[10px] text-white/70">
          <p className="font-bold text-white uppercase tracking-wider">Database Engine</p>
          <p className="mt-1 flex items-center gap-1.5 font-medium">
            <span className={`w-2 h-2 rounded-full ${webAppUrl ? "bg-vibrant-yellow animate-pulse" : "bg-white/40"}`} />
            {webAppUrl ? "Spreadsheet Connected" : "Local Database Session"}
          </p>
        </div>
      </aside>

      {/* Main content body */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Mobile Navigation / bar */}
        <header className="bg-white/95 border-b border-vibrant-border px-6 py-4 flex items-center justify-between md:justify-end shrink-0">
          <div className="md:hidden flex items-center gap-2">
            <div className="bg-vibrant-orange text-white p-2 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </div>
            <span className="font-black text-xs text-vibrant-slate">BiteSync Admin</span>
          </div>

          <div className="md:hidden flex items-center gap-1 overflow-x-auto">
            {([
              { key: "orders", label: "Orders" },
              { key: "menu", label: "Menu" },
              { key: "stats", label: "Stats" },
              { key: "sheets", label: "Sheets" },
            ] as const).map((sub) => (
              <button
                id={`mobile-tab-${sub.key}`}
                key={sub.key}
                onClick={() => setActiveSubTab(sub.key)}
                className={`px-3 py-1.5 rounded-md text-[11px] font-bold ${
                  activeSubTab === sub.key ? "bg-vibrant-orange text-white" : "text-vibrant-gray hover:bg-vibrant-orange/10"
                }`}
              >
                {sub.label}
              </button>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3 text-xs">
            <span className="text-vibrant-gray font-medium">Secure Admin Session</span>
            <span className="bg-vibrant-peach border border-vibrant-border font-mono text-vibrant-orange-dark font-black px-2.5 py-1 rounded-full">
              {orders.length} Total Orders Logs
            </span>
          </div>
        </header>

        {/* Scrollable Panel Area */}
        <main className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            {/* =========================================================================
               ORDER MANAGEMENT PANEL
               ========================================================================= */}
            {activeSubTab === "orders" && (
              <motion.div
                key="orders-panel"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-black tracking-tight text-vibrant-slate">Incoming Orders Dashboard</h1>
                    <p className="text-xs text-vibrant-gray font-semibold mt-1">Review live checkout items, coordinates, and dispatch updates.</p>
                  </div>

                  {/* Filter pills */}
                  <div className="flex items-center gap-1 bg-white border-2 border-vibrant-border p-1 rounded-xl overflow-x-auto shadow-sm">
                    {[
                      { key: "active", label: "Active" },
                      { key: "all", label: "All Logs" },
                      { key: "Pending", label: "Pending" },
                      { key: "Preparing", label: "Preparing" },
                      { key: "Out for Delivery", label: "Transit" },
                    ].map((filt) => (
                      <button
                        id={`order-filter-${filt.key}`}
                        key={filt.key}
                        onClick={() => setOrderFilter(filt.key as any)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                          orderFilter === filt.key
                            ? "bg-vibrant-orange text-white shadow-md"
                            : "text-vibrant-gray hover:text-vibrant-orange hover:bg-vibrant-orange/10"
                        }`}
                      >
                        {filt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {filteredOrders.length > 0 ? (
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {filteredOrders.map((order) => (
                      <div
                        id={`admin-order-card-${order.id}`}
                        key={order.id}
                        className="bg-white border-2 border-vibrant-border rounded-[2.5rem] overflow-hidden hover:border-vibrant-orange/40 transition-all flex flex-col justify-between hover:shadow-xl"
                      >
                        {/* Status bar */}
                        <div className="px-5 py-3.5 bg-vibrant-peach/30 border-b-2 border-vibrant-border flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-gray-700">#{order.id}</span>
                            <span className="text-[10px] text-gray-400">
                              {new Date(order.timestamp).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span
                              className={`w-2 h-2 rounded-full ${
                                order.status === "Pending"
                                  ? "bg-amber-400"
                                  : order.status === "Preparing"
                                  ? "bg-blue-400"
                                  : order.status === "Out for Delivery"
                                  ? "bg-purple-400"
                                  : order.status === "Delivered"
                                  ? "bg-emerald-500"
                                  : "bg-rose-500"
                              }`}
                            />
                            <span className="text-xs font-bold text-gray-800">{order.status}</span>
                          </div>
                        </div>

                        {/* Order info details */}
                        <div className="p-5 flex-1 grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
                          {/* Left: Customer Info */}
                          <div className="space-y-3.5 border-r border-gray-100 sm:pr-5">
                            <div className="space-y-1">
                              <p className="text-gray-400">Recipient</p>
                              <p className="font-semibold text-gray-900 flex items-center gap-1.5">
                                <User className="w-3.5 h-3.5 text-gray-400 shrink-0" /> {order.customerName}
                              </p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-gray-400">Phone</p>
                              <p className="font-semibold text-gray-900 flex items-center gap-1.5">
                                <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" /> {order.customerPhone}
                              </p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-gray-400">Address</p>
                              <p className="font-semibold text-gray-900 flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" /> {order.deliveryAddress}
                              </p>
                            </div>
                            {order.notes && (
                              <div className="bg-gray-50 border border-gray-100 p-2 rounded-lg text-[11px] text-gray-600 font-light italic">
                                "{order.notes}"
                              </div>
                            )}
                          </div>

                          {/* Right: Items checklist */}
                          <div className="space-y-4 flex flex-col justify-between">
                            <div>
                              <p className="text-gray-400 mb-2 font-bold tracking-tight uppercase text-[9px]">Items ordered</p>
                              <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                                {order.items.map((it, idx) => (
                                  <div key={idx} className="flex justify-between items-center bg-gray-50/50 p-2 rounded-lg border border-gray-100">
                                    <span className="text-gray-800 truncate">
                                      <span className="font-bold text-gray-950 mr-1.5">{it.quantity}x</span>
                                      {it.name}
                                    </span>
                                    <span className="font-mono text-gray-500 font-medium">₹{(it.price * it.quantity).toFixed(2)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="border-t border-dashed border-vibrant-border pt-3 flex justify-between items-end">
                              <span className="text-vibrant-gray font-bold text-[10px] uppercase">Paid Invoice</span>
                              <span className="text-sm font-extrabold text-vibrant-orange-dark font-mono">₹{order.total.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Admin Action Row */}
                        <div className="px-5 py-3.5 border-t border-vibrant-border bg-vibrant-peach/10 flex items-center justify-between gap-3 flex-wrap">
                          {/* Cancel button */}
                          {["Pending", "Preparing", "Out for Delivery"].includes(order.status) ? (
                            <button
                              id={`cancel-order-admin-${order.id}`}
                              onClick={() => {
                                if (confirm(`Are you sure you want to CANCEL order #${order.id}?`)) {
                                  onUpdateOrderStatus(order.id, "Cancelled");
                                }
                              }}
                              className="px-3.5 py-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-semibold transition-colors"
                            >
                              Cancel Order
                            </button>
                          ) : (
                            <span className="text-[11px] text-gray-400 font-mono">Completed Log</span>
                          )}

                          {/* Stepper next-step */}
                          {getNextStatusAction(order.status) && (
                            <button
                              id={`next-status-order-admin-${order.id}`}
                              onClick={() => {
                                const action = getNextStatusAction(order.status);
                                if (action) onUpdateOrderStatus(order.id, action.next);
                              }}
                              className={`px-4 py-1.5 rounded-lg text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors ${
                                getNextStatusAction(order.status)!.color
                              }`}
                            >
                              <span>{getNextStatusAction(order.status)!.label}</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20 bg-white border border-gray-200 rounded-2xl p-8">
                    <ShoppingBag className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-sm font-semibold text-gray-850">No incoming orders match</h3>
                    <p className="text-xs text-gray-500 mt-1">When customers place checkout requests from the menu, they appear here instantly.</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* =========================================================================
               MENU MANAGEMENT PANEL
               ========================================================================= */}
            {activeSubTab === "menu" && (
              <motion.div
                key="menu-panel"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-black tracking-tight text-vibrant-slate">Restaurant Menu Catalog</h1>
                    <p className="text-xs text-vibrant-gray font-semibold mt-1">Add culinary creations, modify prices, toggle stock, or delete dishes.</p>
                  </div>

                  <button
                    id="add-new-menu-item-btn"
                    onClick={() => openMenuModal(null)}
                    className="bg-vibrant-orange hover:bg-vibrant-orange-dark text-white text-xs font-bold px-5 py-3 rounded-xl shadow-md shadow-vibrant-orange/25 flex items-center gap-1.5 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    Add Culinary Dish
                  </button>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {menuItems.map((item) => (
                    <div
                      id={`admin-menu-card-${item.id}`}
                      key={item.id}
                      className="bg-white border-2 border-vibrant-border rounded-[2rem] overflow-hidden hover:border-vibrant-orange/40 transition-all flex flex-col justify-between hover:shadow-xl"
                    >
                      <div className="flex items-center gap-4 p-4.5">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-16 h-16 object-cover rounded-xl bg-gray-100 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-bold text-vibrant-orange-dark bg-vibrant-peach px-2 py-0.5 rounded uppercase tracking-wider">
                              {item.category}
                            </span>
                            {!item.available && (
                              <span className="text-[9px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded uppercase tracking-wider border border-rose-100">
                                Sold Out
                              </span>
                            )}
                          </div>
                          <h3 className="text-xs font-bold text-vibrant-slate mt-1 truncate">{item.name}</h3>
                          <p className="text-xs font-black text-vibrant-orange-dark mt-0.5 font-mono">₹{item.price.toFixed(2)}</p>
                        </div>
                      </div>

                      <div className="px-4.5 pb-4 text-xs text-gray-500 font-light leading-relaxed line-clamp-2">
                        {item.description}
                      </div>

                      {/* Card actions */}
                      <div className="px-4.5 py-3 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
                        <label className="flex items-center gap-1.5 cursor-pointer select-none">
                          <input
                            id={`stock-toggle-${item.id}`}
                            type="checkbox"
                            checked={item.available}
                            onChange={() =>
                              onEditMenuItem({
                                ...item,
                                available: !item.available,
                              })
                            }
                            className="w-3.5 h-3.5 text-vibrant-orange border-vibrant-border rounded focus:ring-vibrant-orange focus:ring-offset-0 focus:ring-0"
                          />
                          <span className="text-[11px] font-semibold text-gray-600">In Stock</span>
                        </label>

                        <div className="flex gap-1">
                          <button
                            id={`edit-menu-item-${item.id}`}
                            onClick={() => openMenuModal(item)}
                            className="p-1.5 bg-white hover:bg-gray-100 text-gray-500 hover:text-gray-800 rounded-lg border border-gray-150 transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            id={`delete-menu-item-${item.id}`}
                            onClick={() => handleDeleteItem(item.id, item.name)}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg border border-rose-100 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* =========================================================================
               SALES STATISTICS & DATA VISUALIZATIONS
               ========================================================================= */}
            {activeSubTab === "stats" && (
              <motion.div
                key="stats-panel"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div>
                  <h1 className="text-2xl font-black tracking-tight text-vibrant-slate">Sales Analytics Dashboard</h1>
                  <p className="text-xs text-vibrant-gray font-semibold mt-1">Interactive overview of cashflow, bestsellers, and historical trends.</p>
                </div>

                {/* Dashboard grid metrics */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                  <div className="bg-white border-2 border-vibrant-border p-5 rounded-3xl shadow-md border-b-4 border-vibrant-orange space-y-2">
                    <div className="flex items-center justify-between text-vibrant-gray">
                      <span className="text-xs font-bold uppercase tracking-wider text-[10px]">Total Revenue</span>
                      <IndianRupee className="w-4 h-4 text-vibrant-orange" />
                    </div>
                    <p className="text-2xl font-black text-vibrant-slate font-mono">₹{stats.totalRevenue.toFixed(2)}</p>
                    <p className="text-[10px] text-vibrant-gray font-semibold">Delivered status totals</p>
                  </div>

                  <div className="bg-white border-2 border-vibrant-border p-5 rounded-3xl shadow-md border-b-4 border-vibrant-slate space-y-2">
                    <div className="flex items-center justify-between text-vibrant-gray">
                      <span className="text-xs font-bold uppercase tracking-wider text-[10px]">Completed Sales</span>
                      <Check className="w-4 h-4 text-vibrant-orange" />
                    </div>
                    <p className="text-2xl font-black text-vibrant-slate font-mono">{stats.completedOrders}</p>
                    <p className="text-[10px] text-vibrant-gray font-semibold">Orders dispatched safely</p>
                  </div>

                  <div className="bg-white border-2 border-vibrant-border p-5 rounded-3xl shadow-md border-b-4 border-vibrant-yellow space-y-2">
                    <div className="flex items-center justify-between text-vibrant-gray">
                      <span className="text-xs font-bold uppercase tracking-wider text-[10px]">Avg Order Ticket</span>
                      <TrendingUp className="w-4 h-4 text-vibrant-orange" />
                    </div>
                    <p className="text-2xl font-black text-vibrant-slate font-mono">₹{stats.averageOrderValue.toFixed(2)}</p>
                    <p className="text-[10px] text-vibrant-gray font-semibold">Customer basket average</p>
                  </div>

                  <div className="bg-white border-2 border-vibrant-border p-5 rounded-3xl shadow-md border-b-4 border-rose-500 space-y-2">
                    <div className="flex items-center justify-between text-vibrant-gray">
                      <span className="text-xs font-bold uppercase tracking-wider text-[10px]">Cancelled Items</span>
                      <X className="w-4 h-4 text-rose-500" />
                    </div>
                    <p className="text-2xl font-black text-vibrant-slate font-mono">{stats.cancelledOrders}</p>
                    <p className="text-[10px] text-vibrant-gray font-semibold">Refunded/aborted orders</p>
                  </div>
                </div>

                {/* Benton Grid Visualizations */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                  {/* Daily Revenue Reports Line Chart (SVG Crafted) */}
                  <div className="bg-vibrant-slate p-6 rounded-[2.5rem] shadow-xl lg:col-span-3 space-y-4 text-white animate-fade-in">
                    <div className="flex items-center justify-between border-b border-white/15 pb-3">
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-[#FF6B35]" /> Daily Revenue Reports
                      </h3>
                      <span className="text-[10px] bg-[#FF6B35] text-white font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                        Last 7 Days
                      </span>
                    </div>

                    {/* Dynamic Line SVG */}
                    <div className="relative pt-4 flex justify-center overflow-x-auto">
                      <svg width={chartWidth} height={chartHeight} className="overflow-visible min-w-[500px]">
                        {/* Define linear gradient for area fill */}
                        <defs>
                          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#FF6B35" stopOpacity="0.35" />
                            <stop offset="100%" stopColor="#FF6B35" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>

                        {/* Y Axis Gridlines & Labels */}
                        {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                          const val = Math.round(maxRevenueVal * ratio);
                          const y = chartHeight - 40 - ratio * (chartHeight - 60);
                          return (
                            <g key={idx}>
                              <line
                                x1="50"
                                y1={y}
                                x2={chartWidth - 20}
                                y2={y}
                                stroke="#f1f5f9"
                                strokeWidth="1"
                                strokeDasharray={idx === 0 ? "0" : "4"}
                              />
                              <text x="10" y={y + 4} fill="#94a3b8" className="text-[10px] font-mono text-right" width="35">
                                ${val}
                              </text>
                            </g>
                          );
                        })}

                        {/* Chart Line Path Calculation */}
                        {(() => {
                          const points = stats.dailyRevenueReport.map((r, i) => {
                            const x = 60 + i * ((chartWidth - 90) / 6);
                            const ratio = maxRevenueVal > 0 ? r.revenue / maxRevenueVal : 0;
                            const y = chartHeight - 40 - ratio * (chartHeight - 60);
                            return { x, y, val: r.revenue, date: r.date };
                          });

                          // Generate line path d attribute
                          let linePath = "";
                          let areaPath = "";
                          if (points.length > 0) {
                            linePath = `M ${points[0].x} ${points[0].y}`;
                            areaPath = `M ${points[0].x} ${chartHeight - 40} L ${points[0].x} ${points[0].y}`;

                            for (let idx = 1; idx < points.length; idx++) {
                              linePath += ` L ${points[idx].x} ${points[idx].y}`;
                              areaPath += ` L ${points[idx].x} ${points[idx].y}`;
                            }

                            areaPath += ` L ${points[points.length - 1].x} ${chartHeight - 40} Z`;
                          }

                          return (
                            <>
                              {/* Shaded Area */}
                              {areaPath && <path d={areaPath} fill="url(#chartGradient)" />}

                              {/* Curve line */}
                              {linePath && (
                                <path
                                  d={linePath}
                                  fill="none"
                                  stroke="#FF6B35"
                                  strokeWidth="3.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              )}

                              {/* Interactive Dot checkpoints & hover values */}
                              {points.map((p, idx) => (
                                <g key={idx} className="group cursor-pointer">
                                  <circle
                                    cx={p.x}
                                    cy={p.y}
                                    r="4.5"
                                    fill="#ffffff"
                                    stroke="#FF6B35"
                                    strokeWidth="3"
                                    className="transition-all hover:r-6"
                                  />
                                  {/* Hover tooltip card */}
                                  <rect
                                    x={p.x - 30}
                                    y={p.y - 32}
                                    width="60"
                                    height="20"
                                    rx="5"
                                    fill="#0f172a"
                                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
                                  />
                                  <text
                                    x={p.x}
                                    y={p.y - 18}
                                    fill="#ffffff"
                                    textAnchor="middle"
                                    className="text-[9px] font-mono font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
                                  >
                                    ${p.val.toFixed(0)}
                                  </text>

                                  {/* X Axis Labels */}
                                  <text
                                    x={p.x}
                                    y={chartHeight - 16}
                                    fill="#64748b"
                                    textAnchor="middle"
                                    className="text-[9px] font-medium"
                                  >
                                    {p.date}
                                  </text>
                                </g>
                              ))}
                            </>
                          );
                        })()}
                      </svg>
                    </div>
                  </div>

                  {/* Category Breakdown (Vertical Bar visualizer) */}
                  <div className="bg-white border-2 border-vibrant-border p-5 rounded-[2rem] hover:shadow-lg transition-all lg:col-span-2 space-y-4">
                    <h3 className="text-xs font-black text-vibrant-slate uppercase tracking-wider flex items-center gap-1.5 border-b border-vibrant-border pb-3">
                      <BarChart3 className="w-4 h-4 text-vibrant-orange" /> Category Breakdown
                    </h3>

                    <div className="space-y-4 text-xs pt-1">
                      {["Starters", "Mains", "Desserts", "Beverages"].map((cat) => {
                        const val = stats.categorySales[cat] || 0;
                        const maxVal = Math.max(...(Object.values(stats.categorySales) as number[]), 1);
                        const percent = (val / maxVal) * 100;

                        return (
                          <div key={cat} className="space-y-1.5">
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-bold text-vibrant-slate">{cat}</span>
                              <span className="font-mono text-vibrant-orange-dark font-black">₹{val.toFixed(2)}</span>
                            </div>
                            <div className="h-2.5 bg-vibrant-peach rounded-full overflow-hidden">
                              <div
                                className="h-full bg-vibrant-orange rounded-full transition-all duration-500"
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Bestselling items horizontal progress table */}
                  <div className="bg-white border-2 border-vibrant-border p-5 rounded-[2rem] hover:shadow-lg transition-all lg:col-span-5 space-y-4">
                    <h3 className="text-xs font-black text-vibrant-slate uppercase tracking-wider flex items-center gap-1.5 border-b border-vibrant-border pb-3">
                      <TrendingUp className="w-4 h-4 text-vibrant-orange" /> Bestselling Menu Items
                    </h3>

                    {stats.popularItemsReport.length > 0 ? (
                      <div className="space-y-3.5 text-xs pt-1">
                        {stats.popularItemsReport.map((it, idx) => {
                          const maxQty = Math.max(...stats.popularItemsReport.map((x) => x.quantity), 1);
                          const percent = (it.quantity / maxQty) * 100;

                          return (
                            <div key={idx} className="flex items-center gap-4">
                              {/* Leaderboard crown */}
                              <span className="w-5 font-bold text-vibrant-orange-dark font-mono text-center">#{idx + 1}</span>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-center text-xs mb-1">
                                  <span className="font-bold text-vibrant-slate truncate">{it.name}</span>
                                  <span className="font-mono text-vibrant-gray font-bold">
                                    {it.quantity} sold (₹{it.revenue.toFixed(2)})
                                  </span>
                                </div>
                                <div className="h-2 bg-vibrant-peach rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-vibrant-slate rounded-full transition-all duration-500"
                                    style={{ width: `${percent}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-xs text-gray-400 italic">
                        No sales data recorded yet to compute bestseller analytics.
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* =========================================================================
               GOOGLE SPREADSHEET SYNC PANEL
               ========================================================================= */}
            {activeSubTab === "sheets" && (
              <motion.div
                key="sheets-panel"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <AppsScriptSetup
                  webAppUrl={webAppUrl}
                  onSaveUrl={onSaveUrl}
                  onTestConnection={onTestConnection}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* =========================================================================
         ADD & EDIT CULINARY DISH MODAL OVERLAY
         ========================================================================= */}
      <AnimatePresence>
        {isMenuModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuModalOpen(false)}
              className="fixed inset-0 bg-black z-50 pointer-events-auto"
            />

            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-2xl overflow-hidden max-w-lg w-full shadow-2xl"
              >
                {/* Header */}
                <div className="px-6 py-4.5 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="text-base font-bold text-gray-950">
                    {editingItem ? "Edit Culinary Dish" : "Add New Culinary Creation"}
                  </h3>
                  <button
                    id="close-menu-modal"
                    onClick={() => setIsMenuModalOpen(false)}
                    className="p-1 bg-gray-50 hover:bg-gray-100 text-gray-400 hover:text-gray-600 rounded-full transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Form Body */}
                <form onSubmit={handleMenuSubmit} className="p-6 space-y-4 text-xs text-vibrant-slate">
                  <div className="space-y-1">
                    <label className="font-bold text-vibrant-slate">Dish Title *</label>
                    <input
                      id="menu-form-name"
                      type="text"
                      required
                      className="w-full px-3.5 py-2 bg-vibrant-peach/30 border border-vibrant-border rounded-lg focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange outline-none transition-all"
                      placeholder="e.g. Sizzling Ribeye Steak"
                      value={mName}
                      onChange={(e) => setMName(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="font-bold text-vibrant-slate">Category *</label>
                      <select
                        id="menu-form-category"
                        className="w-full px-3.5 py-2 bg-vibrant-peach/30 border border-vibrant-border rounded-lg focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange outline-none transition-all"
                        value={mCategory}
                        onChange={(e) => setMCategory(e.target.value)}
                      >
                        <option value="Starters">Starters</option>
                        <option value="Mains">Mains</option>
                        <option value="Desserts">Desserts</option>
                        <option value="Beverages">Beverages</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-vibrant-slate">Price (₹ INR) *</label>
                      <input
                        id="menu-form-price"
                        type="number"
                        step="0.01"
                        required
                        className="w-full px-3.5 py-2 bg-vibrant-peach/30 border border-vibrant-border rounded-lg focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange font-mono outline-none transition-all"
                        placeholder="e.g. 280.00"
                        value={mPrice}
                        onChange={(e) => setMPrice(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-vibrant-slate">Image Unsplash/Web URL</label>
                    <input
                      id="menu-form-image"
                      type="url"
                      className="w-full px-3.5 py-2 bg-vibrant-peach/30 border border-vibrant-border rounded-lg focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange font-mono outline-none transition-all"
                      placeholder="https://images.unsplash.com/..."
                      value={mImage}
                      onChange={(e) => setMImage(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-vibrant-slate">Dish Description *</label>
                    <textarea
                      id="menu-form-desc"
                      required
                      className="w-full px-3.5 py-2 bg-vibrant-peach/30 border border-vibrant-border rounded-lg focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange h-20 resize-none outline-none transition-all"
                      placeholder="Explain ingredients, textures, and allergen warnings..."
                      value={mDescription}
                      onChange={(e) => setMDescription(e.target.value)}
                    />
                  </div>

                  <div className="flex items-center gap-2 select-none pt-1">
                    <input
                      id="menu-form-available"
                      type="checkbox"
                      checked={mAvailable}
                      onChange={(e) => setMAvailable(e.target.checked)}
                      className="w-4 h-4 text-vibrant-orange border-vibrant-border rounded focus:ring-vibrant-orange"
                    />
                    <label htmlFor="menu-form-available" className="font-bold text-vibrant-slate cursor-pointer">
                      Available in Stock (Active)
                    </label>
                  </div>

                  {menuFormError && (
                    <p className="p-2 bg-red-50 text-red-600 font-bold rounded-lg border border-red-100">
                      {menuFormError}
                    </p>
                  )}

                  <div className="pt-4 border-t border-vibrant-border flex items-center justify-end gap-2">
                    <button
                      id="menu-form-cancel"
                      type="button"
                      onClick={() => setIsMenuModalOpen(false)}
                      className="px-4 py-2 bg-vibrant-peach text-vibrant-gray hover:bg-vibrant-orange/10 rounded-xl font-bold transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      id="menu-form-submit"
                      type="submit"
                      disabled={isSubmittingMenu}
                      className="px-5 py-2 bg-vibrant-orange hover:bg-vibrant-orange-dark text-white rounded-xl font-black transition-all shadow-md shadow-vibrant-orange/20"
                    >
                      {isSubmittingMenu ? "Saving..." : "Save Culinary Item"}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
