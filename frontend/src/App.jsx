import React from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Challenges from './pages/Challenges'
import CreateChallenge from './pages/CreateChallenge' // Import the new component
import Navbar from './components/Navbar'
import Profile from './pages/Profile'
import api from './api'

// Auth wrapper component
const RequireAuth = ({ children, user }) => {
  return user ? children : <Navigate to="/login" replace />
}

// Admin wrapper component
const RequireAdmin = ({ children, user }) => {
  return user?.isAdmin ? children : <Navigate to="/" replace />
}

// Guest wrapper component
const GuestOnly = ({ children, user }) => {
  return !user ? children : <Navigate to="/" replace />
}

const AppContent = () => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState(null)
  const [todoList, setTodoList] = useState([]);
  const navigate = useNavigate()

  // Check auth state on app load
  useEffect(() => {
    const verifyAuth = async () => {
      const token = localStorage.getItem('token')
      if (!token) {
        setLoading(false)
        return
      }

      try {
        const res = await api.get('/api/profile') // Keep /api prefix
        setUser(res.data)
      } catch (err) {
        localStorage.removeItem('token')
        setAuthError('Session expired. Please login again.')
        navigate('/login')
      } finally {
        setLoading(false)
      }
    }
    verifyAuth()
  }, [navigate])

  // Handle login
  const handleLogin = async (userData, token) => {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
    navigate('/dashboard')
  }

  // Handle logout - Updated to use /api prefix
  const handleLogout = () => {
    api.post('/api/logout').catch(() => {}) // Keep /api prefix
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    navigate('/')
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-[#0a192f]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#64ffda]"></div>
      </div>
    )
  }

  return (
    <>
      <Navbar user={user} onLogout={handleLogout} />
      <main className="min-h-[calc(100vh-76px)] bg-gray-50">
        {authError && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
            <p>{authError}</p>
          </div>
        )}
        <Routes>
          <Route path="/" element={<Home user={user} />} />
          <Route path="/login" element={
            <GuestOnly user={user}>
              <Login onLogin={handleLogin} />
            </GuestOnly>
          } />
          <Route path="/register" element={
            <GuestOnly user={user}>
              <Register onRegister={handleLogin} />
            </GuestOnly>
          } />
          <Route path="/dashboard" element={
            <RequireAuth user={user}>
              <Dashboard 
                user={user} 
                todoList={todoList}
                setTodoList={setTodoList}
              />
            </RequireAuth>
          } />
          <Route path="/challenges" element={
            <RequireAuth user={user}>
              <Challenges 
                user={user} 
                todoList={todoList}
                setTodoList={setTodoList}
              />
            </RequireAuth>
          } />
          <Route path="/challenges/create" element={
            <RequireAuth user={user}>
              <CreateChallenge />
            </RequireAuth>
          } />
          <Route path="/profile" element={
  <RequireAuth user={user}>
    <Profile onLogout={handleLogout} />
  </RequireAuth>
} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <footer className="bg-[#0a192f] text-white py-4 text-center">
        <p>CTF Platform © {new Date().getFullYear()}</p>
      </footer>
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}