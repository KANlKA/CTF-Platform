import React from 'react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { KeyIcon } from '@heroicons/react/24/outline'
import api from '../api'

export default function Register() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      // 1. Register user
      await api.post('/api/register', {
        username: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password
      });
  
      // 2. Auto-login after registration
      const loginRes = await api.post('/api/login', {
        username: formData.username.trim(),
        password: formData.password
      });
  
      // 3. Store auth data
      localStorage.setItem('token', loginRes.data.token);
      localStorage.setItem('user', JSON.stringify(loginRes.data.user));
      
      // 4. REDIRECT TO HOME PAGE - ONLY THIS LINE CHANGED
      navigate('/', { replace: true });
      
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a192f] text-[#64ffda] p-8 font-mono">
      <div className="max-w-md mx-auto bg-[#112240] rounded-lg p-8 shadow-lg border border-[#1e2a47] hover:border-[#64ffda] transition-all">
        <div className="flex items-center justify-center mb-8">
          <KeyIcon className="h-8 w-8 mr-3" />
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#64ffda] to-[#48aff0]">
            Agent Activation
          </h1>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-900/30 text-red-400 rounded border border-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-gray-400 mb-2 text-sm">Codename</label>
            <input
              type="text"
              placeholder="Choose agent codename"
              className="w-full p-3 bg-[#0a192f] text-[#ccd6f6] rounded border border-[#1e2a47] focus:border-[#64ffda] focus:outline-none"
              value={formData.username}
              onChange={(e) => setFormData({...formData, username: e.target.value})}
              required
              minLength={3}
            />
          </div>
          
          <div>
            <label className="block text-gray-400 mb-2 text-sm">Secure Channel</label>
            <input
              type="email"
              placeholder="Enter secure comms address"
              className="w-full p-3 bg-[#0a192f] text-[#ccd6f6] rounded border border-[#1e2a47] focus:border-[#64ffda] focus:outline-none"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              required
            />
          </div>
          
          <div>
            <label className="block text-gray-400 mb-2 text-sm">Encryption Key</label>
            <input
              type="password"
              placeholder="Create secure passphrase"
              className="w-full p-3 bg-[#0a192f] text-[#ccd6f6] rounded border border-[#1e2a47] focus:border-[#64ffda] focus:outline-none"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              required
              minLength={6}
            />
          </div>
          
          <button 
            type="submit" 
            className={`w-full bg-gradient-to-r from-[#64ffda] to-[#48aff0] text-[#0a192f] font-bold py-3 px-4 rounded hover:opacity-90 transition duration-200 flex justify-center items-center ${
              isLoading ? 'opacity-70 cursor-not-allowed' : ''
            }`}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-[#0a192f]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : (
              'Request Clearance'
            )}
          </button>
          
          <p className="text-center text-gray-400 mt-6 text-sm">
            Already activated?{' '}
            <a href="/login" className="text-[#64ffda] hover:underline">Proceed to login</a>
          </p>
        </form>
      </div>
    </div>
  )
}