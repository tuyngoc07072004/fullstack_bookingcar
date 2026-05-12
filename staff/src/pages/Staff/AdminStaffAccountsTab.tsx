import React, { useEffect, useMemo, useState } from 'react';
import { getApiUrl } from '../../utils/dbUrl';

interface StaffAccount {
  _id: string;
  name: string;
  phone: string;
  email: string;
  username: string;
  role: 'staff' | 'admin';
  status: 'active' | 'inactive';
}

export default function AdminStaffAccountsTab() {
  const [accounts, setAccounts] = useState<StaffAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'staff' | 'admin'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const token = useMemo(() => localStorage.getItem('staffToken') || sessionStorage.getItem('staffToken') || '', []);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const response = await fetch(getApiUrl('/staff/accounts'), {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include'
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || 'Không thể tải danh sách staff');
      let list = data.data || [];
      if (search.trim()) {
        const key = search.trim().toLowerCase();
        list = list.filter((x: StaffAccount) =>
          [x.name, x.username, x.phone, x.email].some((v) => (v || '').toLowerCase().includes(key))
        );
      }
      if (roleFilter !== 'all') {
        list = list.filter((x: StaffAccount) => x.role === roleFilter);
      }
      if (statusFilter !== 'all') {
        list = list.filter((x: StaffAccount) => x.status === statusFilter);
      }
      setAccounts(list);
    } catch (error: any) {
      alert(error.message || 'Không thể tải danh sách staff');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, [roleFilter, statusFilter]);

  const updateRole = async (id: string, role: 'staff' | 'admin') => {
    try {
      const response = await fetch(getApiUrl(`/staff/accounts/${id}/role`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify({ role })
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || 'Cập nhật role thất bại');
      await loadAccounts();
    } catch (error: any) {
      alert(error.message || 'Cập nhật role thất bại');
    }
  };

  const updateStatus = async (id: string, status: 'active' | 'inactive') => {
    try {
      const response = await fetch(getApiUrl(`/staff/accounts/${id}/status`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify({ status })
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || 'Cập nhật trạng thái thất bại');
      await loadAccounts();
    } catch (error: any) {
      alert(error.message || 'Cập nhật trạng thái thất bại');
    }
  };

  const deleteAccount = async (id: string, name: string) => {
    const ok = window.confirm(`Bạn chắc chắn muốn xóa nhân viên "${name}"?`);
    if (!ok) return;
    try {
      const response = await fetch(getApiUrl(`/staff/accounts/${id}`), {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        },
        credentials: 'include'
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || 'Xóa tài khoản thất bại');
      await loadAccounts();
    } catch (error: any) {
      alert(error.message || 'Xóa tài khoản thất bại');
    }
  };

  if (loading) {
    return <div className="bg-white rounded-xl p-6">Đang tải danh sách staff...</div>;
  }

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-100">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Quản lý nhân viên</h2>
      <div className="flex flex-col md:flex-row gap-3 mb-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm theo tên/username/sđt/email"
          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg"
        />
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as any)} className="px-3 py-2 border border-gray-200 rounded-lg">
          <option value="all">Tất cả</option>
          <option value="staff">staff</option>
          <option value="admin">admin</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} className="px-3 py-2 border border-gray-200 rounded-lg">
          <option value="all">Tất cả trạng thái</option>
          <option value="active">active</option>
          <option value="inactive">inactive</option>
        </select>
        <button onClick={() => loadAccounts()} className="px-4 py-2 bg-gray-900 text-white rounded-lg">Tìm kiếm</button>
      </div>
      <div className="space-y-3">
        {accounts.map((acc) => (
          <div key={acc._id} className="border border-gray-100 rounded-xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <p className="font-semibold text-gray-900">{acc.name} ({acc.username})</p>
              <p className="text-sm text-gray-500">{acc.email} - {acc.phone}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Phân quyền:</span>
              <select
                value={acc.role}
                onChange={(e) => updateRole(acc._id, e.target.value as 'staff' | 'admin')}
                className="px-3 py-2 border border-gray-200 rounded-lg"
              >
                <option value="staff">staff</option>
                <option value="admin">admin</option>
              </select>
              <button
                onClick={() => deleteAccount(acc._id, acc.name)}
                className="px-3 py-2 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg text-sm"
              >
                Xóa
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
