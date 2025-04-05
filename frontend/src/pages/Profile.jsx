import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { 
  ArrowRightOnRectangleIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  TrophyIcon,
  UserCircleIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';

export default function Profile({ onLogout }) {
  const [user, setUser] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    displayName: '',
    bio: '',
    email: ''
  });
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        const { data } = await api.get('/api/profile');
        setUser(data);
        setFormData({
          displayName: data.displayName || '',
          bio: data.bio || '',
          email: data.email || ''
        });
      } catch (err) {
        console.error('Failed to fetch profile', err);
        setError('Failed to load profile data');
        navigate('/login');
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.put('/api/profile', formData);
      setUser(data);
      setEditMode(false);
      setError(null);
    } catch (err) {
      console.error('Failed to update profile', err);
      setError(err.response?.data?.message || 'Update failed');
    }
  };

  if (isLoading) return (
    <div className="flex justify-center items-center min-h-screen bg-[#0a192f]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#64ffda]"></div>
    </div>
  );

  if (!user) return <div className="text-center py-20 text-[#ccd6f6]">No user data found</div>;

  return (
    <div className="min-h-screen bg-[#0a192f] text-[#ccd6f6] py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8 border-b border-[#1e2a47] pb-4">
          <h1 className="text-3xl font-bold text-[#64ffda] font-mono">
            USER_PROFILE
          </h1>
          
          <div className="flex items-center gap-4">
            <button
              onClick={onLogout}
              className="flex items-center gap-2 text-red-400 hover:text-red-300 transition-colors px-3 py-2"
              title="Logout"
            >
              <ArrowRightOnRectangleIcon className="h-6 w-6" />
              <span className="hidden md:inline">Logout</span>
            </button>
            
            {!editMode && (
              <button
                onClick={() => setEditMode(true)}
                className="flex items-center gap-2 px-4 py-2 bg-[#112240] hover:bg-[#1e2a47] rounded-lg transition-colors"
              >
                <PencilIcon className="h-5 w-5" />
                <span>Edit Profile</span>
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-900/30 border border-red-700 rounded-lg text-red-300">
            {error}
          </div>
        )}

        {editMode ? (
          <div className="bg-[#112240] rounded-xl shadow-lg p-6 max-w-2xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-[#64ffda]">EDIT_PROFILE</h2>
              <button 
                onClick={() => setEditMode(false)}
                className="text-gray-400 hover:text-white"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium">Display Name</label>
                <input
                  name="displayName"
                  value={formData.displayName}
                  onChange={handleChange}
                  className="w-full bg-[#0a192f] border border-[#1e2a47] rounded-lg p-3 focus:ring-2 focus:ring-[#64ffda] focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium">Bio</label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  rows={4}
                  className="w-full bg-[#0a192f] border border-[#1e2a47] rounded-lg p-3 focus:ring-2 focus:ring-[#64ffda] focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full bg-[#0a192f] border border-[#1e2a47] rounded-lg p-3 focus:ring-2 focus:ring-[#64ffda] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setEditMode(false)}
                  className="px-6 py-2 border border-[#64ffda] text-[#64ffda] rounded-lg hover:bg-[#64ffda]/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#64ffda] text-[#0a192f] rounded-lg hover:bg-[#52d3b8] transition-colors flex items-center gap-2"
                >
                  <CheckIcon className="h-5 w-5" />
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Personal Info Card */}
            <div className="bg-[#112240] rounded-xl shadow-lg p-6">
              <div className="flex items-center gap-4 mb-6">
                <UserCircleIcon className="h-10 w-10 text-[#64ffda]" />
                <h2 className="text-2xl font-bold text-[#64ffda]">PERSONAL_INFO</h2>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between border-b border-[#1e2a47] pb-2">
                  <span className="text-gray-400">Username:</span>
                  <span>{user.username}</span>
                </div>
                <div className="flex justify-between border-b border-[#1e2a47] pb-2">
                  <span className="text-gray-400">Email:</span>
                  <span>{user.email}</span>
                </div>
                <div className="flex justify-between border-b border-[#1e2a47] pb-2">
                  <span className="text-gray-400">Display Name:</span>
                  <span>{user.displayName || 'Not set'}</span>
                </div>
                <div className="border-b border-[#1e2a47] pb-2">
                  <p className="text-gray-400 mb-1">Bio:</p>
                  <p>{user.bio || 'No bio provided'}</p>
                </div>
              </div>
            </div>

            {/* Stats Card */}
            <div className="bg-[#112240] rounded-xl shadow-lg p-6">
              <div className="flex items-center gap-4 mb-6">
                <TrophyIcon className="h-10 w-10 text-[#64ffda]" />
                <h2 className="text-2xl font-bold text-[#64ffda]">USER_STATS</h2>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between border-b border-[#1e2a47] pb-2">
                  <span className="text-gray-400">Points:</span>
                  <span className="text-[#64ffda]">{user.points || 0}</span>
                </div>
                <div className="flex justify-between border-b border-[#1e2a47] pb-2">
                  <span className="text-gray-400">Challenges Solved:</span>
                  <span>{user.solvedChallenges?.length || 0}</span>
                </div>
                <div className="flex justify-between border-b border-[#1e2a47] pb-2">
                  <span className="text-gray-400">Member Since:</span>
                  <span>{new Date(user.createdAt).toLocaleDateString()}</span>
                </div>
                {user.isAdmin && (
                  <div className="flex items-center gap-2 text-[#64ffda] pt-2">
                    <ShieldCheckIcon className="h-5 w-5" />
                    <span>Administrator</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}