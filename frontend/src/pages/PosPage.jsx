import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { 
  Search, Plus, Trash2, Printer, Check, 
  ArrowLeft, CreditCard, Banknote, QrCode, User, 
  Utensils, Cpu, ShoppingBag, AlertCircle
} from 'lucide-react';

export default function PosPage({ store, onBackToStores }) {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Checkout modal
  const [showCheckout, setShowCheckout] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [amountPaid, setAmountPaid] = useState(0);
  const [tableNumber, setTableNumber] = useState('');
  const [customerName, setCustomerName] = useState('Pelanggan Umum');
  const [checkoutSuccess, setCheckoutSuccess] = useState(null);

  // New product modal
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newProd, setNewProd] = useState({
    name: '',
    selling_price: '',
    cost_price: '',
    stock: '',
    has_variants: store.business_type === 'retail',
    has_serial_number: store.business_type === 'electronics'
  });

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await api.getProducts(store.id, search);
      setProducts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [search]);

  const addToCart = (product) => {
    const existing = cart.find(item => item.product_id === product.id);
    if (existing) {
      setCart(cart.map(item => 
        item.product_id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setCart([...cart, {
        product_id: product.id,
        name: product.name,
        unit_price: product.selling_price,
        quantity: 1,
        serials: []
      }]);
    }
  };

  const updateQuantity = (productId, delta) => {
    setCart(cart.map(item => {
      if (item.product_id === productId) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : null;
      }
      return item;
    }).filter(Boolean));
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.product_id !== productId));
  };

  const subtotal = cart.reduce((acc, item) => acc + (item.unit_price * item.quantity), 0);

  const handleCheckout = async () => {
    try {
      const payload = {
        order_type: store.business_type === 'fnb' && tableNumber ? 'dine_in' : 'takeaway',
        table_number: tableNumber,
        customer_name: customerName,
        items: cart.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price
        })),
        payment_method: paymentMethod,
        amount_paid: paymentMethod === 'cash' ? Number(amountPaid) : subtotal
      };

      const res = await api.checkout(store.id, payload);
      setCheckoutSuccess(res);
      setCart([]);
      fetchProducts();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    try {
      await api.createProduct(store.id, {
        name: newProd.name,
        selling_price: parseFloat(newProd.selling_price) || 0,
        cost_price: parseFloat(newProd.cost_price) || 0,
        stock: parseFloat(newProd.stock) || 0,
        has_variants: newProd.has_variants,
        has_serial_number: newProd.has_serial_number
      });
      setShowAddProduct(false);
      setNewProd({
        name: '',
        selling_price: '',
        cost_price: '',
        stock: '',
        has_variants: store.business_type === 'retail',
        has_serial_number: store.business_type === 'electronics'
      });
      fetchProducts();
    } catch (err) {
      alert(err.message);
    }
  };

  const formatRupiah = (val) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      {/* LEFT: Catalog & Products */}
      <div className="flex-1 flex flex-col h-full border-r border-slate-200 bg-white">
        {/* Top Navbar */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between gap-4 bg-slate-50">
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToStores}
              className="p-2 hover:bg-slate-200 rounded-xl text-slate-600 transition"
              title="Ganti Toko"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="font-bold text-slate-900 leading-tight">{store.name}</h2>
              <span className="text-xs text-brand-600 font-semibold uppercase tracking-wider">
                Mode: {store.business_type === 'retail' ? 'Ritel & Varian' : store.business_type === 'electronics' ? 'Komputer/CCTV' : 'Rumah Makan'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Cari barang / scan barcode..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <button
              onClick={() => setShowAddProduct(true)}
              className="px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold flex items-center gap-1.5 shrink-0 shadow-sm transition"
            >
              <Plus className="w-4 h-4" /> Barang
            </button>
          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="text-center py-20 text-slate-400">Memuat katalog barang...</div>
          ) : products.length === 0 ? (
            <div className="text-center py-20 border-2 border-dashed border-slate-200 rounded-2xl p-8">
              <p className="text-slate-500 mb-3">Belum ada produk di toko ini.</p>
              <button
                onClick={() => setShowAddProduct(true)}
                className="px-4 py-2 bg-brand-600 text-white rounded-xl text-sm font-semibold"
              >
                + Tambah Produk Sekarang
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
              {products.map((p) => (
                <div
                  key={p.id}
                  onClick={() => addToCart(p)}
                  className="bg-white border border-slate-200 hover:border-brand-500 hover:shadow-md rounded-xl p-3.5 cursor-pointer transition flex flex-col justify-between group"
                >
                  <div>
                    <span className="text-xs font-mono text-slate-400">{p.sku || `#${p.id}`}</span>
                    <h4 className="font-semibold text-slate-900 group-hover:text-brand-600 transition text-sm line-clamp-2 mt-0.5">
                      {p.name}
                    </h4>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-900">
                      {formatRupiah(p.selling_price)}
                    </span>
                    <span className="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                      Stok: {p.stock}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: Cart & Checkout Panel */}
      <div className="w-96 bg-white flex flex-col h-full border-l border-slate-200 shadow-xl">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h3 className="font-bold text-slate-900">Keranjang Kasir</h3>
          <span className="text-xs font-semibold px-2 py-1 bg-brand-100 text-brand-700 rounded-full">
            {cart.length} Item
          </span>
        </div>

        {/* F&B Option: Meja */}
        {store.business_type === 'fnb' && (
          <div className="p-3 bg-amber-50 border-b border-amber-200 flex items-center gap-2">
            <Utensils className="w-4 h-4 text-amber-700" />
            <input
              type="text"
              placeholder="No. Meja (Dine-in)"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              className="px-2.5 py-1 text-xs bg-white border border-amber-300 rounded-lg w-full font-semibold"
            />
          </div>
        )}

        {/* Cart Item List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="text-center py-20 text-slate-400 text-sm">
              Keranjang masih kosong.<br />Klik barang di katalog untuk menambahkan.
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.product_id} className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex-1 min-w-0">
                  <h5 className="font-semibold text-xs text-slate-800 truncate">{item.name}</h5>
                  <span className="text-xs text-slate-500 font-mono">
                    {formatRupiah(item.unit_price)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQuantity(item.product_id, -1)}
                    className="w-6 h-6 rounded-lg bg-white border border-slate-300 flex items-center justify-center text-xs font-bold text-slate-700 hover:bg-slate-100"
                  >
                    -
                  </button>
                  <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.product_id, 1)}
                    className="w-6 h-6 rounded-lg bg-white border border-slate-300 flex items-center justify-center text-xs font-bold text-slate-700 hover:bg-slate-100"
                  >
                    +
                  </button>
                  <button
                    onClick={() => removeFromCart(item.product_id)}
                    className="p-1 text-rose-500 hover:text-rose-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Cart Summary & Pay Button */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 space-y-3">
          <div className="flex justify-between items-center text-sm font-semibold text-slate-600">
            <span>Subtotal</span>
            <span className="text-slate-900">{formatRupiah(subtotal)}</span>
          </div>
          <div className="flex justify-between items-center text-lg font-extrabold text-slate-900 border-t border-slate-200 pt-2">
            <span>Total Tagihan</span>
            <span className="text-brand-600">{formatRupiah(subtotal)}</span>
          </div>

          <button
            onClick={() => { setShowCheckout(true); setAmountPaid(subtotal); }}
            disabled={cart.length === 0}
            className="w-full py-3.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl text-base shadow-lg shadow-brand-500/25 transition disabled:opacity-40"
          >
            Bayar Sekarang (F9)
          </button>
        </div>
      </div>

      {/* MODAL CHECKOUT */}
      {showCheckout && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-slate-900 mb-1">Pembayaran Pesanan</h3>
            <p className="text-xs text-slate-500 mb-4">Total: <strong className="text-brand-600 text-base">{formatRupiah(subtotal)}</strong></p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Metode Pembayaran</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cash')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition ${paymentMethod === 'cash' ? 'bg-brand-50 border-brand-500 text-brand-700' : 'bg-slate-50 border-slate-200'}`}
                  >
                    <Banknote className="w-4 h-4" /> Tunai
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('qris')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition ${paymentMethod === 'qris' ? 'bg-brand-50 border-brand-500 text-brand-700' : 'bg-slate-50 border-slate-200'}`}
                  >
                    <QrCode className="w-4 h-4" /> QRIS
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('transfer')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition ${paymentMethod === 'transfer' ? 'bg-brand-50 border-brand-500 text-brand-700' : 'bg-slate-50 border-slate-200'}`}
                  >
                    <CreditCard className="w-4 h-4" /> Transfer
                  </button>
                </div>
              </div>

              {paymentMethod === 'cash' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Uang Diterima (Rp)</label>
                  <input
                    type="number"
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base font-bold text-slate-900 focus:ring-2 focus:ring-brand-500"
                  />
                  {amountPaid >= subtotal && (
                    <p className="text-xs text-emerald-600 font-semibold mt-1">
                      Kembalian: {formatRupiah(amountPaid - subtotal)}
                    </p>
                  )}
                </div>
              )}

              <div className="flex gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCheckout(false)}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleCheckout}
                  className="flex-1 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-bold shadow-md shadow-brand-500/20"
                >
                  Selesaikan Transaksi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL SUCCESS & PRINT RECEIPT */}
      {checkoutSuccess && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl text-center">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <Check className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Transaksi Berhasil!</h3>
            <p className="text-xs font-mono text-slate-500 mb-4">{checkoutSuccess.invoice_number}</p>

            {/* Hidden Printable Receipt */}
            <div id="thermal-receipt" className="text-left font-mono text-xs hidden print:block">
              <div className="text-center font-bold mb-2">
                {store.name}<br />
                {store.address}<br />
                --------------------------------
              </div>
              <div>Nota: {checkoutSuccess.invoice_number}</div>
              <div>Waktu: {new Date().toLocaleString('id-ID')}</div>
              <div>--------------------------------</div>
              <div className="space-y-1 my-2">
                <div>Total: {formatRupiah(checkoutSuccess.total_amount)}</div>
                <div>Bayar: {formatRupiah(checkoutSuccess.amount_paid)}</div>
                <div>Kembali: {formatRupiah(checkoutSuccess.change_amount)}</div>
              </div>
              <div className="text-center mt-3">
                --------------------------------<br />
                {checkoutSuccess.receipt_footer}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
              >
                <Printer className="w-4 h-4" /> Cetak Struk
              </button>
              <button
                onClick={() => setCheckoutSuccess(null)}
                className="flex-1 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold"
              >
                Transaksi Baru
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ADD PRODUCT */}
      {showAddProduct && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Tambah Produk Baru</h3>
            <form onSubmit={handleCreateProduct} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Produk / Menu</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Jaket Touring / Nasi Goreng"
                  value={newProd.name}
                  onChange={(e) => setNewProd({ ...newProd, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Harga Jual (Rp)</label>
                  <input
                    type="number"
                    required
                    placeholder="250000"
                    value={newProd.selling_price}
                    onChange={(e) => setNewProd({ ...newProd, selling_price: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Harga Modal (Rp)</label>
                  <input
                    type="number"
                    placeholder="180000"
                    value={newProd.cost_price}
                    onChange={(e) => setNewProd({ ...newProd, cost_price: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Stok Awal</label>
                <input
                  type="number"
                  placeholder="10"
                  value={newProd.stock}
                  onChange={(e) => setNewProd({ ...newProd, stock: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddProduct(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-600 text-white rounded-xl text-sm font-semibold"
                >
                  Simpan Produk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
