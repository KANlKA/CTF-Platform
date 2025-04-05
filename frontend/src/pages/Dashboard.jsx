import React from 'react'
import { useEffect, useState } from 'react'
import api from '../api'
import { 
  CommandLineIcon as TerminalIcon,
  ShieldCheckIcon,
  TrophyIcon as AwardIcon,
  ClipboardIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'

export default function Dashboard() {
  const [user, setUser] = useState(null)
  const [todoChallenges, setTodoChallenges] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileRes, todoRes] = await Promise.all([
          api.get('/api/profile'),
          api.get('/api/user/todo')
        ]);
        console.log('Todo List Response:', todoRes.data); // Add this line
        setUser(profileRes.data);
        setTodoChallenges(todoRes.data);
      } catch (err) {
        console.error('Failed to fetch data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);
  const removeFromTodoList = async (challengeId) => {
    try {
      await api.delete(`/api/user/todo/${challengeId}`)
      const res = await api.get('/api/user/todo')
      setTodoChallenges(res.data)
    } catch (err) {
      console.error('Failed to remove from todo list:', err)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a192f] text-[#64ffda] p-8 text-center font-mono">
        <div className="animate-pulse">
          <TerminalIcon className="h-12 w-12 mx-auto mb-4" />
          <p>Decrypting user data...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0a192f] text-[#64ffda] p-8 text-center font-mono">
        <div className="animate-pulse">
          <TerminalIcon className="h-12 w-12 mx-auto mb-4" />
          <p>Authentication required. Redirecting...</p>
        </div>
      </div>
    )
  }

  const clearanceLevel = user.points ? Math.min(10, Math.floor(user.points/100) + 1) : 1
  const solvedChallengeIds = user.solvedChallenges?.map(c => c._id) || []

  return (
    <div className="min-h-screen bg-[#0a192f] text-[#64ffda] p-8 font-mono">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-8 border-b border-[#1e2a47] pb-4">
          <TerminalIcon className="h-8 w-8 mr-3" />
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#64ffda] to-[#48aff0]">
            User Dashboard
          </h1>
        </div>

        {/* Main Content */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* User Info Card */}
          <div className="bg-[#112240] rounded-lg p-6 shadow-lg border border-[#1e2a47] hover:border-[#64ffda] transition-all">
            <div className="flex items-center mb-4">
              <ShieldCheckIcon className="h-6 w-6 mr-2" />
              <h3 className="text-xl font-semibold">Agent Profile</h3>
            </div>
            <div className="space-y-3">
              <p className="flex justify-between">
                <span className="text-gray-400">Codename:</span>
                <span className="font-medium">{user.username}</span>
              </p>
              <p className="flex justify-between">
                <span className="text-gray-400">Security Clearance:</span>
                <span className="font-medium">Level {clearanceLevel}</span>
              </p>
              <p className="flex justify-between">
                <span className="text-gray-400">Mission Points:</span>
                <span className="font-medium">{user.points}</span>
              </p>
              <p className="flex justify-between">
                <span className="text-gray-400">Objectives Completed:</span>
                <span className="font-medium">{user.solvedChallenges?.length || 0}</span>
              </p>
            </div>
          </div>

          {/* Activity Card */}
          <div className="bg-[#112240] rounded-lg p-6 shadow-lg border border-[#1e2a47] hover:border-[#64ffda] transition-all md:col-span-2">
            <div className="flex items-center mb-4">
              <AwardIcon className="h-6 w-6 mr-2" />
              <h3 className="text-xl font-semibold">Mission Log</h3>
            </div>
            
            {user.solvedChallenges?.length > 0 ? (
              <div className="space-y-4">
                {user.solvedChallenges.map(challenge => (
                  <div key={challenge._id} className="border-b border-[#1e2a47] pb-3 last:border-0">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">✓ {challenge.title}</p>
                        <p className="text-sm text-gray-400">{challenge.category} | {challenge.difficulty}</p>
                      </div>
                      <span className="bg-[#64ffda] text-[#0a192f] px-2 py-1 rounded text-sm font-bold">
                        +{challenge.points}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <p>No missions completed yet</p>
                <p className="text-sm mt-2">Begin your first challenge to start earning points</p>
              </div>
            )}
          </div>
        </div>

        {/* To-Do List Section */}
<div className="mt-8 bg-[#112240] rounded-lg p-6 shadow-lg border border-[#1e2a47] hover:border-[#64ffda] transition-all">
  <div className="flex items-center justify-between mb-4">
    <div className="flex items-center">
      <ClipboardIcon className="h-6 w-6 mr-2" />
      <h3 className="text-xl font-semibold">To-Do Challenges</h3>
      <span className="ml-2 text-sm text-gray-400">
        ({todoChallenges.length} items)
      </span>
    </div>
    <button
      onClick={async () => {
        try {
          const res = await api.get('/api/user/todo');
          setTodoChallenges(res.data);
        } catch (err) {
          console.error('Refresh failed:', err);
        }
      }}
      className="flex items-center text-sm text-[#64ffda] hover:text-white"
    >
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        className="h-4 w-4 mr-1" 
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
        />
      </svg>
      Refresh
    </button>
  </div>
  
  {todoChallenges.length > 0 ? (
    <div className="space-y-3">
      {todoChallenges.map(challenge => (
        <div 
          key={challenge._id} 
          className={`p-3 rounded-lg transition-all ${
            solvedChallengeIds.includes(challenge._id) 
              ? 'bg-[#1e2a47]/50' 
              : 'bg-[#1e2a47] hover:bg-[#1e2a47]/80'
          }`}
        >
          <div className="flex justify-between items-center">
            <div className="flex-1 min-w-0">
              <p className={`font-medium truncate ${
                solvedChallengeIds.includes(challenge._id) 
                  ? 'line-through text-gray-500' 
                  : 'text-[#ccd6f6]'
              }`}>
                {challenge.title}
              </p>
              <div className="flex items-center mt-1 text-xs space-x-2">
                <span className="text-gray-400">{challenge.category}</span>
                <span className="text-gray-600">•</span>
                <span className={`${
                  challenge.difficulty === 'easy' ? 'text-green-400' :
                  challenge.difficulty === 'medium' ? 'text-yellow-400' :
                  'text-red-400'
                }`}>
                  {challenge.difficulty}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 ml-4">
              <span className="bg-[#64ffda] text-[#0a192f] px-2 py-1 rounded text-xs font-bold whitespace-nowrap">
                {challenge.points} pts
              </span>
              <button 
                onClick={() => removeFromTodoList(challenge._id)}
                className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                title="Remove from todo list"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
          {solvedChallengeIds.includes(challenge._id) && (
            <div className="mt-2 flex items-center text-xs text-green-400">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-3 w-3 mr-1" 
                viewBox="0 0 20 20" 
                fill="currentColor"
              >
                <path 
                  fillRule="evenodd" 
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" 
                  clipRule="evenodd" 
                />
              </svg>
              Completed
            </div>
          )}
        </div>
      ))}
    </div>
  ) : (
    <div className="text-center py-8 text-gray-400">
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        className="h-12 w-12 mx-auto mb-3 text-gray-600" 
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={1} 
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" 
        />
      </svg>
      <p className="text-lg">Your to-do list is empty</p>
      <p className="text-sm mt-2 max-w-md mx-auto">
        Click the "Add to To-Do List" button on challenges to track them here
      </p>
    </div>
  )}
</div>
        {/* Stats Overview */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[#112240] p-4 rounded-lg border border-[#1e2a47] text-center">
            <p className="text-gray-400 text-sm">Current Rank</p>
            <p className="text-xl font-bold">#{user.rank || '--'}</p>
          </div>
          <div className="bg-[#112240] p-4 rounded-lg border border-[#1e2a47] text-center">
            <p className="text-gray-400 text-sm">Total Points</p>
            <p className="text-xl font-bold">{user.points}</p>
          </div>
          <div className="bg-[#112240] p-4 rounded-lg border border-[#1e2a47] text-center">
            <p className="text-gray-400 text-sm">Challenges Solved</p>
            <p className="text-xl font-bold">{user.solvedChallenges?.length || 0}</p>
          </div>
          <div className="bg-[#112240] p-4 rounded-lg border border-[#1e2a47] text-center">
            <p className="text-gray-400 text-sm">Success Rate</p>
            <p className="text-xl font-bold">{user.solvedChallenges?.length ? '100%' : '0%'}</p>
          </div>
        </div>
      </div>
    </div>
  )
}