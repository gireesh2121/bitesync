import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  ShoppingBag,
  Plus,
  Minus,
  X,
  MapPin,
  Phone,
  User,
  Clock,
  ChevronRight,
  TrendingUp,
  RotateCcw,
  Sparkles,
  UtensilsCrossed,
  Check,
  FileText,
  Star,
  MessageSquare,
  Send,
  ThumbsUp
} from "lucide-react";
import { MenuItem, CartItem, Order, Feedback } from "../types";
import { playAudioNotification } from "../utils/audio";

interface CustomerViewProps {
  menuItems: MenuItem[];
  onPlaceOrder: (orderData: Omit<Order, "id" | "status" | "timestamp">) => Promise<Order>;
  activeOrders: Order[];
  onCancelOrder: (id: string) => void;
  feedbackList: Feedback[];
  onAddFeedback: (feedbackData: Omit<Feedback, "id" | "timestamp">) => void;
}

export default function CustomerView({
  menuItems,
  onPlaceOrder,
  activeOrders,
  onCancelOrder,
  feedbackList,
  onAddFeedback
}: CustomerViewProps) {
  // Navigation & UI States
  const [activeTab, setActiveTab] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  // Checkout Form State
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [isPlacing, setIsPlacing] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");

  // Food quantity counter for Detail Modal
  const [modalQty, setModalQty] = useState(1);

  // Active view: 'menu' or 'tracking' or 'feedback'
  const [currentView, setCurrentView] = useState<'menu' | 'tracking' | 'feedback'>('menu');
  const [lastPlacedOrderId, setLastPlacedOrderId] = useState<string | null>(null);

  // Preload saved customer details for future order convenience
  useEffect(() => {
    const savedName = localStorage.getItem("bitesync_customer_name");
    const savedPhone = localStorage.getItem("bitesync_customer_phone");
    const savedAddress = localStorage.getItem("bitesync_customer_address");
    if (savedName) setName(savedName);
    if (savedPhone) setPhone(savedPhone);
    if (savedAddress) setAddress(savedAddress);
  }, []);

  // Feedback form states

  const [newFeedbackName, setNewFeedbackName] = useState("");
  const [newFeedbackRating, setNewFeedbackRating] = useState(5);
  const [newFeedbackComment, setNewFeedbackComment] = useState("");
  const [newFeedbackTag, setNewFeedbackTag] = useState("Tasty Food");
  const [newFeedbackItemName, setNewFeedbackItemName] = useState("General Feedback");
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);

  // Categories dynamically extracted from menuItems
  const categories = useMemo(() => {
    const cats = Array.from(new Set(menuItems.map((item) => item.category)));
    return ["All", ...cats.filter(Boolean).sort()];
  }, [menuItems]);

  // Submit new feedback review and save to localStorage
  const handleAddFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFeedbackName.trim() || !newFeedbackComment.trim()) {
      return;
    }

    onAddFeedback({
      customerName: newFeedbackName.trim(),
      rating: newFeedbackRating,
      comment: newFeedbackComment.trim(),
      tag: newFeedbackTag,
      menuItemName: newFeedbackItemName === "General Feedback" ? undefined : newFeedbackItemName
    });

    // Persist name if not already set, for future orders
    if (!localStorage.getItem("bitesync_customer_name") && newFeedbackName.trim()) {
      localStorage.setItem("bitesync_customer_name", newFeedbackName.trim());
      setName(newFeedbackName.trim());
    }

    // Reset feedback comment
    setNewFeedbackComment("");
    setFeedbackSuccess(true);
    setTimeout(() => setFeedbackSuccess(false), 3500);
  };

  // Filtered menu items
  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      const matchesCategory = activeTab === "All" || item.category === activeTab;
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [menuItems, activeTab, searchQuery]);

  // Cart helper functions
  const addToCart = (item: MenuItem, qty: number = 1) => {
    if (!item.available) return;
    setCart((prev) => {
      const existing = prev.find((c) => c.menuItem.id === item.id);
      if (existing) {
        return prev.map((c) =>
          c.menuItem.id === item.id ? { ...c, quantity: c.quantity + qty } : c
        );
      }
      return [...prev, { menuItem: item, quantity: qty }];
    });
  };

  const updateCartQty = (itemId: string, increment: boolean) => {
    setCart((prev) =>
      prev
        .map((c) => {
          if (c.menuItem.id === itemId) {
            const newQty = increment ? c.quantity + 1 : c.quantity - 1;
            return { ...c, quantity: newQty };
          }
          return c;
        })
        .filter((c) => c.quantity > 0)
    );
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => prev.filter((c) => c.menuItem.id !== itemId));
  };

  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0);
  }, [cart]);

  const cartCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  // Handle Order Submit
  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    if (!name.trim() || !phone.trim() || !address.trim()) {
      setCheckoutError("Please fill out all required delivery fields.");
      return;
    }
    setCheckoutError("");
    setIsPlacing(true);

    try {
      const orderItems = cart.map((c) => ({
        menuItemId: c.menuItem.id,
        name: c.menuItem.name,
        quantity: c.quantity,
        price: c.menuItem.price
      }));

      const newOrder = await onPlaceOrder({
        customerName: name,
        customerPhone: phone,
        deliveryAddress: address,
        notes,
        items: orderItems,
        total: parseFloat((cartTotal + 40).toFixed(2)) // 40.00 flat delivery fee
      });

      // Save customer contact details in LocalStorage for easy automatic future order retrieval
      localStorage.setItem("bitesync_customer_name", name);
      localStorage.setItem("bitesync_customer_phone", phone);
      localStorage.setItem("bitesync_customer_address", address);

      // Play success synthesized chime feedback
      playAudioNotification("success");

      // Reset cart and checkout states
      setCart([]);
      setLastPlacedOrderId(newOrder.id);
      setCurrentView('tracking');
      setIsCartOpen(false);
    } catch (err) {
      setCheckoutError("Failed to submit order. Please verify connection and retry.");
    } finally {
      setIsPlacing(false);
    }
  };

  // Find currently tracked order
  const trackedOrder = useMemo(() => {
    if (!lastPlacedOrderId) return activeOrders[0] || null;
    return activeOrders.find((o) => o.id === lastPlacedOrderId) || activeOrders[0] || null;
  }, [activeOrders, lastPlacedOrderId]);

  return (
    <div id="customer-view-root" className="min-h-screen bg-vibrant-peach">
      {/* Header bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-vibrant-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="bg-vibrant-orange text-white p-2.5 rounded-xl shadow-md">
            <UtensilsCrossed className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-vibrant-slate">BiteSync</h1>
            <p className="text-[10px] text-vibrant-orange-dark font-bold tracking-wider uppercase">Vibrant Flavors</p>
          </div>
        </div>

        {/* Search Input */}
        {currentView === 'menu' && (
          <div className="hidden md:flex items-center relative w-80">
            <Search className="w-4 h-4 text-gray-400 absolute left-3" />
            <input
              id="search-input-desktop"
              type="text"
              placeholder="Craving something delicious?"
              className="w-full pl-9 pr-4 py-1.5 bg-white border border-vibrant-border rounded-full text-xs focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange transition-all outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        )}

        {/* View toggles & Cart trigger */}
        <div className="flex items-center gap-3">
          <button
            id="menu-view-toggle"
            onClick={() => setCurrentView('menu')}
            className={`px-4 py-2 rounded-full text-xs font-bold tracking-tight transition-all ${
              currentView === 'menu'
                ? 'bg-vibrant-orange text-white shadow-sm'
                : 'text-vibrant-gray hover:bg-vibrant-orange/10'
            }`}
          >
            Our Menu
          </button>
          
          {(activeOrders.length > 0 || trackedOrder) && (
            <button
              id="tracking-view-toggle"
              onClick={() => setCurrentView('tracking')}
              className={`px-4 py-2 rounded-full text-xs font-bold tracking-tight transition-all relative ${
                currentView === 'tracking'
                  ? 'bg-vibrant-orange text-white shadow-sm'
                  : 'text-vibrant-gray hover:bg-vibrant-orange/10'
              }`}
            >
              Track Order
              {activeOrders.some(o => ['Pending', 'Preparing', 'Out for Delivery'].includes(o.status)) && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-vibrant-orange border border-white rounded-full animate-pulse" />
              )}
            </button>
          )}

          <button
            id="feedback-view-toggle"
            onClick={() => setCurrentView('feedback')}
            className={`px-4 py-2 rounded-full text-xs font-bold tracking-tight transition-all ${
              currentView === 'feedback'
                ? 'bg-vibrant-orange text-white shadow-sm'
                : 'text-vibrant-gray hover:bg-vibrant-orange/10'
            }`}
          >
            Feedback & Reviews
          </button>

          {currentView === 'menu' && (
            <button
              id="cart-trigger-btn"
              onClick={() => setIsCartOpen(true)}
              className="bg-vibrant-orange hover:bg-vibrant-orange-dark text-white px-5 py-2 rounded-full text-xs font-bold shadow-md shadow-vibrant-orange/20 flex items-center gap-1.5 relative transition-all"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Cart ({cartCount})</span>
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-vibrant-yellow text-vibrant-orange text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-md">
                  {cartCount}
                </span>
              )}
            </button>
          )}
        </div>
      </header>

      {/* Main body wrapper */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          {currentView === 'menu' ? (
            <motion.div
              key="menu-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="space-y-8"
            >
              {/* Hero Spot banner */}
              <div className="bg-vibrant-slate rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-xl">
                <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-cover bg-center opacity-10 md:opacity-25 pointer-events-none" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600')` }} />
                <div className="max-w-xl space-y-4 relative z-10">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#FFEE93] rounded-full text-[10px] font-bold tracking-wider uppercase text-vibrant-orange">
                    <Sparkles className="w-3.5 h-3.5" /> Fresh ingredients everyday
                  </div>
                  <h2 className="text-2xl md:text-4xl font-black tracking-tight leading-tight text-white">
                    Choose your <span className="text-[#FF6B35]">flavor!</span>
                  </h2>
                  <p className="text-xs text-white/80 font-medium">
                    Savor expertly crafted culinary masterpieces prepared by world-class chefs, delivered piping hot with real-time Google Sheets tracking.
                  </p>
                </div>
              </div>

              {/* Mobile Search & Filter Row */}
              <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between">
                {/* Category tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
                  {categories.map((cat) => (
                    <button
                      id={`category-tab-${cat.toLowerCase()}`}
                      key={cat}
                      onClick={() => setActiveTab(cat)}
                      className={`px-5 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                        activeTab === cat
                          ? "bg-vibrant-orange text-white shadow-md"
                          : "bg-white border border-vibrant-border text-vibrant-gray hover:border-vibrant-orange/40"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Mobile Search input */}
                <div className="md:hidden flex items-center relative w-full">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3" />
                  <input
                    id="search-input-mobile"
                    type="text"
                    placeholder="Search menu..."
                    className="w-full pl-9 pr-4 py-2.5 bg-white border border-vibrant-border rounded-full text-xs focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange transition-all outline-none"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {/* Menu items grid */}
              {filteredItems.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {filteredItems.map((item) => (
                    <motion.div
                      id={`menu-card-${item.id}`}
                      key={item.id}
                      layoutId={`card-container-${item.id}`}
                      className="bg-white border-2 border-vibrant-border rounded-[2rem] overflow-hidden group hover:border-vibrant-orange/40 transition-all flex flex-col hover:shadow-xl h-full"
                    >
                      {/* Image block */}
                      <div className="h-44 w-full relative overflow-hidden bg-gray-100 shrink-0">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-xs px-2 py-0.5 rounded-md text-[10px] font-bold text-gray-800 tracking-tight uppercase shadow-xs">
                          {item.category}
                        </div>
                        {!item.available && (
                          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center text-white text-xs font-semibold">
                            Sold Out
                          </div>
                        )}
                      </div>

                      {/* Info block */}
                      <div className="p-4.5 flex-1 flex flex-col justify-between space-y-4">
                        <div className="space-y-1.5 cursor-pointer" onClick={() => { setSelectedItem(item); setModalQty(1); }}>
                          <div className="flex items-start justify-between gap-1.5">
                            <h3 className="text-sm font-semibold text-gray-900 group-hover:text-emerald-600 transition-colors line-clamp-1">
                              {item.name}
                            </h3>
                            <span className="text-sm font-bold text-gray-950">₹{item.price.toFixed(2)}</span>
                          </div>
                          <p className="text-xs text-gray-500 leading-normal line-clamp-2">
                            {item.description}
                          </p>
                        </div>

                        {/* Add action */}
                        {!item.available ? (
                          <button
                            disabled
                            className="w-full py-2.5 bg-gray-100 text-gray-400 rounded-xl text-xs font-medium cursor-not-allowed text-center"
                          >
                            Unavailable
                          </button>
                        ) : (() => {
                          const cartItem = cart.find((c) => c.menuItem.id === item.id);
                          if (cartItem) {
                            return (
                              <div className="w-full flex items-center justify-between bg-vibrant-orange text-white rounded-xl py-1 px-3 shadow-md border-2 border-vibrant-orange font-bold text-xs h-10">
                                <button
                                  id={`dec-cart-qty-${item.id}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateCartQty(item.id, false);
                                  }}
                                  className="p-1.5 hover:bg-white/15 active:bg-white/30 rounded-lg transition-colors flex items-center justify-center"
                                  title="Decrease quantity"
                                >
                                  <Minus className="w-3 h-3 stroke-[3]" />
                                </button>
                                <span className="font-black text-sm px-2 select-none">
                                  {cartItem.quantity}
                                </span>
                                <button
                                  id={`inc-cart-qty-${item.id}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateCartQty(item.id, true);
                                  }}
                                  className="p-1.5 hover:bg-white/15 active:bg-white/30 rounded-lg transition-colors flex items-center justify-center"
                                  title="Increase quantity"
                                >
                                  <Plus className="w-3 h-3 stroke-[3]" />
                                </button>
                              </div>
                            );
                          } else {
                            return (
                              <button
                                id={`add-to-cart-quick-${item.id}`}
                                onClick={() => addToCart(item, 1)}
                                className="w-full h-10 bg-vibrant-slate text-white rounded-xl text-xs font-bold hover:bg-vibrant-orange transition-colors flex items-center justify-center gap-1 shadow-md"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                Add to Cart
                              </button>
                            );
                          }
                        })()}
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 bg-white border border-gray-200 rounded-2xl p-8">
                  <ShoppingBag className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-sm font-semibold text-gray-850">No culinary items found</h3>
                  <p className="text-xs text-gray-500 mt-1">Try tweaking your search keywords or choosing a different category.</p>
                  <button
                    onClick={() => { setActiveTab("All"); setSearchQuery(""); }}
                    className="mt-4 px-4 py-2 bg-gray-900 text-white text-xs font-medium rounded-full hover:bg-gray-800 transition-all"
                  >
                    Reset Filters
                  </button>
                </div>
              )}
            </motion.div>
          ) : currentView === 'tracking' ? (
            /* =========================================================================
               ORDER PROGRESS TRACKING SECTION
               ========================================================================= */
            <motion.div
              key="tracking-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="max-w-3xl mx-auto space-y-6"
            >
              {trackedOrder ? (
                <div className="space-y-6">
                  {/* Summary progress bar */}
                  <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs relative overflow-hidden">
                    {/* Glowing status line */}
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-vibrant-orange" />
                    
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-5">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-vibrant-orange-dark bg-[#FFEE93] px-2.5 py-0.5 rounded-full tracking-wider uppercase">
                            {trackedOrder.status}
                          </span>
                          <span className="text-xs font-mono text-gray-400">#{trackedOrder.id}</span>
                        </div>
                        <h2 className="text-lg font-bold text-gray-900 mt-1">
                          {trackedOrder.status === 'Pending' && "Waiting for restaurant approval"}
                          {trackedOrder.status === 'Preparing' && "Your chef is preparing the ingredients"}
                          {trackedOrder.status === 'Out for Delivery' && "Out for delivery - heading your way!"}
                          {trackedOrder.status === 'Delivered' && "Order successfully delivered. Enjoy!"}
                          {trackedOrder.status === 'Cancelled' && "This order has been cancelled"}
                        </h2>
                      </div>
                      
                      {['Pending', 'Preparing', 'Out for Delivery'].includes(trackedOrder.status) && (
                        <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 px-4 py-2 rounded-xl">
                          <Clock className="w-4 h-4 text-emerald-500" />
                          <div>
                            <p className="text-[9px] text-gray-400 uppercase font-bold tracking-wider">Estimated Time</p>
                            <p className="text-xs font-semibold text-gray-800">
                              {trackedOrder.status === 'Pending' ? "25 - 35 mins" : ""}
                              {trackedOrder.status === 'Preparing' ? "15 - 20 mins" : ""}
                              {trackedOrder.status === 'Out for Delivery' ? "5 - 10 mins" : ""}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Interactive tracker stepper */}
                    <div className="mt-8 relative">
                      {/* Grey background bar */}
                      <div className="absolute top-4 left-4 right-4 h-0.5 bg-gray-150 -z-10" />
                      
                      {/* Active green bar */}
                      <div
                        className="absolute top-4 left-4 h-0.5 bg-vibrant-orange -z-10 transition-all duration-500"
                        style={{
                          width:
                            trackedOrder.status === "Pending"
                              ? "0%"
                              : trackedOrder.status === "Preparing"
                              ? "33%"
                              : trackedOrder.status === "Out for Delivery"
                              ? "66%"
                              : trackedOrder.status === "Delivered"
                              ? "100%"
                              : "0%"
                        }}
                      />

                      <div className="flex justify-between items-start text-center">
                        {[
                          { key: "Pending", label: "Approved" },
                          { key: "Preparing", label: "Cooking" },
                          { key: "Out for Delivery", label: "Shipping" },
                          { key: "Delivered", label: "Enjoy" }
                        ].map((step, idx) => {
                          const statuses = ["Pending", "Preparing", "Out for Delivery", "Delivered"];
                          const orderIdx = statuses.indexOf(trackedOrder.status);
                          const stepIdx = statuses.indexOf(step.key);
                          const isCompleted = trackedOrder.status !== 'Cancelled' && orderIdx >= stepIdx;
                          const isActive = trackedOrder.status !== 'Cancelled' && orderIdx === stepIdx;

                          return (
                            <div key={step.key} className="flex flex-col items-center flex-1">
                              <div
                                className={`w-8.5 h-8.5 rounded-full flex items-center justify-center border-2 transition-all ${
                                  isCompleted
                                    ? "bg-vibrant-orange border-vibrant-orange text-white shadow-xs"
                                    : "bg-white border-vibrant-border text-vibrant-gray"
                                } ${isActive ? "ring-4 ring-vibrant-orange/15" : ""}`}
                              >
                                {isCompleted ? (
                                  <Check className="w-4 h-4 stroke-[3]" />
                                ) : (
                                  <span className="text-xs font-bold">{idx + 1}</span>
                                )}
                              </div>
                              <span className={`text-[10px] font-bold mt-2.5 uppercase tracking-wider ${
                                isCompleted ? "text-gray-900" : "text-gray-400"
                              }`}>
                                {step.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Order detail checklist */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Delivery summary card */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-4 md:col-span-2">
                      <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-100 pb-2.5">
                        <MapPin className="w-4 h-4 text-gray-400" /> Delivery Details
                      </h3>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        <div className="space-y-1">
                          <p className="text-gray-400">Recipient Name</p>
                          <p className="font-semibold text-gray-850 flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-gray-400" /> {trackedOrder.customerName}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-gray-400">Phone Contact</p>
                          <p className="font-semibold text-gray-850 flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-gray-400" /> {trackedOrder.customerPhone}
                          </p>
                        </div>
                        <div className="space-y-1 sm:col-span-2">
                          <p className="text-gray-400">Delivery Address</p>
                          <p className="font-semibold text-gray-850">{trackedOrder.deliveryAddress}</p>
                        </div>
                        {trackedOrder.notes && (
                          <div className="space-y-1 sm:col-span-2 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                            <p className="text-gray-400">Special Cooking Notes</p>
                            <p className="font-light italic text-gray-600">"{trackedOrder.notes}"</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Receipt breakdown */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-4 flex flex-col justify-between">
                      <div>
                        <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-100 pb-2.5">
                          <FileText className="w-4 h-4 text-gray-400" /> Invoice Check
                        </h3>
                        <div className="mt-3.5 space-y-2.5 overflow-y-auto max-h-40 pr-1">
                          {trackedOrder.items.map((it) => (
                            <div key={it.menuItemId} className="flex justify-between items-center text-xs">
                              <span className="text-gray-600 truncate max-w-[120px]">
                                <span className="font-semibold text-gray-900 mr-1.5">{it.quantity}x</span>
                                {it.name}
                              </span>
                              <span className="font-mono text-gray-500">₹{(it.price * it.quantity).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="border-t border-gray-100 pt-3.5 space-y-2 text-xs">
                        <div className="flex justify-between text-gray-500">
                          <span>Subtotal</span>
                          <span className="font-mono">₹{(trackedOrder.total - 40).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-gray-500">
                          <span>Delivery Fee</span>
                          <span className="font-mono">₹40.00</span>
                        </div>
                        <div className="flex justify-between font-bold text-gray-900 text-sm pt-1.5 border-t border-dashed border-vibrant-border">
                          <span>Paid Total</span>
                          <span className="font-mono text-vibrant-orange-dark font-black">₹{trackedOrder.total.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions footer */}
                  <div className="flex items-center justify-between gap-3 bg-white border border-gray-100 p-4 rounded-2xl">
                    <button
                      id="order-more-btn"
                      onClick={() => setCurrentView('menu')}
                      className="px-5 py-2.5 bg-gray-900 text-white text-xs font-semibold rounded-full hover:bg-gray-800 transition-colors flex items-center gap-1"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Browse & Order More
                    </button>
                    
                    {['Pending'].includes(trackedOrder.status) && (
                      <button
                        id="cancel-active-order-btn"
                        onClick={() => {
                          if (confirm("Are you sure you want to cancel this order? This action cannot be undone.")) {
                            onCancelOrder(trackedOrder.id);
                          }
                        }}
                        className="px-5 py-2.5 text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-full border border-rose-200 transition-colors"
                      >
                        Cancel Order
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-20 bg-white border border-gray-200 rounded-2xl p-8">
                  <ShoppingBag className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-sm font-semibold text-gray-850">No active tracking history</h3>
                  <p className="text-xs text-gray-500 mt-1">Place your first order to track cooking and transit times live.</p>
                  <button
                    onClick={() => setCurrentView('menu')}
                    className="mt-4 px-4 py-2 bg-gray-900 text-white text-xs font-medium rounded-full hover:bg-gray-800 transition-all"
                  >
                    Go to Menu
                  </button>
                </div>
              )}
            </motion.div>
          ) : (
            /* =========================================================================
               CUSTOMER FEEDBACK SECTION
               ========================================================================= */
            <motion.div
              key="feedback-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="max-w-6xl mx-auto space-y-8"
            >
              {/* Header section */}
              <div className="bg-white border-2 border-vibrant-border rounded-[2.5rem] p-8 md:p-10 relative overflow-hidden shadow-xl">
                <div className="max-w-2xl space-y-4">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#FFEE93] rounded-full text-[10px] font-bold tracking-wider uppercase text-vibrant-orange">
                    <MessageSquare className="w-3.5 h-3.5" /> Dining Experiences
                  </div>
                  <h2 className="text-2xl md:text-3.5xl font-black tracking-tight text-vibrant-slate leading-tight">
                    We Value Your <span className="text-[#FF6B35]">Feedback!</span>
                  </h2>
                  <p className="text-xs text-vibrant-gray font-medium leading-relaxed">
                    Help us elevate our cuisine and service. Share your culinary experiences, rate your favorite dishes, and read honest reviews from fellow food lovers.
                  </p>
                </div>
              </div>

              {/* Bento Grid section */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Form on left (5 cols) */}
                <div className="lg:col-span-5 bg-white border-2 border-vibrant-border rounded-[2rem] p-6 shadow-lg space-y-6">
                  <div>
                    <h3 className="text-base font-extrabold text-vibrant-slate">Share Your Experience</h3>
                    <p className="text-[11px] text-vibrant-gray mt-1">Submit your rating and comments instantly.</p>
                  </div>

                  <form onSubmit={handleAddFeedback} className="space-y-4">
                    {/* Customer Name */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700 block">Your Name</label>
                      <div className="relative">
                        <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                        <input
                          type="text"
                          required
                          placeholder="e.g. Aarav Sharma"
                          className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-vibrant-border rounded-xl text-xs focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange outline-none font-bold"
                          value={newFeedbackName}
                          onChange={(e) => setNewFeedbackName(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Menu Item dropdown */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700 block">Which dish are you reviewing?</label>
                      <select
                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-vibrant-border rounded-xl text-xs focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange outline-none font-bold text-gray-800"
                        value={newFeedbackItemName}
                        onChange={(e) => setNewFeedbackItemName(e.target.value)}
                      >
                        <option value="General Feedback">General Dining Feedback</option>
                        {menuItems.map((item) => (
                          <option key={item.id} value={item.name}>
                            {item.name} ({item.category})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Rating Select */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700 block">Your Rating</label>
                      <div className="flex items-center gap-1 bg-gray-50 p-2 rounded-xl border border-vibrant-border">
                        {[1, 2, 3, 4, 5].map((stars) => (
                          <button
                            type="button"
                            key={stars}
                            onClick={() => setNewFeedbackRating(stars)}
                            className="p-1 hover:scale-110 transition-transform"
                          >
                            <Star
                              className={`w-6 h-6 ${
                                stars <= newFeedbackRating
                                  ? "text-vibrant-yellow fill-vibrant-yellow"
                                  : "text-gray-200"
                              }`}
                            />
                          </button>
                        ))}
                        <span className="text-xs font-black text-gray-700 ml-2">
                          {newFeedbackRating} Star{newFeedbackRating > 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>

                    {/* Quick Tags selector */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700 block">Add Tag</label>
                      <div className="flex flex-wrap gap-1.5">
                        {["Tasty Food", "Fast Delivery", "Great Service", "Fresh Ingredients", "Highly Recommend"].map((tag) => (
                          <button
                            type="button"
                            key={tag}
                            onClick={() => setNewFeedbackTag(tag)}
                            className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-all border ${
                              newFeedbackTag === tag
                                ? "bg-vibrant-orange text-white border-vibrant-orange shadow-xs"
                                : "bg-gray-50 border-gray-200 text-vibrant-gray hover:border-gray-300"
                            }`}
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Comments Textarea */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700 block">Your Review</label>
                      <textarea
                        required
                        rows={3}
                        placeholder="Tell us about the texture, spice levels, delivery speed, or overall experience..."
                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-vibrant-border rounded-xl text-xs focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange outline-none resize-none leading-relaxed font-medium text-gray-850"
                        value={newFeedbackComment}
                        onChange={(e) => setNewFeedbackComment(e.target.value)}
                      />
                    </div>

                    {/* Success notification */}
                    <AnimatePresence>
                      {feedbackSuccess && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] p-2.5 rounded-xl font-bold flex items-center gap-1.5"
                        >
                          <Check className="w-4 h-4 text-emerald-600" />
                          Feedback submitted! Thank you for supporting us.
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      className="w-full py-3 bg-vibrant-orange hover:bg-vibrant-orange-dark text-white rounded-xl text-xs font-bold shadow-md shadow-vibrant-orange/20 transition-all flex items-center justify-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Submit Review
                    </button>
                  </form>
                </div>

                {/* Dashboard & Reviews list on right (7 cols) */}
                <div className="lg:col-span-7 space-y-6">
                  {/* Rating Scorecard card */}
                  <div className="bg-white border-2 border-vibrant-border rounded-[2rem] p-6 shadow-md flex flex-col sm:flex-row items-center gap-6">
                    <div className="text-center sm:border-r sm:border-gray-100 sm:pr-8">
                      <p className="text-[10px] uppercase font-bold text-vibrant-gray tracking-wider">Average Rating</p>
                      <h4 className="text-4xl font-black text-vibrant-slate mt-1">
                        {(feedbackList.reduce((sum, f) => sum + f.rating, 0) / (feedbackList.length || 1)).toFixed(1)}
                      </h4>
                      <div className="flex items-center justify-center gap-0.5 mt-1.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star key={star} className="w-3.5 h-3.5 fill-vibrant-yellow text-vibrant-yellow" />
                        ))}
                      </div>
                      <p className="text-[10px] text-gray-400 mt-1 font-semibold">{feedbackList.length} global ratings</p>
                    </div>

                    <div className="flex-1 w-full space-y-2">
                      {[5, 4, 3, 2, 1].map((stars) => {
                        const count = feedbackList.filter(f => f.rating === stars).length;
                        const percent = feedbackList.length > 0 ? (count / feedbackList.length) * 100 : 0;
                        return (
                          <div key={stars} className="flex items-center gap-3 text-xs text-vibrant-gray font-bold">
                            <span className="w-3 text-right">{stars}</span>
                            <Star className="w-3 h-3 fill-gray-400 text-gray-400" />
                            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div className="bg-vibrant-orange h-full" style={{ width: `${percent}%` }} />
                            </div>
                            <span className="w-8 text-right text-gray-400 text-[10px]">{Math.round(percent)}%</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Reviews lists card */}
                  <div className="bg-white border-2 border-vibrant-border rounded-[2rem] p-6 shadow-md space-y-4">
                    <div className="flex items-center justify-between border-b border-gray-150 pb-3">
                      <h3 className="text-sm font-black text-vibrant-slate">Diners Community Reviews</h3>
                      <span className="text-xs font-bold text-vibrant-orange bg-vibrant-orange/15 px-2.5 py-0.5 rounded-full font-mono">
                        {feedbackList.length} Reviews
                      </span>
                    </div>

                    {/* Scrollable list */}
                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1 scrollbar-thin">
                      {feedbackList.map((feedback) => (
                        <div
                          key={feedback.id}
                          className="p-4 bg-gray-50 rounded-2xl border border-gray-150 space-y-2.5 transition-all hover:bg-white hover:border-vibrant-orange/30 shadow-xs"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <h5 className="text-xs font-bold text-gray-950">{feedback.customerName}</h5>
                              <p className="text-[9px] text-gray-400 font-medium mt-0.5">
                                {new Date(feedback.timestamp).toLocaleDateString(undefined, {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>

                            {/* Stars rating badges */}
                            <div className="flex items-center gap-0.5 bg-vibrant-yellow/15 px-2 py-0.5 rounded-full">
                              <Star className="w-3 h-3 fill-vibrant-yellow text-vibrant-yellow" />
                              <span className="text-[10px] font-black text-vibrant-orange-dark">{feedback.rating}.0</span>
                            </div>
                          </div>

                          {/* Reviewed Dish Info */}
                          {feedback.menuItemName && (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-vibrant-slate text-white rounded-lg text-[10px] font-bold">
                              <UtensilsCrossed className="w-3 h-3 text-vibrant-orange" />
                              <span>Reviewed: {feedback.menuItemName}</span>
                            </div>
                          )}

                          {/* Tag */}
                          {feedback.tag && (
                            <span className="inline-block ml-2 text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                              {feedback.tag}
                            </span>
                          )}

                          {/* Comment comment */}
                          <p className="text-xs text-vibrant-slate leading-relaxed font-light font-sans italic">
                            "{feedback.comment}"
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* =========================================================================
         SLIDING CART DRAWER (CLIENT SIDE SIDEBAR)
         ========================================================================= */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-black z-50 pointer-events-auto"
            />

            {/* Sidebar drawer panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.25 }}
              className="fixed right-0 top-0 bottom-0 w-full sm:w-[460px] bg-white z-50 shadow-2xl border-l border-gray-100 flex flex-col justify-between"
            >
              {/* Header */}
              <div className="px-6 py-4.5 border-b border-vibrant-border flex items-center justify-between bg-vibrant-peach/30">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-vibrant-orange" />
                  <h2 className="text-base font-black text-vibrant-slate">Your Basket</h2>
                  <span className="text-xs bg-[#FFEE93] text-vibrant-orange font-bold px-2.5 py-0.5 rounded-full">
                    {cartCount} items
                  </span>
                </div>
                <button
                  id="close-cart-btn"
                  onClick={() => setIsCartOpen(false)}
                  className="p-1.5 bg-gray-50 hover:bg-gray-100 text-gray-400 hover:text-gray-600 rounded-full transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scrollable list & Checkout forms */}
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 scrollbar-thin">
                {cart.length > 0 ? (
                  <>
                    {/* Item list */}
                    <div className="space-y-4">
                      {cart.map((c) => (
                        <div
                          key={c.menuItem.id}
                          className="flex items-center gap-3.5 pb-4 border-b border-gray-50"
                        >
                          <img
                            src={c.menuItem.image}
                            alt={c.menuItem.name}
                            className="w-14 h-14 object-cover rounded-xl bg-gray-100 shrink-0"
                            referrerPolicy="no-referrer"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-semibold text-gray-900 truncate">
                              {c.menuItem.name}
                            </h4>
                            <p className="text-xs text-gray-500 font-mono mt-0.5">₹{c.menuItem.price.toFixed(2)}</p>
                          </div>
                          
                          {/* Quantity control */}
                          <div className="flex items-center gap-2.5 bg-gray-50 border border-gray-150 px-2 py-1 rounded-lg">
                            <button
                              id={`decrease-qty-${c.menuItem.id}`}
                              onClick={() => updateCartQty(c.menuItem.id, false)}
                              className="text-gray-500 hover:text-gray-900 p-0.5"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-xs font-bold text-gray-850 min-w-4 text-center">{c.quantity}</span>
                            <button
                              id={`increase-qty-${c.menuItem.id}`}
                              onClick={() => updateCartQty(c.menuItem.id, true)}
                              className="text-gray-500 hover:text-gray-900 p-0.5"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Checkout Details Form */}
                    <form onSubmit={handleCheckout} className="space-y-4 border-t border-vibrant-border pt-5">
                      <h3 className="text-xs font-bold text-vibrant-slate uppercase tracking-wider flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-vibrant-orange" /> Delivery Coordinates
                      </h3>

                      <div className="space-y-3 text-xs">
                        <div className="relative">
                          <User className="w-4 h-4 text-vibrant-gray absolute left-3 top-3" />
                          <input
                            id="customer-name-input"
                            type="text"
                            required
                            placeholder="Full Name"
                            className="w-full pl-9 pr-4 py-2.5 bg-vibrant-peach/30 border border-vibrant-border rounded-lg focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange transition-all outline-none"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                          />
                        </div>

                        <div className="relative">
                          <Phone className="w-4 h-4 text-vibrant-gray absolute left-3 top-3" />
                          <input
                            id="customer-phone-input"
                            type="tel"
                            required
                            placeholder="Phone Number"
                            className="w-full pl-9 pr-4 py-2.5 bg-vibrant-peach/30 border border-vibrant-border rounded-lg focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange transition-all outline-none"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                          />
                        </div>

                        <div className="relative">
                          <MapPin className="w-4 h-4 text-vibrant-gray absolute left-3 top-3" />
                          <input
                            id="customer-address-input"
                            type="text"
                            required
                            placeholder="Delivery Address"
                            className="w-full pl-9 pr-4 py-2.5 bg-vibrant-peach/30 border border-vibrant-border rounded-lg focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange transition-all outline-none"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                          />
                        </div>

                        <div>
                          <textarea
                            id="customer-notes-input"
                            placeholder="Cooking notes, allergies, gate code, or delivery instructions..."
                            className="w-full px-3.5 py-2 bg-white border border-vibrant-border rounded-lg focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange h-20 resize-none transition-all outline-none"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                          />
                        </div>
                      </div>

                      {checkoutError && (
                        <p className="text-xs font-semibold text-red-500 bg-red-50 p-2.5 rounded-md border border-red-100">
                          {checkoutError}
                        </p>
                      )}

                      <button type="submit" className="hidden" />
                    </form>
                  </>
                ) : (
                  <div className="text-center py-20">
                    <ShoppingBag className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                    <h3 className="text-sm font-semibold text-gray-800">Your basket is empty</h3>
                    <p className="text-xs text-gray-400 mt-1">Browse our handpicked gourmet items and load your cart!</p>
                  </div>
                )}
              </div>

              {/* Subtotal & Action buttons */}
              {cart.length > 0 && (
                <div className="px-6 py-5 bg-gray-50 border-t border-gray-100 space-y-4">
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between text-gray-500">
                      <span>Subtotal</span>
                      <span className="font-mono">₹{cartTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-gray-500">
                      <span>Delivery Flat Fee</span>
                      <span className="font-mono">₹40.00</span>
                    </div>
                    <div className="flex justify-between font-bold text-gray-900 text-sm pt-2.5 border-t border-vibrant-border">
                      <span>Total Invoice</span>
                      <span className="font-mono text-vibrant-orange-dark font-black">₹{(cartTotal + 40).toFixed(2)}</span>
                    </div>
                  </div>

                  <button
                    id="submit-checkout-btn"
                    onClick={handleCheckout}
                    disabled={isPlacing || cart.length === 0}
                    className="w-full py-3 bg-vibrant-orange hover:bg-vibrant-orange-dark disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-vibrant-orange/20 flex items-center justify-center gap-2"
                  >
                    {isPlacing ? (
                      <span>Placing Order...</span>
                    ) : (
                      <>
                        <span>Submit Secure Order</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* =========================================================================
         CRAFTED DETAIL DIALOG OVERLAY (FOOD DETAILS MODAL)
         ========================================================================= */}
      <AnimatePresence>
        {selectedItem && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedItem(null)}
              className="fixed inset-0 bg-black z-50 pointer-events-auto"
            />

            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-2xl overflow-hidden max-w-lg w-full shadow-2xl relative"
              >
                {/* Dismiss X button */}
                <button
                  id="close-food-modal"
                  onClick={() => setSelectedItem(null)}
                  className="absolute top-4 right-4 z-10 p-1.5 bg-black/40 hover:bg-black/60 text-white rounded-full transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Hero large picture */}
                <div className="h-64 w-full bg-gray-100 relative">
                  <img
                    src={selectedItem.image}
                    alt={selectedItem.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
                  <div className="absolute bottom-4 left-4 text-white">
                    <span className="text-[10px] font-bold bg-white/25 backdrop-blur-md px-2.5 py-0.5 rounded-md uppercase tracking-wider">
                      {selectedItem.category}
                    </span>
                    <h3 className="text-lg font-bold mt-1.5 leading-none">{selectedItem.name}</h3>
                  </div>
                </div>

                {/* Information body */}
                <div className="p-6 space-y-6">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <p className="text-xs font-bold text-vibrant-gray uppercase tracking-wider">Dish Description</p>
                      <span className="text-xl font-extrabold text-vibrant-orange-dark">₹{selectedItem.price.toFixed(2)}</span>
                    </div>
                    <p className="text-xs text-vibrant-slate leading-relaxed font-light">
                      {selectedItem.description}
                    </p>
                  </div>

                  {/* Highlights/Badges */}
                  <div className="grid grid-cols-2 gap-3 bg-gray-50 border border-gray-100 p-3.5 rounded-xl text-[11px] text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Prep time: 10-15 mins</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Popularity: High</span>
                    </div>
                  </div>

                  {/* Footer actions with quantity adjuster */}
                  <div className="flex items-center justify-between gap-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-3 bg-gray-100 px-3.5 py-2 rounded-xl">
                      <button
                        id="modal-decrease-qty"
                        onClick={() => setModalQty(q => Math.max(1, q - 1))}
                        className="text-gray-500 hover:text-gray-900"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-xs font-bold text-gray-850 min-w-5 text-center">{modalQty}</span>
                      <button
                        id="modal-increase-qty"
                        onClick={() => setModalQty(q => q + 1)}
                        className="text-gray-500 hover:text-gray-900"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      id="modal-add-to-cart-btn"
                      onClick={() => {
                        addToCart(selectedItem, modalQty);
                        setSelectedItem(null);
                      }}
                      className="flex-1 py-2.5 bg-vibrant-orange hover:bg-vibrant-orange-dark text-white rounded-xl text-xs font-bold shadow-md shadow-vibrant-orange/25 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      Add {(modalQty * selectedItem.price).toFixed(2)} to Basket
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
