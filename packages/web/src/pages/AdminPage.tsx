import { useState, useEffect, FormEvent } from 'react';
import { useAdminStore } from '@/store/adminStore';
import { useAuthStore } from '@/store/authStore';
import {
  getUsers,
  createUser as apiCreateUser,
  deleteUser as apiDeleteUser,
  updateUser as apiUpdateUser,
  resetUserPassword,
} from '@/api/admin.api';
import {
  Shield,
  UserPlus,
  Trash2,
  Pencil,
  X,
  Check,
  Loader2,
  Building2,
  AlertCircle,
  Info,
  KeyRound,
  CheckCircle,
  Clock,
} from 'lucide-react';
import type { AdminUser } from '@finthesis/shared';

export function AdminPage() {
  const { users, setUsers, addUser, removeUser, updateUserInStore, loading, setLoading } =
    useAdminStore();
  const { user: currentUser } = useAuthStore();

  // Create form
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<'user' | 'admin'>('user');
  const [createLoading, setCreateLoading] = useState(false);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editEmail, setEditEmail] = useState('');
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editRole, setEditRole] = useState<'user' | 'admin'>('user');

  // Delete confirmation
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Reset password confirmation
  const [resettingId, setResettingId] = useState<string | null>(null);

  // Messages
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  const isAdmin = currentUser?.role === 'admin';

  useEffect(() => {
    if (isAdmin) loadUsers();
  }, [isAdmin]);

  // Guard : accès admin uniquement
  if (!isAdmin) {
    return (
      <div className="max-w-2xl mx-auto mt-12 text-center">
        <Shield className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-gray-900">Accès restreint</h2>
        <p className="text-sm text-gray-500 mt-2">
          Cette page est réservée aux administrateurs.
        </p>
      </div>
    );
  }

  async function loadUsers() {
    setLoading(true);
    try {
      const data = await getUsers();
      setUsers(data);
    } catch {
      setMessage('Erreur lors du chargement des utilisateurs.');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setMessage('');
    setCreateLoading(true);
    try {
      const user = await apiCreateUser({ email, displayName, role });
      addUser(user);
      setEmail('');
      setDisplayName('');
      setRole('user');
      setMessage(`Utilisateur "${user.displayName}" créé avec succès.`);
      setMessageType('success');
    } catch (err: any) {
      const apiError = err?.response?.data?.error;
      setMessage(apiError?.message || err?.message || 'Erreur lors de la création.');
      setMessageType('error');
    } finally {
      setCreateLoading(false);
    }
  }

  function startEdit(u: AdminUser) {
    setEditingId(u.id);
    setEditEmail(u.email);
    setEditDisplayName(u.displayName);
    setEditRole(u.role as 'user' | 'admin');
  }

  function cancelEdit() {
    setEditingId(null);
    setEditEmail('');
    setEditDisplayName('');
    setEditRole('user');
  }

  async function handleUpdate(userId: string) {
    setMessage('');
    try {
      const updated = await apiUpdateUser(userId, {
        email: editEmail,
        displayName: editDisplayName,
        role: editRole,
      });
      updateUserInStore(updated);
      setEditingId(null);
      setMessage(`Utilisateur "${updated.displayName}" mis à jour.`);
      setMessageType('success');
    } catch (err: any) {
      const apiError = err?.response?.data?.error;
      setMessage(apiError?.message || err?.message || 'Erreur lors de la mise à jour.');
      setMessageType('error');
    }
  }

  async function handleDelete(userId: string) {
    setMessage('');
    try {
      await apiDeleteUser(userId);
      removeUser(userId);
      setDeletingId(null);
      setMessage('Utilisateur supprimé.');
      setMessageType('success');
    } catch (err: any) {
      const apiError = err?.response?.data?.error;
      setMessage(apiError?.message || err?.message || 'Erreur lors de la suppression.');
      setMessageType('error');
    }
  }

  async function handleResetPassword(userId: string) {
    setMessage('');
    try {
      await resetUserPassword(userId);
      // Mettre à jour hasPassword dans le store
      const user = users.find((u) => u.id === userId);
      if (user) {
        updateUserInStore({ ...user, hasPassword: false });
      }
      setResettingId(null);
      setMessage('Mot de passe réinitialisé. L\'utilisateur devra le redéfinir à la prochaine connexion.');
      setMessageType('success');
    } catch (err: any) {
      const apiError = err?.response?.data?.error;
      setMessage(apiError?.message || err?.message || 'Erreur lors de la réinitialisation.');
      setMessageType('error');
    }
  }

  const formatDate = (d: string | undefined) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('fr-FR');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
        <Shield className="w-6 h-6 text-primary-500" />
        Administration
      </h2>

      {message && (
        <div
          className={`rounded-lg p-3 text-sm ${
            messageType === 'success'
              ? 'bg-green-50 text-green-700'
              : 'bg-red-50 text-red-700'
          }`}
        >
          {message}
        </div>
      )}

      {/* Formulaire de création */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-primary-500" />
          Nouvel utilisateur
        </h3>
        <div className="flex items-start gap-2 text-xs text-blue-600 bg-blue-50 rounded-lg px-3 py-2 mb-4">
          <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <span>L'utilisateur définira son mot de passe lors de sa première connexion.</span>
        </div>

        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="utilisateur@email.com"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom affiché *</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="user_nom"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rôle</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as 'user' | 'admin')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="user">Utilisateur</option>
                <option value="admin">Administrateur</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={createLoading || !email || !displayName}
            className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
          >
            {createLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <UserPlus className="w-4 h-4" />
            )}
            Créer l'utilisateur
          </button>
        </form>
      </div>

      {/* Liste des utilisateurs */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary-500" />
            Utilisateurs ({users.length})
          </h3>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <Loader2 className="w-6 h-6 animate-spin text-primary-500 mx-auto" />
            <p className="text-sm text-gray-400 mt-2">Chargement...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">
            Aucun utilisateur enregistré.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {users.map((u) => (
              <div key={u.id} className="p-4 hover:bg-gray-50 transition-colors">
                {editingId === u.id ? (
                  /* Mode édition */
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <input
                        type="email"
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="Email"
                      />
                      <input
                        type="text"
                        value={editDisplayName}
                        onChange={(e) => setEditDisplayName(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="Nom affiché"
                      />
                      <select
                        value={editRole}
                        onChange={(e) => setEditRole(e.target.value as 'user' | 'admin')}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="user">Utilisateur</option>
                        <option value="admin">Administrateur</option>
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdate(u.id)}
                        className="flex items-center gap-1 bg-primary-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-primary-700"
                      >
                        <Check className="w-3.5 h-3.5" /> Enregistrer
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="flex items-center gap-1 bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-200"
                      >
                        <X className="w-3.5 h-3.5" /> Annuler
                      </button>
                    </div>
                  </div>
                ) : deletingId === u.id ? (
                  /* Mode confirmation suppression */
                  <div className="space-y-3">
                    <div className="flex items-start gap-2 text-sm text-red-700">
                      <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                      <span>
                        Supprimer <strong>{u.displayName}</strong> ({u.email}) ? Toutes ses
                        entreprises et données seront définitivement supprimées.
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDelete(u.id)}
                        className="flex items-center gap-1 bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-red-700"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Confirmer
                      </button>
                      <button
                        onClick={() => setDeletingId(null)}
                        className="flex items-center gap-1 bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-200"
                      >
                        <X className="w-3.5 h-3.5" /> Annuler
                      </button>
                    </div>
                  </div>
                ) : resettingId === u.id ? (
                  /* Mode confirmation réinitialisation mdp */
                  <div className="space-y-3">
                    <div className="flex items-start gap-2 text-sm text-amber-700">
                      <KeyRound className="w-4 h-4 mt-0.5 shrink-0" />
                      <span>
                        Réinitialiser le mot de passe de <strong>{u.displayName}</strong> ?
                        L'utilisateur devra le redéfinir à la prochaine connexion.
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleResetPassword(u.id)}
                        className="flex items-center gap-1 bg-amber-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-amber-600"
                      >
                        <KeyRound className="w-3.5 h-3.5" /> Confirmer
                      </button>
                      <button
                        onClick={() => setResettingId(null)}
                        className="flex items-center gap-1 bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-200"
                      >
                        <X className="w-3.5 h-3.5" /> Annuler
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Mode affichage */
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-gray-900">{u.displayName}</p>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            u.role === 'admin'
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {u.role === 'admin' ? 'Admin' : 'Utilisateur'}
                        </span>
                        {u.hasPassword ? (
                          <span className="flex items-center gap-1 text-xs text-green-600">
                            <CheckCircle className="w-3 h-3" /> Actif
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-amber-500">
                            <Clock className="w-3 h-3" /> Premier login en attente
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">{u.email}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-xs text-gray-400">
                          Créé le {formatDate(u.createdAt)}
                        </span>
                        {u.companies.length > 0 && (
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <Building2 className="w-3 h-3" />
                            {u.companies.map((c) => c.name).join(', ')}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 ml-4">
                      <button
                        onClick={() => startEdit(u)}
                        className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        title="Modifier"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setResettingId(u.id)}
                        className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                        title="Réinitialiser le mot de passe"
                      >
                        <KeyRound className="w-4 h-4" />
                      </button>
                      {u.id !== currentUser?.id && (
                        <button
                          onClick={() => setDeletingId(u.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
