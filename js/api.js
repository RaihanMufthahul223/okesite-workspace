/**
 * =========================================================================
 * BOS UMKM - API & DATA SERVICE LAYER
 * =========================================================================
 * File ini dirancang agar mudah diintegrasikan dengan backend buatan rekan Anda.
 * 
 * CARA MENGHUBUNGKAN KE BACKEND REAL:
 * 1. Ubah USE_MOCK menjadi false
 * 2. Sesuaikan API_BASE_URL ke endpoint backend rekan Anda (misal: 'http://localhost/bos-umkm/api')
 * =========================================================================
 */

const ApiConfig = {
  USE_MOCK: true,
  API_BASE_URL: 'http://localhost/bos-umkm/api',
  TIMEOUT: 8000
};

// Data Dummy Realistis untuk Keperluan Presentasi & Demo Frontend
const MockData = {
  user: {
    name: "Andhika Putra",
    role: "Owner / Juragan",
    storeName: "Berkah Jaya Mandiri",
    isPremium: true,
    premiumExpiry: "12 Des 2026",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80"
  },

  dashboard: {
    today: {
      stockAvailable: 342,      // Stok aman
      stockUnit: "item",
      stockStatus: "Aman",
      stockOut: 38,             // Barang keluar / terjual
      stockOutUnit: "terjual",
      turnover: 2840000,        // Omzet (Rp)
      turnoverGrowth: "+14.8%",
      profit: 965000,           // Untung Bersih (Rp)
      profitMargin: "33.9%"
    },
    weekly: {
      stockAvailable: 342,
      stockOut: 245,
      turnover: 18750000,
      turnoverGrowth: "+21.2%",
      profit: 6420000,
      profitMargin: "34.2%"
    },
    monthly: {
      stockAvailable: 342,
      stockOut: 980,
      turnover: 74200000,
      turnoverGrowth: "+18.5%",
      profit: 25800000,
      profitMargin: "34.7%"
    }
  },

  stockList: [
    { id: "STK-001", name: "Beras Rojolele 5kg", category: "Sembako", stock: 28, minStock: 10, unit: "sak", buyPrice: 65000, sellPrice: 75000, status: "safe" },
    { id: "STK-002", name: "Minyak Goreng Sania 2L", category: "Sembako", stock: 5, minStock: 15, unit: "pouch", buyPrice: 32000, sellPrice: 36000, status: "warning" },
    { id: "STK-003", name: "Gula Pasir Gulaku 1kg", category: "Sembako", stock: 45, minStock: 12, unit: "bungkus", buyPrice: 15500, sellPrice: 18000, status: "safe" },
    { id: "STK-004", name: "Kopi Arabika Gayo 250g", category: "Minuman", stock: 18, minStock: 5, unit: "pack", buyPrice: 42000, sellPrice: 60000, status: "safe" },
    { id: "STK-005", name: "Telur Ayam Negeri 1kg", category: "Sembako", stock: 3, minStock: 10, unit: "kg", buyPrice: 26000, sellPrice: 29500, status: "danger" },
    { id: "STK-006", name: "Sambal Bawang Kemasan 150g", category: "Makanan", stock: 32, minStock: 8, unit: "botol", buyPrice: 18000, sellPrice: 28000, status: "safe" }
  ],

  transactions: [
    { id: "TRX-2026-0920-001", time: "16:45", customer: "Ibu Ratna", items: "Beras 5kg (1x), Minyak 2L (2x)", total: 147000, type: "sale", paymentMethod: "QRIS" },
    { id: "TRX-2026-0920-002", time: "15:20", customer: "Pak Bambang", items: "Kopi Arabika (2x)", total: 120000, type: "sale", paymentMethod: "Tunai" },
    { id: "TRX-2026-0920-003", time: "14:10", customer: "Supplier Beras", items: "Restok Beras Rojolele 20 sak", total: 1300000, type: "purchase", paymentMethod: "Transfer" },
    { id: "TRX-2026-0920-004", time: "11:35", customer: "Mbak Cindy", items: "Sambal Bawang (3x), Gula (2x)", total: 120000, type: "sale", paymentMethod: "QRIS" },
    { id: "TRX-2026-0920-005", time: "09:15", customer: "Toko Plastik Makmur", items: "Kantong Kresek & Plastik Packing", total: 65000, type: "expense", paymentMethod: "Tunai" }
  ],

  operations: [
    { id: "OPS-01", name: "Listrik & Air Toko", category: "Utilitas", amount: 450000, date: "15 Sep 2026", status: "Lunas" },
    { id: "OPS-02", name: "Bensin Kurir Antar", category: "Transport", amount: 50000, date: "19 Sep 2026", status: "Lunas" },
    { id: "OPS-03", name: "Kemasan & Lakban", category: "Packaging", amount: 120000, date: "20 Sep 2026", status: "Lunas" }
  ],

  marketing: [
    { id: "MKT-01", title: "Promo Gajian Akhir Bulan", discount: "Diskon 10% Min. Belanja 100rb", channel: "WhatsApp & Banner", status: "Aktif", reach: "142 Pelanggan" },
    { id: "MKT-02", title: "Flash Sale Sembako Jumat Berkah", discount: "Minyak Goreng Potongan Rp 3.000", channel: "Status WA", status: "Selesai", reach: "89 Pelanggan" },
    { id: "MKT-03", title: "Broadcast Kupon Pelanggan Setia", discount: "Cashback Rp 5.000", channel: "SMS / WA Blast", status: "Draft", reach: "-" }
  ],

  notifications: [
    { id: "NOTIF-1", title: "⚠️ Stok Telur Hampir Habis", message: "Tersisa 3 kg, segera lakukan restok sebelum kehabisan!", time: "10 menit lalu", unread: true },
    { id: "NOTIF-2", title: "🎉 Omzet Hari Ini Melampaui Target", message: "Selamat! Omzet tembus Rp 2.800.000 lebih cepat dari perkiraan.", time: "1 jam lalu", unread: true },
    { id: "NOTIF-3", title: "💡 Tips Bos UMKM", message: "Gunakan fitur Broadcast WhatsApp untuk tingkatkan repeat order pelanggan.", time: "Kemarin", unread: false }
  ]
};

// Objek Service Utama
const BosApi = {
  // 1. Get Dashboard Summary (Hari ini / Minggu ini / Bulan ini)
  async getDashboardSummary(period = 'today') {
    if (ApiConfig.USE_MOCK) {
      return new Promise(resolve => setTimeout(() => {
        resolve({ success: true, data: MockData.dashboard[period] || MockData.dashboard.today });
      }, 150));
    }

    try {
      const res = await fetch(`${ApiConfig.API_BASE_URL}/dashboard?period=${period}`);
      return await res.json();
    } catch (err) {
      console.error("Gagal memuat data dashboard:", err);
      return { success: false, message: err.message, data: MockData.dashboard.today };
    }
  },

  // 2. Get Data Stok
  async getStockList() {
    if (ApiConfig.USE_MOCK) {
      return new Promise(resolve => setTimeout(() => {
        resolve({ success: true, data: MockData.stockList });
      }, 150));
    }

    try {
      const res = await fetch(`${ApiConfig.API_BASE_URL}/stok`);
      return await res.json();
    } catch (err) {
      console.error("Gagal memuat stok:", err);
      return { success: false, data: MockData.stockList };
    }
  },

  // 3. Tambah Stok Baru (POST)
  async addStockItem(newItem) {
    if (ApiConfig.USE_MOCK) {
      const itemWithId = {
        id: "STK-" + String(MockData.stockList.length + 1).padStart(3, '0'),
        status: newItem.stock <= (newItem.minStock || 10) ? 'warning' : 'safe',
        ...newItem
      };
      MockData.stockList.unshift(itemWithId);
      MockData.dashboard.today.stockAvailable += parseInt(newItem.stock || 0);
      return { success: true, message: "Produk berhasil ditambahkan ke stok!", data: itemWithId };
    }

    try {
      const res = await fetch(`${ApiConfig.API_BASE_URL}/stok`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem)
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: err.message };
    }
  },

  // 4. Get Riwayat Transaksi
  async getTransactions() {
    if (ApiConfig.USE_MOCK) {
      return new Promise(resolve => setTimeout(() => {
        resolve({ success: true, data: MockData.transactions });
      }, 150));
    }

    try {
      const res = await fetch(`${ApiConfig.API_BASE_URL}/transaksi`);
      return await res.json();
    } catch (err) {
      return { success: false, data: MockData.transactions };
    }
  },

  // 5. Simpan Transaksi Baru
  async createTransaction(txData) {
    if (ApiConfig.USE_MOCK) {
      const newTx = {
        id: "TRX-" + Date.now().toString().slice(-6),
        time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        ...txData
      };
      MockData.transactions.unshift(newTx);
      if (txData.type === 'sale') {
        MockData.dashboard.today.turnover += Number(txData.total || 0);
        MockData.dashboard.today.profit += Math.round(Number(txData.total || 0) * 0.35);
        MockData.dashboard.today.stockOut += 1;
      }
      return { success: true, message: "Transaksi berhasil dicatat!", data: newTx };
    }

    try {
      const res = await fetch(`${ApiConfig.API_BASE_URL}/transaksi`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(txData)
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: err.message };
    }
  },

  // 6. Get Data Operasional & Marketing
  async getOperations() {
    return { success: true, data: MockData.operations };
  },

  async getMarketing() {
    return { success: true, data: MockData.marketing };
  },

  async getNotifications() {
    return { success: true, data: MockData.notifications };
  },

  // 7. Simpan Operasional Baru
  async addOperationExpense(expense) {
    if (ApiConfig.USE_MOCK) {
      const newExp = {
        id: "OPS-" + Date.now().toString().slice(-4),
        date: "Hari ini",
        status: "Lunas",
        ...expense
      };
      MockData.operations.unshift(newExp);
      return { success: true, message: "Biaya operasional berhasil dicatat!", data: newExp };
    }
  },

  // 8. Simpan Promo Marketing Baru
  async addMarketingCampaign(promo) {
    if (ApiConfig.USE_MOCK) {
      const newPromo = {
        id: "MKT-" + Date.now().toString().slice(-4),
        status: "Aktif",
        reach: "Dalam proses",
        ...promo
      };
      MockData.marketing.unshift(newPromo);
      return { success: true, message: "Promo marketing berhasil diterbitkan!", data: newPromo };
    }
  },

  // 9. Multi-Toko & Akun Cabang (Fitur Ganti Toko & Tambah Toko Baru)
  async getStores() {
    return { success: true, data: MockData.stores };
  },

  async getActiveStore() {
    let active = MockData.stores.find(s => s.isActive);
    if (!active) {
      active = MockData.stores[0];
      active.isActive = true;
    }
    return { success: true, data: active };
  },

  async switchStore(storeId) {
    MockData.stores.forEach(s => {
      s.isActive = (s.id === storeId);
    });
    try {
      localStorage.setItem('bos_umkm_stores', JSON.stringify(MockData.stores));
    } catch(e) {}
    const active = MockData.stores.find(s => s.id === storeId) || MockData.stores[0];
    MockData.user.storeName = active.name;
    MockData.dashboard.today.turnover = active.todayTurnover || 2500000;
    MockData.dashboard.today.profit = active.todayProfit || 850000;
    MockData.dashboard.today.stockAvailable = active.stockCount || 200;
    return { success: true, message: `Beralih ke toko: ${active.name} (${active.branch || 'Pusat'})`, data: active };
  },

  async addStore(storeData) {
    const newStore = {
      id: "STORE-" + String(MockData.stores.length + 1).padStart(2, '0'),
      isActive: true, // Langsung aktifkan toko baru
      todayTurnover: 0,
      todayProfit: 0,
      stockCount: 0,
      ...storeData
    };
    MockData.stores.forEach(s => s.isActive = false);
    MockData.stores.unshift(newStore);
    try {
      localStorage.setItem('bos_umkm_stores', JSON.stringify(MockData.stores));
    } catch(e) {}
    MockData.user.storeName = newStore.name;
    MockData.dashboard.today.turnover = 0;
    MockData.dashboard.today.profit = 0;
    MockData.dashboard.today.stockAvailable = 0;
    MockData.dashboard.today.stockOut = 0;
    return { success: true, message: `Toko baru "${newStore.name}" berhasil dibuat & langsung aktif!`, data: newStore };
  }
};

// Inisialisasi Toko Default
const defaultStoresList = [
  {
    id: "STORE-01",
    name: "Toko Berkah Mandiri",
    branch: "Pusat (Jakarta)",
    address: "Jl. Merdeka No. 12, Jakarta Pusat",
    phone: "0812-3456-7890",
    category: "Sembako & Kelontong",
    isActive: true,
    todayTurnover: 2840000,
    todayProfit: 965000,
    stockCount: 342
  },
  {
    id: "STORE-02",
    name: "Warung Berkah Jaya 2",
    branch: "Cabang Pasar Minggu",
    address: "Kios Blok A No. 05, Pasar Minggu",
    phone: "0857-1122-3344",
    category: "Minuman & Kopi",
    isActive: false,
    todayTurnover: 1420000,
    todayProfit: 510000,
    stockCount: 186
  },
  {
    id: "STORE-03",
    name: "Dapur Sambal Berkah",
    branch: "Outlet Kuliner Tebet",
    address: "Food Court Lt. 1, Tebet",
    phone: "0813-8899-0011",
    category: "Kuliner & Sambal Kemasan",
    isActive: false,
    todayTurnover: 980000,
    todayProfit: 390000,
    stockCount: 65
  }
];

let cachedStores = null;
try {
  const local = localStorage.getItem('bos_umkm_stores');
  if (local) cachedStores = JSON.parse(local);
} catch (e) {}

MockData.stores = cachedStores && cachedStores.length ? cachedStores : defaultStoresList;

window.BosApi = BosApi;
window.MockData = MockData;

