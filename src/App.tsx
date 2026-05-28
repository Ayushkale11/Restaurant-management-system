import { useState, useMemo, useEffect } from 'react';
import {
  Search, MapPin, Clock, Star, X, Info, Utensils,
  ShoppingCart, Plus, Minus, ArrowLeft, CreditCard, ShieldCheck
} from 'lucide-react';
import QRCode from 'qrcode';
import { supabase } from './supabase';

// --- MENU DATA ---
const menuData = [
  // PIZZA
  { id: 1, category: 'Pizza', name: 'Classic Veggie Pizza', price: 239, img: 'https://www.crazycheesy.com/wp-content/uploads/2022/11/CLASSIC-VEGGIE-PIZZA-450x450.jpg', desc: 'Onion, Capsicum, Tomato, Mozzarella Cheese', popular: true, veg: true },
  { id: 2, category: 'Pizza', name: 'Five Pepper Pizza', price: 299, img: 'https://www.crazycheesy.com/wp-content/uploads/2026/03/3-450x450.jpg', desc: 'A fiery blend of five different peppers layered with premium mozzarella and cheddar', popular: true, veg: true },
  { id: 3, category: 'Pizza', name: 'Gardener Special Pizza', price: 329, img: 'https://www.crazycheesy.com/wp-content/uploads/2022/11/GARDENER-SPECIAL-PIZZA-450x450.jpg', desc: 'Onion, Capsicum, Mushroom, Mozzarella Cheese, American Corn, Black Olives, Paneer', veg: true },
  { id: 4, category: 'Pizza', name: 'Farmhouse Pizza', price: 279, img: 'https://www.crazycheesy.com/wp-content/uploads/2022/11/FARMHOUSE-PIZZA-450x450.jpg', desc: 'Onion, Capsicum, Mushroom, Mozzarella Cheese', veg: true },
  { id: 5, category: 'Pizza', name: 'Paneer Butter Masala Pizza', price: 319, img: 'https://www.crazycheesy.com/wp-content/uploads/2026/01/Paneer-Butter-Masala-Pizza-450x450.png', desc: 'Soft paneer cubes cooked in rich butter masala sauce with mozzarella', veg: true },
  { id: 6, category: 'Pizza', name: 'Cheesy Corn Delight Pizza', price: 259, img: 'https://www.crazycheesy.com/wp-content/uploads/2022/11/CHEESY-CORN-DELIGHT-PIZZA-450x450.jpg', desc: 'Creamy & cheesy American corn topping, Mozzarella, Orange Cheddar, Red Paprika, Black Olives', veg: true },
  { id: 7, category: 'Pizza', name: 'Paneer Tandoori Pizza', price: 299, img: 'https://www.crazycheesy.com/wp-content/uploads/2022/11/PANEER-TANDOORI-PIZZA-450x450.jpg', desc: 'Tandoori Sauce, Onion, Capsicum, Marinated Paneer Tandoori, Mozzarella Cheese', popular: true, veg: true },

  // BURGER
  { id: 8, category: 'Burger', name: 'Double Dacker Burger', price: 189, img: 'https://www.crazycheesy.com/wp-content/uploads/2026/01/Double-Dacker-Burger-450x450.png', desc: 'Twice the indulgence with two juicy patties stacked high, layered with melted cheese', popular: true, veg: true },
  { id: 9, category: 'Burger', name: 'Pepper Jack Cheese Burger', price: 149, img: 'https://www.crazycheesy.com/wp-content/uploads/2025/10/Burger-panner-450x417.png', desc: 'A juicy grilled patty layered with spicy Pepper Jack cheese and fresh veggies', veg: true },
  { id: 10, category: 'Burger', name: 'Smoky BBQ Grilled Burger', price: 159, img: 'https://www.crazycheesy.com/wp-content/uploads/2025/02/Smoky-BBQ-Grilled-Burger-450x450.jpg', desc: 'A perfectly grilled patty infused with rich, smoky BBQ flavors and melted cheese', veg: true },
  { id: 11, category: 'Burger', name: 'Crispy Cheese Blast Burger', price: 199, img: 'https://www.crazycheesy.com/wp-content/uploads/2023/01/CRISPY-CHEESE-BLAST-BURGER1-450x450.jpg', desc: 'A giant vegetable patty stuffed with melted liquid cheese that bursts with every bite', popular: true, veg: true },

  // SANDWICH & TOASTIES
  { id: 12, category: 'Sandwich & Toasties', name: 'Chatpata Bombay Masala Sandwich', price: 139, img: 'https://www.crazycheesy.com/wp-content/uploads/2026/03/1-450x450.jpg', desc: 'Mumbai-style sandwich loaded with spicy masala, fresh veggies, and tangy chutneys', veg: true },
  { id: 13, category: 'Sandwich & Toasties', name: 'Mushroom Korean Grilled', price: 169, img: 'https://www.crazycheesy.com/wp-content/uploads/2026/01/Mashroom-Korian-Grilled-450x450.png', desc: 'Grilled mushrooms infused with Korean flavors, layered into a crispy sandwich', veg: true },
  { id: 14, category: 'Sandwich & Toasties', name: 'Paneer Korean Grilled', price: 179, img: 'https://www.crazycheesy.com/wp-content/uploads/2026/01/Paneer-Korian-Grilled-450x450.png', desc: 'A fusion-style grilled sandwich with juicy paneer coated in Korean-inspired sauce', popular: true, veg: true },
  { id: 15, category: 'Sandwich & Toasties', name: 'Cheese Chilli Toasties', price: 119, img: 'https://www.crazycheesy.com/wp-content/uploads/2025/02/Cheese-Chilli-Toasties-450x450.jpg', desc: 'Golden, crispy toasties stuffed with gooey melted cheese and spicy green chilies', veg: true },
  { id: 16, category: 'Sandwich & Toasties', name: 'Cheese Garlic Bread', price: 129, img: 'https://www.crazycheesy.com/wp-content/uploads/2025/02/Cheese-Toaste-450x450.jpg', desc: 'Crispy toasted bread topped with a generous layer of garlic butter and melted mozzarella', popular: true, veg: true },

  // PASTA
  { id: 17, category: 'Pasta', name: 'Penne Alfredo (White Sauce)', price: 229, img: 'https://www.crazycheesy.com/wp-content/uploads/2022/11/Penne-Arrabiatta-450x450.jpg', desc: 'Classic Italian Rich Creamy Sauce, Garlic, Onion, Oregano Sprinkle, Assorted Veggies', veg: true },
  { id: 18, category: 'Pasta', name: 'Makhani N\' Cheese', price: 249, img: 'https://www.crazycheesy.com/wp-content/uploads/2026/01/Makhani-N_-Cheese-450x450.png', desc: 'A rich and creamy fusion pasta tossed in buttery makhani sauce with melted cheese', popular: true, veg: true },
  { id: 19, category: 'Pasta', name: 'Del Barone (Pink Sauce)', price: 239, img: 'https://www.crazycheesy.com/wp-content/uploads/2022/11/SMOKEY-BBQ-PANEER-PASTA-450x450.jpg', desc: 'Classic Italian Rich Pink Sauce, Assorted Exotic Vegetables, Orange Cheddar, Fresh Basil', veg: true },

  // FRIES & SIDES
  { id: 20, category: 'Fries & Sides', name: 'Cheese Fries Peri Peri', price: 149, img: 'https://www.crazycheesy.com/wp-content/uploads/2023/01/CHEESE-FRIES-PERI-PERI-450x450.jpg', desc: 'Crispy french fries drenched in hot cheddar sauce and peri-peri seasoning', popular: true, veg: true },
  { id: 21, category: 'Fries & Sides', name: 'Cheese Corn Nuggets', price: 129, img: 'https://www.crazycheesy.com/wp-content/uploads/2023/01/CHEESE-CORN-NUGGETS-1-450x450.jpg', desc: 'Crispy golden nuggets filled with sweet corn and melted cheese', veg: true },
  { id: 22, category: 'Fries & Sides', name: 'Fully Loaded Nachos', price: 159, img: 'https://www.crazycheesy.com/wp-content/uploads/2023/01/Mexican-Fully-Loaded-Nachos-450x450.jpg', desc: 'Crispy tortilla chips smothered in warm cheese sauce, refried beans, salsa, and jalapenos', veg: true },

  // BEVERAGES & SHAKES
  { id: 23, category: 'Beverages & Shakes', name: 'Cold Chocolate', price: 149, img: 'https://www.crazycheesy.com/wp-content/uploads/2026/03/10-450x450.jpg', desc: 'Rich, chilled chocolate drink blended to creamy perfection with a smooth and indulgent taste', veg: true },
  { id: 24, category: 'Beverages & Shakes', name: 'Thandai Shake', price: 169, img: 'https://www.crazycheesy.com/wp-content/uploads/2026/03/9-450x450.jpg', desc: 'A rich blend of traditional thandai flavors with creamy milk, refreshing and aromatic', popular: true, veg: true },
  { id: 25, category: 'Beverages & Shakes', name: 'Green Apple Mojito', price: 129, img: 'https://www.crazycheesy.com/wp-content/uploads/2026/01/Green-Apple-Mojito-450x450.png', desc: 'A crisp and tangy green apple mojito with a refreshing minty touch', veg: true },

  // JAIN SPECIAL
  { id: 26, category: 'Jain Special', name: 'Jain Burger', price: 139, img: 'https://www.crazycheesy.com/wp-content/uploads/2025/02/Jain-burger-450x450.jpg', desc: '100% Jain-friendly burger with a crispy spiced raw banana patty, fresh veggies, and Jain cheese', popular: true, veg: true },
  { id: 27, category: 'Jain Special', name: 'Jain Margherita Pizza', price: 239, img: 'https://www.crazycheesy.com/wp-content/uploads/2022/11/CLASSIC-VEGGIE-PIZZA-450x450.jpg', desc: 'Jain pizza sauce, sweet corn, and a thick layer of premium mozzarella', veg: true }
];

const categories = ['All', 'Pizza', 'Burger', 'Sandwich & Toasties', 'Pasta', 'Fries & Sides', 'Beverages & Shakes', 'Jain Special'];

interface MenuItem {
  id: number;
  category: string;
  name: string;
  price: number;
  img: string;
  desc: string;
  popular?: boolean;
  veg?: boolean;
}

interface CartItem {
  item: MenuItem;
  quantity: number;
}

interface Order {
  id: string;
  customerName: string;
  customerPhone?: string;
  tableNumber: string;
  items: { id: number; name: string; price: number; quantity: number }[];
  totalPrice: number;
  paymentMethod: 'upi' | 'counter';
  paymentStatus: 'paid' | 'pending';
  status: 'pending' | 'preparing' | 'served' | 'cancelled';
  timestamp: string;
}

export default function App() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);

  // App View State
  const [view, setView] = useState<'menu' | 'cart' | 'checkout' | 'payment' | 'status'>('menu');

  // Table and Cart States
  const [tableNumber, setTableNumber] = useState('1');
  const [cart, setCart] = useState<CartItem[]>([]);

  // Checkout Details
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'counter'>('upi');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [paymentProgress, setPaymentProgress] = useState(0);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);

  // Read config parameters on load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const table = params.get('table') || params.get('t') || '1';
    setTableNumber(table);

    // Restore active order from Supabase / localStorage
    const savedOrderId = localStorage.getItem('activeOrderId');
    if (savedOrderId) {
      const fetchActiveOrder = async () => {
        try {
          const { data, error } = await supabase
            .from('orders')
            .select('*')
            .eq('id', savedOrderId)
            .single();

          if (data && !error && data.status !== 'cancelled') {
            const mappedOrder: Order = {
              id: data.id,
              customerName: data.customer_name,
              customerPhone: data.customer_phone || undefined,
              tableNumber: data.table_number,
              items: data.items,
              totalPrice: Number(data.total_price),
              paymentMethod: data.payment_method,
              paymentStatus: data.payment_status,
              status: data.status,
              timestamp: data.created_at || data.timestamp
            };
            setActiveOrder(mappedOrder);
            setView('status');
          } else {
            localStorage.removeItem('activeOrderId');
          }
        } catch (err) {
          console.error("Error restoring active order:", err);
        }
      };
      fetchActiveOrder();
    }
  }, []);

  // Realtime subscription to customer order status changes
  useEffect(() => {
    if (view !== 'status' || !activeOrder?.id) return;

    const channel = supabase
      .channel(`order-status-${activeOrder.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${activeOrder.id}` },
        (payload: any) => {
          const data = payload.new;
          if (data) {
            const mappedOrder: Order = {
              id: data.id,
              customerName: data.customer_name,
              customerPhone: data.customer_phone || undefined,
              tableNumber: data.table_number,
              items: data.items,
              totalPrice: Number(data.total_price),
              paymentMethod: data.payment_method,
              paymentStatus: data.payment_status,
              status: data.status,
              timestamp: data.created_at || data.timestamp
            };
            setActiveOrder(mappedOrder);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [view, activeOrder?.id]);

  // Generate dynamic QR Code for UPI Pay
  const cartSubtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.item.price * item.quantity), 0);
  }, [cart]);

  useEffect(() => {
    if (view === 'payment') {
      const upiUrl = `upi://pay?pa=crazycheesy@paytm&pn=Crazy%20Cheesy%20Cafe&am=${cartSubtotal}&cu=INR&tn=Table%20${tableNumber}`;
      QRCode.toDataURL(upiUrl, { width: 250, margin: 2 })
        .then((url: string) => setQrCodeUrl(url))
        .catch((err: any) => console.error(err));

      // Simulate payment timer (takes ~4.5s)
      setPaymentProgress(0);
      const timer = setInterval(() => {
        setPaymentProgress(prev => {
          if (prev >= 100) {
            clearInterval(timer);
            // Submit order
            submitOrder('paid');
            return 100;
          }
          return prev + 5;
        });
      }, 200);

      return () => clearInterval(timer);
    }
  }, [view]);

  // Add / Edit Cart Actions
  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.item.id === item.id);
      if (existing) {
        return prev.map(i => i.item.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { item, quantity: 1 }];
    });
  };

  const removeFromCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.item.id === item.id);
      if (existing && existing.quantity > 1) {
        return prev.map(i => i.item.id === item.id ? { ...i, quantity: i.quantity - 1 } : i);
      }
      return prev.filter(i => i.item.id !== item.id);
    });
  };

  // Submit Order to Supabase
  const submitOrder = async (payStatus: 'paid' | 'pending') => {
    const orderItems = cart.map(c => ({
      id: c.item.id,
      name: c.item.name,
      price: c.item.price,
      quantity: c.quantity
    }));

    const generatedId = 'ORD-' + Math.floor(1000 + Math.random() * 9000);
    const dbPayload = {
      id: generatedId,
      customer_name: customerName || 'Anonymous Guest',
      customer_phone: customerPhone || null,
      table_number: tableNumber,
      items: orderItems,
      total_price: cartSubtotal,
      payment_method: paymentMethod,
      payment_status: payStatus,
      status: 'pending'
    };

    try {
      const { data, error } = await supabase
        .from('orders')
        .insert([dbPayload])
        .select()
        .single();

      if (!error && data) {
        const orderCreated: Order = {
          id: data.id,
          customerName: data.customer_name,
          customerPhone: data.customer_phone || undefined,
          tableNumber: data.table_number,
          items: data.items,
          totalPrice: Number(data.total_price),
          paymentMethod: data.payment_method,
          paymentStatus: data.payment_status,
          status: data.status,
          timestamp: data.created_at || data.timestamp
        };
        setActiveOrder(orderCreated);
        localStorage.setItem('activeOrderId', orderCreated.id);
        setCart([]); // Clear cart
        setView('status');
      } else {
        throw error || new Error('Supabase insert failed');
      }
    } catch (e: any) {
      console.error(e);
      const errMsg = e?.message || (typeof e === 'object' ? JSON.stringify(e) : String(e));
      alert(`Failed to place order: ${errMsg}\n\nPlease check if your Supabase database has the 'orders' table created and the RLS policy allows public inserts.`);
    }
  };

  // Filter items based on category and search query
  const filteredItems = useMemo(() => {
    return menuData.filter((item) => {
      const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.desc.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  // --- RENDERING VIEWS ---

  // 1. SHOPPING CART VIEW
  if (view === 'cart') {
    return (
      <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-20">
        <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
          <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
            <button
              onClick={() => setView('menu')}
              className="flex items-center text-slate-600 hover:text-slate-900 font-semibold gap-1 text-sm transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Menu
            </button>
            <h1 className="text-lg font-black text-slate-900">Your Basket</h1>
            <span className="text-xs bg-amber-100 text-amber-900 font-bold px-3 py-1 rounded-full border border-amber-200">
              Table {tableNumber}
            </span>
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-4 py-8">
          {cart.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
              <ShoppingCart className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <h2 className="text-lg font-bold text-slate-800">Your basket is empty</h2>
              <p className="text-slate-500 text-sm mt-1">Browse our menu and add your favorite dishes!</p>
              <button
                onClick={() => setView('menu')}
                className="mt-6 bg-amber-500 hover:bg-amber-600 text-white font-bold px-6 py-2.5 rounded-xl shadow-md transition-colors"
              >
                View Menu
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Cart Items list */}
              <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="divide-y divide-slate-100">
                  {cart.map((cartItem) => (
                    <div key={cartItem.item.id} className="p-4 sm:p-6 flex gap-4 items-center">
                      <img
                        src={cartItem.item.img}
                        alt={cartItem.item.name}
                        className="w-16 h-16 rounded-xl object-cover bg-slate-100 shrink-0"
                      />
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <h3 className="font-bold text-slate-900 text-base leading-tight">
                            {cartItem.item.name}
                          </h3>
                          <span className="font-extrabold text-slate-900 text-base ml-2">
                            ₹{cartItem.item.price * cartItem.quantity}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5 uppercase tracking-wide font-medium">
                          {cartItem.item.category}
                        </p>

                        <div className="flex justify-between items-center mt-3">
                          <span className="text-sm text-amber-600 font-bold">₹{cartItem.item.price} each</span>
                          {/* Quantity control */}
                          <div className="flex items-center bg-slate-100 rounded-xl px-1 py-0.5 border border-slate-200">
                            <button
                              onClick={() => removeFromCart(cartItem.item)}
                              className="p-1 hover:bg-white rounded-lg transition-colors text-slate-600"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="px-3 text-sm font-bold text-slate-800">{cartItem.quantity}</span>
                            <button
                              onClick={() => addToCart(cartItem.item)}
                              className="p-1 hover:bg-white rounded-lg transition-colors text-slate-600"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Subtotal card */}
                <div className="bg-slate-50 p-6 border-t border-slate-100 flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-650 uppercase">Basket Total</span>
                  <span className="text-2xl font-black text-amber-700">₹{cartSubtotal}</span>
                </div>
              </div>

              {/* Table alert */}
              <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex gap-3 text-amber-950">
                <Info className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
                <div>
                  <p className="text-sm font-bold">Ordering for Dining Table {tableNumber}</p>
                  <p className="text-xs text-amber-700">This order will automatically be routed to your current table.</p>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                onClick={() => setView('checkout')}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold py-4 rounded-2xl shadow-xl transition-all hover:scale-[1.01]"
              >
                Proceed to Checkout
              </button>
            </div>
          )}
        </main>
      </div>
    );
  }

  // 2. CHECKOUT FORM VIEW
  if (view === 'checkout') {
    return (
      <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-20">
        <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
          <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
            <button
              onClick={() => setView('cart')}
              className="flex items-center text-slate-600 hover:text-slate-900 font-semibold gap-1 text-sm transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Basket
            </button>
            <h1 className="text-lg font-black text-slate-900">Checkout Details</h1>
            <span className="w-10"></span> {/* Spacer */}
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-4 py-8">
          <div className="space-y-6">
            {/* Customer Details Form */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 sm:p-8">
              <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Utensils className="w-5 h-5 text-amber-600" /> Dine-in Information
              </h2>

              <div className="space-y-4">
                <div>
                  <label htmlFor="customerName" className="block text-xs font-bold text-slate-550 uppercase tracking-wide mb-2">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    id="customerName"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Enter your name"
                    className="block w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="customerPhone" className="block text-xs font-bold text-slate-550 uppercase tracking-wide mb-2">
                    Phone Number (Optional)
                  </label>
                  <input
                    type="tel"
                    id="customerPhone"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="Enter 10-digit mobile number"
                    className="block w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium"
                  />
                </div>

                <div>
                  <label htmlFor="tableNumber" className="block text-xs font-bold text-slate-550 uppercase tracking-wide mb-2">
                    Dining Table
                  </label>
                  <input
                    type="text"
                    id="tableNumber"
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    placeholder="Table #"
                    className="block w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-100 focus:outline-none font-bold text-slate-700"
                    title="Change Table Number"
                  />
                </div>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 sm:p-8">
              <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-amber-600" /> Choose Payment Option
              </h2>

              <div className="space-y-3">
                <label
                  onClick={() => setPaymentMethod('upi')}
                  className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all
                    ${paymentMethod === 'upi'
                      ? 'border-amber-500 bg-amber-50/20 shadow-sm'
                      : 'border-slate-100 hover:border-slate-200'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full border-2 border-slate-350 flex items-center justify-center">
                      {paymentMethod === 'upi' && <div className="w-2.5 h-2.5 bg-amber-500 rounded-full"></div>}
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 text-sm block">Scan & Pay via UPI</span>
                      <span className="text-xs text-slate-450 mt-0.5 block">Scan QR code dynamic mockup</span>
                    </div>
                  </div>
                  <span className="text-xs font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded uppercase">Recommended</span>
                </label>

                <label
                  onClick={() => setPaymentMethod('counter')}
                  className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all
                    ${paymentMethod === 'counter'
                      ? 'border-amber-500 bg-amber-50/20 shadow-sm'
                      : 'border-slate-100 hover:border-slate-200'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full border-2 border-slate-350 flex items-center justify-center">
                      {paymentMethod === 'counter' && <div className="w-2.5 h-2.5 bg-amber-600 rounded-full"></div>}
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 text-sm block">Pay at Counter</span>
                      <span className="text-xs text-slate-450 mt-0.5 block">Confirm order & pay to cashier later</span>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Total Summary & Place Button */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div>
                <span className="text-xs font-bold text-slate-450 uppercase block">Total Due</span>
                <span className="text-2xl font-black text-slate-900">₹{cartSubtotal}</span>
              </div>

              <button
                disabled={!customerName.trim()}
                onClick={() => {
                  if (paymentMethod === 'upi') {
                    setView('payment');
                  } else {
                    submitOrder('pending');
                  }
                }}
                className={`w-full sm:w-auto bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold px-8 py-3.5 rounded-2xl shadow-xl transition-all
                  ${!customerName.trim() ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.01]'}`}
              >
                {paymentMethod === 'upi' ? 'Pay & Place Order' : 'Place Order (Pay Later)'}
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // 3. MOCK PAYMENT SIMULATION VIEW (UPI QR SCREEN)
  if (view === 'payment') {
    return (
      <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col justify-center items-center p-4">
        <div className="bg-white w-full max-w-md rounded-3xl shadow-xl border border-slate-100 p-6 text-center space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <h2 className="text-lg font-black text-slate-900">UPI Instant Payment</h2>
            <button
              onClick={() => setView('checkout')}
              className="text-xs text-slate-450 font-bold hover:text-slate-655"
            >
              Cancel
            </button>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-slate-450 font-semibold uppercase tracking-wide">Paying To</p>
            <h3 className="text-lg font-bold text-slate-850">Crazy Cheesy Cafe</h3>
            <p className="text-3xl font-black text-amber-600 mt-2">₹{cartSubtotal}</p>
          </div>

          {/* Dynamic QR Code Canvas */}
          <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 inline-flex flex-col items-center justify-center">
            {qrCodeUrl ? (
              <img src={qrCodeUrl} alt="UPI QR Code" className="w-52 h-52 shadow-sm rounded-xl" />
            ) : (
              <div className="w-52 h-52 flex items-center justify-center text-xs text-slate-400">Generating QR...</div>
            )}
            <p className="text-[10px] font-bold text-slate-400 uppercase mt-4 tracking-wider">Scan using GPay, PhonePe, Paytm, etc.</p>
          </div>

          {/* Simulation status / timer bar */}
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs text-slate-500 font-semibold px-2">
              <span>Waiting for bank confirmation...</span>
              <span>{Math.floor(paymentProgress)}%</span>
            </div>

            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden border border-slate-200">
              <div
                className="bg-amber-500 h-full rounded-full transition-all duration-200"
                style={{ width: `${paymentProgress}%` }}
              ></div>
            </div>

            <p className="text-xs text-slate-450 leading-relaxed max-w-xs mx-auto">
              This is a secure checkout simulation. We are monitoring the UPI node for payment signals.
            </p>
          </div>

          {/* Quick debug trigger to bypass */}
          <button
            onClick={() => submitOrder('paid')}
            className="w-full text-xs text-amber-650 hover:text-amber-700 bg-amber-50 border border-amber-200 py-2.5 rounded-xl font-bold transition-all"
          >
            Skip & Simulate Success Immediate
          </button>
        </div>
      </div>
    );
  }

  // 4. CUSTOMER ORDER TRACKING PAGE
  if (view === 'status' && activeOrder) {
    const progressLevel =
      activeOrder.status === 'pending' ? 33 :
        activeOrder.status === 'preparing' ? 66 : 100;

    return (
      <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-20">
        <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
          <div className="max-w-xl mx-auto px-4 py-4 flex items-center justify-between">
            <h1 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Utensils className="h-5 w-5 text-amber-600" /> Order Tracking
            </h1>
            <span className="text-xs bg-slate-100 text-slate-700 font-bold px-3 py-1 rounded-full border border-slate-200">
              ID: {activeOrder.id}
            </span>
          </div>
        </header>

        <main className="max-w-xl mx-auto px-4 py-8">
          <div className="space-y-6">
            {/* Status Card */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 sm:p-8 text-center space-y-6">
              <div className="space-y-2">
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Status for Table {activeOrder.tableNumber}</p>

                {activeOrder.status === 'pending' && (
                  <h2 className="text-2xl font-black text-slate-900">Order Received! 🍳</h2>
                )}
                {activeOrder.status === 'preparing' && (
                  <h2 className="text-2xl font-black text-slate-900">Cooking in Kitchen 👨‍🍳</h2>
                )}
                {activeOrder.status === 'served' && (
                  <h2 className="text-2xl font-black text-emerald-600">Served & Enjoy! 🎉</h2>
                )}
                {activeOrder.status === 'cancelled' && (
                  <h2 className="text-2xl font-black text-rose-550">Order Cancelled</h2>
                )}
              </div>

              {/* Status Timeline */}
              {activeOrder.status !== 'cancelled' && (
                <div className="space-y-4">
                  <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-205">
                    <div
                      className={`h-full rounded-full transition-all duration-1000
                        ${activeOrder.status === 'served' ? 'bg-emerald-500' : 'bg-amber-500'}`}
                      style={{ width: `${progressLevel}%` }}
                    ></div>
                  </div>

                  <div className="grid grid-cols-3 text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
                    <span className={activeOrder.status === 'pending' || activeOrder.status === 'preparing' || activeOrder.status === 'served' ? 'text-amber-600' : ''}>
                      Placed
                    </span>
                    <span className={activeOrder.status === 'preparing' || activeOrder.status === 'served' ? 'text-amber-600' : ''}>
                      Preparing
                    </span>
                    <span className={activeOrder.status === 'served' ? 'text-emerald-600' : ''}>
                      Served
                    </span>
                  </div>
                </div>
              )}

              <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
                {activeOrder.status === 'pending' && 'We have sent your order to the kitchen. Please wait a moment while our chefs accept it.'}
                {activeOrder.status === 'preparing' && 'Your food is fresh, hot, and currently being prepared in our kitchen!'}
                {activeOrder.status === 'served' && 'Bon Appetit! Your food has been successfully served at your table.'}
                {activeOrder.status === 'cancelled' && 'We are sorry, your order could not be fulfilled at this time. Please contact the counter.'}
              </p>
            </div>

            {/* Receipt Summary */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
              <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wide mb-4 border-b border-slate-100 pb-3">
                Items Summary
              </h3>
              <ul className="divide-y divide-slate-50 space-y-3 pb-3">
                {activeOrder.items.map((it, idx) => (
                  <li key={idx} className="flex justify-between items-center text-sm pt-2">
                    <span className="text-slate-650">
                      <span className="font-semibold text-amber-600">{it.quantity}x</span> {it.name}
                    </span>
                    <span className="font-semibold text-slate-800">₹{it.price * it.quantity}</span>
                  </li>
                ))}
              </ul>

              <div className="flex justify-between items-center border-t border-slate-100 pt-4 text-sm font-bold text-slate-700">
                <span>Total Amount Paid</span>
                <span className="text-lg font-black text-amber-700">₹{activeOrder.totalPrice}</span>
              </div>
            </div>

            {/* Back to menu button */}
            <button
              onClick={() => {
                localStorage.removeItem('activeOrderId');
                setActiveOrder(null);
                setView('menu');
              }}
              className="w-full bg-slate-850 hover:bg-slate-900 text-white font-bold py-3.5 rounded-2xl shadow-md transition-all text-center text-sm"
            >
              Order Something Else
            </button>
          </div>
        </main>
      </div>
    );
  }

  // 5. MAIN MENU VIEW (DEFAULT)
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-24">

      {/* Top Navbar */}
      <div className="bg-white border-b border-slate-100 py-2 px-4 sticky top-0 z-40 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/crazy_cheesy_logo.png" alt="Crazy Cheesy Logo" className="w-11 h-11 object-contain rounded-full shadow-sm" />
          <span className="font-extrabold text-lg text-slate-900 tracking-tight">Crazy Cheesy</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-[#FAF6EE] text-[#78350f] font-bold px-3 py-1.5 rounded-full border border-[#EBE2CF]">
            Table {tableNumber}
          </span>
        </div>
      </div>

      {/* Hero Header */}
      <header className="relative bg-white pb-6 shadow-sm">
        <div className="absolute inset-0 h-64 overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1600&q=80"
            alt="Cafe Ambiance"
            className="w-full h-full object-cover opacity-25"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-amber-955/15 to-white"></div>
        </div>

        <div className="relative max-w-5xl mx-auto px-4 pt-12 sm:px-6 lg:px-8 text-center flex flex-col items-center">
          <div className="inline-flex items-center justify-center p-1 bg-white rounded-full shadow-lg mb-4 border border-[#EBE2CF] w-24 h-24 overflow-hidden">
            <img src="/crazy_cheesy_logo.png" alt="Crazy Cheesy Logo" className="w-full h-full object-contain rounded-full" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 mb-2">
            Crazy Cheesy Cafe
          </h1>
          <p className="text-lg text-slate-600 mb-6 max-w-2xl mx-auto font-medium">
            Ahilyanagar's favorite destination for ultimate cheese indulgence. Cozy vibes, melting pizzas, and delicious memories.
          </p>

          <div className="flex flex-wrap justify-center gap-3 text-sm font-medium text-slate-700">
            <span className="flex items-center bg-amber-50 px-3 py-1.5 rounded-full text-amber-900 border border-amber-100 font-bold">
              <Clock className="w-4 h-4 mr-1.5" />
              Open 24/7
            </span>
            <a
              href="https://maps.app.goo.gl/eHVhkaDhzYddv1ro9"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center bg-slate-100 px-3 py-1.5 rounded-full border border-slate-205 hover:bg-slate-200 transition-colors"
            >
              <MapPin className="w-4 h-4 mr-1.5 text-slate-500" />
              Ahilyanagar, Maharashtra
            </a>
            <span className="flex items-center bg-amber-50 px-3 py-1.5 rounded-full text-amber-700 border border-amber-100 font-semibold">
              <Star className="w-4 h-4 mr-1.5 fill-amber-550 text-amber-550" />
              Table {tableNumber} Ordering
            </span>
          </div>
        </div>
      </header>

      {/* Navigation & Search Sticky Bar */}
      <div className="sticky top-[60px] z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">

            {/* Search Input */}
            <div className="relative w-full md:w-72 shrink-0">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Search for Pizza, Burger..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-xl bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-600 sm:text-sm transition-all"
              />
            </div>

            {/* Category filter scroll */}
            <div className="flex overflow-x-auto hide-scrollbar -mx-4 px-4 md:mx-0 md:px-0 space-x-2 pb-1">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200
                    ${activeCategory === cat
                      ? 'bg-amber-500 text-white shadow-md'
                      : 'bg-slate-100 text-slate-650 hover:bg-amber-50'}`}
                >
                  {cat}
                </button>
              ))}
            </div>

          </div>
        </div>
      </div>

      {/* Menu Grid */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {filteredItems.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-flex justify-center items-center w-16 h-16 rounded-full bg-slate-100 mb-4">
              <Search className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900">No dishes found</h3>
            <p className="mt-1 text-slate-500">Try searching for something else or clearing your filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => {
              const cartQuantity = cart.find(c => c.item.id === item.id)?.quantity || 0;
              return (
                <div
                  key={item.id}
                  className="bg-[#FAF6EE] rounded-3xl overflow-hidden border border-[#EBE2CF] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group"
                >
                  {/* Image Container */}
                  <div className="p-4 pb-0 cursor-pointer" onClick={() => setSelectedItem(item)}>
                    <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-white/50">
                      <img
                        src={item.img}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                      {item.popular && (
                        <div className="absolute top-2 right-2 bg-red-500 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-sm flex items-center">
                          <Star className="w-2.5 h-2.5 mr-0.5 fill-white text-white" /> Bestseller
                        </div>
                      )}
                      {item.veg && (
                        <div className="absolute bottom-2 left-2 bg-white p-0.5 rounded shadow-sm border border-slate-200">
                          <div className="w-3 h-3 border border-green-600 flex items-center justify-center p-[1px]">
                            <div className="w-full h-full bg-green-600 rounded-full"></div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Item Content */}
                  <div className="p-5 pt-3 flex-1 flex flex-col justify-between">
                    <div>
                      <div
                        onClick={() => setSelectedItem(item)}
                        className="flex justify-between items-start mb-1 cursor-pointer"
                      >
                        <h3 className="text-base font-bold text-slate-900 leading-tight hover:text-[#d97706] transition-colors">
                          {item.name}
                        </h3>
                      </div>
                      <p className="text-xs text-slate-500 leading-normal font-medium mt-1">({item.desc})</p>
                    </div>

                    {/* Bottom Action Area */}
                    <div className="mt-4 pt-4 border-t border-[#EBE2CF]/60 flex justify-between items-center">
                      <span className="text-sm font-extrabold text-[#78350f]">₹{item.price}</span>

                      {cartQuantity > 0 ? (
                        <div className="flex items-center bg-white rounded-xl px-1 py-0.5 border border-[#EBE2CF] shadow-sm">
                          <button
                            onClick={() => removeFromCart(item)}
                            className="p-1 hover:bg-[#FAF6EE] rounded-lg transition-colors text-[#78350f]"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="px-3 text-xs font-extrabold text-[#78350f]">{cartQuantity}</span>
                          <button
                            onClick={() => addToCart(item)}
                            className="p-1 hover:bg-[#FAF6EE] rounded-lg transition-colors text-[#78350f]"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => addToCart(item)}
                          className="bg-[#FFC222] hover:bg-[#e0ab1f] text-[#1E1D23] text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5 active:scale-95 border border-[#e0ab1f]"
                        >
                          <Plus className="w-3.5 h-3.5 text-[#1E1D23]" /> Add to Table
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Floating Cart Bar (at bottom of menu) */}
      {cart.length > 0 && (
        <div className="fixed bottom-6 left-4 right-4 z-40 max-w-xl mx-auto">
          <div
            onClick={() => setView('cart')}
            className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-2xl p-4 shadow-xl flex justify-between items-center cursor-pointer transition-all hover:scale-[1.01] border border-amber-500/20 active:scale-[0.99]"
          >
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-xl relative">
                <ShoppingCart className="w-5 h-5 text-white" />
                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center border border-white">
                  {cart.reduce((sum, i) => sum + i.quantity, 0)}
                </span>
              </div>
              <div>
                <span className="text-xs text-amber-100 font-semibold block">Dine-in Order</span>
                <span className="text-sm font-bold text-white block">View Basket ({cart.length} items)</span>
              </div>
            </div>
            <div className="flex items-center gap-1 text-white font-extrabold text-base">
              ₹{cartSubtotal} <span className="text-xs text-amber-100 font-bold ml-1">→</span>
            </div>
          </div>
        </div>
      )}

      {/* Standard Footer */}
      <footer className="bg-white border-t border-slate-200 py-12 mt-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <div className="flex justify-center items-center space-x-2">
            <img src="/crazy_cheesy_logo.png" alt="Crazy Cheesy Logo" className="w-8 h-8 object-contain rounded-full" />
            <h2 className="text-xl font-bold text-slate-900">Crazy Cheesy Cafe</h2>
          </div>

          <p className="text-slate-500 max-w-md mx-auto text-sm">
            Your ultimate destination in Ahilyanagar for delicious cheesy pizzas, burgers, pasta, and amazing vibes.
          </p>

          <div className="flex flex-col md:flex-row justify-center items-center space-y-2 md:space-y-0 md:space-x-6 text-xs text-slate-650 font-medium pt-2">
            <a
              href="https://maps.app.goo.gl/eHVhkaDhzYddv1ro9"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center hover:text-amber-600 transition-colors"
            >
              <MapPin className="w-4 h-4 mr-2 text-[#FFC222]" /> Ahilyanagar, Maharashtra
            </a>
            <span className="hidden md:inline text-slate-300">|</span>
            <span className="flex items-center"><Clock className="w-4 h-4 mr-2 text-amber-500" /> Open 24 Hours, 7 Days a week</span>
          </div>

          {/* Owner Access Trigger */}
          <div className="border-t border-slate-100 pt-6">
            <a
              href="/dashboard.html"
              className="text-xs font-semibold text-amber-600/70 hover:text-amber-600 transition-colors uppercase tracking-wider inline-flex items-center gap-1.5 justify-center"
            >
              <ShieldCheck className="w-3.5 h-3.5" /> Staff Console Access
            </a>
          </div>
        </div>
      </footer>

      {/* 6. ITEM DETAIL MODAL */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm transition-opacity"
          onClick={() => setSelectedItem(null)}>
          <div
            className="bg-white rounded-3xl overflow-hidden w-full max-w-lg shadow-2xl transform transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative h-72 sm:h-80 w-full bg-slate-100">
              <img
                src={selectedItem.img}
                alt={selectedItem.name}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => setSelectedItem(null)}
                className="absolute top-4 right-4 bg-white/80 hover:bg-white text-slate-800 p-2 rounded-full shadow-md backdrop-blur-md transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {selectedItem.popular && (
                <div className="absolute top-4 left-4 bg-red-500 text-white text-[10px] font-bold uppercase tracking-wider px-4 py-1.5 rounded-full shadow-lg flex items-center">
                  <Star className="w-4 h-4 mr-1.5 fill-white text-white" /> Bestseller
                </div>
              )}
            </div>

            <div className="p-6 sm:p-8">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {selectedItem.veg && (
                      <div className="w-3.5 h-3.5 border-2 border-green-600 flex items-center justify-center p-[2px]">
                        <div className="w-full h-full bg-green-600 rounded-full"></div>
                      </div>
                    )}
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600">
                      {selectedItem.category}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">{selectedItem.name}</h2>
                </div>
                <span className="text-xl font-extrabold text-amber-700 bg-amber-50 px-3 py-1 rounded-xl">
                  ₹{selectedItem.price}
                </span>
              </div>

              <p className="text-slate-600 text-sm mb-6 leading-relaxed">
                {selectedItem.desc}
              </p>

              {/* Add to table directly from modal */}
              <div className="flex justify-between items-center gap-4 border-t border-slate-100 pt-6">
                <div className="bg-slate-50 p-3 rounded-xl flex items-start gap-3 border border-slate-100 flex-1">
                  <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-slate-600 leading-normal">
                    Hot, fresh food prepared upon your table request. Customizable options are available on request.
                  </p>
                </div>

                <button
                  onClick={() => {
                    addToCart(selectedItem);
                    setSelectedItem(null);
                  }}
                  className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold px-5 py-3 rounded-xl shadow-md transition-all shrink-0 active:scale-95"
                >
                  Add to Cart
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CSS details */}
      <style dangerouslySetInnerHTML={{
        __html: `
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />
    </div>
  );
}
