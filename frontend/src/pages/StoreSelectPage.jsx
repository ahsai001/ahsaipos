import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { 
  Plus, Store, ShoppingBag, Cpu, Utensils, 
  ArrowRight, MapPin, Phone, CheckCircle2 
} from 'lucide-react';

export default function StoreSelectPage({ onSelectStore, onLogout }) {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newStore, setNewStore] = useState({
    name: '',
    business_type: 'retail',
    phone: '',
    address: '',
    receipt_footer: 'Terima kasih atas kunjungan Anda!'
  });

  const fetchStores = async () => {
    try {
      setLoading(true);
      const data = await api.getStores();
      setStores(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStores();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const created = await api.createStore(newStore);
      setShowModal(false);
      setNewStore({
        name: '',
        business_type: 'retail',
        phone: '',
        address: '',
        receipt_footer: 'Terima kasih atas kunjungan Anda!'
      });
      fetchStores();
      onSelectStore(created);
    } catch (err) {
      alert(err.message);
    }
  };

  const getStoreBadge = (type) => {
    switch (type) {
      case 'retail':
        return {
          icon: <ShoppingBag className="w-4 h-4 text-emerald-600" />,
          label: 'Ritel & Apparel',
          color: 'bg-emerald-50 text-emerald-700 border-emerald-200'
        };
      case 'electronics':
        return {
          icon: <Cpu className="w-4 h-4 text-blue-600" />,
          label: 'Elektronik & CCTV',
          color: 'bg-blue-50 text-blue-700 border-blue-200'
        };
      case 'fnb':
        return {
          icon: <Utensils className="w-4 h-4 text-amber-600" />,
          label: 'Rumah Makan & F&B',
          color: 'bg-amber-50 text-amber-700 border-amber-200'
        };
      default:
        return {
          icon: <Store className="w-4 h-4 text-slate-600" />,
          label: type,
          color: 'bg-slate-50 text-slate-700 border-slate-200'
        };
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Pilih Cabang / Toko</h1>
            <p className="text-slate-500 mt-1 text-sm">
              Kelola beberapa cabang toko (Ritel, Elektronik/CCTV, Rumah Makan) dalam 1 akun owner
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold shadow-sm transition"
            >
              <Plus className="w-4 h-4" /> Tambah Toko Baru
            </button>
            <button
              onClick={onLogout}
              className="px-4 py-2.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-xl text-sm font-semibold transition"
            >
              Keluar
            </button>
          </div>
        </div>

        {/* Stores Grid */}
        {loading ? (
          <div className="text-center py-20 text-slate-400">Memuat data toko...</div>
        ) : stores.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
            <Store className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-800">Belum Ada Toko Terdaftar</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1 mb-6">
              Buat toko pertama Anda sekarang untuk mulai mengelola produk dan kasir penjualan.
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold shadow-sm transition"
            >
              <Plus className="w-4 h-4" /> Buat Toko Pertama
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stores.map((store) => {
              const badge = getStoreBadge(store.business_type);
              return (
                <div
                  key={store.id}
                  onClick={() => onSelectStore(store)}
                  className="group bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-xl hover:border-brand-500 transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${badge.color}`}>
                        {badge.icon}
                        {badge.label}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">ID #{store.id}</span>
                    </div>

                    <h3 className="text-xl font-bold text-slate-900 group-hover:text-brand-600 transition">
                      {store.name}
                    </h3>

                    {store.address && (
                      <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{store.address}</span>
                      </p>
                    )}
                    {store.phone && (
                      <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{store.phone}</span>
                      </p>
                    )}
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-sm font-semibold text-brand-600 group-hover:translate-x-1 transition">
                    <span>Buka Kasir & Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal Create Store */}
        {showModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl">
              <h2 className="text-xl font-bold text-slate-900 mb-1">Tambah Toko / Cabang Baru</h2>
              <p className="text-xs text-slate-500 mb-6">Pilih jenis bisnis agar fitur kasir disesuaikan secara otomatis.</p>

              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Nama Toko</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Toko Riding Gear Ahsai"
                    value={newStore.name}
                    onChange={(e) => setNewStore({ ...newStore, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Tipe Bisnis</label>
                  <select
                    value={newStore.business_type}
                    onChange={(e) => setNewStore({ ...newStore, business_type: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:bg-white font-medium"
                  >
                    <option value="retail">🛒 Ritel & Apparel (Jaket, Sepatu, Varian Ukuran/Warna)</option>
                    <option value="electronics">💻 Elektronik & CCTV (Serial Number & Garansi)</option>
                    <option value="fnb">🍽️ Rumah Makan / F&B (Meja, Menu Makanan & Minuman)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Telepon Toko</label>
                    <input
                      type="text"
                      placeholder="0812xxxx"
                      value={newStore.phone}
                      onChange={(e) => setNewStore({ ...newStore, phone: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Footer Struk</label>
                    <input
                      type="text"
                      value={newStore.receipt_footer}
                      onChange={(e) => setNewStore({ ...newStore, receipt_footer: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Alamat Lengkap</label>
                  <textarea
                    rows="2"
                    placeholder="Alamat jalan, kota..."
                    value={newStore.address}
                    onChange={(e) => setNewStore({ ...newStore, address: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500"
                  ></textarea>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold shadow-sm"
                  >
                    Simpan Toko
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
