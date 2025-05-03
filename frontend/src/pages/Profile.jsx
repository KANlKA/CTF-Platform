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
  ShieldCheckIcon,
  CameraIcon,
  LinkIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';
import { FaGithub, FaTwitter } from 'react-icons/fa';

export default function Profile({ onLogout }) {
  const [user, setUser] = useState({
    displayName: '',
    bio: '',
    email: '',
    username: '',
    avatar: null,
    socialLinks: {
      github: '',
      twitter: '',
      website: ''
    },
    points: 0,
    solvedChallenges: [],
    rank: null,
    isAdmin: false,
    createdAt: new Date()
  });
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    displayName: '',
    bio: '',
    email: '',
    socialLinks: {
      github: '',
      twitter: '',
      website: ''
    }
  });
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [avatarFile, setAvatarFile] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Update your fetchProfile function
const fetchProfile = async () => {
  try {
    setIsLoading(true);
    const { data } = await api.get('/api/profile');
    
    if (!data) {
      throw new Error('No data received');
    }

    setUser(prev => ({
      ...prev,
      ...data,
      socialLinks: {
        github: data.socialLinks?.github || '',
        twitter: data.socialLinks?.twitter || '',
        website: data.socialLinks?.website || ''
      }
    }));
    
    setFormData({
      displayName: data.displayName || '',
      bio: data.bio || '',
      email: data.email || '',
      socialLinks: {
        github: data.socialLinks?.github || '',
        twitter: data.socialLinks?.twitter || '',
        website: data.socialLinks?.website || ''
      }
    });
  } catch (err) {
    console.error('Profile fetch error:', err);
    setError(err.response?.data?.message || err.message || 'Failed to load profile');
    if (err.response?.status === 401) {
      navigate('/login');
    }
  } finally {
    setIsLoading(false);
  }
};
    fetchProfile();
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('socialLinks.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        socialLinks: {
          ...prev.socialLinks,
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setAvatarFile(file);

    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const { data } = await api.post('/api/user/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setUser(prev => ({ 
        ...prev, 
        avatar: data.avatarUrl.split('/').pop() 
      }));
      setError(null);
    } catch (err) {
      console.error('Avatar upload failed', err);
      setError(err.response?.data?.message || 'Avatar upload failed');
      setAvatarFile(null);
    }
  };

  const removeAvatar = async () => {
    try {
      await api.delete('/api/user/avatar');
      setUser(prev => ({ ...prev, avatar: null }));
      setAvatarFile(null);
      setError(null);
    } catch (err) {
      console.error('Failed to remove avatar', err);
      setError('Failed to remove avatar');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submissionData = {
        displayName: formData.displayName.trim(),
        bio: formData.bio.trim(),
        email: formData.email.trim(),
        socialLinks: {
          github: formData.socialLinks.github?.trim() || undefined,
          twitter: formData.socialLinks.twitter?.trim() || undefined,
          website: formData.socialLinks.website?.trim() || undefined
        }
      };
  
      const { data } = await api.put('/api/profile', submissionData, {
        headers: { 'Content-Type': 'application/json' }
      });
  
      setUser(prev => ({
        ...prev,
        ...data,
        socialLinks: {
          ...prev.socialLinks,
          ...data.socialLinks
        }
      }));
  
      setFormData(prev => ({
        ...prev,
        displayName: data.displayName || '',
        bio: data.bio || '',
        email: data.email || '',
        socialLinks: {
          github: data.socialLinks?.github || '',
          twitter: data.socialLinks?.twitter || '',
          website: data.socialLinks?.website || ''
        }
      }));
  
      setEditMode(false);
      setError(null);
    } catch (err) {
      console.error('Update error:', err);
      setError(err.response?.data?.message || 'Failed to update profile');
    }
  };

  // Replace your loading component with:
if (isLoading) {
  return (
    <div className="min-h-screen bg-[#0a192f] flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#64ffda] mb-4"></div>
        <p className="text-[#64ffda]">Loading your profile...</p>
      </div>
    </div>
  );
}

  if (!user || !user.email) {
    return (
      <div className="min-h-screen bg-[#0a192f] flex items-center justify-center">
        <div className="text-red-400">
          Failed to load profile data. 
          <button 
            onClick={() => window.location.reload()} 
            className="ml-2 text-[#64ffda] hover:underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

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
              <div className="flex flex-col items-center">
                <div className="relative group mb-4">
                  <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-[#64ffda]">
                    {avatarFile ? (
                      <img 
                        src={URL.createObjectURL(avatarFile)} 
                        alt="Preview" 
                        className="w-full h-full object-cover"
                      />
                    ) : user.avatar ? (
                      <img 
                        src={`/avatars/${user.avatar}`} 
                        alt="User Avatar" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-[#1e2a47] flex items-center justify-center">
                        <UserCircleIcon className="h-16 w-16 text-[#64ffda]" />
                      </div>
                    )}
                  </div>
                  <label className="absolute bottom-0 right-0 bg-[#64ffda] text-[#0a192f] p-2 rounded-full cursor-pointer hover:bg-[#52d3b8] transition-colors">
                    <CameraIcon className="h-5 w-5" />
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleAvatarChange}
                      className="hidden" 
                    />
                  </label>
                </div>
                {(avatarFile || user.avatar) && (
                  <button
                    type="button"
                    onClick={removeAvatar}
                    className="mt-2 text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
                  >
                    <XMarkIcon className="h-3 w-3" />
                    Remove Avatar
                  </button>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium">Display Name</label>
                <input
                  name="displayName"
                  value={formData.displayName}
                  onChange={handleChange}
                  className="w-full bg-[#0a192f] border border-[#1e2a47] rounded-lg p-3 focus:ring-2 focus:ring-[#64ffda] focus:outline-none"
                  maxLength={50}
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
                  maxLength={200}
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

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-[#64ffda] flex items-center gap-2">
                  <LinkIcon className="h-5 w-5" />
                  Social Links
                </h3>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium flex items-center gap-2">
                    <FaGithub className="h-4 w-4" />
                    GitHub
                  </label>
                  <input
                    type="url"
                    name="socialLinks.github"
                    value={formData.socialLinks.github}
                    onChange={handleChange}
                    placeholder="https://github.com/username"
                    className="w-full bg-[#0a192f] border border-[#1e2a47] rounded-lg p-3 focus:ring-2 focus:ring-[#64ffda] focus:outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium flex items-center gap-2">
                    <FaTwitter className="h-4 w-4" />
                    Twitter
                  </label>
                  <input
                    type="url"
                    name="socialLinks.twitter"
                    value={formData.socialLinks.twitter}
                    onChange={handleChange}
                    placeholder="https://twitter.com/username"
                    className="w-full bg-[#0a192f] border border-[#1e2a47] rounded-lg p-3 focus:ring-2 focus:ring-[#64ffda] focus:outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium flex items-center gap-2">
                    <GlobeAltIcon className="h-4 w-4" />
                    Website
                  </label>
                  <input
                    type="url"
                    name="socialLinks.website"
                    value={formData.socialLinks.website}
                    onChange={handleChange}
                    placeholder="https://yourwebsite.com"
                    className="w-full bg-[#0a192f] border border-[#1e2a47] rounded-lg p-3 focus:ring-2 focus:ring-[#64ffda] focus:outline-none"
                  />
                </div>
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="bg-[#112240] rounded-xl shadow-lg p-6 lg:col-span-1">
              <div className="flex flex-col items-center">
                <div className="relative mb-4">
                  <div className="w-40 h-40 rounded-full overflow-hidden border-2 border-[#64ffda]">
                    {user.avatar ? (
                      // Replace the onError handler in the img tag with:
<img 
  src={`/avatars/${user.avatar}`} 
  alt="User Avatar" 
  className="w-full h-full object-cover"
  onError={(e) => {
    e.target.onerror = null;
    e.target.src = '';
    const parent = e.target.parentElement;
    if (parent) {
      parent.innerHTML = `
        <div class="w-full h-full bg-[#1e2a47] flex items-center justify-center">
          <svg class="h-20 w-20 text-[#64ffda]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
      `;
    }
  }}
/>
                    ) : (
                      <div className="w-full h-full bg-[#1e2a47] flex items-center justify-center">
                        <UserCircleIcon className="h-20 w-20 text-[#64ffda]" />
                      </div>
                    )}
                  </div>
                </div>
                
                <h2 className="text-2xl font-bold text-center">
                  {user.displayName || user.username}
                </h2>
                {user.bio && (
                  <p className="text-center mt-2 text-gray-300">{user.bio}</p>
                )}
                
                {(user.socialLinks?.github || user.socialLinks?.twitter || user.socialLinks?.website) && (
                  <div className="flex gap-4 mt-4">
                    {user.socialLinks.github && (
                      <a 
                        href={user.socialLinks.github.includes('://') 
                          ? user.socialLinks.github 
                          : `https://${user.socialLinks.github}`}
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-[#64ffda] transition-colors"
                        title="GitHub"
                      >
                        <FaGithub className="h-6 w-6" />
                      </a>
                    )}
                    {user.socialLinks?.twitter && (
                      <a 
                        href={user.socialLinks.twitter.includes('://') 
                          ? user.socialLinks.twitter 
                          : `https://${user.socialLinks.twitter}`}
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-[#64ffda] transition-colors"
                        title="Twitter"
                      >
                        <FaTwitter className="h-6 w-6" />
                      </a>
                    )}
                    {user.socialLinks?.website && (
                      <a 
                        href={user.socialLinks.website.includes('://') 
                          ? user.socialLinks.website 
                          : `https://${user.socialLinks.website}`}
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-[#64ffda] transition-colors"
                        title="Website"
                      >
                        <GlobeAltIcon className="h-6 w-6" />
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-2 space-y-8">
              <div className="bg-[#112240] rounded-xl shadow-lg p-6">
                <div className="flex items-center gap-4 mb-6">
                  <UserCircleIcon className="h-8 w-8 text-[#64ffda]" />
                  <h2 className="text-xl font-bold text-[#64ffda]">PERSONAL_INFO</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h3 className="text-gray-400 text-sm">Username</h3>
                    <p>{user?.username || 'Not set'}</p>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-gray-400 text-sm">Email</h3>
                    <p>{user?.email || 'Not set'}</p>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-gray-400 text-sm">Member Since</h3>
                    <p>{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</p>
                  </div>
                  {user?.isAdmin && (
                    <div className="space-y-2">
                      <h3 className="text-gray-400 text-sm">Role</h3>
                      <div className="flex items-center gap-2 text-[#64ffda]">
                        <ShieldCheckIcon className="h-5 w-5" />
                        <span>Administrator</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-[#112240] rounded-xl shadow-lg p-6">
                <div className="flex items-center gap-4 mb-6">
                  <TrophyIcon className="h-8 w-8 text-[#64ffda]" />
                  <h2 className="text-xl font-bold text-[#64ffda]">STATISTICS</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-[#0a192f] rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-[#64ffda]">
                      {user?.points || 0}
                    </div>
                    <div className="text-gray-400 text-sm mt-1">Points</div>
                  </div>
                  <div className="bg-[#0a192f] rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-[#64ffda]">
                      {user?.solvedChallenges?.length || 0}
                    </div>
                    <div className="text-gray-400 text-sm mt-1">Challenges Solved</div>
                  </div>
                  <div className="bg-[#0a192f] rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-[#64ffda]">
                      #{user?.rank || 'N/A'}
                    </div>
                    <div className="text-gray-400 text-sm mt-1">Leaderboard Rank</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}