import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Challenges from './pages/Challenges';
import CreateChallenge from './pages/CreateChallenge';
import Discussions from './pages/Discussions';
import Discussion from './pages/Discussion';
import CreateDiscussion from './pages/CreateDiscussion';
import Navbar from './components/Navbar';
import Profile from './pages/Profile';
import Chatbot from './pages/Chatbot';
import { ChallengeProvider, useChallenge } from './contexts/ChallengeContext';
import api from './api';

// Auth wrapper component
const RequireAuth = ({ children, user }) => {
  return user ? children : <Navigate to="/login" replace />;
};

// Admin wrapper component
const RequireAdmin = ({ children, user }) => {
  return user?.role === 'admin' ? children : <Navigate to="/" replace />;
};

// Guest wrapper component
const GuestOnly = ({ children, user }) => {
  return !user ? children : <Navigate to="/" replace />;
};

const AppContent = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [todoList, setTodoList] = useState([]);
  const [showChatbot, setShowChatbot] = useState(false);
  const [currentChallenge, setCurrentChallenge] = useState(null);
  const [challengesData, setChallengesData] = useState([]); // New state for challenges data
  const [discussionsData, setDiscussionsData] = useState([]); // New state for discussions data
  const navigate = useNavigate();

  // Check auth state and fetch initial data on app load
  useEffect(() => {
    const verifyAuthAndFetchData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }
    
      try {
        // Verify auth
        const profileRes = await api.get('/api/profile');
        const completeUser = {
          ...profileRes.data,
          id: profileRes.data._id || profileRes.data.id,
          solvedChallenges: profileRes.data.solvedChallenges || [],
          todoChallenges: profileRes.data.todoChallenges || []
        };
        setUser(completeUser);
        localStorage.setItem('user', JSON.stringify(completeUser));

        // Fetch challenges data
        const challengesRes = await api.get('/api/challenges');
        setChallengesData(challengesRes.data);

        // Fetch discussions data
        const discussionsRes = await api.get('/api/discussions');
        setDiscussionsData(discussionsRes.data);

      } catch (err) {
        console.error('Initialization error:', err);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        if (err.response?.status === 401) {
          setAuthError('Session expired. Please login again.');
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };
    verifyAuthAndFetchData();
  }, [navigate]);

  const toggleChatbot = () => {
    setShowChatbot(!showChatbot);
  };

  // Handle login
  const handleLogin = async (userData, token) => {
    try {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      
      // Fetch data after login
      const [challengesRes, discussionsRes] = await Promise.all([
        api.get('/api/challenges'),
        api.get('/api/discussions')
      ]);
      
      setChallengesData(challengesRes.data);
      setDiscussionsData(discussionsRes.data);
      
      navigate('/dashboard');
    } catch (err) {
      console.error('Login data fetch error:', err);
    }
  };

  // Handle logout
  const handleLogout = () => {
    api.post('/api/logout').catch(() => {});
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setChallengesData([]);
    setDiscussionsData([]);
    setShowChatbot(false);
    setCurrentChallenge(null);
    navigate('/');
  };

  // Function to refresh challenges data
  const refreshChallenges = async () => {
    try {
      const res = await api.get('/api/challenges');
      setChallengesData(res.data);
    } catch (err) {
      console.error('Error refreshing challenges:', err);
    }
  };

  // Function to refresh discussions data
  const refreshDiscussions = async () => {
    try {
      const res = await api.get('/api/discussions');
      setDiscussionsData(res.data);
    } catch (err) {
      console.error('Error refreshing discussions:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-[#0a192f]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#64ffda]"></div>
      </div>
    );
  }

  return (
    <ChallengeProvider value={{ 
      currentChallenge, 
      setCurrentChallenge,
      refreshChallenges,
      refreshDiscussions
    }}>
      <Navbar 
        user={user} 
        onLogout={handleLogout} 
        toggleChatbot={toggleChatbot}
        showChatbot={showChatbot}
      />
      
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
                challengesData={challengesData}
              />
            </RequireAuth>
          } />
          <Route path="/challenges" element={
            <RequireAuth user={user}>
              <Challenges 
                user={user} 
                challengesData={challengesData}
                refreshChallenges={refreshChallenges}
                todoList={todoList}
                setTodoList={setTodoList}
              />
            </RequireAuth>
          } />
          <Route path="/challenges/create" element={
            <RequireAdmin user={user}>
              <CreateChallenge
                refreshChallenges={refreshChallenges}
              />
            </RequireAdmin>
          } />
          <Route path="/profile" element={
            <RequireAuth user={user}>
              <Profile 
                user={user} 
                onLogout={handleLogout} 
                challengesData={challengesData}
              />
            </RequireAuth>
          } />
          <Route path="/discussions" element={
            <RequireAuth user={user}>
              <Discussions 
                user={user} 
                discussionsData={discussionsData}
                refreshDiscussions={refreshDiscussions}
              />
            </RequireAuth>
          } />
          <Route path="/discussions/:id" element={
            <RequireAuth user={user}>
              <Discussion 
                user={user} 
                refreshDiscussions={refreshDiscussions}
              />
            </RequireAuth>
          } />
          <Route path="/discussions/new" element={
            <RequireAuth user={user}>
              <CreateDiscussion 
                user={user}
                refreshDiscussions={refreshDiscussions}
              />
            </RequireAuth>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      
      {/* Chatbot positioned in the bottom right corner */}
      {user && showChatbot && (
        <div className="fixed bottom-6 right-6 z-50">
          <Chatbot 
            onClose={() => setShowChatbot(false)} 
            currentChallenge={currentChallenge}
          />
        </div>
      )}
      
      <footer className="bg-[#0a192f] text-white py-4 text-center">
        <p>CTF Platform by Kanika © {new Date().getFullYear()}</p>
      </footer>
    </ChallengeProvider>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}