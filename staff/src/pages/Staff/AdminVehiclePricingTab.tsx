import React, { useEffect, useMemo, useState } from 'react';
import { getApiUrl } from '../../utils/dbUrl';

interface VehiclePricingItem {
  _id: string;
  type_name: string;
  seats: number;
  base_price: number;
  price_per_km: number;
  is_active: boolean;
}

export default function AdminVehiclePricingTab() {
  const [items, setItems] = useState<VehiclePricingItem[]>([]);
  const [loading, setLoading] = useState(false);
  const token = useMemo(() => localStorage.getItem('staffToken') || sessionStorage.getItem('staffToken') || '', []);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await fetch(getApiUrl('/vehicles/pricing'), {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include'
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || 'Không thể tải bảng giá');
      setItems(data.data || []);
    } catch (error: any) {
      alert(error.message || 'Không thể tải bảng giá');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSave = async (item: VehiclePricingItem) => {
    try {
      const response = await fetch(getApiUrl(`/vehicles/pricing/${item._id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify({
          base_price: Number(item.base_price),
          price_per_km: Number(item.price_per_km),
          is_active: item.is_active
        })
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || 'Cập nhật thất bại');
      alert('Cập nhật giá xe thành công');
      await loadData();
    } catch (error: any) {
      alert(error.message || 'Cập nhật thất bại');
    }
  };

  if (loading) {
    return <div className="bg-white rounded-xl p-6">Đang tải bảng giá...</div>;
  }

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-100">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Quản lý giá xe</h2>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item._id} className="border border-gray-100 rounded-xl p-4 grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
            <div>
              <p className="text-xs text-gray-500">Loại xe</p>
              <p className="font-semibold">{item.type_name}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Số chỗ</p>
              <p className="font-semibold">{item.seats}</p>
            </div>
            <label className="block">
              <p className="text-xs text-gray-500 mb-1">Giá cơ bản</p>
              <input
                type="number"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                value={item.base_price}
                onChange={(e) => setItems((prev) => prev.map((x) => x._id === item._id ? { ...x, base_price: Number(e.target.value) } : x))}
              />
            </label>
            <label className="block">
              <p className="text-xs text-gray-500 mb-1">Giá/km</p>
              <input
                type="number"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                value={item.price_per_km}
                onChange={(e) => setItems((prev) => prev.map((x) => x._id === item._id ? { ...x, price_per_km: Number(e.target.value) } : x))}
              />
            </label>
            <button
              type="button"
              onClick={() => handleSave(item)}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
            >
              Lưu
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
