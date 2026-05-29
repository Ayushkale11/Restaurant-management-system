import { useState, useEffect, useMemo } from 'react';
import { 
  Volume2, VolumeX, TrendingUp, ClipboardList, Coffee, CheckCircle2,
  Trash2, Search, X, Printer, Clock, RefreshCw, AlertTriangle
} from 'lucide-react';
import { supabase } from './supabase';

interface OrderItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

interface Order {
  id: string;
  customerName: string;
  customerPhone?: string;
  tableNumber: string;
  items: OrderItem[];
  totalPrice: number;
  paymentMethod: 'upi' | 'counter';
  paymentStatus: 'paid' | 'pending';
  status: 'pending' | 'preparing' | 'served' | 'cancelled';
  timestamp: string;
}

// Sound chime synthesizer using Web Audio API
const playChime = (volume: number) => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const now = ctx.currentTime;
    
    // First tone (higher pitch)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(523.25, now); // C5
    gain1.gain.setValueAtTime(volume * 0.15, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    
    // Second tone (slightly delayed, lower pitch chord)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(659.25, now + 0.1); // E5
    gain2.gain.setValueAtTime(volume * 0.15, now + 0.1);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    
    osc1.start(now);
    osc1.stop(now + 0.4);
    osc2.start(now + 0.1);
    osc2.stop(now + 0.5);
  } catch (e) {
    console.error("Audio chime failed:", e);
  }
};

const mapDbOrderToOrder = (data: any): Order => ({
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
});

export default function DashboardApp() {
  // Authorization State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passcode, setPasscode] = useState('');
  
  // Dashboard Core State
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Settings & Interface States
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [soundVolume, setSoundVolume] = useState(0.8);
  const [filterType, setFilterType] = useState<'active' | 'past'>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [itemChecklists, setItemChecklists] = useState<Record<string, Record<string, boolean>>>({});
  const [currentTime, setCurrentTime] = useState(new Date());

  // Check auth cookie/storage on load
  useEffect(() => {
    const isAuth = localStorage.getItem('dashboard_authenticated') === 'true';
    if (isAuth) {
      setIsAuthenticated(true);
    }

    // Keep current time updated for ticket duration calculation
    const timer = setInterval(() => setCurrentTime(new Date()), 10000);
    return () => clearInterval(timer);
  }, []);

  // Load initially and subscribe to updates via Supabase Realtime
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchOrders = async () => {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: true });
        
        if (error) throw error;
        if (data) {
          const mapped: Order[] = data.map(mapDbOrderToOrder);
          setOrders(mapped);
        }
      } catch (err) {
        console.error("Supabase load error:", err);
      }
    };

    fetchOrders();

    const channel = supabase
      .channel('kds-orders-feed')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload: any) => {
          if (payload.eventType === 'INSERT') {
            const newOrder = mapDbOrderToOrder(payload.new);
            setOrders(prev => {
              if (prev.some(o => o.id === newOrder.id)) return prev;
              return [...prev, newOrder];
            });
            if (newOrder.status === 'pending' && soundEnabled) {
              playChime(soundVolume);
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedOrder = mapDbOrderToOrder(payload.new);
            setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
            setSelectedOrder(current => current?.id === updatedOrder.id ? updatedOrder : current);
            
            // Play chime if status transitioned to pending
            if (updatedOrder.status === 'pending' && soundEnabled) {
              playChime(soundVolume);
            }
          } else if (payload.eventType === 'DELETE') {
            const deletedId = payload.old.id;
            setOrders(prev => prev.filter(o => o.id !== deletedId));
            setSelectedOrder(current => current?.id === deletedId ? null : current);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAuthenticated, soundEnabled, soundVolume]);

  // Auth submission
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode === '1234') {
      setIsAuthenticated(true);
      localStorage.setItem('dashboard_authenticated', 'true');
      setPasscode('');
    } else {
      alert('Invalid passcode. Use 1234!');
      setPasscode('');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('dashboard_authenticated');
  };

  // Sound test
  const triggerSoundTest = () => {
    playChime(soundVolume);
  };

  // Modify order status via Supabase
  const updateOrderStatus = async (orderId: string, nextStatus: 'preparing' | 'served' | 'cancelled') => {
    try {
      const updateData: any = { status: nextStatus };
      if (nextStatus === 'served') {
        updateData.payment_status = 'paid';
      }
      
      const { data, error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId)
        .select()
        .single();

      if (!error && data) {
        const updated = mapDbOrderToOrder(data);
        setOrders(prev => prev.map(o => o.id === orderId ? updated : o));
        if (selectedOrder?.id === orderId) {
          setSelectedOrder(updated);
        }
      } else {
        throw error || new Error('Failed to update status');
      }
    } catch (e) {
      console.error("Error updating status:", e);
      alert("Failed to update order status. Please verify your Supabase connection!");
    }
  };

  // Clear all database orders in Supabase
  const clearDatabase = async () => {
    if (!window.confirm("Are you sure you want to clear all orders? This will reset the database.")) return;
    try {
      const { error } = await supabase
        .from('orders')
        .delete()
        .neq('id', 'dummy_nonexistent_id'); // Delete all rows

      if (error) throw error;
      setOrders([]);
      setSelectedOrder(null);
      alert("Database reset successfully!");
    } catch (e) {
      console.error("Error clearing database:", e);
      alert("Failed to clear database orders. Check policies / credentials.");
    }
  };

  // Toggle checklist for individual items
  const toggleItemCheck = (orderId: string, itemKey: string) => {
    setItemChecklists(prev => {
      const orderList = prev[orderId] || {};
      return {
        ...prev,
        [orderId]: {
          ...orderList,
          [itemKey]: !orderList[itemKey]
        }
      };
    });
  };

  // Calculate stats based on orders
  const stats = useMemo(() => {
    const todaySales = orders
      .filter(o => o.status !== 'cancelled' && o.paymentStatus === 'paid')
      .reduce((sum, o) => sum + o.totalPrice, 0);

    const pending = orders.filter(o => o.status === 'pending').length;
    const preparing = orders.filter(o => o.status === 'preparing').length;
    const served = orders.filter(o => o.status === 'served').length;
    const cancelled = orders.filter(o => o.status === 'cancelled').length;

    return { todaySales, pending, preparing, served, cancelled };
  }, [orders]);

  // Filters
  const filteredOrders = useMemo(() => {
    return orders
      .filter(o => {
        const matchesFilter = filterType === 'active' 
          ? (o.status === 'pending' || o.status === 'preparing')
          : (o.status === 'served' || o.status === 'cancelled');

        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          o.customerName.toLowerCase().includes(query) ||
          o.tableNumber.includes(query) ||
          o.id.toLowerCase().includes(query) ||
          o.items.some(it => it.name.toLowerCase().includes(query));

        return matchesFilter && matchesSearch;
      })
      .sort((a, b) => {
        if (filterType === 'active') {
          // Oldest pending orders at the top
          return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
        }
        // Newest served logs at the top
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });
  }, [orders, filterType, searchQuery]);

  // Time elapsed format
  const getElapsedMinutes = (timestamp: string) => {
    const start = new Date(timestamp).getTime();
    const current = currentTime.getTime();
    const diff = Math.floor((current - start) / 60000);
    if (diff < 1) return 'Just now';
    return `${diff}m ago`;
  };

  // --- RENDERING LOGIN PANEL ---
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-4 font-sans">
        <div className="bg-slate-900 border border-slate-800 p-8 pt-12 rounded-3xl w-full max-w-sm text-center space-y-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-6 cheese-texture"></div>
          <div className="absolute top-6 inset-x-0 cheese-drips" style={{ height: '14px' }}></div>
          
          <div className="mx-auto w-16 h-16 bg-white rounded-full flex items-center justify-center border border-slate-850 overflow-hidden shadow-md relative z-10">
            <img src="/crazy_cheesy_logo.png" alt="Crazy Cheesy Logo" className="w-full h-full object-contain" />
          </div>

          <div>
            <h1 className="text-2xl font-black tracking-tight text-white">Crazy Cheesy Console</h1>
            <p className="text-xs text-slate-450 mt-1">Standalone Kitchen Display System & Panel</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="block text-left text-xs font-bold text-slate-450 uppercase tracking-wider">
                Staff Console Passcode
              </label>
              <input
                type="password"
                placeholder="••••"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                maxLength={4}
                className="w-full text-center text-3xl font-bold tracking-widest py-3 border border-slate-700 bg-slate-950 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all text-white placeholder-slate-800"
                required
                autoFocus
              />
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-650 text-slate-950 font-bold py-3.5 rounded-2xl shadow-xl transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
              Verify Credentials
            </button>
          </form>
          
          <p className="text-[10px] text-slate-500">Demo Access Passcode: 1234</p>
        </div>
      </div>
    );
  }

  // --- RENDERING DASHBOARD APP ---
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col justify-between">
      
      {/* Top Banner and Navigation */}
      <header className="bg-[#FFC222] cheese-texture border-b border-amber-600/35 sticky top-0 z-40 print:hidden shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full border border-amber-450 overflow-hidden bg-white shrink-0 shadow-md">
              <img src="/crazy_cheesy_logo.png" alt="Crazy Cheesy Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-900 flex items-center gap-2">
                Crazy Cheesy Console
                <span className="text-[10px] font-bold bg-[#78350f]/15 text-[#78350f] border border-[#78350f]/20 px-2 py-0.5 rounded uppercase tracking-wider">KDS</span>
              </h1>
              <p className="text-xs text-slate-700 font-medium">Live Dine-in Order Management Engine</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Audio Panel */}
            <div className="flex items-center bg-white/80 backdrop-blur-md rounded-xl px-2 py-1.5 border border-amber-300 gap-2">
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`p-1.5 rounded-lg transition-colors
                  ${soundEnabled 
                    ? 'bg-amber-100 text-amber-900 border border-amber-200' 
                    : 'bg-slate-100 text-slate-400 border border-slate-200'}`}
                title={soundEnabled ? 'Mute Chime' : 'Unmute Chime'}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4 text-amber-900" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
              </button>
              <input 
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={soundVolume}
                onChange={(e) => setSoundVolume(Number(e.target.value))}
                className="w-16 accent-amber-600 cursor-pointer h-1 rounded-full bg-slate-200"
                title={`Volume: ${Math.floor(soundVolume * 100)}%`}
              />
              <button 
                onClick={triggerSoundTest}
                className="text-[10px] font-black text-[#78350f] hover:text-[#5e290b] uppercase px-1.5 py-0.5 bg-amber-50 border border-amber-200 rounded"
              >
                Test
              </button>
            </div>

            <button
              onClick={handleLogout}
              className="bg-[#78350f] hover:bg-[#5e290b] text-white px-4.5 py-2 rounded-xl text-xs font-black transition-all shadow-sm"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>
      <div className="cheese-drips sticky top-[72px] z-30 -mt-0.5 print:hidden"></div>

      {/* Main Console Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full print:p-0">
        
        {/* Print only - Ticket representation */}
        {selectedOrder && (
          <div className="hidden print:block bg-white text-black p-8 font-mono text-sm max-w-xs mx-auto border-2 border-black rounded-lg">
            <h2 className="text-center font-bold text-lg uppercase tracking-wide">Crazy Cheesy Ticket</h2>
            <p className="text-center text-xs mt-1">=== Dine-in Order ===</p>
            <div className="border-t border-dashed border-black my-4"></div>
            <div className="space-y-1">
              <p><strong>Order ID:</strong> {selectedOrder.id}</p>
              <p><strong>Table:</strong> Table {selectedOrder.tableNumber}</p>
              <p><strong>Customer:</strong> {selectedOrder.customerName}</p>
              <p><strong>Phone:</strong> {selectedOrder.customerPhone || 'N/A'}</p>
              <p><strong>Time:</strong> {new Date(selectedOrder.timestamp).toLocaleString()}</p>
            </div>
            <div className="border-t border-dashed border-black my-4"></div>
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-black">
                  <th>QTY</th>
                  <th>ITEM</th>
                  <th className="text-right">TOTAL</th>
                </tr>
              </thead>
              <tbody>
                {selectedOrder.items.map((it, idx) => (
                  <tr key={idx} className="align-top">
                    <td>{it.quantity}x</td>
                    <td>{it.name}</td>
                    <td className="text-right">₹{it.price * it.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="border-t border-dashed border-black my-4"></div>
            <div className="flex justify-between items-center text-base font-bold">
              <span>TOTAL</span>
              <span>₹{selectedOrder.totalPrice}</span>
            </div>
            <p className="mt-3 text-xs">Payment: {selectedOrder.paymentMethod.toUpperCase()} ({selectedOrder.paymentStatus.toUpperCase()})</p>
            <div className="border-t border-dashed border-black my-4"></div>
            <p className="text-center text-[10px] mt-6">Prepared at Crazy Cheesy Cafe, Pune</p>
          </div>
        )}

        {/* Console view layout */}
        <div className="print:hidden">
          {/* Stats Bar */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between shadow-lg">
              <div>
                <p className="text-[10px] text-slate-450 font-bold uppercase tracking-wider mb-1">Today's Revenue</p>
                <h3 className="text-2xl font-black text-emerald-400">₹{stats.todaySales}</h3>
              </div>
              <div className="bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between shadow-lg">
              <div>
                <p className="text-[10px] text-slate-450 font-bold uppercase tracking-wider mb-1">Pending Cook</p>
                <h3 className="text-2xl font-black text-amber-400">{stats.pending}</h3>
              </div>
              <div className="bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20 animate-pulse">
                <ClipboardList className="w-5 h-5 text-amber-400" />
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between shadow-lg">
              <div>
                <p className="text-[10px] text-slate-450 font-bold uppercase tracking-wider mb-1">Preparing</p>
                <h3 className="text-2xl font-black text-sky-400">{stats.preparing}</h3>
              </div>
              <div className="bg-sky-500/10 p-2.5 rounded-xl border border-sky-500/20">
                <Coffee className="w-5 h-5 text-sky-400" />
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between shadow-lg">
              <div>
                <p className="text-[10px] text-slate-450 font-bold uppercase tracking-wider mb-1">Served Meals</p>
                <h3 className="text-2xl font-black text-amber-400">{stats.served}</h3>
              </div>
              <div className="bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20">
                <CheckCircle2 className="w-5 h-5 text-amber-400" />
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl col-span-2 lg:col-span-1 flex items-center justify-between shadow-lg">
              <div>
                <p className="text-[10px] text-slate-450 font-bold uppercase tracking-wider mb-1">Cancelled</p>
                <h3 className="text-2xl font-black text-rose-450">{stats.cancelled}</h3>
              </div>
              <div className="bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
              </div>
            </div>
          </div>

          {/* Filtering and Toolbar */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-900 border border-slate-800 p-4 rounded-2xl mb-8 shadow-md">
            {/* Active / Past Toggles */}
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 w-full md:w-auto">
              <button
                onClick={() => setFilterType('active')}
                className={`flex-1 md:flex-initial px-5 py-2 text-xs font-bold rounded-lg transition-all
                  ${filterType === 'active'
                    ? 'bg-amber-550 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-slate-205'}`}
              >
                Cook Queue ({stats.pending + stats.preparing})
              </button>
              <button
                onClick={() => setFilterType('past')}
                className={`flex-1 md:flex-initial px-5 py-2 text-xs font-bold rounded-lg transition-all
                  ${filterType === 'past'
                    ? 'bg-amber-555 text-slate-955 shadow-md'
                    : 'text-slate-400 hover:text-slate-205'}`}
              >
                Served History Logs ({stats.served + stats.cancelled})
              </button>
            </div>

            <div className="flex gap-3 w-full md:w-auto items-center">
              {/* Search Bar */}
              <div className="relative flex-1 md:w-60">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-slate-500" />
                </div>
                <input
                  type="text"
                  placeholder="Search table, item, name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2 text-xs border border-slate-800 bg-slate-950 rounded-xl placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500/50 focus:border-amber-600 text-white"
                />
              </div>

              <button
                onClick={clearDatabase}
                className="bg-slate-950 hover:bg-rose-500/10 hover:text-rose-450 border border-slate-800 hover:border-rose-500/20 p-2.5 rounded-xl text-slate-500 transition-all shrink-0"
                title="Reset Console Database"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Orders Feed Layout */}
          {filteredOrders.length === 0 ? (
            <div className="text-center py-24 bg-slate-900 border border-dashed border-slate-800 rounded-3xl p-6">
              <ClipboardList className="h-16 w-16 text-slate-700 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-450">No orders in current list</h3>
              <p className="text-slate-500 text-sm mt-1 max-w-sm mx-auto">
                {filterType === 'active' 
                  ? 'All quiet in the kitchen! Ready to receive self-placed table orders.' 
                  : 'No order logs found matching the filter.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredOrders.map((order) => {
                const checklist = itemChecklists[order.id] || {};
                
                return (
                  <div 
                    key={order.id} 
                    className={`bg-slate-900 rounded-3xl p-6 border relative flex flex-col justify-between shadow-xl transition-all duration-300 hover:scale-[1.01]
                      ${order.status === 'pending' ? 'border-amber-500/30 bg-gradient-to-b from-amber-500/5 to-transparent' : 'border-slate-800'}
                      ${order.status === 'preparing' ? 'border-sky-500/30 bg-gradient-to-b from-sky-500/5 to-transparent' : ''}
                      ${order.status === 'served' ? 'border-emerald-500/10 opacity-90' : ''}
                      ${order.status === 'cancelled' ? 'border-rose-500/15 opacity-60' : ''}
                    `}
                  >
                    <div>
                      {/* Header */}
                      <div className="flex justify-between items-start mb-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span 
                              onClick={() => setSelectedOrder(order)}
                              className="text-xs font-black text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded cursor-pointer hover:bg-amber-500/20 transition-colors uppercase tracking-wider"
                            >
                              {order.id}
                            </span>
                            <span className="text-[10px] text-slate-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {getElapsedMinutes(order.timestamp)}
                            </span>
                          </div>
                          
                          <h4 
                            onClick={() => setSelectedOrder(order)}
                            className="text-xl font-black text-white hover:text-amber-400 transition-colors cursor-pointer"
                          >
                            Table {order.tableNumber}
                          </h4>
                          
                          <p className="text-xs text-slate-300 font-medium">Guest: {order.customerName}</p>
                        </div>

                        {/* Status Label */}
                        <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border
                          ${order.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border-amber-500/25 animate-pulse' : ''}
                          ${order.status === 'preparing' ? 'bg-sky-500/10 text-sky-400 border-sky-500/25' : ''}
                          ${order.status === 'served' ? 'bg-emerald-500/10 text-emerald-450 border-emerald-500/20' : ''}
                          ${order.status === 'cancelled' ? 'bg-rose-500/10 text-rose-450 border-rose-500/20' : ''}
                        `}>
                          {order.status}
                        </span>
                      </div>

                      {/* Items checklist */}
                      <div className="border-t border-slate-800/80 pt-4 mb-6">
                        <p className="text-[10px] font-bold text-slate-500 uppercase mb-2 tracking-wider">Kitchen Checklist</p>
                        <ul className="space-y-2">
                          {order.items.map((item, idx) => {
                            const itemKey = `${item.id}-${idx}`;
                            const isChecked = !!checklist[itemKey];
                            
                            return (
                              <li 
                                key={itemKey} 
                                onClick={() => {
                                  if (order.status === 'preparing') {
                                    toggleItemCheck(order.id, itemKey);
                                  }
                                }}
                                className={`flex items-center justify-between text-sm py-1.5 px-2 rounded-lg transition-all select-none
                                  ${order.status === 'preparing' ? 'cursor-pointer hover:bg-slate-850' : ''}
                                  ${isChecked ? 'bg-slate-850 opacity-50' : ''}
                                `}
                              >
                                <span className="flex items-center gap-3.5">
                                  {order.status === 'preparing' && (
                                    <div className={`w-4.5 h-4.5 rounded border-2 flex items-center justify-center transition-colors
                                      ${isChecked ? 'bg-amber-500 border-amber-500 text-slate-900' : 'border-slate-700'}`}
                                    >
                                      {isChecked && <CheckCircle2 className="w-3.5 h-3.5" />}
                                    </div>
                                  )}
                                  <span className={`font-medium ${isChecked ? 'line-through text-slate-500' : 'text-slate-100'}`}>
                                    <span className="font-extrabold text-amber-400">{item.quantity}x</span> {item.name}
                                  </span>
                                </span>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    </div>

                    {/* Footer Stats & Actions */}
                    <div className="border-t border-slate-800/85 pt-4">
                      <div className="flex justify-between items-center mb-4 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-500 uppercase block">Total Due</span>
                          <span className="text-base font-extrabold text-white">₹{order.totalPrice}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-500 uppercase block">Method</span>
                          <span className={`inline-block font-semibold px-2 py-0.5 rounded text-[10px] mt-0.5
                            ${order.paymentStatus === 'paid' 
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25' 
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/25'}`}>
                            {order.paymentMethod.toUpperCase()} • {order.paymentStatus.toUpperCase()}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        {order.status === 'pending' && (
                          <>
                            <button
                              onClick={() => updateOrderStatus(order.id, 'preparing')}
                              className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md"
                            >
                              Accept & Start Cook
                            </button>
                            <button
                              onClick={() => updateOrderStatus(order.id, 'cancelled')}
                              className="bg-slate-800 hover:bg-rose-500/20 hover:text-rose-400 text-slate-500 p-2.5 rounded-xl border border-slate-750 transition-all"
                              title="Cancel Order"
                            >
                              <Trash2 className="w-4.5 h-4.5" />
                            </button>
                          </>
                        )}

                        {order.status === 'preparing' && (
                          <>
                            <button
                              onClick={() => updateOrderStatus(order.id, 'served')}
                              className="flex-1 bg-gradient-to-r from-sky-500 to-amber-500 hover:from-sky-650 hover:to-amber-600 text-slate-950 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md"
                            >
                              Mark as Served
                            </button>
                            <button
                              onClick={() => updateOrderStatus(order.id, 'cancelled')}
                              className="bg-slate-800 hover:bg-rose-500/20 hover:text-rose-400 text-slate-500 p-2.5 rounded-xl border border-slate-750 transition-all"
                              title="Cancel Order"
                            >
                              <Trash2 className="w-4.5 h-4.5" />
                            </button>
                          </>
                        )}
                        
                        {/* Print shortcut for history */}
                        {(order.status === 'served' || order.status === 'cancelled') && (
                          <button
                            onClick={() => {
                              setSelectedOrder(order);
                              setTimeout(() => window.print(), 100);
                            }}
                            className="w-full bg-slate-850 hover:bg-slate-800 border border-slate-800 text-slate-300 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                          >
                            <Printer className="w-3.5 h-3.5" /> Print Ticket Reciept
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-850 py-6 text-center text-xs text-slate-500 print:hidden">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-2">
          <p>© {new Date().getFullYear()} Crazy Cheesy Cafe. Staff Kitchen Management Portal.</p>
          <p className="flex items-center gap-1">
            Status: <span className="inline-block w-2.5 h-2.5 bg-emerald-500 rounded-full"></span> Live Order Synced
          </p>
        </div>
      </footer>

      {/* --- DETAIL & RECEIPT MODAL --- */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm print:hidden"
             onClick={() => setSelectedOrder(null)}>
          <div 
            className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden w-full max-w-lg shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-4 right-4 flex gap-2">
              <button 
                onClick={() => window.print()}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 p-2.5 rounded-full shadow-md transition-colors"
                title="Print Kitchen Slip"
              >
                <Printer className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setSelectedOrder(null)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-205 p-2.5 rounded-full shadow-md transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 sm:p-8 space-y-6">
              <div className="space-y-1">
                <span className="text-xs font-black text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded uppercase tracking-wide">
                  Order {selectedOrder.id}
                </span>
                <h2 className="text-2xl font-black text-white mt-3">Table {selectedOrder.tableNumber} Receipt</h2>
                <p className="text-xs text-slate-400">Placed: {new Date(selectedOrder.timestamp).toLocaleString()}</p>
              </div>

              {/* Guest Details */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 space-y-2 text-sm text-slate-350">
                <p><strong>Customer Name:</strong> {selectedOrder.customerName}</p>
                <p><strong>Contact Phone:</strong> {selectedOrder.customerPhone || 'Not provided'}</p>
                <p><strong>Payment Status:</strong> {selectedOrder.paymentStatus.toUpperCase()} ({selectedOrder.paymentMethod === 'upi' ? 'UPI QR Code' : 'Cash Counter'})</p>
                <p><strong>Current State:</strong> <span className="font-bold text-amber-450 uppercase">{selectedOrder.status}</span></p>
              </div>

              {/* Items List */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-450 uppercase tracking-wider">Ordered Items</h3>
                <ul className="divide-y divide-slate-800 border-y border-slate-800 py-2">
                  {selectedOrder.items.map((it, idx) => (
                    <li key={idx} className="flex justify-between py-2 text-sm">
                      <span>
                        <span className="font-bold text-amber-400">{it.quantity}x</span> {it.name}
                      </span>
                      <span className="font-bold text-white">₹{it.price * it.quantity}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex justify-between items-center text-lg font-black text-white pt-2">
                <span>Receipt Total</span>
                <span className="text-amber-400">₹{selectedOrder.totalPrice}</span>
              </div>

              {/* Footer Actions */}
              <div className="flex gap-3 pt-4 border-t border-slate-800">
                {selectedOrder.status === 'pending' && (
                  <button
                    onClick={() => updateOrderStatus(selectedOrder.id, 'preparing')}
                    className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-950 py-3 rounded-2xl text-xs font-bold transition-all shadow-md"
                  >
                    Accept & Start Cook
                  </button>
                )}
                {selectedOrder.status === 'preparing' && (
                  <button
                    onClick={() => updateOrderStatus(selectedOrder.id, 'served')}
                    className="flex-1 bg-gradient-to-r from-sky-500 to-amber-500 hover:from-sky-650 hover:to-amber-600 text-slate-950 py-3 rounded-2xl text-xs font-bold transition-all shadow-md"
                  >
                    Mark as Served (Done)
                  </button>
                )}
                {selectedOrder.status !== 'cancelled' && selectedOrder.status !== 'served' && (
                  <button
                    onClick={() => updateOrderStatus(selectedOrder.id, 'cancelled')}
                    className="bg-slate-800 hover:bg-rose-500/15 hover:text-rose-400 text-slate-450 px-4 py-3 rounded-2xl text-xs font-bold border border-slate-750 transition-all"
                  >
                    Cancel Order
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
