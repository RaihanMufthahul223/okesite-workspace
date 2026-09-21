/**
 * =========================================================================
 * BOS UMKM - APP CONTROLLER & MULTI-SCREEN ROUTER
 * =========================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
  // State Aplikasi
  const state = {
    isPrivacyHidden: true, // Default seperti foto: metrik bertanda asterisk (*)
    currentPeriod: 'today',
    currentTab: 'home',
    dashboardData: null,
    stockFilter: 'all',
    stockSearch: '',
    stockSortAsc: true,
    txFilter: 'all',
    showEmptyHistoryState: false
  };

  // Elemen DOM
  const elements = {
    // Screen Views
    viewHome: document.getElementById('viewHome'),
    viewWarehouse: document.getElementById('viewWarehouse'),
    viewHistory: document.getElementById('viewHistory'),
    viewAccount: document.getElementById('viewAccount'),

    // Privacy Toggle
    privacyBtn: document.getElementById('privacyToggleBtn'),
    privacyIcon: document.getElementById('privacyIcon'),
    privacyText: document.getElementById('privacyText'),
    
    // Metrik Card
    valStock: document.getElementById('valStock'),
    valStockOut: document.getElementById('valStockOut'),
    valTurnover: document.getElementById('valTurnover'),
    valProfit: document.getElementById('valProfit'),
    indStock: document.getElementById('indStock'),
    indStockOut: document.getElementById('indStockOut'),
    indTurnover: document.getElementById('indTurnover'),
    indProfit: document.getElementById('indProfit'),

    // Modals
    modalOverlay: document.getElementById('modalOverlay'),
    modalTitle: document.getElementById('modalTitle'),
    modalBody: document.getElementById('modalBody'),
    modalCloseBtn: document.getElementById('modalCloseBtn'),

    // Buttons Beranda
    btnReport: document.getElementById('btnReport'),
    menuStock: document.getElementById('menuStock'),
    menuOps: document.getElementById('menuOps'),
    menuMarketing: document.getElementById('menuMarketing'),
    btnQuickPos: document.getElementById('btnQuickPos'),
    btnQuickScan: document.getElementById('btnQuickScan'),
    btnQuickExpense: document.getElementById('btnQuickExpense'),

    // Daftar Barang
    warehouseProductList: document.getElementById('warehouseProductList'),
    warehouseSearchInput: document.getElementById('warehouseSearchInput'),
    btnScanBarcodeInSearch: document.getElementById('btnScanBarcodeInSearch'),
    btnSortProducts: document.getElementById('btnSortProducts'),
    fabAddProduct: document.getElementById('fabAddProduct'),
    categoryChips: document.querySelectorAll('.chip-pill'),

    // Riwayat
    historyTransactionsList: document.getElementById('historyTransactionsList'),
    historySearchInput: document.getElementById('historySearchInput'),
    historyEmptyState: document.getElementById('historyEmptyState'),
    historyActionRow: document.getElementById('historyActionRow'),
    btnToggleEmptyHistory: document.getElementById('btnToggleEmptyHistory'),
    btnDownloadExcel: document.getElementById('btnDownloadExcel'),
    btnDownloadExcelEmpty: document.getElementById('btnDownloadExcelEmpty'),
    txFilterTabs: document.querySelectorAll('[data-tx-filter]'),

    // Universal Nav & Triggers
    centerProfileBtn: document.getElementById('centerProfileBtn'),
    navItems: document.querySelectorAll('.nav-item'),
    recentTransactionsList: document.getElementById('recentTransactionsList'),
    triggersSupport: document.querySelectorAll('.btn-trigger-support'),
    triggersNotif: document.querySelectorAll('.btn-trigger-notif'),
    triggersPremium: document.querySelectorAll('.btn-trigger-premium')
  };

  // Format Angka Rupiah
  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(number);
  };

  // Tampilkan Notifikasi Toast
  const showToast = (message, type = 'info') => {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <span>${type === 'success' ? '✓' : type === 'warning' ? '⚠️' : 'ℹ️'}</span>
      <span>${message}</span>
    `;

    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-20px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  };

  // -------------------------------------------------------------------------
  // Multi-Screen Router (Navigasi Antar Layar: Beranda, Gudang, Riwayat, Akun)
  // -------------------------------------------------------------------------
  const navigateTo = (tabName) => {
    state.currentTab = tabName;

    // Cek apakah halaman saat ini memiliki multi screen-view (seperti di index.html)
    const allViews = document.querySelectorAll('.screen-view');
    if (allViews.length <= 1) {
      return false; // Izinkan browser pindah halaman HTML secara normal
    }

    // Sembunyikan semua layar
    allViews.forEach(view => {
      view.classList.remove('active');
    });

    // Reset active nav item
    elements.navItems.forEach(item => {
      item.classList.remove('active');
    });

    // Update status switcher button
    document.querySelectorAll('[data-tab-switch]').forEach(btn => {
      btn.classList.remove('active');
      if (btn.dataset.tabSwitch === tabName) btn.classList.add('active');
    });

    if (tabName === 'home' && elements.viewHome) {
      elements.viewHome.classList.add('active');
      const navHome = document.querySelector('.nav-item[data-tab="home"]');
      if (navHome) navHome.classList.add('active');
      loadDashboard();
      loadRecentTransactions();
    } else if (tabName === 'warehouse' && elements.viewWarehouse) {
      elements.viewWarehouse.classList.add('active');
      const navWh = document.querySelector('.nav-item[data-tab="warehouse"]');
      if (navWh) navWh.classList.add('active');
      renderWarehouseProducts();
    } else if (tabName === 'history' && elements.viewHistory) {
      elements.viewHistory.classList.add('active');
      const navHist = document.querySelector('.nav-item[data-tab="history"]');
      if (navHist) navHist.classList.add('active');
      renderHistoryTransactions();
    } else if ((tabName === 'settings' || tabName === 'account') && elements.viewAccount) {
      elements.viewAccount.classList.add('active');
      const navSet = document.querySelector('.nav-item[data-tab="settings"]');
      if (navSet) navSet.classList.add('active');
    }

    // Scroll ke atas layar baru
    const activeView = document.querySelector('.screen-view.active');
    if (activeView) activeView.scrollTop = 0;
    return true;
  };

  // Event Listener Navigasi Bawah
  elements.navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      const tab = item.dataset.tab;
      if (tab && navigateTo(tab)) {
        e.preventDefault();
      }
    });
  });

  // Tombol Profil Tengah Melayang
  if (elements.centerProfileBtn) {
    elements.centerProfileBtn.addEventListener('click', (e) => {
      if (navigateTo('account')) {
        e.preventDefault();
      }
    });
  }

  // Switcher Buttons Cepat
  document.querySelectorAll('[data-tab-switch]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const tab = btn.dataset.tabSwitch;
      if (tab && navigateTo(tab)) {
        e.preventDefault();
      }
    });
  });

  // -------------------------------------------------------------------------
  // Metrik & Privasi Dashboard Beranda
  // -------------------------------------------------------------------------
  const loadDashboard = async (period = 'today') => {
    const res = await window.BosApi.getDashboardSummary(period);
    if (res.success) {
      state.dashboardData = res.data;
      renderMetrics();
    }
  };

  const renderMetrics = () => {
    const d = state.dashboardData;
    if (!d || !elements.valStock) return;

    if (state.isPrivacyHidden) {
      // Tampilan persis seperti di foto pengguna (Tanda asterisk *)
      elements.valStock.textContent = '*';
      elements.valStockOut.textContent = '*';
      elements.valTurnover.textContent = '*';
      elements.valProfit.textContent = '*';

      // Warna asterisk sesuai foto: Stok hijau, Keluar merah
      elements.valStock.style.color = '#10b981';
      elements.valStockOut.style.color = '#ef4444';
      elements.valTurnover.style.color = '#0f172a';
      elements.valProfit.style.color = '#0f172a';

      elements.privacyText.textContent = 'Buka Nilai';
      elements.privacyIcon.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
          <circle cx="12" cy="12" r="3"></circle>
        </svg>
      `;
    } else {
      // Tampilan nominal bisnis lengkap
      elements.valStock.textContent = `${d.stockAvailable} item`;
      elements.valStockOut.textContent = `${d.stockOut} terjual`;
      elements.valTurnover.textContent = formatRupiah(d.turnover);
      elements.valProfit.textContent = formatRupiah(d.profit);

      elements.valStock.style.color = '#0f172a';
      elements.valStockOut.style.color = '#0f172a';
      elements.valTurnover.style.color = '#0f172a';
      elements.valProfit.style.color = '#10b981';

      elements.privacyText.textContent = 'Sembunyikan';
      elements.privacyIcon.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
          <line x1="1" y1="1" x2="23" y2="23"></line>
        </svg>
      `;
    }
  };

  if (elements.privacyBtn) {
    elements.privacyBtn.addEventListener('click', () => {
      state.isPrivacyHidden = !state.isPrivacyHidden;
      renderMetrics();
      showToast(
        state.isPrivacyHidden ? 'Nominal disembunyikan (*) demi privasi Anda' : 'Nominal bisnis ditampilkan lengkap',
        'info'
      );
    });
  }

  // Muat Transaksi Terkini di Beranda
  const loadRecentTransactions = async () => {
    const res = await window.BosApi.getTransactions();
    if (!res.success || !elements.recentTransactionsList) return;

    elements.recentTransactionsList.innerHTML = '';
    res.data.slice(0, 4).forEach(tx => {
      const isSale = tx.type === 'sale';
      const isExpense = tx.type === 'expense';
      
      const itemEl = document.createElement('div');
      itemEl.className = 'tx-item';
      itemEl.innerHTML = `
        <div class="tx-left">
          <div class="tx-icon ${isSale ? 'tx-icon-sale' : isExpense ? 'tx-icon-expense' : 'tx-icon-restock'}">
            ${isSale ? '💰' : isExpense ? '📤' : '📦'}
          </div>
          <div class="tx-info">
            <h4>${tx.customer || tx.items}</h4>
            <p>${tx.items} • <span style="font-weight:700;">${tx.paymentMethod}</span></p>
          </div>
        </div>
        <div class="tx-right">
          <div class="tx-amount ${isSale ? 'tx-amount-plus' : 'tx-amount-minus'}">
            ${isSale ? '+' : '-'}${formatRupiah(tx.total)}
          </div>
          <div class="tx-time">${tx.time}</div>
        </div>
      `;
      elements.recentTransactionsList.appendChild(itemEl);
    });
  };

  // -------------------------------------------------------------------------
  // LAYAR DAFTAR BARANG: Render, Filter Kategori, Search & Sort
  // -------------------------------------------------------------------------
  const renderWarehouseProducts = async () => {
    if (!elements.warehouseProductList) return;
    const res = await window.BosApi.getStockList();
    let items = res.data || [];

    // Filter Kategori
    if (state.stockFilter === 'low') {
      items = items.filter(i => i.status === 'warning' || i.status === 'danger' || i.stock <= i.minStock);
    } else if (state.stockFilter !== 'all') {
      items = items.filter(i => i.category === state.stockFilter);
    }

    // Filter Search
    if (state.stockSearch.trim() !== '') {
      const q = state.stockSearch.toLowerCase();
      items = items.filter(i => i.name.toLowerCase().includes(q) || (i.id && i.id.toLowerCase().includes(q)));
    }

    // Sortir Nama
    items.sort((a, b) => {
      return state.stockSortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
    });

    if (items.length === 0) {
      elements.warehouseProductList.innerHTML = `
        <div class="empty-state-box" style="margin-top:10px; padding:30px 20px;">
          <div style="font-size:36px; margin-bottom:8px;">🔍</div>
          <h4 style="font-size:16px; font-weight:800; color:#0f172a;">Produk tidak ditemukan</h4>
          <p style="font-size:12px; color:#64748b; margin-top:4px;">Coba gunakan kata kunci pencarian lain atau tambah barang baru.</p>
        </div>
      `;
      return;
    }

    const emojiMap = {
      "Sembako": "🌾",
      "Minuman": "☕",
      "Makanan": "🍱",
      "Umum": "📦"
    };

    elements.warehouseProductList.innerHTML = items.map(item => {
      const emoji = emojiMap[item.category] || "📦";
      const statusText = item.status === 'safe' ? 'Stok Aman' : item.status === 'warning' ? 'Stok Menipis' : 'Stok Kritis!';
      const badgeClass = item.status === 'safe' ? 'stock-pill-safe' : item.status === 'warning' ? 'stock-pill-warning' : 'stock-pill-danger';

      return `
        <div class="product-card" data-product-id="${item.id}">
          <div class="product-img-box">${emoji}</div>
          <div class="product-info-box">
            <div class="product-name-row">
              <span class="product-name">${item.name}</span>
              <span class="product-price">${formatRupiah(item.sellPrice)}</span>
            </div>
            <div class="product-meta-row">
              <span class="product-sku">${item.id} • ${item.category}</span>
              <span class="stock-pill ${badgeClass}">
                ● ${item.stock} ${item.unit} (${statusText})
              </span>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Detail Produk saat diklik
    elements.warehouseProductList.querySelectorAll('.product-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.dataset.productId;
        const p = items.find(x => x.id === id);
        if (!p) return;

        openModal(`📦 Detail: ${p.name}`, `
          <div style="text-align:center; padding:10px 0 16px 0;">
            <div style="font-size:44px; margin-bottom:6px;">${emojiMap[p.category] || '📦'}</div>
            <h3 style="font-size:18px; font-weight:800; color:#0f172a;">${p.name}</h3>
            <span style="font-size:12px; color:#64748b;">Kode SKU: ${p.id}</span>
          </div>

          <div style="background:#f8fafc; border-radius:14px; padding:16px; border:1px solid #e2e8f0; margin-bottom:16px;">
            <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:13px;">
              <span style="color:#64748b;">Kategori:</span>
              <strong>${p.category}</strong>
            </div>
            <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:13px;">
              <span style="color:#64748b;">Stok Saat Ini:</span>
              <strong style="color:#0f172a;">${p.stock} ${p.unit}</strong>
            </div>
            <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:13px;">
              <span style="color:#64748b;">Harga Modal:</span>
              <span>${formatRupiah(p.buyPrice)}</span>
            </div>
            <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:13px;">
              <span style="color:#64748b;">Harga Jual:</span>
              <strong style="color:#1053d4;">${formatRupiah(p.sellPrice)}</strong>
            </div>
            <div style="display:flex; justify-content:space-between; font-size:13px;">
              <span style="color:#64748b;">Estimasi Margin Laba:</span>
              <strong style="color:#10b981;">+${formatRupiah(p.sellPrice - p.buyPrice)} (${Math.round(((p.sellPrice - p.buyPrice)/p.sellPrice)*100)}%)</strong>
            </div>
          </div>

          <div style="display:flex; gap:10px;">
            <button class="btn-primary-action" onclick="alert('Form restok produk');">
              + Restok Barang
            </button>
            <button class="btn-secondary-action" style="margin-top:0;" onclick="document.getElementById('modalCloseBtn').click();">
              Tutup
            </button>
          </div>
        `);
      });
    });
  };

  // Filter Chips Kategori
  elements.categoryChips.forEach(chip => {
    chip.addEventListener('click', () => {
      elements.categoryChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      state.stockFilter = chip.dataset.filter;
      renderWarehouseProducts();
    });
  });

  // Search Input di Daftar Barang
  if (elements.warehouseSearchInput) {
    elements.warehouseSearchInput.addEventListener('input', (e) => {
      state.stockSearch = e.target.value;
      renderWarehouseProducts();
    });
  }

  // Sort Button
  if (elements.btnSortProducts) {
    elements.btnSortProducts.addEventListener('click', () => {
      state.stockSortAsc = !state.stockSortAsc;
      showToast(state.stockSortAsc ? 'Urutkan: A ke Z' : 'Urutkan: Z ke A', 'info');
      renderWarehouseProducts();
    });
  }

  // Scanner Button di Kolom Search
  if (elements.btnScanBarcodeInSearch) {
    elements.btnScanBarcodeInSearch.addEventListener('click', () => {
      openModal('📷 Scan Barcode Produk', `
        <div style="text-align:center; padding:20px 10px;">
          <div style="width:200px; height:200px; border:3px dashed #2563eb; border-radius:20px; margin:0 auto 16px auto; display:flex; align-items:center; justify-content:center; background:#eff6ff;">
            <span style="font-size:48px;">📷</span>
          </div>
          <p style="font-size:14px; font-weight:700; color:#1e293b;">Arahkan kamera ke Barcode Produk Dagangan</p>
          <p style="font-size:12px; color:#64748b; margin-top:4px;">Kamera aktif mendeteksi barcode otomatis.</p>
          <button class="btn-primary-action" style="margin-top:20px;" onclick="document.getElementById('modalCloseBtn').click();">
            Simulasi Scan: STK-001 (Beras Rojolele)
          </button>
        </div>
      `);
    });
  }

  // Floating Action Button (+ Barang Sesuai Foto Pengguna)
  const openAddStockModal = () => {
    openModal('➕ Tambah Produk / Stok Baru', `
      <form id="formAddStock">
        <div class="form-group">
          <label class="form-label">Nama Produk / Barang Dagangan</label>
          <input type="text" id="inputStockName" class="form-input" placeholder="Contoh: Kopi Susu Aren 250ml" required>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Jumlah Stok</label>
            <input type="number" id="inputStockQty" class="form-input" placeholder="50" required>
          </div>
          <div class="form-group">
            <label class="form-label">Satuan</label>
            <select id="inputStockUnit" class="form-select">
              <option value="pcs">pcs</option>
              <option value="kg">kg</option>
              <option value="sak">sak</option>
              <option value="pouch">pouch</option>
              <option value="botol">botol</option>
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Kategori</label>
            <select id="inputStockCategory" class="form-select">
              <option value="Sembako">Sembako</option>
              <option value="Minuman">Minuman</option>
              <option value="Makanan">Makanan</option>
              <option value="Umum">Umum</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Stok Minimum</label>
            <input type="number" id="inputStockMin" class="form-input" placeholder="10" value="10">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Harga Modal (Rp)</label>
            <input type="number" id="inputBuyPrice" class="form-input" placeholder="15000" required>
          </div>
          <div class="form-group">
            <label class="form-label">Harga Jual (Rp)</label>
            <input type="number" id="inputSellPrice" class="form-input" placeholder="20000" required>
          </div>
        </div>
        <button type="submit" class="btn-primary-action" style="margin-top:10px;">Simpan ke Katalog Stok</button>
      </form>
    `);

    document.getElementById('formAddStock').addEventListener('submit', async (e) => {
      e.preventDefault();
      const newItem = {
        name: document.getElementById('inputStockName').value,
        stock: parseInt(document.getElementById('inputStockQty').value),
        unit: document.getElementById('inputStockUnit').value,
        category: document.getElementById('inputStockCategory').value,
        minStock: parseInt(document.getElementById('inputStockMin').value) || 10,
        buyPrice: parseInt(document.getElementById('inputBuyPrice').value),
        sellPrice: parseInt(document.getElementById('inputSellPrice').value)
      };

      const res = await window.BosApi.addStockItem(newItem);
      showToast(res.message, 'success');
      closeModal();
      await renderWarehouseProducts();
      await loadDashboard();
    });
  };

  if (elements.fabAddProduct) elements.fabAddProduct.addEventListener('click', openAddStockModal);
  if (elements.menuStock) elements.menuStock.addEventListener('click', () => navigateTo('warehouse'));

  // -------------------------------------------------------------------------
  // LAYAR RIWAYAT: Render Transaksi, Filter & Empty State Sesuai Foto
  // -------------------------------------------------------------------------
  const renderHistoryTransactions = async () => {
    if (!elements.historyTransactionsList) return;

    if (state.showEmptyHistoryState) {
      elements.historyTransactionsList.style.display = 'none';
      if (elements.historyActionRow) elements.historyActionRow.style.display = 'none';
      elements.historyEmptyState.style.display = 'flex';
      return;
    }

    elements.historyEmptyState.style.display = 'none';
    elements.historyTransactionsList.style.display = 'flex';
    if (elements.historyActionRow) elements.historyActionRow.style.display = 'block';

    const res = await window.BosApi.getTransactions();
    let txs = res.data || [];

    // Filter Type
    if (state.txFilter !== 'all') {
      txs = txs.filter(t => t.type === state.txFilter);
    }

    // Filter Search
    if (elements.historySearchInput && elements.historySearchInput.value.trim() !== '') {
      const q = elements.historySearchInput.value.toLowerCase();
      txs = txs.filter(t => (t.customer && t.customer.toLowerCase().includes(q)) || (t.items && t.items.toLowerCase().includes(q)) || t.id.toLowerCase().includes(q));
    }

    if (txs.length === 0) {
      elements.historyTransactionsList.innerHTML = `
        <div class="empty-state-box" style="margin-top:10px; padding:30px 20px;">
          <h4 style="font-size:16px; font-weight:800; color:#0f172a;">Tidak ada transaksi di kategori ini</h4>
          <p style="font-size:12px; color:#64748b; margin-top:4px;">Gunakan filter lain atau catat penjualan baru.</p>
        </div>
      `;
      return;
    }

    elements.historyTransactionsList.innerHTML = txs.map(tx => {
      const isSale = tx.type === 'sale';
      const isExpense = tx.type === 'expense';

      return `
        <div class="tx-item">
          <div class="tx-left">
            <div class="tx-icon ${isSale ? 'tx-icon-sale' : isExpense ? 'tx-icon-expense' : 'tx-icon-restock'}">
              ${isSale ? '💰' : isExpense ? '📤' : '📦'}
            </div>
            <div class="tx-info">
              <h4>${tx.customer || tx.items}</h4>
              <p>${tx.items} • <span style="font-weight:700;">${tx.paymentMethod}</span></p>
            </div>
          </div>
          <div class="tx-right">
            <div class="tx-amount ${isSale ? 'tx-amount-plus' : 'tx-amount-minus'}">
              ${isSale ? '+' : '-'}${formatRupiah(tx.total)}
            </div>
            <div class="tx-time">${tx.time}</div>
          </div>
        </div>
      `;
    }).join('');
  };

  // Filter Tabs Transaksi
  elements.txFilterTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      if (tab.id === 'btnToggleEmptyHistory') return;
      elements.txFilterTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      state.txFilter = tab.dataset.txFilter;
      state.showEmptyHistoryState = false;
      renderHistoryTransactions();
    });
  });

  // Toggle Mode Kosong (Untuk melihat kondisi awal persis seperti foto pengguna)
  if (elements.btnToggleEmptyHistory) {
    elements.btnToggleEmptyHistory.addEventListener('click', () => {
      state.showEmptyHistoryState = !state.showEmptyHistoryState;
      elements.btnToggleEmptyHistory.textContent = state.showEmptyHistoryState ? 'Mode Ada Data' : 'Mode Kosong';
      renderHistoryTransactions();
    });
  }

  // Search di Riwayat
  if (elements.historySearchInput) {
    elements.historySearchInput.addEventListener('input', () => {
      renderHistoryTransactions();
    });
  }

  // Download Excel Handler
  const handleDownloadExcel = () => {
    showToast('📊 Mengunduh file Rekap_Riwayat_Transaksi_BosUMKM.xlsx...', 'success');
  };

  if (elements.btnDownloadExcel) elements.btnDownloadExcel.addEventListener('click', handleDownloadExcel);
  if (elements.btnDownloadExcelEmpty) elements.btnDownloadExcelEmpty.addEventListener('click', handleDownloadExcel);

  // -------------------------------------------------------------------------
  // Modal Handler Helper
  // -------------------------------------------------------------------------
  const openModal = (title, contentHtml) => {
    elements.modalTitle.textContent = title;
    elements.modalBody.innerHTML = contentHtml;
    elements.modalOverlay.classList.add('active');
  };

  const closeModal = () => {
    elements.modalOverlay.classList.remove('active');
  };

  elements.modalCloseBtn.addEventListener('click', closeModal);
  elements.modalOverlay.addEventListener('click', (e) => {
    if (e.target === elements.modalOverlay) closeModal();
  });

  // -------------------------------------------------------------------------
  // Modal: Lihat Laporan Lengkap (Finansial)
  // -------------------------------------------------------------------------
  if (elements.btnReport) {
    elements.btnReport.addEventListener('click', async () => {
      const d = state.dashboardData || window.MockData.dashboard.today;
      openModal('📊 Laporan Finansial UMKM', `
        <div class="filter-tabs">
          <div class="filter-tab active" data-period="today">Hari Ini</div>
          <div class="filter-tab" data-period="weekly">7 Hari</div>
          <div class="filter-tab" data-period="monthly">Bulan Ini</div>
        </div>

        <div class="report-chart-box">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
            <span style="font-size:13px; font-weight:700; color:#1e293b;">Tren Omzet Penjualan</span>
            <span style="font-size:12px; font-weight:800; color:#10b981;">${d.turnoverGrowth || '+14.8%'}</span>
          </div>
          
          <div class="chart-bars-row">
            <div class="chart-bar-col"><div class="chart-bar" style="height: 45%;"></div><span class="chart-day-label">Sen</span></div>
            <div class="chart-bar-col"><div class="chart-bar" style="height: 60%;"></div><span class="chart-day-label">Sel</span></div>
            <div class="chart-bar-col"><div class="chart-bar" style="height: 35%;"></div><span class="chart-day-label">Rab</span></div>
            <div class="chart-bar-col"><div class="chart-bar" style="height: 75%;"></div><span class="chart-day-label">Kam</span></div>
            <div class="chart-bar-col"><div class="chart-bar" style="height: 85%;"></div><span class="chart-day-label">Jum</span></div>
            <div class="chart-bar-col"><div class="chart-bar" style="height: 95%;"></div><span class="chart-day-label">Sab</span></div>
            <div class="chart-bar-col"><div class="chart-bar highlight" style="height: 88%;"></div><span class="chart-day-label" style="color:#d97706;">Hari ini</span></div>
          </div>
        </div>

        <div style="background:#f8fafc; border-radius:14px; padding:16px; border:1px solid #e2e8f0; margin-bottom:16px;">
          <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
            <span style="font-size:13px; color:#64748b;">Total Omzet Bruto:</span>
            <strong style="color:#0f172a;">${formatRupiah(d.turnover)}</strong>
          </div>
          <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
            <span style="font-size:13px; color:#64748b;">Estimasi Margin Laba:</span>
            <strong style="color:#10b981;">${d.profitMargin} (${formatRupiah(d.profit)})</strong>
          </div>
          <div style="display:flex; justify-content:space-between;">
            <span style="font-size:13px; color:#64748b;">Barang Terjual:</span>
            <strong style="color:#2563eb;">${d.stockOut} transaksi</strong>
          </div>
        </div>

        <button class="btn-primary-action" id="btnExportPdf">
          <span>📥</span> Unduh Laporan PDF / Excel
        </button>
      `);

      const tabs = elements.modalBody.querySelectorAll('.filter-tab');
      tabs.forEach(tab => {
        tab.addEventListener('click', async () => {
          tabs.forEach(t => t.classList.remove('active'));
          tab.classList.add('active');
          const period = tab.dataset.period;
          await loadDashboard(period);
          showToast(`Memuat data laporan periode: ${tab.textContent}`, 'info');
        });
      });

      const btnExport = elements.modalBody.querySelector('#btnExportPdf');
      if (btnExport) btnExport.addEventListener('click', handleDownloadExcel);
    });
  }

  // -------------------------------------------------------------------------
  // Modal: Operasional Toko
  // -------------------------------------------------------------------------
  if (elements.menuOps) {
    elements.menuOps.addEventListener('click', async () => {
      const res = await window.BosApi.getOperations();
      const ops = res.data || [];

      const listHtml = ops.map(o => `
        <div class="stock-card-row">
          <div>
            <div style="font-weight:700; font-size:14px; color:#1e293b;">${o.name}</div>
            <div style="font-size:12px; color:#64748b;">${o.category} • ${o.date}</div>
          </div>
          <div style="text-align:right;">
            <div style="font-weight:800; color:#ef4444;">-${formatRupiah(o.amount)}</div>
            <span style="font-size:11px; color:#10b981; font-weight:700;">${o.status}</span>
          </div>
        </div>
      `).join('');

      openModal('⚙️ Biaya Operasional & Usaha', `
        <form id="formAddExpense" style="background:#f8fafc; padding:14px; border-radius:14px; border:1px solid #e2e8f0; margin-bottom:16px;">
          <div style="font-weight:800; font-size:14px; margin-bottom:10px; color:#0f172a;">Catat Pengeluaran Cepat:</div>
          <div class="form-group">
            <input type="text" id="expenseName" class="form-input" placeholder="Nama pengeluaran (misal: Bensin, Listrik)" required>
          </div>
          <div class="form-row">
            <div class="form-group">
              <input type="number" id="expenseAmount" class="form-input" placeholder="Nominal (Rp)" required>
            </div>
            <div class="form-group">
              <select id="expenseCategory" class="form-select">
                <option value="Operasional">Operasional</option>
                <option value="Packaging">Kemasan</option>
                <option value="Transport">Transportasi</option>
                <option value="Gaji">Gaji / Upah</option>
              </select>
            </div>
          </div>
          <button type="submit" class="btn-primary-action" style="padding:10px; font-size:13px;">+ Simpan Biaya</button>
        </form>

        <div style="font-weight:800; font-size:14px; margin-bottom:8px; color:#334155;">Daftar Pengeluaran Terakhir:</div>
        <div class="stock-list-container">
          ${listHtml}
        </div>
      `);

      document.getElementById('formAddExpense').addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('expenseName').value;
        const amount = parseInt(document.getElementById('expenseAmount').value);
        const category = document.getElementById('expenseCategory').value;

        await window.BosApi.addOperationExpense({ name, amount, category });
        showToast('Biaya operasional berhasil dicatat!', 'success');
        closeModal();
      });
    });
  }

  // -------------------------------------------------------------------------
  // Modal: Marketing & Promosi
  // -------------------------------------------------------------------------
  if (elements.menuMarketing) {
    elements.menuMarketing.addEventListener('click', async () => {
      const res = await window.BosApi.getMarketing();
      const promos = res.data || [];

      const listHtml = promos.map(p => `
        <div style="background:#fdf4ff; border:1px solid #f0abfc; border-radius:14px; padding:14px; margin-bottom:10px;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <strong style="color:#701a75; font-size:14px;">${p.title}</strong>
            <span style="font-size:11px; background:#fae8ff; color:#a21caf; padding:2px 8px; border-radius:99px; font-weight:700;">${p.status}</span>
          </div>
          <div style="font-size:13px; color:#4a044e; margin-top:4px;">${p.discount}</div>
          <div style="font-size:11px; color:#86198f; margin-top:4px;">Channel: ${p.channel} • Jangkauan: ${p.reach}</div>
        </div>
      `).join('');

      openModal('📢 Marketing & Promo UMKM', `
        <div style="margin-bottom:14px;">
          <p style="font-size:13px; color:#64748b; margin-bottom:12px;">Tingkatkan omzet toko Anda dengan membuat promo diskon dan broadcast ke WhatsApp pelanggan.</p>
          <button id="btnCreatePromo" class="btn-primary-action" style="background:#7e22ce;">
            ✨ Buat Promo / Diskon Baru
          </button>
        </div>

        <div style="font-weight:800; font-size:14px; margin-bottom:10px; color:#334155;">Kampanye Aktif:</div>
        ${listHtml}
      `);

      document.getElementById('btnCreatePromo').addEventListener('click', () => {
        openModal('🎉 Buat Kampanye Promo Baru', `
          <form id="formPromo">
            <div class="form-group">
              <label class="form-label">Judul Promo</label>
              <input type="text" id="promoTitle" class="form-input" placeholder="Contoh: Promo Jumat Berkah Diskon 15%" required>
            </div>
            <div class="form-group">
              <label class="form-label">Bentuk Promo / Potongan</label>
              <input type="text" id="promoDiscount" class="form-input" placeholder="Contoh: Potongan Rp 5.000 atau Diskon 10%" required>
            </div>
            <div class="form-group">
              <label class="form-label">Target Publikasi</label>
              <select id="promoChannel" class="form-select">
                <option value="WhatsApp Broadcast">WhatsApp Broadcast Pelanggan</option>
                <option value="Banner Toko / Spanduk">Banner Toko / Kasir</option>
                <option value="Instagram & Medsos">Instagram Story & TikTok</option>
              </select>
            </div>
            <button type="submit" class="btn-primary-action" style="background:#7e22ce;">Sebarkan Promo Sekarang</button>
          </form>
        `);

        document.getElementById('formPromo').addEventListener('submit', async (e) => {
          e.preventDefault();
          await window.BosApi.addMarketingCampaign({
            title: document.getElementById('promoTitle').value,
            discount: document.getElementById('promoDiscount').value,
            channel: document.getElementById('promoChannel').value
          });
          showToast('Promo berhasil dibuat & disiarkan!', 'success');
          closeModal();
        });
      });
    });
  }

  // -------------------------------------------------------------------------
  // Modal: Kasir Cepat (POS)
  // -------------------------------------------------------------------------
  if (elements.btnQuickPos) {
    elements.btnQuickPos.addEventListener('click', () => {
      openModal('🛒 Kasir Cepat (POS)', `
        <form id="formQuickPos">
          <div class="form-group">
            <label class="form-label">Nama Pelanggan</label>
            <input type="text" id="posCustomer" class="form-input" value="Pelanggan Umum">
          </div>
          <div class="form-group">
            <label class="form-label">Produk yang Dibeli</label>
            <input type="text" id="posItems" class="form-input" placeholder="Contoh: Beras Rojolele 5kg (1x)" required>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Total Pembayaran (Rp)</label>
              <input type="number" id="posTotal" class="form-input" placeholder="75000" required>
            </div>
            <div class="form-group">
              <label class="form-label">Metode Pembayaran</label>
              <select id="posPayment" class="form-select">
                <option value="QRIS">QRIS</option>
                <option value="Tunai">Tunai / Cash</option>
                <option value="Transfer Bank">Transfer Bank</option>
              </select>
            </div>
          </div>
          <button type="submit" class="btn-primary-action" style="margin-top:10px;">
            💰 Selesaikan Transaksi
          </button>
        </form>
      `);

      document.getElementById('formQuickPos').addEventListener('submit', async (e) => {
        e.preventDefault();
        const customer = document.getElementById('posCustomer').value;
        const items = document.getElementById('posItems').value;
        const total = parseInt(document.getElementById('posTotal').value);
        const paymentMethod = document.getElementById('posPayment').value;

        const res = await window.BosApi.createTransaction({
          customer,
          items,
          total,
          paymentMethod,
          type: 'sale'
        });

        showToast(res.message, 'success');
        closeModal();
        await loadDashboard();
        await loadRecentTransactions();
      });
    });
  }

  // -------------------------------------------------------------------------
  // Modal: Scan QRIS
  // -------------------------------------------------------------------------
  if (elements.btnQuickScan) {
    elements.btnQuickScan.addEventListener('click', () => {
      openModal('📷 Scan QRIS / Barcode', `
        <div style="text-align:center; padding:20px 10px;">
          <div style="width:200px; height:200px; border:3px dashed #2563eb; border-radius:20px; margin:0 auto 16px auto; display:flex; align-items:center; justify-content:center; background:#eff6ff;">
            <span style="font-size:48px;">📷</span>
          </div>
          <p style="font-size:14px; font-weight:700; color:#1e293b;">Arahkan kamera ke QRIS Pembeli</p>
          <p style="font-size:12px; color:#64748b; margin-top:4px;">Mendukung seluruh QRIS Bank & E-Wallet.</p>
          <button class="btn-primary-action" style="margin-top:20px;" onclick="document.getElementById('modalCloseBtn').click();">
            Simulasi Scan Berhasil
          </button>
        </div>
      `);
    });
  }

  // -------------------------------------------------------------------------
  // Universal Triggers: Bantuan CS, Notifikasi, Premium
  // -------------------------------------------------------------------------
  elements.triggersSupport.forEach(btn => {
    btn.addEventListener('click', () => {
      openModal('🎧 Layanan Bantuan & Konsultasi UMKM', `
        <div style="text-align:center; padding:10px 0;">
          <div style="font-size:40px; margin-bottom:8px;">💬</div>
          <h4 style="font-size:16px; font-weight:800; color:#0f172a;">Butuh Bantuan Operasional?</h4>
          <p style="font-size:13px; color:#64748b; margin-top:4px;">Tim konsultan Bos UMKM siap membantu 24/7 seputar pembukuan, stok, dan kasir.</p>
          <div style="margin-top:20px; display:flex; flex-direction:column; gap:10px;">
            <a href="https://wa.me/6281234567890?text=Halo%20Tim%20Bos%20UMKM,%20saya%20butuh%20bantuan" target="_blank" class="btn-primary-action" style="background:#25d366; text-decoration:none;">
              Chat Langsung via WhatsApp
            </a>
            <button class="btn-secondary-action" onclick="alert('Panduan Buku Manual dibuka');">
              📖 Baca Buku Panduan Penggunaan
            </button>
          </div>
        </div>
      `);
    });
  });

  elements.triggersNotif.forEach(btn => {
    btn.addEventListener('click', async () => {
      const res = await window.BosApi.getNotifications();
      const notifs = res.data || [];

      const notifHtml = notifs.map(n => `
        <div style="background:${n.unread ? '#eff6ff' : '#f8fafc'}; border-left:4px solid ${n.unread ? '#2563eb' : '#94a3b8'}; border-radius:12px; padding:12px 14px; margin-bottom:10px;">
          <div style="display:flex; justify-content:space-between; align-items:flex-start;">
            <strong style="font-size:13px; color:#1e293b;">${n.title}</strong>
            <span style="font-size:11px; color:#94a3b8;">${n.time}</span>
          </div>
          <p style="font-size:12px; color:#475569; margin-top:4px;">${n.message}</p>
        </div>
      `).join('');

      openModal('🔔 Notifikasi & Peringatan', `
        <div style="margin-bottom:10px; display:flex; justify-content:space-between; align-items:center;">
          <span style="font-size:12px; color:#64748b;">3 Peringatan Sistem</span>
          <a href="javascript:void(0)" style="font-size:12px; color:#2563eb; font-weight:700; text-decoration:none;" onclick="document.querySelectorAll('.badge-dot').forEach(e=>e.remove());">Tandai Sudah Dibaca</a>
        </div>
        <div>${notifHtml}</div>
      `);
    });
  });

  elements.triggersPremium.forEach(btn => {
    btn.addEventListener('click', () => {
      openModal('👑 Keanggotaan Bos UMKM Premium', `
        <div class="premium-perk-box">
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="font-size:24px;">👑</span>
            <div>
              <strong style="font-size:16px; color:#78350f;">Akun Premium Aktif</strong>
              <div style="font-size:12px; color:#b45309;">Berlaku hingga 12 Desember 2026</div>
            </div>
          </div>
          <div class="perk-list">
            <div class="perk-item"><span class="perk-icon">✓</span> Multi-Cabang & Kasir Tanpa Batas</div>
            <div class="perk-item"><span class="perk-icon">✓</span> Laporan Pajak & Neraca Laba Rugi Otomatis</div>
            <div class="perk-item"><span class="perk-icon">✓</span> Integrasi QRIS Statis & Dinamis Otomatis</div>
            <div class="perk-item"><span class="perk-icon">✓</span> Backup Database Cloud 24/7 Terenkripsi</div>
          </div>
        </div>
        <button class="btn-secondary-action" onclick="document.getElementById('modalCloseBtn').click();">
          Tutup
        </button>
      `);
    });
  });

  // -------------------------------------------------------------------------
  // Fitur Ganti Toko & Tambah Toko / Akun Baru (Tanpa Perlu Logout)
  // -------------------------------------------------------------------------
  const updateStoreDisplay = async () => {
    const res = await window.BosApi.getActiveStore();
    if (!res.success || !res.data) return;
    const store = res.data;

    // Update semua teks nama toko di header
    document.querySelectorAll('.store-name-text, #storeSelector span').forEach(el => {
      el.textContent = store.name;
    });

    // Update profil toko di layar akun
    document.querySelectorAll('.account-store-name').forEach(el => {
      el.innerHTML = `<strong>${store.name}</strong> (${store.branch || 'Pusat'})`;
    });
  };

  const openStoreSwitchModal = async () => {
    const res = await window.BosApi.getStores();
    const stores = res.data || [];

    const storeCardsHtml = stores.map(s => `
      <div class="store-select-card ${s.isActive ? 'active' : ''}" data-store-id="${s.id}">
        <div class="store-card-left">
          <div class="store-avatar-icon">🏪</div>
          <div class="store-card-info">
            <h4>
              ${s.name}
              ${s.isActive ? '<span class="store-badge-active">✓ Aktif</span>' : ''}
            </h4>
            <p>${s.branch || 'Pusat'} • ${s.category || 'Usaha UMKM'}</p>
            <p style="font-size:11px; color:#94a3b8;">${s.address || 'Indonesia'}</p>
          </div>
        </div>
        <div style="color:${s.isActive ? '#2563eb' : '#94a3b8'}; font-size:18px; font-weight:bold;">
          ${s.isActive ? '●' : '○'}
        </div>
      </div>
    `).join('');

    openModal('🏪 Ganti Toko / Cabang Usaha', `
      <p style="font-size:13px; color:#64748b; margin-bottom:12px;">
        Pilih toko atau cabang yang ingin Anda kelola saat ini tanpa perlu keluar/logout dari akun.
      </p>

      <div class="store-list-container">
        ${storeCardsHtml}
      </div>

      <button class="btn-add-store-outline" id="btnTriggerAddStore">
        <span>+</span> Tambah Toko / Cabang Baru
      </button>
    `);

    // Handler klik kartu toko untuk ganti toko
    elements.modalBody.querySelectorAll('.store-select-card').forEach(card => {
      card.addEventListener('click', async () => {
        const storeId = card.dataset.storeId;
        const res = await window.BosApi.switchStore(storeId);
        showToast(res.message, 'success');
        closeModal();
        await updateStoreDisplay();
        await loadDashboard();
        if (typeof renderWarehouseProducts === 'function') await renderWarehouseProducts();
        if (typeof renderHistoryTransactions === 'function') await renderHistoryTransactions();
      });
    });

    // Handler tombol tambah toko baru
    const btnAdd = elements.modalBody.querySelector('#btnTriggerAddStore');
    if (btnAdd) {
      btnAdd.addEventListener('click', openAddStoreModal);
    }
  };

  const openAddStoreModal = () => {
    openModal('➕ Tambah Toko / Cabang Baru', `
      <form id="formAddStore">
        <div class="form-group">
          <label class="form-label">Nama Toko / Usaha Baru</label>
          <input type="text" id="inputStoreName" class="form-input" placeholder="Contoh: Kios Berkah Cabang 3" required>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Nama Cabang / Lokasi</label>
            <input type="text" id="inputStoreBranch" class="form-input" placeholder="Contoh: Cabang Pasar Baru" required>
          </div>
          <div class="form-group">
            <label class="form-label">Kategori Usaha</label>
            <select id="inputStoreCategory" class="form-select">
              <option value="Sembako & Kelontong">Sembako & Kelontong</option>
              <option value="Makanan & Kuliner">Makanan & Kuliner</option>
              <option value="Minuman & Kopi">Minuman & Kopi</option>
              <option value="Fashion & Pakaian">Fashion & Pakaian</option>
              <option value="Jasa & Lainnya">Jasa & Lainnya</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Alamat Toko</label>
          <input type="text" id="inputStoreAddress" class="form-input" placeholder="Jl. Anggrek No. 15, Pasar Baru">
        </div>
        <div class="form-group">
          <label class="form-label">No. Telepon / WhatsApp Toko</label>
          <input type="text" id="inputStorePhone" class="form-input" placeholder="0812-xxxx-xxxx">
        </div>
        <button type="submit" class="btn-primary-action" style="margin-top:10px;">
          ✓ Simpan & Aktifkan Toko Baru
        </button>
      </form>
    `);

    document.getElementById('formAddStore').addEventListener('submit', async (e) => {
      e.preventDefault();
      const newStore = {
        name: document.getElementById('inputStoreName').value,
        branch: document.getElementById('inputStoreBranch').value,
        category: document.getElementById('inputStoreCategory').value,
        address: document.getElementById('inputStoreAddress').value,
        phone: document.getElementById('inputStorePhone').value
      };

      const res = await window.BosApi.addStore(newStore);
      showToast(res.message, 'success');
      closeModal();
      await updateStoreDisplay();
      await loadDashboard();
      if (typeof renderWarehouseProducts === 'function') await renderWarehouseProducts();
      if (typeof renderHistoryTransactions === 'function') await renderHistoryTransactions();
    });
  };

  // Pasang event listener ke selector nama toko di header dan tombol ganti toko
  document.querySelectorAll('#storeSelector, .btn-switch-store').forEach(el => {
    el.addEventListener('click', openStoreSwitchModal);
  });

  document.querySelectorAll('.btn-add-store-direct').forEach(el => {
    el.addEventListener('click', openAddStoreModal);
  });

  // Shortcut "Lihat Semua" di Beranda
  const btnSeeAll = document.getElementById('btnSeeAllActivity');
  if (btnSeeAll) {
    btnSeeAll.addEventListener('click', () => navigateTo('history'));
  }

  // Inisialisasi awal aplikasi
  updateStoreDisplay();
  loadDashboard();
  loadRecentTransactions();
});

