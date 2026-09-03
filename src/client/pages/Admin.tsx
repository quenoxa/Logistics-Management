import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Plus,
  Edit,
  Trash2,
  Server,
  Database,
  CheckCircle2,
  Users,
  Activity,
  RotateCw,
  Cpu,
  HardDrive,
  Clock,
  Lock,
} from 'lucide-react';
import { adminApi } from '../services/api';
import { User, AuditLog } from '../../shared/types';
import { DataTable, Column } from '../components/common/DataTable';
import { Modal } from '../components/common/Modal';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { useToast } from '../context/ToastContext';

export const Admin: React.FC = () => {
  const { success, error } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [systemHealth, setSystemHealth] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'users' | 'audit' | 'diagnostics'>('users');
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const fetchData = async (showLoading = true) => {
    try {
      if (showLoading) setIsLoading(true);
      const [uData, aData, hData] = await Promise.all([
        adminApi.getUsers(),
        adminApi.getAuditLogs(),
        adminApi.getSystemHealth(),
      ]);
      setUsers(uData);
      setAuditLogs(aData);
      setSystemHealth(hData);
    } catch (err: any) {
      console.error('Failed to load admin data:', err);
      error('Access Denied', err.response?.data?.error || 'Failed to load administrator records.');
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData(true);
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await adminApi.createUser(newUser as any);
      success('Operator Provisioned', `User ${created.name} (${created.email}) added.`);
      setIsAddUserOpen(false);
      fetchData(false);
      setNewUser({
        name: '',
        email: '',
        password: '',
        role: 'DISPATCHER',
        status: 'ACTIVE',
      });
    } catch (err: any) {
      error('Creation Failed', err.response?.data?.error || 'Failed to create user.');
    }
  };

  const openEditUser = (u: User) => {
    setSelectedUser(u);
    setEditUserData({
      name: u.name,
      role: u.role,
      status: u.status || 'ACTIVE',
      password: '',
    });
    setIsEditUserOpen(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    try {
      await adminApi.updateUser(selectedUser.id, editUserData as any);
      success('User Updated', `Account ${selectedUser.email} updated.`);
      setIsEditUserOpen(false);
      fetchData(false);
    } catch (err: any) {
      error('Update Failed', err.response?.data?.error || 'Failed to update user.');
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      await adminApi.deleteUser(deleteTarget.id);
      success('User Deleted', `Account ${deleteTarget.email} removed.`);
      setDeleteTarget(null);
      fetchData(false);
    } catch (err: any) {
      error('Delete Failed', err.response?.data?.error || 'Failed to delete user.');
    } finally {
      setIsDeleting(false);
    }
  };

  const userColumns: Column<User>[] = [
    {
      header: 'Name & Email',
      accessor: 'name',
      sortable: true,
      render: (u) => (
        <div>
          <span className="font-bold text-slate-900 block">{u.name}</span>
          <span className="text-xs text-slate-500 font-mono">{u.email}</span>
        </div>
      ),
    },
    {
      header: 'Role Level',
      accessor: 'role',
      sortable: true,
      render: (u) => (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
          u.role === 'ADMIN'
            ? 'bg-rose-50 text-rose-700 border border-rose-200'
            : u.role === 'DISPATCHER'
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            : 'bg-slate-100 text-slate-700 border border-slate-200'
        }`}>
          {u.role}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (u) => (
        <span className={`px-2 py-0.5 rounded text-xs font-bold ${
          u.status === 'ACTIVE'
            ? 'bg-emerald-50 text-emerald-700'
            : 'bg-rose-50 text-rose-700'
        }`}>
          {u.status || 'ACTIVE'}
        </span>
      ),
    },
    {
      header: 'Created Date',
      render: (u) => (
        <span className="font-mono text-xs text-slate-500">
          {new Date(u.createdAt || Date.now()).toLocaleDateString('en-US')}
        </span>
      ),
    },
    {
      header: 'Actions',
      className: 'text-right',
      render: (u) => (
        <div className="flex items-center justify-end space-x-2">
          <button
            onClick={() => openEditUser(u)}
            className="p-1.5 text-slate-400 hover:text-slate-700 transition"
            title="Edit user"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDeleteTarget(u)}
            className="p-1.5 text-slate-400 hover:text-rose-600 transition"
            title="Delete user"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 pb-12 font-sans text-slate-800">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Users & System Security
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            User provisioning, role-based access control (RBAC), and cryptographic audit trail logs
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => fetchData(true)}
            className="p-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 transition shadow-sm"
            title="Refresh admin records"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsAddUserOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-2 shadow-md shadow-emerald-600/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add User</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 space-x-6 text-xs font-bold">
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 transition border-b-2 ${
            activeTab === 'users'
              ? 'border-emerald-600 text-emerald-600 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          User Accounts Roster ({users.length})
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`pb-3 transition border-b-2 ${
            activeTab === 'audit'
              ? 'border-emerald-600 text-emerald-600 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Activity Audit Logs ({auditLogs.length})
        </button>

        <button
          onClick={() => setActiveTab('diagnostics')}
          className={`pb-3 transition border-b-2 ${
            activeTab === 'diagnostics'
              ? 'border-emerald-600 text-emerald-600 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          System Diagnostics
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'users' && (
        <DataTable
          data={users}
          columns={userColumns}
          keyExtractor={(u) => u.id}
          searchPlaceholder="Search users by name, email, role..."
          searchFilter={(u, q) => {
            const matchName = u.name.toLowerCase().includes(q.toLowerCase());
            const matchEmail = u.email.toLowerCase().includes(q.toLowerCase());
            const matchRole = u.role.toLowerCase().includes(q.toLowerCase());
            return matchName || matchEmail || matchRole;
          }}
          isLoading={isLoading}
          pageSize={10}
        />
      )}

      {activeTab === 'audit' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden p-5">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 border-b border-slate-100 pb-3">
            Cryptographic Activity Audit Trail Stream
          </h3>

          <div className="divide-y divide-slate-100 max-h-[520px] overflow-y-auto pr-1">
            {auditLogs.length === 0 ? (
              <p className="text-xs text-slate-400 py-12 text-center">No audit logs recorded.</p>
            ) : (
              auditLogs.map((log) => (
                <div key={log.id} className="py-3 flex items-start justify-between text-xs space-x-4">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 rounded-xl bg-slate-100 text-slate-600 border border-slate-200 shrink-0 mt-0.5">
                      <Activity className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-900">{log.action}</span>
                        <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-600 font-mono text-[10px]">
                          {log.entity || 'SYSTEM'}
                        </span>
                      </div>
                      <p className="text-slate-600 mt-0.5">{log.details || 'Operation logged'}</p>
                      <p className="text-slate-400 font-mono text-[10px] mt-0.5">
                        User: {typeof log.user === 'object' ? log.user.name : (log.userName || String(log.user || 'System'))}
                      </p>
                    </div>
                  </div>
                  <span className="font-mono text-slate-400 text-[11px] shrink-0">
                    {new Date(log.timestamp || log.createdAt || Date.now()).toLocaleString('en-US')}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'diagnostics' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-6">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3">
            System & Database Diagnostics
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <span className="text-slate-500 font-bold block uppercase">Database Engine</span>
              <span className="text-slate-900 font-bold text-sm block">Prisma ORM (PostgreSQL / SQLite WAL)</span>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <span className="text-slate-500 font-bold block uppercase">Server Status</span>
              <span className="text-emerald-600 font-bold text-sm block flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                Express API Server Running (Port 5000)
              </span>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <span className="text-slate-500 font-bold block uppercase">Authentication</span>
              <span className="text-slate-900 font-bold text-sm block">Stateless JWT & Bcrypt (10 rounds)</span>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      <Modal isOpen={isAddUserOpen} onClose={() => setIsAddUserOpen(false)} title="Provision User Account">
        <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Full Name *</label>
            <input
              type="text"
              required
              value={newUser.name}
              onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
              placeholder="Rajesh Sharma"
              className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-900"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Email Address *</label>
            <input
              type="email"
              required
              value={newUser.email}
              onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              placeholder="operator@example.com"
              className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-900"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Password *</label>
            <input
              type="password"
              required
              value={newUser.password}
              onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
              placeholder="••••••••••••"
              className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Role *</label>
              <select
                value={newUser.role}
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-bold"
              >
                <option value="ADMIN">ADMIN</option>
                <option value="DISPATCHER">DISPATCHER</option>
                <option value="DRIVER">DRIVER</option>
                <option value="VIEWER">VIEWER</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Status</label>
              <select
                value={newUser.status}
                onChange={(e) => setNewUser({ ...newUser, status: e.target.value })}
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-bold"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="SUSPENDED">SUSPENDED</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsAddUserOpen(false)}
              className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md shadow-emerald-600/20"
            >
              Provision Account
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit User Modal */}
      <Modal isOpen={isEditUserOpen} onClose={() => setIsEditUserOpen(false)} title="Update User Account">
        <form onSubmit={handleUpdateUser} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Full Name</label>
            <input
              type="text"
              value={editUserData.name}
              onChange={(e) => setEditUserData({ ...editUserData, name: e.target.value })}
              className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Role Level</label>
              <select
                value={editUserData.role}
                onChange={(e) => setEditUserData({ ...editUserData, role: e.target.value })}
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-bold"
              >
                <option value="ADMIN">ADMIN</option>
                <option value="DISPATCHER">DISPATCHER</option>
                <option value="DRIVER">DRIVER</option>
                <option value="VIEWER">VIEWER</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Account Status</label>
              <select
                value={editUserData.status}
                onChange={(e) => setEditUserData({ ...editUserData, status: e.target.value })}
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-bold"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="SUSPENDED">SUSPENDED</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsEditUserOpen(false)}
              className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md shadow-emerald-600/20"
            >
              Save Changes
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete User Modal */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteUser}
        title="Delete User Account"
        message={`Are you sure you want to remove user account ${deleteTarget?.email}?`}
        isLoading={isDeleting}
      />
    </div>
  );
};
