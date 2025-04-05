import React, { useState } from 'react';
import api from '../api';
import { XMarkIcon } from '@heroicons/react/24/outline';

const categories = [
  'web', 'crypto', 'pwn', 'forensics', 
  'reversing', 'misc', 'osint', 'stego'
].map(cat => ({
  value: cat,
  label: cat.charAt(0).toUpperCase() + cat.slice(1)
}));

const difficultyOptions = [
  { value: 'easy', label: 'Easy (100 pts)' },
  { value: 'medium', label: 'Medium (200 pts)' },
  { value: 'hard', label: 'Hard (300 pts)' }
];

export default function CreateChallenge() {
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'web',
    difficulty: 'easy',
    flag: ''
  });
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (form.title.length < 5) newErrors.title = 'Title too short (min 5 chars)';
    if (form.description.length < 20) newErrors.description = 'Description too short (min 20 chars)';
    if (form.flag.length < 3) newErrors.flag = 'Flag too short (min 3 chars)';
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/api/challenges', form);
      setMessage('Challenge created successfully!');
      setForm({ 
        title: '', 
        description: '', 
        category: 'web', 
        difficulty: 'easy', 
        flag: '' 
      });
      setErrors({});
    } catch (err) {
      const errorMsg = err.response?.data?.message || 
                      err.response?.data?.errors?.join(', ') || 
                      'Error creating challenge';
      setMessage(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a192f] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#112240] rounded-xl shadow-2xl border border-[#1e2a47] hover:shadow-[0_0_20px_rgba(100,255,218,0.3)] transition-all duration-300 transform hover:-translate-y-1">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-6 text-[#64ffda] text-center border-b border-[#1e2a47] pb-3">
            CREATE_NEW_CHALLENGE
          </h2>
          
          {message && (
            <div className={`mb-4 p-3 rounded-lg border ${
              message.includes('success') 
                ? 'bg-green-900/30 border-green-700 text-green-300' 
                : 'bg-red-900/30 border-red-700 text-red-300'
            }`}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1">
              <label className="block text-gray-300 font-medium">Title*</label>
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                className="w-full bg-[#0a192f] border border-[#1e2a47] p-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#64ffda] text-gray-200"
                placeholder="Enter challenge title"
                required
                minLength={5}
              />
              {errors.title && (
                <p className="text-red-400 text-sm mt-1 flex items-center">
                  <XMarkIcon className="h-3 w-3 mr-1" />
                  {errors.title}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label className="block text-gray-300 font-medium">Description*</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                className="w-full bg-[#0a192f] border border-[#1e2a47] p-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#64ffda] min-h-[100px] text-gray-200"
                placeholder="Describe the challenge in detail..."
                required
                minLength={20}
              />
              <div className="flex justify-between text-xs">
                <span className={`${form.description.length < 20 ? 'text-gray-400' : 'text-green-400'}`}>
                  {form.description.length}/20 characters
                </span>
                {errors.description && (
                  <span className="text-red-400 flex items-center">
                    <XMarkIcon className="h-3 w-3 mr-1" />
                    {errors.description}
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-gray-300 font-medium">Category*</label>
                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  className="w-full bg-[#0a192f] border border-[#1e2a47] p-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#64ffda] text-gray-200 cursor-pointer"
                >
                  {categories.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-gray-300 font-medium">Difficulty*</label>
                <select
                  name="difficulty"
                  value={form.difficulty}
                  onChange={handleChange}
                  className="w-full bg-[#0a192f] border border-[#1e2a47] p-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#64ffda] text-gray-200 cursor-pointer"
                >
                  {difficultyOptions.map((diff) => (
                    <option key={diff.value} value={diff.value}>
                      {diff.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-gray-300 font-medium">Flag*</label>
              <input
                name="flag"
                value={form.flag}
                onChange={handleChange}
                className="w-full bg-[#0a192f] border border-[#1e2a47] p-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#64ffda] text-gray-200"
                placeholder="CTF{example_flag}"
                required
                minLength={3}
              />
              {errors.flag && (
                <p className="text-red-400 text-sm mt-1 flex items-center">
                  <XMarkIcon className="h-3 w-3 mr-1" />
                  {errors.flag}
                </p>
              )}
              <p className="text-xs text-gray-400 mt-1">
                This is the solution participants need to submit (minimum 3 characters)
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-2 px-4 rounded-lg font-bold transition-all ${
                isSubmitting
                  ? 'bg-[#64ffda]/70 cursor-not-allowed'
                  : 'bg-[#64ffda] hover:bg-[#52d3b8] hover:shadow-[0_0_10px_rgba(100,255,218,0.5)]'
              } text-[#0a192f] flex items-center justify-center`}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-[#0a192f]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating...
                </>
              ) : (
                'Create Challenge'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}