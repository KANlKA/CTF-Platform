import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api';
import {
  ArrowUpIcon,
  ArrowDownIcon,
  ChatBubbleLeftIcon,
  CheckIcon,
  PencilIcon,
  TrashIcon,
  UserCircleIcon,
  ArrowUturnLeftIcon
} from '@heroicons/react/24/outline';
import { formatDistanceToNow, parseISO } from 'date-fns';

export default function Discussion() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [discussion, setDiscussion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [commentContent, setCommentContent] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingComment, setEditingComment] = useState(null);
  const [userId, setUserId] = useState(null); // Add userId state

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) setUserId(user.id);

    const fetchDiscussion = async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/api/discussions/${id}`);
        setDiscussion(data.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Discussion not found');
      } finally {
        setLoading(false);
      }
    };

    fetchDiscussion();
  }, [id]);

  const handleVote = async (itemId, type, isDiscussion = true) => {
    try {
      const endpoint = isDiscussion
        ? `/api/discussions/${itemId}/vote`
        : `/api/comments/${itemId}/vote`;

      await api.post(endpoint, { type });

      // Refresh the discussion to show updated votes
      const { data: updatedDiscussion } = await api.get(`/api/discussions/${id}`);
      setDiscussion(updatedDiscussion.data);
    } catch (err) {
      console.error('Vote error:', err);
      setError(err.response?.data?.message || 'Failed to process vote');
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();

    if (!userId) {
      navigate('/login');
      return;
    }

    if (!commentContent.trim()) {
      setError('Comment cannot be empty');
      return;
    }

    try {
      const { data } = await api.post(`/api/discussions/${id}/comments`, {
        content: commentContent,
        parentComment: replyingTo || undefined
      });

      // Refresh the discussion to show the new comment
      const { data: updatedDiscussion } = await api.get(`/api/discussions/${id}`);
      setDiscussion(updatedDiscussion.data);

      // Reset form
      setCommentContent('');
      setReplyingTo(null);
      setError(null);
    } catch (err) {
      console.error('Comment error:', err.response?.data);
      setError(
        err.response?.data?.message ||
        'Failed to post comment'
      );
    }
  };

  const handleCommentUpdate = async (commentId, content) => {
    if (!content.trim()) {
      setError('Comment cannot be empty');
      return;
    }

    try {
      await api.put(`/api/comments/${commentId}`, {
        content: content
      });

      // Refresh the discussion to show the updated comment
      const { data: updatedDiscussion } = await api.get(`/api/discussions/${id}`);
      setDiscussion(updatedDiscussion.data);
      setEditingComment(null);
      setError(null);
    } catch (err) {
      console.error('Update error:', err.response?.data);
      setError(
        err.response?.data?.message ||
        err.response?.data?.errors?.map(e => e.msg).join(', ') ||
        'Failed to update comment'
      );
    }
  };

  const handleCommentDelete = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;

    try {
      await api.delete(`/api/comments/${commentId}`);

      // Refresh the discussion to remove the deleted comment
      const { data: updatedDiscussion } = await api.get(`/api/discussions/${id}`);
      setDiscussion(updatedDiscussion.data);
      setError(null);
    } catch (err) {
      console.error('Delete error:', err.response?.data);
      setError(
        err.response?.data?.message ||
        'Failed to delete comment'
      );
    }
  };

  const handleMarkAsSolution = async (commentId) => {
    try {
      const { data } = await api.post(`/api/discussions/${id}/solution`, { commentId });
      setDiscussion(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to mark as solution');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a192f] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#64ffda]"></div>
      </div>
    );
  }

  if (!discussion) {
    return (
      <div className="min-h-screen bg-[#0a192f] flex items-center justify-center">
        <div className="text-red-400">Discussion not found</div>
      </div>
    );
  }

  // Improve the formatDate function
const formatDate = (dateString) => {
  try {
    if (!dateString) return 'some time ago';
    
    // Handle both ISO strings and existing Date objects
    const date = typeof dateString === 'string' 
      ? new Date(dateString) 
      : dateString;
    
    if (isNaN(date.getTime())) {
      console.warn('Invalid date:', dateString);
      return 'some time ago';
    }
    
    return formatDistanceToNow(date, { addSuffix: true });
  } catch (error) {
    console.error('Date formatting error:', error);
    return 'some time ago';
  }
};

// Add error boundary for the discussion data
if (!discussion || typeof discussion !== 'object') {
  return (
    <div className="min-h-screen bg-[#0a192f] flex items-center justify-center">
      <div className="text-red-400">
        Discussion data is invalid or not loaded properly
      </div>
    </div>
  );
}
  return (
    <div className="min-h-screen bg-[#0a192f] text-[#ccd6f6] py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link
            to="/discussions"
            className="text-[#64ffda] hover:underline"
          >
            <ArrowUturnLeftIcon className="h-5 w-5 inline mr-1" />
            Back to discussions
          </Link>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-900/30 border border-red-700 rounded-lg text-red-300">
            {error}
          </div>
        )}

        {/* Discussion */}
        <div className="bg-[#112240] rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            {discussion.tags?.map(tag => (
              <span
                key={tag}
                className="px-2 py-1 text-xs bg-[#0a192f] rounded-full text-[#64ffda]"
              >
                {tag}
              </span>
            ))}
          </div>

          <h1 className="text-2xl font-bold mb-4">{discussion.title}</h1>

          <div className="prose prose-invert max-w-none mb-6">
            {discussion.content}
          </div>

          <div className="flex items-center justify-between mt-6 pt-4 border-t border-[#1e2a47]">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleVote(discussion._id, 'upvote')}
                  className={`p-1 rounded ${discussion.upvotes?.includes(userId) ? 'text-green-400' : 'hover:text-[#64ffda]'}`}
                >
                  <ArrowUpIcon className="h-5 w-5" />
                </button>
                <span>{discussion.upvotes?.length - discussion.downvotes?.length || 0}</span>
                <button
                  onClick={() => handleVote(discussion._id, 'downvote')}
                  className={`p-1 rounded ${discussion.downvotes?.includes(userId) ? 'text-red-400' : 'hover:text-[#64ffda]'}`}
                >
                  <ArrowDownIcon className="h-5 w-5" />
                </button>
              </div>

              <div className="flex items-center gap-1 text-gray-400">
                <ChatBubbleLeftIcon className="h-5 w-5" />
                <span>{discussion.comments?.length || 0} comments</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
            <Link
  to={`/profile/${discussion.author?.username}`}
  className="flex items-center gap-2 hover:text-[#64ffda] transition-colors"
>
  <div className="relative w-8 h-8 flex-shrink-0">
    {discussion.author?.avatar ? (
      <img
        src={discussion.author.avatar}
        alt={discussion.author.displayName || discussion.author.username || 'User'}
        className="w-full h-full rounded-full object-cover"
        onError={(e) => {
          e.target.style.display = 'none';
          e.target.nextElementSibling.style.display = 'block';
        }}
      />
    ) : null}
    <div className={`w-full h-full rounded-full bg-[#1e2a47] flex items-center justify-center ${discussion.author?.avatar ? 'hidden' : ''}`}>
      <UserCircleIcon className="h-6 w-6 text-[#64ffda]" />
    </div>
  </div>
  <span>{discussion.author?.displayName || discussion.author?.username || 'Anonymous'}</span>
</Link>

              <span className="text-gray-400 text-sm">
                {formatDate(discussion.createdAt)}
              </span>
            </div>
          </div>
        </div>

        {/* Comments */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-[#64ffda] mb-4">
            {discussion.comments?.length || 0} Comments
          </h2>

          {/* Comment Form */}
          <div className="bg-[#112240] rounded-xl shadow-lg p-6">
            <form onSubmit={handleCommentSubmit}>
              <div className="mb-4">
                <label htmlFor="comment" className="block text-sm font-medium mb-2">
                  {replyingTo ? 'Reply to comment' : 'Add a comment'}
                </label>
                <textarea
                  id="comment"
                  rows="4"
                  className="w-full bg-[#0a192f] border border-[#1e2a47] rounded-lg p-3 focus:ring-2 focus:ring-[#64ffda] focus:outline-none"
                  placeholder="Write your comment here..."
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                  required
                ></textarea>
              </div>
              <div className="flex justify-end gap-2">
                {replyingTo && (
                  <button
                    type="button"
                    onClick={() => setReplyingTo(null)}
                    className="px-4 py-2 text-gray-400 hover:text-white"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#64ffda] text-[#0a192f] rounded-lg hover:bg-[#52d3b8] transition-colors"
                >
                  Post Comment
                </button>
              </div>
            </form>
          </div>

          {/* Comments List */}
          {discussion.comments?.filter(c => !c.parentComment).map(comment => (
            <CommentItem
              key={comment._id}
              comment={comment}
              discussion={discussion}
              onReply={setReplyingTo}
              onEdit={setEditingComment}
              onUpdate={handleCommentUpdate}
              onDelete={handleCommentDelete}
              onMarkAsSolution={handleMarkAsSolution}
              isAuthor={discussion.author._id === userId}
              replies={discussion.comments?.filter(c => c.parentComment === comment._id)}
              handleVote={handleVote}
              userId={userId}
              formatDate={formatDate}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function CommentItem({
  comment,
  discussion,
  onReply,
  onEdit,
  onUpdate,
  onDelete,
  onMarkAsSolution,
  isAuthor,
  replies,
  handleVote,
  userId,
  formatDate
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(comment.content);

  const handleUpdate = () => {
    onUpdate(comment._id, editedContent);
  };

  return (
    <div className="bg-[#112240] rounded-xl shadow-lg p-6 mb-4">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="relative w-8 h-8 flex-shrink-0">
            {comment.author?.avatar ? (
              <img
                src={comment.author.avatar}
                alt={comment.author.displayName || comment.author.username || 'User'}
                className="w-full h-full rounded-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                  const fallback = e.target.nextElementSibling;
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
            ) : null}
            <div 
              className={`w-full h-full rounded-full bg-[#1e2a47] items-center justify-center ${
                comment.author?.avatar ? 'hidden' : 'flex'
              }`}
            >
              <UserCircleIcon className="h-6 w-6 text-[#64ffda]" />
            </div>
          </div>
          <div>
            <p className="text-[#64ffda]">{comment.author?.displayName || comment.author?.username || 'Anonymous'}</p>
            <p className="text-sm text-[#8892b0]">{formatDate(comment.createdAt)}</p>
          </div>
        </div>
        
        {userId === comment.author?._id && !isEditing && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setIsEditing(true);
                setEditedContent(comment.content);
              }}
              className="text-[#ccd6f6] hover:text-[#64ffda]"
            >
              <PencilIcon className="h-5 w-5" />
            </button>
            <button
              onClick={() => onDelete(comment._id)}
              className="text-[#ccd6f6] hover:text-red-400"
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>

      {isEditing ? (
        <div className="mt-4">
          <textarea
            className="w-full bg-[#0a192f] border border-[#1e2a47] rounded-lg p-3 text-[#ccd6f6]"
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            rows="3"
          />
          <div className="flex justify-end gap-2 mt-2">
            <button
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 text-[#ccd6f6] hover:text-[#64ffda]"
            >
              Cancel
            </button>
            <button
              onClick={handleUpdate}
              className="px-4 py-2 bg-[#64ffda] text-[#0a192f] rounded-lg hover:bg-[#52d3b8]"
            >
              Update
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-4">
          <p className="text-[#ccd6f6]">{comment.content}</p>
          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleVote(comment._id, 'upvote', false)}
                className={`p-1 rounded ${comment.upvotes?.includes(userId) ? 'text-green-400' : 'text-[#ccd6f6] hover:text-[#64ffda]'}`}
              >
                <ArrowUpIcon className="h-5 w-5" />
              </button>
              <span className="text-[#ccd6f6]">{comment.upvotes?.length - comment.downvotes?.length || 0}</span>
              <button
                onClick={() => handleVote(comment._id, 'downvote', false)}
                className={`p-1 rounded ${comment.downvotes?.includes(userId) ? 'text-red-400' : 'text-[#ccd6f6] hover:text-[#64ffda]'}`}
              >
                <ArrowDownIcon className="h-5 w-5" />
              </button>
            </div>
            <button
              onClick={() => onReply(comment._id)}
              className="flex items-center gap-1 text-[#ccd6f6] hover:text-[#64ffda]"
            >
              <ChatBubbleLeftIcon className="h-5 w-5" />
              <span>Reply</span>
            </button>
            {isAuthor && !comment.isSolution && (
              <button
                onClick={() => onMarkAsSolution(comment._id)}
                className="flex items-center gap-1 text-[#ccd6f6] hover:text-green-400"
              >
                <CheckIcon className="h-5 w-5" />
                <span>Mark as solution</span>
              </button>
            )}
          </div>
        </div>
      )}

      {replies?.length > 0 && (
        <div className="mt-4 pl-6 border-l-2 border-[#1e2a47]">
          {replies.map(reply => (
            <CommentItem
              key={reply._id}
              comment={reply}
              discussion={discussion}
              onReply={onReply}
              onEdit={onEdit}
              onUpdate={onUpdate}
              onDelete={onDelete}
              onMarkAsSolution={onMarkAsSolution}
              isAuthor={isAuthor}
              replies={[]}
              handleVote={handleVote}
              userId={userId}
              formatDate={formatDate}
            />
          ))}
        </div>
      )}
    </div>
  );
}