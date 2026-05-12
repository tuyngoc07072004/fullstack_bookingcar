import React, { useEffect, useMemo, useState } from 'react';
import { getApiUrl } from '../../utils/dbUrl';

interface DriverAccount {
  _id: string;
  name: string;
  phone: string;
  license_number: string;
  status: 'active' | 'inactive' | 'busy';
}

export default function AdminDriverAccountsTab() {
  const [drivers, setDrivers] = useState<DriverAccount[]>([]);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'busy'>('all');
  const token = useMemo(() => localStorage.getItem('staffToken') || sessionStorage.getItem('staffToken') || '', []);

  const loadDrivers = async () => {
    const query = keyword.trim() ? `/staff/drivers/search?keyword=${encodeURIComponent(keyword.trim())}` : '/staff/drivers';
    const response = await fetch(getApiUrl(query), {
      headers: { Authorization: `Bearer ${token}` },
      credentials: 'include'
    });
    const data = await response.json();
    if (!response.ok || !data.success) throw new Error(data.message || 'Không thể tải danh sách tài xế');
    let list = data.data || [];
    if (statusFilter !== 'all') {
      list = list.filter((d: DriverAccount) => d.status === statusFilter);
    }
    setDrivers(list);
  };

  useEffect(() => {
    loadDrivers().catch((e) => alert(e.message));
  }, [statusFilter]);

  const updateStatus = async (id: string, status: 'active' | 'inactive') => {
    const response = await fetch(getApiUrl(`/staff/drivers/${id}/status`), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      credentials: 'include',
      body: JSON.stringify({ status })
    });
    const data = await response.json();
    if (!response.ok || !data.success) throw new Error(data.message || 'Cập nhật trạng thái thất bại');
    await loadDrivers();
  };

  const deleteDriver = async (id: string, name: string) => {
    const ok = window.confirm(`Bạn chắc chắn muốn xóa tài xế "${name}"?`);
    if (!ok) return;
    const response = await fetch(getApiUrl(`/staff/drivers/${id}`), {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`
      },
      credentials: 'include'
    });
    const data = await response.json();
    if (!response.ok || !data.success) throw new Error(data.message || 'Xóa tài xế thất bại');
    await loadDrivers();
  };

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-100">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Quản lý tài xế</h2>
      <div className="flex flex-col md:flex-row gap-3 mb-4">
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Tìm theo tên/số điện thoại/Số bằng"
          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="px-3 py-2 border border-gray-200 rounded-lg"
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="active">active</option>
          <option value="inactive">inactive</option>
          <option value="busy">busy</option>
        </select>
        <button onClick={() => loadDrivers().catch((e) => alert(e.message))} className="px-4 py-2 bg-gray-900 text-white rounded-lg">Tìm kiếm</button>
      </div>

      <div className="space-y-3">
        {drivers.map((d) => (
          <div key={d._id} className="border border-gray-100 rounded-xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <p className="font-semibold text-gray-900">{d.name}</p>
              <p className="text-sm text-gray-500">{d.phone} - {d.license_number}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Trạng thái: {d.status}</span>
              <button onClick={() => updateStatus(d._id, 'active').catch((e) => alert(e.message))} className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-sm">Mở</button>
              <button onClick={() => updateStatus(d._id, 'inactive').catch((e) => alert(e.message))} className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-sm">Khóa</button>
              <button onClick={() => deleteDriver(d._id, d.name).catch((e) => alert(e.message))} className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-sm">Xóa</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
