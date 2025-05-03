import React from 'react'
import { useEffect, useState } from 'react'
import api from '../api'
import { 
  CommandLineIcon as TerminalIcon,
  ShieldCheckIcon,
  TrophyIcon as AwardIcon,
  ClipboardIcon,
  XMarkIcon,
  UsersIcon,
  ChevronUpIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline'

export default function Dashboard() {
  const [user, setUser] = useState(null)
  const [todoChallenges, setTodoChallenges] = useState([])
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading] = useState(true)
  const [totalChallenges, setTotalChallenges] = useState(0)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const [profileRes, todoRes, leaderboardRes, challengesRes] = await Promise.all([
          api.get('/api/profile'),
          api.get('/api/user/todo'),
          api.get('/api/leaderboard'),
          api.get('/api/challenges')
        ])

        // Validate and set data
        setUser(profileRes.data || null)
        setTodoChallenges(Array.isArray(todoRes?.data) ? todoRes.data : [])
        
        // Handle leaderboard data safely
        const lbData = Array.isArray(leaderboardRes?.data) 
          ? leaderboardRes.data.slice(0, 20) 
          : []
        setLeaderboard(lbData)
        
        setTotalChallenges(Array.isArray(challengesRes?.data) ? challengesRes.data.length : 0)
      } catch (err) {
        console.error('Failed to fetch data:', err)
        setError('Failed to load dashboard data')
        setLeaderboard([]) // Ensure leaderboard is always an array
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [])

  const removeFromTodoList = async (challengeId) => {
    try {
      await api.delete(`/api/user/todo/${challengeId}`)
      const res = await api.get('/api/user/todo')
      setTodoChallenges(Array.isArray(res?.data) ? res.data : [])
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

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a192f] text-[#64ffda] p-8 text-center font-mono">
        <TerminalIcon className="h-12 w-12 mx-auto mb-4" />
        <p className="text-red-400">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-[#1e2a47] rounded hover:bg-[#64ffda] hover:text-[#0a192f] transition-colors"
        >
          Retry
        </button>
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
  const solvedChallengeIds = Array.isArray(user.solvedChallenges) 
    ? user.solvedChallenges.map(c => c._id) 
    : []
  const solvedCount = Array.isArray(user.solvedChallenges) 
    ? user.solvedChallenges.length 
    : 0
  const completionPercentage = totalChallenges > 0 
    ? Math.min(100, Math.round((solvedCount / totalChallenges) * 100)) 
    : 0

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

        {/* Progress Bar */}
        <div className="mb-8 bg-[#112240] rounded-lg p-6 shadow-lg border border-[#1e2a47]">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium">Mission Progress</span>
            <span className="text-sm font-medium">{completionPercentage}%</span>
          </div>
          <div className="w-full bg-[#1e2a47] rounded-full h-4">
            <div 
              className="bg-gradient-to-r from-[#64ffda] to-[#48aff0] h-4 rounded-full transition-all duration-500 ease-out" 
              style={{ width: `${completionPercentage}%` }}
            ></div>
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-400">
            <span>{solvedCount} completed</span>
            <span>{totalChallenges - solvedCount} remaining</span>
          </div>
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
                <span className="font-medium">{user.points || 0}</span>
              </p>
              <p className="flex justify-between">
                <span className="text-gray-400">Objectives Completed:</span>
                <span className="font-medium">{solvedCount}</span>
              </p>
            </div>
          </div>

          {/* Activity Card */}
          <div className="bg-[#112240] rounded-lg p-6 shadow-lg border border-[#1e2a47] hover:border-[#64ffda] transition-all md:col-span-2">
            <div className="flex items-center mb-4">
              <AwardIcon className="h-6 w-6 mr-2" />
              <h3 className="text-xl font-semibold">Mission Log</h3>
            </div>
            
            {solvedCount > 0 ? (
              <div className="space-y-4">
                {user.solvedChallenges?.map(challenge => (
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

        {/* Leaderboard Section */}
        <div className="mt-8 bg-[#112240] rounded-lg p-6 shadow-lg border border-[#1e2a47] hover:border-[#64ffda] transition-all">
          <div className="flex items-center mb-4">
            <UsersIcon className="h-6 w-6 mr-2" />
            <h3 className="text-xl font-semibold">Top 20 Agents</h3>
          </div>
          
          {Array.isArray(leaderboard) && leaderboard.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[#1e2a47]">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Rank</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Agent</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Points</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Solved</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Clearance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e2a47]">
                  {leaderboard.map((player, index) => (
                    <tr 
                      key={player._id || index} 
                      className={`${player._id === user._id ? 'bg-[#1e2a47]' : ''} hover:bg-[#1e2a47]/50`}
                    >
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className={`font-medium ${
                            index === 0 ? 'text-yellow-400' : 
                            index === 1 ? 'text-gray-300' : 
                            index === 2 ? 'text-amber-600' : 'text-gray-400'
                          }`}>
                            {index + 1}
                          </span>
                          {index < 3 && (
                            <span className="ml-2">
                              {index === 0 ? (
                                <ChevronUpIcon className="h-4 w-4 text-yellow-400" />
                              ) : index === 1 ? (
                                <ChevronUpIcon className="h-4 w-4 text-gray-300" />
                              ) : (
                                <ChevronUpIcon className="h-4 w-4 text-amber-600" />
                              )}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className={`font-medium ${
                            player._id === user._id ? 'text-[#64ffda]' : 'text-[#ccd6f6]'
                          }`}>
                            {player.username || 'Anonymous'}
                          </span>
                          {player._id === user._id && (
                            <span className="ml-2 text-xs bg-[#64ffda]/10 text-[#64ffda] px-2 py-0.5 rounded-full">
                              YOU
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-[#ccd6f6]">{player.points || 0}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-[#ccd6f6]">
                        {Array.isArray(player.solvedChallenges) ? player.solvedChallenges.length : 0}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-[#ccd6f6]">
                        Level {player.points ? Math.min(10, Math.floor((player.points || 0)/100) + 1) : 1}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <p>No leaderboard data available</p>
              <button
                onClick={async () => {
                  try {
                    const res = await api.get('/api/leaderboard')
                    setLeaderboard(Array.isArray(res?.data) ? res.data.slice(0, 20) : [])
                  } catch (err) {
                    console.error('Failed to reload leaderboard:', err)
                  }
                }}
                className="mt-2 text-sm text-[#64ffda] hover:underline"
              >
                Retry loading leaderboard
              </button>
            </div>
          )}
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
                  const res = await api.get('/api/user/todo')
                  setTodoChallenges(Array.isArray(res?.data) ? res.data : [])
                } catch (err) {
                  console.error('Refresh failed:', err)
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
      </div>
    </div>
  )
}