import React, { useState, useRef } from 'react';
import api from '../api';
import { XMarkIcon, PlusIcon, PaperClipIcon } from '@heroicons/react/24/outline';

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
    flag: '',
    hints: [{
      text: '',
      cost: 300
    }]
  });
  
  const [files, setFiles] = useState([]);
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };
  const handleHintChange = (index, field, value) => {
    const updatedHints = [...form.hints];
    updatedHints[index][field] = field === 'cost' ? parseInt(value) || 0 : value;
    setForm(prev => ({ ...prev, hints: updatedHints }));
  };
  const validateForm = () => {
    const newErrors = {};
    if (form.title.length < 5) newErrors.title = 'Title too short (min 5 chars)';
    if (form.description.length < 20) newErrors.description = 'Description too short (min 20 chars)';
    if (form.flag.length < 3) newErrors.flag = 'Flag too short (min 3 chars)';
    return newErrors;
  };

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files);
    setFiles(prev => {
      const existing = new Set(prev.map(f => f.name + f.size));
      return [...prev, ...selected.filter(f => !existing.has(f.name + f.size))];
    });
    e.target.value = '';
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
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
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('description', form.description);
      formData.append('category', form.category);
      formData.append('difficulty', form.difficulty);
      formData.append('flag', form.flag);
      formData.append('hints', JSON.stringify(form.hints));
      files.forEach(f => formData.append('files', f));

      await api.post('/api/challenges', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setMessage('Challenge created successfully!');
      setForm({ title: '', description: '', category: 'web', difficulty: 'easy', flag: '', hints: [] });
      setFiles([]);
      setErrors({});
    } catch (err) {
      setMessage(err.response?.data?.message || 'Challenge creation failed.');
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
            {/* File Attachments */}
            <div className="space-y-2">
              <label className="block text-gray-300 font-medium">Attachments</label>
              <div
                className="border-2 border-dashed border-[#1e2a47] rounded-lg p-4 text-center cursor-pointer hover:border-[#64ffda] transition-colors"
                onClick={() => fileInputRef.current.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const dropped = Array.from(e.dataTransfer.files);
                  setFiles(prev => {
                    const existing = new Set(prev.map(f => f.name + f.size));
                    return [...prev, ...dropped.filter(f => !existing.has(f.name + f.size))];
                  });
                }}
              >
                <PaperClipIcon className="h-6 w-6 mx-auto mb-1 text-gray-400" />
                <p className="text-gray-400 text-sm">Drop files here or <span className="text-[#64ffda]">browse</span></p>
                <p className="text-gray-500 text-xs mt-1">ZIP, binaries, images, PDFs — up to 50 MB each</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleFileChange}
              />
              {files.length > 0 && (
                <ul className="space-y-1 mt-2">
                  {files.map((f, i) => (
                    <li key={i} className="flex items-center justify-between bg-[#0a192f] border border-[#1e2a47] rounded px-3 py-2 text-sm">
                      <span className="text-gray-300 truncate max-w-[75%]">{f.name}</span>
                      <span className="flex items-center gap-3">
                        <span className="text-gray-500 text-xs">{(f.size / 1024).toFixed(1)} KB</span>
                        <button type="button" onClick={() => removeFile(i)} className="text-red-400 hover:text-red-300">
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="space-y-4">
  <h3 className="text-lg font-medium text-gray-300">Hints</h3>
  {form.hints.map((hint, index) => (
    <div key={index} className="bg-[#0a192f]/50 p-3 rounded-lg border border-[#1e2a47]">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-2">
        <div className="md:col-span-2">
          <label className="block text-sm text-gray-400 mb-1">Hint Text</label>
          <input
            value={hint.text}
            onChange={(e) => handleHintChange(index, 'text', e.target.value)}
            className="w-full bg-[#0a192f] border border-[#1e2a47] p-2 rounded"
            placeholder="Provide a helpful hint"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Point Cost</label>
          <input
            type="number"
            value={hint.cost}
            onChange={(e) => handleHintChange(index, 'cost', e.target.value)}
            className="w-full bg-[#0a192f] border border-[#1e2a47] p-2 rounded"
            min="10"
            max="500"
          />
        </div>
      </div>
      <div className="flex justify-end space-x-2">
        {form.hints.length > 1 && (
          <button
            type="button"
            onClick={() => {
              const updatedHints = [...form.hints];
              updatedHints.splice(index, 1);
              setForm(prev => ({ ...prev, hints: updatedHints }));
            }}
            className="text-xs bg-red-900/30 text-red-400 px-2 py-1 rounded hover:bg-red-900/50"
          >
            Remove
          </button>
        )}
      </div>
    </div>
  ))}
  <button
    type="button"
    onClick={() => setForm(prev => ({
      ...prev,
      hints: [...prev.hints, { text: '', cost: 50 }]
    }))}
    className="text-sm bg-[#1e2a47] text-[#64ffda] px-3 py-1 rounded hover:bg-[#64ffda]/10 flex items-center"
  >
    <PlusIcon className="h-4 w-4 mr-1" />
    Add Another Hint
  </button>
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