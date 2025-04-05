import React from 'react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CommandLineIcon as TerminalIcon } from '@heroicons/react/24/outline'
import api from '../api'

export default function Login({ onLogin }) {
  const [formData, setFormData] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    try {
      const res = await api.post('/api/login', formData)
      onLogin(res.data.user, res.data.token)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed')
    }
  }
  return (
    <div className="min-h-screen bg-[#0a192f] text-[#64ffda] p-8 font-mono">
      <div className="max-w-md mx-auto bg-[#112240] rounded-lg p-8 shadow-lg border border-[#1e2a47] hover:border-[#64ffda] transition-all">
        <div className="flex items-center justify-center mb-8">
          <TerminalIcon className="h-8 w-8 mr-3" />
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#64ffda] to-[#48aff0]">
            Agent Login
          </h1>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-gray-400 mb-2 text-sm">Codename</label>
            <input
              type="text"
              placeholder="Enter agent codename"
              className="w-full p-3 bg-[#0a192f] text-[#ccd6f6] rounded border border-[#1e2a47] focus:border-[#64ffda] focus:outline-none"
              value={formData.username}
              onChange={(e) => setFormData({...formData, username: e.target.value})}
              required
            />
          </div>
          
          <div>
            <label className="block text-gray-400 mb-2 text-sm">Access Code</label>
            <input
              type="password"
              placeholder="Enter secure passphrase"
              className="w-full p-3 bg-[#0a192f] text-[#ccd6f6] rounded border border-[#1e2a47] focus:border-[#64ffda] focus:outline-none"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              required
            />
          </div>
          
          <button 
            type="submit" 
            className="w-full bg-gradient-to-r from-[#64ffda] to-[#48aff0] text-[#0a192f] font-bold py-3 px-4 rounded hover:opacity-90 transition duration-200"
          >
            Authenticate
          </button>
          
          <p className="text-center text-gray-400 mt-6 text-sm">
            Not yet activated?{' '}
            <a href="/register" className="text-[#64ffda] hover:underline">Request clearance</a>
          </p>
        </form>
      </div>
    </div>
  )
}