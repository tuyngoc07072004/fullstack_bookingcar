import React, { useEffect, useMemo, useState } from 'react';
import { getApiUrl } from '../../utils/dbUrl';

interface UserAccount {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  status?: 'active' | 'inactive';
  total_bookings?: number;
  total_spent?: number;
}

export default function AdminUserAccountsTab() {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const token = useMemo(() => localStorage.getItem('staffToken') || sessionStorage.getItem('staffToken') || '', []);

  const loadUsers = async () => {
    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    if (statusFilter !== 'all') params.set('status', statusFilter);
    const response = await fetch(getApiUrl(`/staffListCustomers/customers?${params.toString()}`), {
      headers: { Authorization: `Bearer ${token}` },
      credentials: 'include'
    });
    const data = await response.json();
    if (!response.ok || !data.success) throw new Error(data.message || 'Không thể tải danh sách user');
    setUsers(data.data?.customers || []);
  };

  useEffect(() => {
    loadUsers().catch((e) => alert(e.message));
  }, [statusFilter]);

  const updateStatus = async (id: string, status: 'active' | 'inactive') => {
    const response = await fetch(getApiUrl(`/staffListCustomers/customers/${id}/status`), {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      credentials: 'include',
      body: JSON.stringify({ status })
    });
    const data = await response.json();
    if (!response.ok || !data.success) throw new Error(data.message || 'Cập nhật trạng thái user thất bại');
    await loadUsers();
  };

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-100">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Quản lý khách hàng</h2>
      <div className="flex flex-col md:flex-row gap-3 mb-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm theo tên/số điện thoại/email"
          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg"
        />
        <button onClick={() => loadUsers().catch((e) => alert(e.message))} className="px-4 py-2 bg-gray-900 text-white rounded-lg">Tìm kiếm</button>
      </div>

      <div className="space-y-3">
        {users.map((u) => (
          <div key={u._id} className="border border-gray-100 rounded-xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <p className="font-semibold text-gray-900">{u.name}</p>
              <p className="text-sm text-gray-500">{u.phone} {u.email ? `- ${u.email}` : ''}</p>
              <p className="text-xs text-gray-500">Bookings: {u.total_bookings || 0} - Tổng chi tiêu: {(u.total_spent || 0).toLocaleString('vi-VN')}đ</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
