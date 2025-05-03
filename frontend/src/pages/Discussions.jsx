import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import api from '../api';
import { 
  PencilIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ChatBubbleLeftRightIcon,
  BookmarkIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
  UserCircleIcon,
  TrashIcon,
  EllipsisVerticalIcon
} from '@heroicons/react/24/outline';

export default function Discussions({ user }) {
  const [discussions, setDiscussions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [availableTags, setAvailableTags] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();

  const userId = user?.id || JSON.parse(localStorage.getItem('user'))?.id;

  // Handle refresh after creating a discussion
  useEffect(() => {
    if (location.state?.refresh) {
      fetchDiscussions();
      // Clear the refresh state
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location]);

  const fetchDiscussions = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/discussions', {
        params: {
          page,
          search: searchTerm,
          tag: selectedTag,
          sort: sortBy === 'newest' ? '-createdAt' : '-upvotes'
        }
      });

      // Validate and normalize discussion data
      const discussionsData = Array.isArray(response.data?.data) 
        ? response.data.data.map(d => ({
            ...d,
            _id: d._id || Math.random().toString(36).substring(2, 9),
            author: {
              ...(d.author || { 
                username: 'unknown', 
                displayName: 'Unknown User',
                avatar: null 
              }),
              // Ensure avatar URL is properly constructed
              avatar: d.author?.avatar 
                ? d.author.avatar.startsWith('http') 
                  ? d.author.avatar 
                  : `/avatars/${d.author.avatar}`
                : null
            },
            title: d.title || 'Untitled Discussion',
            content: d.content || '',
            tags: Array.isArray(d.tags) ? d.tags : [],
            upvotes: Array.isArray(d.upvotes) ? d.upvotes : [],
            downvotes: Array.isArray(d.downvotes) ? d.downvotes : [],
            comments: Array.isArray(d.comments) ? d.comments : [],
            createdAt: d.createdAt || new Date().toISOString()
          }))
        : [];

      setDiscussions(discussionsData);
      setTotalPages(response.data?.pagination?.totalPages || 1);
      setError(null);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(
        err.response?.data?.message || 
        err.message || 
        'Failed to load discussions'
      );
      setDiscussions([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableTags = async () => {
    try {
      const { data } = await api.get('/api/discussions/tags/popular');
      setAvailableTags(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch tags:', err);
      setAvailableTags([]);
    }
  };

  const handleVote = async (discussionId, type) => {
    if (!userId) {
      navigate('/login');
      return;
    }

    try {
      await api.post(`/api/discussions/${discussionId}/vote`, { type });
      fetchDiscussions(); // Refresh the list after voting
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to process vote');
    }
  };

  const handleDelete = async (discussionId) => {
    if (!window.confirm('Are you sure you want to delete this discussion?')) return;
  
    try {
      await api.delete(`/api/discussions/${discussionId}`);
      setDiscussions(prev => prev.filter(d => d._id !== discussionId));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete discussion');
    }
  };

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [searchTerm, selectedTag, sortBy]);

  // Fetch data when dependencies change
  useEffect(() => {
    fetchDiscussions();
    fetchAvailableTags();
  }, [page, searchTerm, selectedTag, sortBy]);

  const formatDate = (dateString) => {
    if (!dateString) return 'some time ago';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return 'some time ago';
    }
  };

  return (
    <div className="min-h-screen bg-[#0a192f] text-[#ccd6f6] py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <h1 className="text-2xl font-bold text-[#64ffda]">
            Community Discussions
          </h1>
          <Link
            to="/discussions/new"
            className="flex items-center gap-2 px-4 py-2 bg-[#112240] hover:bg-[#1e2a47] rounded-lg transition-colors"
          >
            <PencilIcon className="h-5 w-5" />
            <span>New Discussion</span>
          </Link>
        </div>

        {/* Search and Filter */}
        <div className="mb-6 bg-[#112240] rounded-lg p-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search discussions..."
                className="w-full pl-10 pr-4 py-2 bg-[#0a192f] border border-[#1e2a47] rounded-lg focus:ring-2 focus:ring-[#64ffda] focus:outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex gap-2">
              <div className="relative">
                <select
                  className="pl-10 pr-4 py-2 bg-[#0a192f] border border-[#1e2a47] rounded-lg focus:ring-2 focus:ring-[#64ffda] focus:outline-none"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="newest">Newest</option>
                  <option value="popular">Most Popular</option>
                </select>
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FunnelIcon className="h-5 w-5 text-gray-400" />
                </div>
              </div>
              
              <div className="relative">
                <select
                  className="pl-4 pr-8 py-2 bg-[#0a192f] border border-[#1e2a47] rounded-lg focus:ring-2 focus:ring-[#64ffda] focus:outline-none"
                  value={selectedTag}
                  onChange={(e) => setSelectedTag(e.target.value)}
                >
                  <option value="">All Tags</option>
                  {availableTags.map(tag => (
                    <option key={tag} value={tag}>{tag}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-3 bg-red-900/30 border border-red-700 rounded-lg text-red-300">
            {error}
            <button 
              onClick={fetchDiscussions}
              className="ml-2 text-red-200 hover:text-white"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#64ffda]"></div>
          </div>
        )}

        {/* Discussions List */}
        {!loading && discussions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg">No discussions found</p>
            <p className="text-gray-400 mt-2">
              {searchTerm || selectedTag ? 'Try different search criteria' : 'Start the conversation!'}
            </p>
            <Link
              to="/discussions/new"
              className="mt-4 inline-flex items-center px-4 py-2 bg-[#64ffda] text-[#0a192f] rounded-lg hover:bg-[#52d3b8]"
            >
              <PencilIcon className="h-5 w-5 mr-2" />
              Create Discussion
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {discussions.map(discussion => (
              <div key={discussion._id} className="bg-[#112240] rounded-lg shadow-md p-5 hover:shadow-[#64ffda]/10 transition-all">
                {/* Discussion Header */}
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2">
                      {discussion.author?.avatar ? (
                        <img 
                          src={discussion.author.avatar} 
                          alt={discussion.author.displayName || discussion.author.username} 
                          className="w-8 h-8 rounded-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '';
                            e.target.outerHTML = `
                              <div class="w-8 h-8 rounded-full bg-[#1e2a47] flex items-center justify-center">
                                <svg class="h-5 w-5 text-[#64ffda]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                              </div>
                            `;
                          }}
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-[#1e2a47] flex items-center justify-center">
                          <UserCircleIcon className="h-5 w-5 text-[#64ffda]" />
                        </div>
                      )}
                      <span className="font-medium text-[#ccd6f6]">
                        {discussion.author?.displayName || discussion.author?.username || 'Unknown User'}
                      </span>
                    </div>
                    <span className="text-gray-400 text-sm">
                      {formatDate(discussion.createdAt)}
                    </span>
                  </div>
                  
                  {/* Edit/Delete dropdown for author */}
                  {userId === discussion.author?._id && (
                    <div className="relative group">
                      <button className="text-gray-400 hover:text-[#64ffda] p-1">
                        <EllipsisVerticalIcon className="h-5 w-5" />
                      </button>
                      <div className="absolute right-0 mt-1 w-40 bg-[#0a192f] border border-[#1e2a47] rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        <Link
                          to={`/discussions/${discussion._id}/edit`}
                          className="flex items-center gap-2 px-3 py-2 hover:bg-[#1e2a47] rounded-t-lg"
                        >
                          <PencilIcon className="h-4 w-4" />
                          <span>Edit</span>
                        </Link>
                        <button
                          onClick={() => handleDelete(discussion._id)}
                          className="flex items-center gap-2 px-3 py-2 text-red-400 hover:bg-[#1e2a47] w-full rounded-b-lg"
                        >
                          <TrashIcon className="h-4 w-4" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Discussion Content */}
                <Link to={`/discussions/${discussion._id}`} className="block group">
                  <h2 className="text-xl font-bold group-hover:text-[#64ffda] transition-colors mb-2">
                    {discussion.title}
                  </h2>
                  <p className="text-gray-300 line-clamp-3 mb-3">
                    {discussion.content}
                  </p>
                </Link>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {discussion.tags?.map(tag => (
                    <span 
                      key={tag} 
                      onClick={() => setSelectedTag(tag)}
                      className="px-2 py-1 text-xs bg-[#0a192f] rounded-full text-[#64ffda] cursor-pointer hover:bg-[#64ffda] hover:text-[#0a192f] transition-colors"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Discussion Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-[#1e2a47]">
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => handleVote(discussion._id, discussion.upvotes?.includes(userId) ? 'remove' : 'upvote')}
                      className={`flex items-center gap-1 ${discussion.upvotes?.includes(userId) ? 'text-green-400' : 'text-gray-400 hover:text-[#64ffda]'}`}
                    >
                      <ArrowUpIcon className="h-5 w-5" />
                      <span>{discussion.upvotes?.length || 0}</span>
                    </button>
                    <button 
                      onClick={() => handleVote(discussion._id, discussion.downvotes?.includes(userId) ? 'remove' : 'downvote')}
                      className={`flex items-center gap-1 ${discussion.downvotes?.includes(userId) ? 'text-red-400' : 'text-gray-400 hover:text-[#64ffda]'}`}
                    >
                      <ArrowDownIcon className="h-5 w-5" />
                      <span>{discussion.downvotes?.length || 0}</span>
                    </button>
                  </div>
                  
                  <Link 
                    to={`/discussions/${discussion._id}`}
                    className="flex items-center gap-1 text-gray-400 hover:text-[#64ffda] transition-colors"
                  >
                    <ChatBubbleLeftRightIcon className="h-5 w-5" />
                    <span>{discussion.comments?.length || 0} comments</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-8">
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 bg-[#112240] rounded-lg disabled:opacity-50 hover:bg-[#1e2a47] transition-colors"
              >
                Previous
              </button>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = page <= 3 ? i + 1 : 
                              page >= totalPages - 2 ? totalPages - 4 + i : 
                              page - 2 + i;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`px-4 py-2 rounded-lg ${page === pageNum ? 'bg-[#64ffda] text-[#0a192f]' : 'bg-[#112240] hover:bg-[#1e2a47]'}`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 bg-[#112240] rounded-lg disabled:opacity-50 hover:bg-[#1e2a47] transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}