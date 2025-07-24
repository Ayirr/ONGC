import React, { useState, useEffect } from 'react';
import { Users, FileText, MessageSquare, Calendar, Search, Edit2, Save, X, Key, AlertCircle } from 'lucide-react';
import { User, Chat, Document, EditUserForm, PasswordChangeForm } from '../../types';
import { adminApi } from '../../services/api';
import { toast } from '../../utils/toast';
import { validateEmail, validateUsername, validatePassword } from '../../utils/validation';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userChats, setUserChats] = useState<Chat[]>([]);
  const [userDocs, setUserDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'chats' | 'documents'>('chats');
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditUserForm>({
    username: '',
    email: '',
    role: 'user'
  });
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});
  const [passwordForm, setPasswordForm] = useState<PasswordChangeForm>({
    userId: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await adminApi.getUsers();
      setUsers(response.data);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Failed to load users. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadUserDetails = async (userId: string) => {
    try {
      const [chatsResponse, docsResponse] = await Promise.all([
        adminApi.getUserChats(userId),
        adminApi.getUserDocs(userId),
      ]);
      setUserChats(chatsResponse.data);
      setUserDocs(docsResponse.data);
    } catch (error) {
      console.error('Error loading user details:', error);
      toast.error('Failed to load user details.');
    }
  };

  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
    setEditingUser(null);
    loadUserDetails(user.id);
  };

  const validateEditForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    const usernameValidation = validateUsername(editForm.username);
    if (!usernameValidation.isValid) {
      errors.username = usernameValidation.errors[0];
    }
    
    if (!editForm.email) {
      errors.email = 'Email is required';
    } else if (!validateEmail(editForm.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    setEditErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const startEditing = (user: User) => {
    setEditingUser(user.id);
    setEditForm({
      username: user.username,
      email: user.email,
      role: user.role
    });
    setEditErrors({});
  };

  const cancelEditing = () => {
    setEditingUser(null);
    setEditForm({ username: '', email: '', role: 'user' });
    setEditErrors({});
  };

  const saveUserChanges = async (userId: string) => {
    if (!validateEditForm()) {
      return;
    }

    try {
      setSaveLoading(true);
      await adminApi.updateUser(userId, editForm);
      await loadUsers();
      setEditingUser(null);
      
      // Update selected user if it's the one being edited
      if (selectedUser?.id === userId) {
        const updatedUser = users.find(u => u.id === userId);
        if (updatedUser) {
          setSelectedUser(updatedUser);
        }
      }
      
      toast.success('User updated successfully');
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Failed to update user. Please try again.');
    } finally {
      setSaveLoading(false);
    }
  };

  const validatePasswordForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    const passwordValidation = validatePassword(passwordForm.newPassword);
    if (!passwordValidation.isValid) {
      errors.newPassword = passwordValidation.errors[0];
    }
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const openPasswordModal = (userId: string) => {
    setPasswordForm({
      userId,
      newPassword: '',
      confirmPassword: ''
    });
    setPasswordErrors({});
    setShowPasswordModal(true);
  };

  const closePasswordModal = () => {
    setShowPasswordModal(false);
    setPasswordForm({
      userId: '',
      newPassword: '',
      confirmPassword: ''
    });
    setPasswordErrors({});
  };

  const changePassword = async () => {
    if (!validatePasswordForm()) {
      return;
    }

    try {
      setSaveLoading(true);
      await adminApi.changeUserPassword(passwordForm.userId, passwordForm.newPassword);
      toast.success('Password changed successfully');
      closePasswordModal();
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error('Failed to change password. Please try again.');
    } finally {
      setSaveLoading(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
        {/* Users List */}
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Users ({filteredUsers.length})</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                  selectedUser?.id === user.id ? 'bg-red-50 border-r-2 border-red-600' : ''
                }`}
                onClick={() => handleUserSelect(user)}
              >
                {editingUser === user.id ? (
                  <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
                    <div>
                      <input
                        type="text"
                        value={editForm.username}
                        onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                        className={`w-full px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-red-500 ${
                          editErrors.username ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Username"
                      />
                      {editErrors.username && (
                        <p className="text-xs text-red-600 mt-1">{editErrors.username}</p>
                      )}
                    </div>
                    <div>
                      <input
                        type="email"
                        value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        className={`w-full px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-red-500 ${
                          editErrors.email ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Email"
                      />
                      {editErrors.email && (
                        <p className="text-xs text-red-600 mt-1">{editErrors.email}</p>
                      )}
                    </div>
                    <select
                      value={editForm.role}
                      onChange={(e) => setEditForm({ ...editForm, role: e.target.value as 'user' | 'admin' })}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-red-500"
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => saveUserChanges(user.id)}
                        disabled={saveLoading}
                        className="flex-1 px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 disabled:opacity-50 flex items-center justify-center space-x-1"
                      >
                        {saveLoading ? (
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                        ) : (
                          <>
                            <Save className="h-3 w-3" />
                            <span>Save</span>
                          </>
                        )}
                      </button>
                      <button
                        onClick={cancelEditing}
                        className="flex-1 px-2 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700 flex items-center justify-center space-x-1"
                      >
                        <X className="h-3 w-3" />
                        <span>Cancel</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                        <Users className="h-4 w-4 text-gray-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {user.username}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            user.role === 'admin' 
                              ? 'bg-purple-100 text-purple-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {user.role}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          startEditing(user);
                        }}
                        className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Edit user"
                      >
                        <Edit2 className="h-3 w-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openPasswordModal(user.id);
                        }}
                        className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                        title="Change password"
                      >
                        <Key className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* User Details */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-lg">
          {selectedUser ? (
            <>
              {/* User Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                    <Users className="h-6 w-6 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {selectedUser.username}
                    </h3>
                    <p className="text-sm text-gray-500">{selectedUser.email}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Calendar className="h-3 w-3 text-gray-400" />
                      <span className="text-xs text-gray-500">
                        Joined {new Date(selectedUser.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <MessageSquare className="h-5 w-5 text-blue-600" />
                      <span className="text-sm font-medium text-blue-900">Chats</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-900 mt-1">
                      {userChats.length}
                    </p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-5 w-5 text-green-600" />
                      <span className="text-sm font-medium text-green-900">Documents</span>
                    </div>
                    <p className="text-2xl font-bold text-green-900 mt-1">
                      {userDocs.length}
                    </p>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="border-b border-gray-200">
                <nav className="flex space-x-8 px-6">
                  <button
                    onClick={() => setActiveTab('chats')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === 'chats'
                        ? 'border-red-500 text-red-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Chat History ({userChats.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('documents')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === 'documents'
                        ? 'border-red-500 text-red-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Documents ({userDocs.length})
                  </button>
                </nav>
              </div>

              {/* Tab Content */}
              <div className="p-6 overflow-y-auto max-h-96">
                {activeTab === 'chats' ? (
                  <div className="space-y-4">
                    {userChats.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">No chats found</p>
                    ) : (
                      userChats.map((chat) => (
                        <div key={chat.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium text-gray-900">{chat.title}</h4>
                            <span className="text-xs text-gray-500">
                              {new Date(chat.updatedAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">
                            {chat.messages.length} message{chat.messages.length !== 1 ? 's' : ''}
                          </p>
                          {chat.messages.length > 0 && (
                            <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600">
                              Last: {chat.messages[chat.messages.length - 1].text.substring(0, 100)}
                              {chat.messages[chat.messages.length - 1].text.length > 100 ? '...' : ''}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {userDocs.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">No documents found</p>
                    ) : (
                      userDocs.map((doc) => (
                        <div key={doc.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center space-x-2">
                              <FileText className="h-4 w-4 text-gray-600" />
                              <h4 className="font-medium text-gray-900">{doc.fileName}</h4>
                            </div>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              doc.status === 'completed' 
                                ? 'bg-green-100 text-green-800'
                                : doc.status === 'failed'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {doc.status}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-sm text-gray-500">
                            <span>{(doc.fileSize / 1024 / 1024).toFixed(1)} MB</span>
                            <span>{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full py-12">
              <div className="text-center">
                <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select a User</h3>
                <p className="text-gray-500">Choose a user from the list to view their details</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Change Password</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                    passwordErrors.newPassword ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter new password"
                />
                {passwordErrors.newPassword && (
                  <p className="text-sm text-red-600 mt-1">{passwordErrors.newPassword}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                    passwordErrors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Confirm new password"
                />
                {passwordErrors.confirmPassword && (
                  <p className="text-sm text-red-600 mt-1">{passwordErrors.confirmPassword}</p>
                )}
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={changePassword}
                disabled={saveLoading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {saveLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Key className="h-4 w-4" />
                    <span>Change Password</span>
                  </>
                )}
              </button>
              <button
                onClick={closePasswordModal}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default UserManagement;