import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Plus,
  Edit,
  Trash2,
  Server,
  Database,
  CheckCircle2,
} from 'lucide-react';
import { adminApi } from '../api/client';
import { User, AuditLog } from '../types';
import { DataTable, Column } from '../components/common/DataTable';
import { Modal } from '../components/common/Modal';

export const Admin: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [systemHealth, setSystemHealth] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'users' | 'audit' | 'diagnostics'>('users');
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Add User State
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'DISPATCHER',
    status: 'ACTIVE',
  });

  // Edit User State
  const [editUserData, setEditUserData] = useState({
    name: '',
    role: 'DISPATCHER',
    status: 'ACTIVE',
    password: '',
  });

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [uData, aData, hData] = await Promise.all([
        adminApi.getUsers(),
        adminApi.getAuditLogs(),
        adminApi.getSystemHealth(),
      ]);
      setUsers(uData);
      setAuditLogs(aData);
      setSystemHealth(hData);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminApi.createUser(newUser as any);
      setIsAddUserOpen(false);
      fetchData();
      setNewUser({
        name: '',
        email: '',
        password: '',
        role: 'DISPATCHER',
        status: 'ACTIVE',
      });
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create user');
    }
  };

  const openEditUser = (u: User) => {
    setSelectedUser(u);
    setEditUserData({
      name: u.name,
      role: u.role,
      status: u.status,
      password: '',
    });
    setIsEditUserOpen(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      const payload: any = {
        name: editUserData.name,
        role: editUserData.role,
        status: editUserData.status,
      };
      if (editUserData.password) payload.password = editUserData.password;

      await adminApi.updateUser(selectedUser.id, payload);
      setIsEditUserOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update user');
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await adminApi.deleteUser(id);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete user');
    }
  };

  const userColumns: Column<User>[] = [
    {
      header: 'Operator Name',
      accessor: 'name',
      sortable: true,
      render: (u) => (
        <div className="font-mono">
          <span className="font-bold text-slate-900 block">{u.name}</span>
          <span className="text-[10px] text-slate-500">{u.email}</span>
        </div>
      ),
    },
    {
      header: 'Role Assignment',
      accessor: 'role',
      sortable: true,
      render: (u) => {
        const colors: Record<string, string> = {
          ADMIN: 'bg-rose-50 text-rose-700 border-rose-200',
          DISPATCHER: 'bg-orange-50 text-orange-700 border-orange-200',
          FLEET_MANAGER: 'bg-blue-50 text-blue-700 border-blue-200',
          DRIVER: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        };
        return (
          <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold border ${colors[u.role] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
            {u.role}
          </span>
        );
      },
    },
    {
      header: 'Account Status',
      accessor: 'status',
      sortable: true,
      render: (u) => (
        <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
          u.status === 'ACTIVE' ? 'text-emerald-700 bg-emerald-50 border border-emerald-200' : 'text-rose-700 bg-rose-50 border border-rose-200'
        }`}>
          {u.status}
        </span>
      ),
    },
    {
      header: 'Created Date',
      accessor: 'createdAt',
      sortable: true,
      render: (u) => (
        <span className="font-mono text-xs text-slate-500">
          {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '--'}
        </span>
      ),
    },
    {
      header: 'Actions',
      render: (u) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => openEditUser(u)}
            className="p-1.5 rounded bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs shadow-xs"
          >
            <Edit className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleDeleteUser(u.id)}
            className="p-1.5 rounded bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 text-xs shadow-xs"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  const auditColumns: Column<AuditLog>[] = [
    {
      header: 'Timestamp',
      accessor: 'createdAt',
      sortable: true,
      render: (a) => (
        <span className="font-mono text-[11px] text-slate-500">
          {new Date(a.createdAt).toLocaleString()}
        </span>
      ),
    },
    {
      header: 'Actor / User',
      accessor: 'userName',
      sortable: true,
      render: (a) => (
        <span className="font-mono font-bold text-slate-900">{a.userName}</span>
      ),
    },
    {
      header: 'Action',
      accessor: 'action',
      sortable: true,
      render: (a) => (
        <span className="px-2 py-0.5 rounded bg-orange-50 border border-orange-200 text-orange-700 font-mono text-[10px] font-bold">
          {a.action}
        </span>
      ),
    },
    {
      header: 'Entity Target',
      accessor: 'entityType',
      sortable: true,
      render: (a) => (
        <span className="font-mono text-xs text-slate-700 font-semibold">{a.entityType}</span>
      ),
    },
    {
      header: 'Details / Payload',
      accessor: 'details',
      render: (a) => (
        <span className="font-mono text-[11px] text-slate-600 max-w-md truncate block">
          {a.details || '--'}
        </span>
      ),
    },
    {
      header: 'IP Address',
      accessor: 'ipAddress',
      render: (a) => (
        <span className="font-mono text-[10px] text-slate-400">{a.ipAddress || '127.0.0.1'}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Users & Administration
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Operator access management, audit trail logs, and system health
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-md border border-slate-200 text-xs">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              activeTab === 'users' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Users ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              activeTab === 'audit' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Audit trail ({auditLogs.length})
          </button>
          <button
            onClick={() => setActiveTab('diagnostics')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              activeTab === 'diagnostics' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            System health
          </button>
        </div>
      </div>

      {/* Tab Content: Users */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setIsAddUserOpen(true)}
              className="px-3 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add user</span>
            </button>
          </div>

          <DataTable
            data={users}
            columns={userColumns}
            keyExtractor={(u) => u.id}
            searchPlaceholder="Search Operator by Name or Email..."
            searchFilter={(u, q) =>
              u.name.toLowerCase().includes(q.toLowerCase()) ||
              u.email.toLowerCase().includes(q.toLowerCase()) ||
              u.role.toLowerCase().includes(q.toLowerCase())
            }
            isLoading={isLoading}
          />
        </div>
      )}

      {/* Tab Content: Audit Logs */}
      {activeTab === 'audit' && (
        <DataTable
          data={auditLogs}
          columns={auditColumns}
          keyExtractor={(a) => a.id}
          searchPlaceholder="Search Audit Logs by Actor, Action, Details..."
          searchFilter={(a, q) =>
            a.userName.toLowerCase().includes(q.toLowerCase()) ||
            a.action.toLowerCase().includes(q.toLowerCase()) ||
            Boolean(a.details?.toLowerCase().includes(q.toLowerCase()))
          }
          isLoading={isLoading}
        />
      )}

      {/* Tab Content: System Health Diagnostics */}
      {activeTab === 'diagnostics' && systemHealth && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-3">
              <Server className="w-4 h-4 text-emerald-600" />
              <span>API SERVER & ENGINE RUNTIME</span>
            </h3>

            <div className="space-y-3 font-mono text-xs">
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500">System Status:</span>
                <span className="text-emerald-700 font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {systemHealth.status}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500">Server Uptime:</span>
                <span className="text-slate-900 font-bold">{systemHealth.uptimeSeconds} seconds</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500">Database Engine:</span>
                <span className="text-orange-600 font-bold">{systemHealth.databaseEngine}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500">Heap Memory Used:</span>
                <span className="text-sky-700 font-bold">{systemHealth.memory?.heapUsedMb} MB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Resident Set Size (RSS):</span>
                <span className="text-slate-900 font-bold">{systemHealth.memory?.rssMb} MB</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-3">
              <Database className="w-4 h-4 text-orange-600" />
              <span>DATABASE ENTITY RECORD COUNTS</span>
            </h3>

            <div className="grid grid-cols-2 gap-3 font-mono text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Deliveries</span>
                <span className="text-lg font-bold text-slate-900">{systemHealth.entities?.deliveries || 0}</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Orders</span>
                <span className="text-lg font-bold text-slate-900">{systemHealth.entities?.orders || 0}</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Fleet Vehicles</span>
                <span className="text-lg font-bold text-slate-900">{systemHealth.entities?.vehicles || 0}</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Commercial Drivers</span>
                <span className="text-lg font-bold text-slate-900">{systemHealth.entities?.drivers || 0}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      <Modal
        isOpen={isAddUserOpen}
        onClose={() => setIsAddUserOpen(false)}
        title="CREATE DISPATCH OPERATOR ACCOUNT"
        subtitle="Issue credentials and assign RBAC role permissions"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateUser} className="space-y-4 font-mono text-xs">
          <div>
            <label className="text-slate-700 font-bold block mb-1">Full Name</label>
            <input
              required
              type="text"
              placeholder="e.g. Alex Morgan"
              value={newUser.name}
              onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded text-slate-900 focus:border-orange-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="text-slate-700 font-bold block mb-1">Email Address</label>
            <input
              required
              type="email"
              placeholder="alex.m@fleetops.io"
              value={newUser.email}
              onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded text-slate-900 focus:border-orange-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="text-slate-700 font-bold block mb-1">Password</label>
            <input
              required
              type="password"
              placeholder="••••••••••••"
              value={newUser.password}
              onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded text-slate-900 focus:border-orange-500 focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-slate-700 font-bold block mb-1">System Role</label>
              <select
                value={newUser.role}
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded text-slate-900 focus:border-orange-500 focus:bg-white"
              >
                <option value="ADMIN">ADMINISTRATOR</option>
                <option value="DISPATCHER">DISPATCHER</option>
                <option value="FLEET_MANAGER">FLEET OPERATIONS MANAGER</option>
                <option value="DRIVER">COMMERCIAL DRIVER</option>
              </select>
            </div>
            <div>
              <label className="text-slate-700 font-bold block mb-1">Account Status</label>
              <select
                value={newUser.status}
                onChange={(e) => setNewUser({ ...newUser, status: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded text-slate-900 focus:border-orange-500 focus:bg-white"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
                <option value="SUSPENDED">SUSPENDED</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsAddUserOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg shadow-sm"
            >
              Create Account
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={isEditUserOpen}
        onClose={() => setIsEditUserOpen(false)}
        title={`EDIT OPERATOR: ${selectedUser?.email || ''}`}
        subtitle="Modify user credentials and privileges"
        maxWidth="lg"
      >
        <form onSubmit={handleUpdateUser} className="space-y-4 font-mono text-xs">
          <div>
            <label className="text-slate-700 font-bold block mb-1">Full Name</label>
            <input
              required
              type="text"
              value={editUserData.name}
              onChange={(e) => setEditUserData({ ...editUserData, name: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded text-slate-900 focus:border-orange-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="text-slate-700 font-bold block mb-1">Reset Password (Leave blank to keep current)</label>
            <input
              type="password"
              placeholder="New password (optional)"
              value={editUserData.password}
              onChange={(e) => setEditUserData({ ...editUserData, password: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded text-slate-900 focus:border-orange-500 focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-slate-700 font-bold block mb-1">System Role</label>
              <select
                value={editUserData.role}
                onChange={(e) => setEditUserData({ ...editUserData, role: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded text-slate-900 focus:border-orange-500 focus:bg-white"
              >
                <option value="ADMIN">ADMINISTRATOR</option>
                <option value="DISPATCHER">DISPATCHER</option>
                <option value="FLEET_MANAGER">FLEET OPERATIONS MANAGER</option>
                <option value="DRIVER">COMMERCIAL DRIVER</option>
              </select>
            </div>
            <div>
              <label className="text-slate-700 font-bold block mb-1">Account Status</label>
              <select
                value={editUserData.status}
                onChange={(e) => setEditUserData({ ...editUserData, status: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded text-slate-900 focus:border-orange-500 focus:bg-white"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
                <option value="SUSPENDED">SUSPENDED</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsEditUserOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg shadow-sm"
            >
              Save Operator Changes
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
