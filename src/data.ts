import { MenuItem, Order } from './types';

export const INITIAL_MENU_ITEMS: MenuItem[] = [
  {
    id: "p1",
    name: "Classic Margherita Pizza",
    description: "Hand-stretched crust topped with rich Italian tomato sauce, fresh mozzarella, fresh basil leaves, and olive oil.",
    price: 240.00,
    category: "Pizza",
    image: "https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?w=600&auto=format&fit=crop&q=80",
    available: true
  },
  {
    id: "p2",
    name: "Fiery Paneer Tikka Pizza",
    description: "Spicy tandoori paneer chunks, capsicum, red onions, and mozzarella with a spicy house pizza sauce.",
    price: 290.00,
    category: "Pizza",
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=80",
    available: true
  },
  {
    id: "pa1",
    name: "Creamy Alfredo Pasta",
    description: "Penne pasta tossed in a rich, velvety white sauce made of fresh cream, butter, parmesan cheese, garlic, and mushrooms.",
    price: 260.00,
    category: "Pasta",
    image: "https://images.unsplash.com/photo-1645112411341-6c4fd023714a?w=600&auto=format&fit=crop&q=80",
    available: true
  },
  {
    id: "pa2",
    name: "Spicy Tomato Arrabbiata Pasta",
    description: "Penne cooked in a fiery red sauce made of crushed tomatoes, garlic, red chili flakes, and fresh basil.",
    price: 220.00,
    category: "Pasta",
    image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80",
    available: true
  },
  {
    id: "b1",
    name: "Crunchy Double Veggie Burger",
    description: "Double crispy vegetable patties, melted cheddar cheese, fresh lettuce, tomato, and our signature smoked burger sauce.",
    price: 150.00,
    category: "Burgers",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80",
    available: true
  },
  {
    id: "b2",
    name: "Classic Crispy Chicken Burger",
    description: "Golden fried seasoned chicken breast fillet topped with creamy mayo, pickles, and crisp lettuce on a toasted brioche bun.",
    price: 180.00,
    category: "Burgers",
    image: "https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?w=600&auto=format&fit=crop&q=80",
    available: true
  },
  {
    id: "s1",
    name: "Grilled Paneer Club Sandwich",
    description: "Triple-decker sandwich loaded with grilled paneer slices, cucumber, tomatoes, lettuce, green chutney, and cheese.",
    price: 140.00,
    category: "Sandwiches",
    image: "https://images.unsplash.com/photo-1521390188846-e2a3a97453a0?w=600&auto=format&fit=crop&q=80",
    available: true
  },
  {
    id: "r1",
    name: "Kathi Paneer Roll",
    description: "Flaky paratha wrap stuffed with spiced tandoori paneer tikka, sliced onions, bell peppers, and mint mayonnaise.",
    price: 120.00,
    category: "Rolls",
    image: "https://images.unsplash.com/photo-1626132647523-66f5bf380027?w=600&auto=format&fit=crop&q=80",
    available: true
  },
  {
    id: "r2",
    name: "Classic Chicken Egg Roll",
    description: "Egg-coated flatbread rolled with juicy shredded chicken, fresh lemon, chopped green chilies, and tangy spices.",
    price: 140.00,
    category: "Rolls",
    image: "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=600&auto=format&fit=crop&q=80",
    available: true
  },
  {
    id: "m1",
    name: "Paneer Butter Masala",
    description: "Creamy cottage cheese cubes in a rich, spiced tomato-butter gravy with fresh cream.",
    price: 280.00,
    category: "Mains",
    image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=600&auto=format&fit=crop&q=80",
    available: true
  },
  {
    id: "m2",
    name: "Butter Chicken (Murgh Makhani)",
    description: "Succulent clay-oven tandoori chicken pieces simmered in a creamy, buttery spiced tomato curry.",
    price: 340.00,
    category: "Mains",
    image: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=600&auto=format&fit=crop&q=80",
    available: true
  },
  {
    id: "m3",
    name: "Crispy Samosa Platter",
    description: "Golden fried flaky pastries stuffed with spiced potatoes and peas, served with sweet tamarind and spicy mint chutneys.",
    price: 110.00,
    category: "Starters",
    image: "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=600&auto=format&fit=crop&q=80",
    available: true
  },
  {
    id: "m4",
    name: "Hara Bhara Kabab",
    description: "Delicately spiced, shallow-fried patties made of spinach, green peas, paneer, and potatoes.",
    price: 160.00,
    category: "Starters",
    image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop&q=80",
    available: true
  },
  {
    id: "m5",
    name: "Warm Gulab Jamun",
    description: "Two classic soft milk-solid dumplings fried golden and soaked in hot rose and cardamom-infused sugar syrup.",
    price: 90.00,
    category: "Desserts",
    image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600&auto=format&fit=crop&q=80",
    available: true
  },
  {
    id: "m6",
    name: "Kesar Rasmalai",
    description: "Delicate cottage cheese patties soaked in thickened, sweetened saffron-infused milk, garnished with almonds and pistachios.",
    price: 120.00,
    category: "Desserts",
    image: "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=600&auto=format&fit=crop&q=80",
    available: true
  },
  {
    id: "m7",
    name: "Masala Chai (Cutting)",
    description: "Authentic Indian spiced hot milk tea brewed with fresh ginger, crushed cardamom, cloves, and premium CTC tea leaves.",
    price: 40.00,
    category: "Beverages",
    image: "https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=600&auto=format&fit=crop&q=80",
    available: true
  },
  {
    id: "m8",
    name: "Mango Lassi",
    description: "Creamy, refreshing yogurt-based Indian beverage blended with sweet mango pulp and cardamom.",
    price: 80.00,
    category: "Beverages",
    image: "https://images.unsplash.com/photo-1497534446932-c925b458314e?w=600&auto=format&fit=crop&q=80",
    available: true
  }
];

// Helper to generate mock order times in the past
const getPastDateString = (daysAgo: number, hour: number, minute: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
};

export const INITIAL_ORDERS: Order[] = [
  {
    id: "ORD-9842",
    customerName: "Sarah Jenkins",
    customerPhone: "+91 98765 43210",
    deliveryAddress: "Flat 402, Sunshine Heights, Koramangala, Bengaluru",
    notes: "Please leave at the reception and call.",
    items: [
      { menuItemId: "m1", name: "Paneer Butter Masala", quantity: 1, price: 280.00 },
      { menuItemId: "m7", name: "Masala Chai (Cutting)", quantity: 2, price: 40.00 }
    ],
    total: 360.00,
    status: "Delivered",
    timestamp: getPastDateString(0, 14, 30) // Today, 2:30 PM
  },
  {
    id: "ORD-8711",
    customerName: "Marcus Vance",
    customerPhone: "+91 91234 56789",
    deliveryAddress: "A-12, Sector 62, Noida, UP",
    notes: "Make it extra spicy, please!",
    items: [
      { menuItemId: "m2", name: "Butter Chicken (Murgh Makhani)", quantity: 2, price: 340.00 },
      { menuItemId: "m8", name: "Mango Lassi", quantity: 2, price: 80.00 },
      { menuItemId: "m5", name: "Warm Gulab Jamun", quantity: 1, price: 90.00 }
    ],
    total: 930.00,
    status: "Preparing",
    timestamp: getPastDateString(0, 9, 15) // Today, 9:15 AM
  },
  {
    id: "ORD-5120",
    customerName: "Emily Zhao",
    customerPhone: "+91 99887 76655",
    deliveryAddress: "Building 5B, DLF Cyber City, Gurugram",
    notes: "Send extra mint chutney.",
    items: [
      { menuItemId: "m3", name: "Crispy Samosa Platter", quantity: 2, price: 110.00 },
      { menuItemId: "m4", name: "Hara Bhara Kabab", quantity: 1, price: 160.00 }
    ],
    total: 380.00,
    status: "Pending",
    timestamp: getPastDateString(0, 10, 0) // Today, 10:00 AM (just now)
  },
  {
    id: "ORD-3201",
    customerName: "Arthur Dent",
    customerPhone: "+91 88776 65544",
    deliveryAddress: "Flat 203, Block B, Raheja Vihar, Powai, Mumbai",
    notes: "Is the lassi sweet?",
    items: [
      { menuItemId: "m4", name: "Hara Bhara Kabab", quantity: 1, price: 160.00 },
      { menuItemId: "m7", name: "Masala Chai (Cutting)", quantity: 1, price: 40.00 },
      { menuItemId: "m6", name: "Kesar Rasmalai", quantity: 1, price: 120.00 }
    ],
    total: 320.00,
    status: "Delivered",
    timestamp: getPastDateString(1, 19, 10) // Yesterday evening
  },
  {
    id: "ORD-1124",
    customerName: "Chloe Dupont",
    customerPhone: "+91 77665 54433",
    deliveryAddress: "Villa 45, Palm Meadows, Whitefield, Bengaluru",
    notes: "Contactless delivery.",
    items: [
      { menuItemId: "m1", name: "Paneer Butter Masala", quantity: 2, price: 280.00 },
      { menuItemId: "m5", name: "Warm Gulab Jamun", quantity: 2, price: 90.00 }
    ],
    total: 740.00,
    status: "Delivered",
    timestamp: getPastDateString(1, 13, 0) // Yesterday lunch
  },
  {
    id: "ORD-6541",
    customerName: "John Smith",
    customerPhone: "+91 66554 43322",
    deliveryAddress: "Row House 7, Pune Cantonment, Pune",
    notes: "",
    items: [
      { menuItemId: "m2", name: "Butter Chicken (Murgh Makhani)", quantity: 3, price: 340.00 },
      { menuItemId: "m8", name: "Mango Lassi", quantity: 3, price: 80.00 }
    ],
    total: 1260.00,
    status: "Delivered",
    timestamp: getPastDateString(2, 18, 45) // 2 days ago
  },
  {
    id: "ORD-1090",
    customerName: "Linda K.",
    customerPhone: "+91 99988 87776",
    deliveryAddress: "Tower A, 14th Floor, Lodha Bellissimo, Worli, Mumbai",
    notes: "Ring bell twice.",
    items: [
      { menuItemId: "m3", name: "Crispy Samosa Platter", quantity: 1, price: 110.00 },
      { menuItemId: "m6", name: "Kesar Rasmalai", quantity: 2, price: 120.00 }
    ],
    total: 350.00,
    status: "Delivered",
    timestamp: getPastDateString(3, 19, 0) // 3 days ago
  },
  {
    id: "ORD-4541",
    customerName: "David Lee",
    customerPhone: "+91 98888 77777",
    deliveryAddress: "Plot 42, Jubilee Hills, Hyderabad",
    notes: "Call when outside.",
    items: [
      { menuItemId: "m1", name: "Paneer Butter Masala", quantity: 1, price: 280.00 },
      { menuItemId: "m2", name: "Butter Chicken (Murgh Makhani)", quantity: 1, price: 340.00 },
      { menuItemId: "m6", name: "Kesar Rasmalai", quantity: 1, price: 120.00 }
    ],
    total: 740.00,
    status: "Delivered",
    timestamp: getPastDateString(4, 20, 15) // 4 days ago
  },
  {
    id: "ORD-2022",
    customerName: "Rachel Green",
    customerPhone: "+91 97777 66666",
    deliveryAddress: "Flat 10, Salt Lake Sector V, Kolkata",
    notes: "Leave at door.",
    items: [
      { menuItemId: "m4", name: "Hara Bhara Kabab", quantity: 2, price: 160.00 },
      { menuItemId: "m7", name: "Masala Chai (Cutting)", quantity: 2, price: 40.00 }
    ],
    total: 400.00,
    status: "Cancelled",
    timestamp: getPastDateString(5, 12, 30) // 5 days ago
  },
  {
    id: "ORD-9901",
    customerName: "Peter Parker",
    customerPhone: "+91 96666 55555",
    deliveryAddress: "High Rise Apt 104, ITPL Main Road, Bengaluru",
    notes: "Delivery must be fast!",
    items: [
      { menuItemId: "m2", name: "Butter Chicken (Murgh Makhani)", quantity: 4, price: 340.00 },
      { menuItemId: "m8", name: "Mango Lassi", quantity: 4, price: 80.00 }
    ],
    total: 1680.00,
    status: "Delivered",
    timestamp: getPastDateString(6, 18, 0) // 6 days ago
  }
];
