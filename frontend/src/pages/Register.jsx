import React, { useState } from 'react'
import { KeyIcon } from '@heroicons/react/24/outline'
import { GoogleLogin } from '@react-oauth/google'
import api from '../api'

export default function Register({ onRegister }) {
  const [formData, setFormData] = useState({ username: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const validate = () => {
    if (formData.username.trim().length < 3) {
      setError('Username must be at least 3 characters')
      return false
    }
    if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      setError('Please enter a valid email')
      return false
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      return false
    }
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!validate()) return

    setLoading(true)
    try {
      await api.post('/api/register', {
        username: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password,
      })

      // Auto-login after registration
      const loginRes = await api.post('/api/login', {
        username: formData.username.trim(),
        password: formData.password,
      })

      await onRegister(loginRes.data.user, loginRes.data.token)
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }


  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  return (
    <div className="min-h-screen bg-[#0a192f] text-[#64ffda] p-8 font-mono flex items-center justify-center">
      <div className="w-full max-w-md bg-[#112240] rounded-lg p-8 shadow-lg border border-[#1e2a47] hover:border-[#64ffda] transition-all">
        <div className="flex items-center justify-center mb-8">
          <KeyIcon className="h-8 w-8 mr-3" />
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#64ffda] to-[#48aff0]">
            Agent Activation
          </h1>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-900/30 text-red-400 rounded border border-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-gray-400 mb-2 text-sm">Codename</label>
            <input
              type="text"
              name="username"
              placeholder="Choose agent codename"
              className="w-full p-3 bg-[#0a192f] text-[#ccd6f6] rounded border border-[#1e2a47] focus:border-[#64ffda] focus:outline-none"
              value={formData.username}
              onChange={handleChange}
              required
              minLength={3}
            />
          </div>

          <div>
            <label className="block text-gray-400 mb-2 text-sm">Secure Channel</label>
            <input
              type="email"
              name="email"
              placeholder="Enter secure comms address"
              className="w-full p-3 bg-[#0a192f] text-[#ccd6f6] rounded border border-[#1e2a47] focus:border-[#64ffda] focus:outline-none"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="block text-gray-400 mb-2 text-sm">Encryption Key</label>
            <input
              type="password"
              name="password"
              placeholder="Create secure passphrase"
              className="w-full p-3 bg-[#0a192f] text-[#ccd6f6] rounded border border-[#1e2a47] focus:border-[#64ffda] focus:outline-none"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#64ffda] to-[#48aff0] text-[#0a192f] font-bold py-3 px-4 rounded hover:opacity-90 transition duration-200 flex justify-center items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-[#0a192f]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Processing…
              </>
            ) : (
              'Request Clearance'
            )}
          </button>
        </form>

        <div className="flex items-center my-6">
          <div className="flex-1 border-t border-[#1e2a47]" />
          <span className="mx-4 text-gray-500 text-sm">or</span>
          <div className="flex-1 border-t border-[#1e2a47]" />
        </div>

        <div className="flex justify-center">
          <GoogleLogin
            onSuccess={async (credentialResponse) => {
              setError('')
              setLoading(true)
              try {
                const res = await api.post('/api/auth/google', { idToken: credentialResponse.credential })
                await onRegister(res.data.user, res.data.token)
              } catch (err) {
                setError(err.response?.data?.message || 'Google sign-up failed')
              } finally {
                setLoading(false)
              }
            }}
            onError={() => setError('Google sign-in was cancelled or failed')}
          />
        </div>

        <p className="text-center text-gray-400 mt-6 text-sm">
          Already activated?{' '}
          <a href="/login" className="text-[#64ffda] hover:underline">Proceed to login</a>
        </p>
      </div>
    </div>
  )
}
