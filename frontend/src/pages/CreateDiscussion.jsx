import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { PencilIcon, XMarkIcon } from '@heroicons/react/24/outline';

export default function CreateDiscussion() {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    tags: []
  });
  const [newTag, setNewTag] = useState('');
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [suggestedTags, setSuggestedTags] = useState([]);
  const navigate = useNavigate();

  // Load popular tags and draft
  useEffect(() => {
    const fetchPopularTags = async () => {
      try {
        const { data } = await api.get('/api/discussions/tags/popular');
        setSuggestedTags(data);
      } catch (err) {
        console.error('Failed to fetch tags', err);
      }
    };
    fetchPopularTags();

    const draft = localStorage.getItem('discussionDraft');
    if (draft) {
      setFormData(JSON.parse(draft));
    }
  }, []);

  // Save draft when form changes
  useEffect(() => {
    if (formData.title || formData.content || formData.tags.length > 0) {
      localStorage.setItem('discussionDraft', JSON.stringify(formData));
    }
  }, [formData]);

  const handleAddTag = () => {
    const trimmedTag = newTag.trim().toLowerCase();
    
    if (!trimmedTag) return;
    
    if (!/^[a-z0-9_-]+$/i.test(trimmedTag)) {
      setError('Tags can only contain letters, numbers, hyphens and underscores');
      return;
    }
    
    if (formData.tags.length >= 5) {
      setError('Maximum 5 tags allowed');
      return;
    }
    
    if (!formData.tags.includes(trimmedTag)) {
      setFormData({
        ...formData,
        tags: [...formData.tags, trimmedTag]
      });
      setNewTag('');
      setError(null);
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic frontend validation
    if (formData.title.length < 5) {
      setError('Title must be at least 5 characters');
      return;
    }
    if (formData.content.length < 10) {
      setError('Content must be at least 10 characters');
      return;
    }
  
    setIsSubmitting(true);
    setError(null);
  
    try {
      // Debug the payload before sending
      console.log('Submitting payload:', {
        title: formData.title,
        content: formData.content,
        tags: formData.tags
      });
  
      const response = await api.post('/api/discussions', {
        title: formData.title,
        content: formData.content,
        tags: formData.tags
      });
  
      localStorage.removeItem('discussionDraft');
      navigate(`/discussions/${response.data.data._id}`, { 
        state: { refresh: true } 
      });
  
    } catch (err) {
      console.error('Full error response:', err.response);
      
      // Handle different error cases
      if (err.response?.data?.details) {
        // Backend validation errors
        const errors = err.response.data.details.map(e => e.msg);
        setError(errors.join(', '));
      } else if (err.response?.data?.message) {
        // Other backend errors
        setError(err.response.data.message);
      } else {
        // Network/other errors
        setError('Failed to create discussion. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <div className="min-h-screen bg-[#0a192f] text-[#ccd6f6] py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link 
            to="/discussions" 
            className="text-[#64ffda] hover:underline"
          >
            &larr; Back to discussions
          </Link>
        </div>

        <h1 className="text-2xl font-bold text-[#64ffda] mb-6">Create New Discussion</h1>
        
        {error && (
          <div className="mb-6 p-4 bg-red-900/30 border border-red-700 rounded-lg text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-[#112240] rounded-xl shadow-lg p-6">
          <div className="mb-6">
            <label htmlFor="title" className="block text-sm font-medium mb-2">
              Title <span className="text-gray-400 text-xs">({formData.title.length}/200)</span>
            </label>
            <input
              type="text"
              id="title"
              className="w-full bg-[#0a192f] border border-[#1e2a47] rounded-lg p-3 focus:ring-2 focus:ring-[#64ffda] focus:outline-none"
              placeholder="What's your question or topic?"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              maxLength="200"
              required
            />
          </div>
          
          <div className="mb-6">
            <label htmlFor="content" className="block text-sm font-medium mb-2">
              Details <span className="text-gray-400 text-xs">({formData.content.length}/5000)</span>
            </label>
            <textarea
              id="content"
              rows="8"
              className="w-full bg-[#0a192f] border border-[#1e2a47] rounded-lg p-3 focus:ring-2 focus:ring-[#64ffda] focus:outline-none"
              placeholder="Provide more details about your discussion..."
              value={formData.content}
              onChange={(e) => setFormData({...formData, content: e.target.value})}
              maxLength="5000"
              required
            ></textarea>
          </div>
          
          <div className="mb-6">
            <label htmlFor="tags" className="block text-sm font-medium mb-2">
              Tags <span className="text-gray-400 text-xs">({formData.tags.length}/5)</span>
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                id="tags"
                className="flex-grow bg-[#0a192f] border border-[#1e2a47] rounded-lg p-3 focus:ring-2 focus:ring-[#64ffda] focus:outline-none"
                placeholder="Add tags (e.g. javascript, react)"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-4 py-2 bg-[#64ffda] text-[#0a192f] rounded-lg hover:bg-[#52d3b8] transition-colors"
              >
                Add
              </button>
            </div>
            
            {suggestedTags.length > 0 && newTag && (
              <div className="mt-1 bg-[#0a192f] border border-[#1e2a47] rounded-lg p-2">
                {suggestedTags
                  .filter(tag => 
                    tag.includes(newTag.toLowerCase()) && 
                    !formData.tags.includes(tag)
                  )
                  .slice(0, 5)
                  .map(tag => (
                    <div 
                      key={tag}
                      className="p-1 hover:bg-[#1e2a47] cursor-pointer rounded"
                      onClick={() => {
                        setNewTag(tag);
                        handleAddTag();
                      }}
                    >
                      {tag}
                    </div>
                  ))}
              </div>
            )}
            
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.tags.map(tag => (
                <div key={tag} className="flex items-center gap-1 px-3 py-1 bg-[#0a192f] rounded-full text-[#64ffda]">
                  <span>{tag}</span>
                  <button 
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="text-gray-400 hover:text-red-400"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2 bg-[#64ffda] text-[#0a192f] rounded-lg hover:bg-[#52d3b8] transition-colors disabled:opacity-50"
            >
              <PencilIcon className="h-5 w-5" />
              {isSubmitting ? 'Posting...' : 'Post Discussion'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}