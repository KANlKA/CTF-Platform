import React from 'react'
import { useEffect, useState } from 'react';
import api from '../api';
import { 
  ArrowRightIcon,
  FireIcon,
  CalendarIcon,
  UserIcon,
  FlagIcon,
  StarIcon,
  PlusIcon,
  EyeIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

export default function Challenges({ user }) {
  const [challenges, setChallenges] = useState([]);
  const [difficulty, setDifficulty] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [showHint, setShowHint] = useState(false);
  const [flag, setFlag] = useState('');
  const [message, setMessage] = useState('');
  const [todoList, setTodoList] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchChallenges = async () => {
      try {
        setLoading(true);
        setError(null);
        const endpoint = difficulty === 'all' 
          ? '/api/challenges' 
          : `/api/challenges/difficulty/${difficulty}`;
        const res = await api.get(endpoint);
        setChallenges(res.data || []);
      } catch (err) {
        console.error('Failed to fetch challenges:', err);
        setError('Failed to load challenges. Please try again later.');
        setChallenges([]);
      } finally {
        setLoading(false);
      }
    };
    fetchChallenges();
  }, [difficulty]);

  const openChallengeModal = (challenge) => {
    setSelectedChallenge(challenge);
    setShowHint(false);
    setFlag('');
    setMessage('');
  };

  const closeChallengeModal = () => {
    setSelectedChallenge(null);
  };

  const submitFlag = async () => {
    try {
      setIsSubmitting(true);
      setMessage('');
  
      console.log('Submitting flag:', flag); // Log the flag being submitted
      console.log('For challenge:', selectedChallenge?._id); // Log the challenge ID
  
      if (!selectedChallenge) {
        setMessage('No challenge selected');
        return;
      }
  
      if (!flag.trim()) {
        setMessage('Please enter a flag');
        return;
      }
  
      const res = await api.post(
        `/api/challenges/${selectedChallenge._id}/submit`,
        { flag: flag.trim() }
      );
  
      console.log('Submission response:', res.data); // Log the response
      setMessage(res.data.message);
      
      if (res.data.success) {
        // Refresh data
        const [challengesRes, userRes] = await Promise.all([
          api.get(difficulty === 'all' ? '/api/challenges' : `/api/challenges/difficulty/${difficulty}`),
          api.get('/api/profile')
        ]);
        
        setChallenges(challengesRes.data || []);
        setUser(userRes.data);
        setFlag('');
      }
    } catch (err) {
      console.error('Full submission error:', err); // Log entire error object
      console.error('Error response:', err.response); // Log response if exists
      
      const errorMessage = err.response?.data?.message || 
                          err.message || 
                          'Submission failed. Please try again.';
      setMessage(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const addToTodoList = async () => {
    try {
      const response = await api.post('/api/user/todo', { 
        challengeId: selectedChallenge._id 
      });
      setTodoList([...todoList, selectedChallenge]);
      setMessage('Added to your todo list!');
    } catch (err) {
      setMessage('Failed to add to todo list: ' + (err.response?.data?.message || err.message));
    }
  };

  const removeFromTodoList = async (challengeId) => {
    try {
      await api.delete(`/api/user/todo/${challengeId}`);
      setTodoList(todoList.filter(item => item._id !== challengeId));
      setMessage('Removed from todo list');
    } catch (err) {
      setMessage('Failed to remove from todo list');
    }
  };

  return (
    <div className="min-h-screen bg-[#0a192f] text-[#64ffda] p-8 font-mono">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b border-[#1e2a47] pb-4">
          <div className="flex items-center mb-4 md:mb-0">
            <FireIcon className="h-8 w-8 mr-3 text-[#64ffda]" />
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#64ffda] to-[#48aff0]">
              Challenge Arena
            </h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <select 
              className="bg-[#112240] text-[#64ffda] border border-[#1e2a47] rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#64ffda]"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
            >
              <option value="all">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="bg-red-900/30 text-red-400 p-4 rounded border border-red-700 mb-6">
            {error}
          </div>
        )}

        {todoList.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <StarIcon className="h-5 w-5 mr-2" />
              My To-Do List
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {todoList.map(challenge => (
                <div key={challenge._id} className="bg-[#1e2a47] rounded-lg p-4 flex justify-between items-center">
                  <span>{challenge.title}</span>
                  <button 
                    onClick={() => removeFromTodoList(challenge._id)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#64ffda]"></div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {challenges.length > 0 ? (
              challenges.map(challenge => (
                <div 
                  key={challenge._id} 
                  className="bg-[#112240] rounded-lg p-6 shadow-lg border border-[#1e2a47] hover:border-[#64ffda] transition-all hover:scale-[1.02]"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-semibold">{challenge.title}</h3>
                    <span className={`px-2 py-1 rounded text-xs ${
                      challenge.difficulty === 'easy' ? 'bg-green-900 text-green-300' :
                      challenge.difficulty === 'medium' ? 'bg-yellow-900 text-yellow-300' :
                      'bg-red-900 text-red-300'
                    }`}>
                      {challenge.difficulty}
                    </span>
                  </div>
                  
                  <p className="text-gray-400 mb-4">{challenge.description.substring(0, 100)}...</p>
                  
                  <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
                    <div className="flex items-center text-gray-400">
                      <UserIcon className="h-4 w-4 mr-1" />
                      <span>{challenge.creator || "User"}</span>
                    </div>
                    <div className="flex items-center text-gray-400">
                      <CalendarIcon className="h-4 w-4 mr-1" />
                      <span>{new Date(challenge.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center text-gray-400">
                      <FlagIcon className="h-4 w-4 mr-1" />
                      <span>{challenge.solves || 0} solves</span>
                    </div>
                    <div className="flex items-center text-gray-400">
                      <StarIcon className="h-4 w-4 mr-1" />
                      <span>{challenge.points} points</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div>
                      {user?.solvedChallenges?.includes(challenge._id) ? (
                        <span className="bg-green-900 text-green-300 px-2 py-1 rounded text-sm font-bold">
                          Solved
                        </span>
                      ) : (
                        <span className="bg-[#64ffda] text-[#0a192f] px-2 py-1 rounded text-sm font-bold">
                          {challenge.points} pts
                        </span>
                      )}
                    </div>
                    
                    <button 
                      className="flex items-center text-[#64ffda] hover:text-white transition-colors"
                      onClick={() => openChallengeModal(challenge)}
                    >
                      <span>View Challenge</span>
                      <ArrowRightIcon className="h-4 w-4 ml-1" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-12 text-gray-400">
                No challenges found for selected difficulty
              </div>
            )}
          </div>
        )}

        {selectedChallenge && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-[#112240] rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold">{selectedChallenge.title}</h2>
                <button 
                  onClick={closeChallengeModal}
                  className="text-gray-400 hover:text-[#64ffda]"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="mb-6">
                <p className="text-gray-300">{selectedChallenge.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="flex items-center">
                  <span className={`px-2 py-1 rounded text-xs ${
                    selectedChallenge.difficulty === 'easy' ? 'bg-green-900 text-green-300' :
                    selectedChallenge.difficulty === 'medium' ? 'bg-yellow-900 text-yellow-300' :
                    'bg-red-900 text-red-300'
                  }`}>
                    {selectedChallenge.difficulty}
                  </span>
                  <span className="ml-2 bg-[#64ffda] text-[#0a192f] px-2 py-1 rounded text-sm font-bold">
                    {selectedChallenge.points} pts
                  </span>
                </div>
                <div className="flex items-center justify-end space-x-4">
                  <div className="flex items-center text-sm text-gray-400">
                    <UserIcon className="h-4 w-4 mr-1" />
                    <span>{selectedChallenge.creator || "User"}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-400">
                    <FlagIcon className="h-4 w-4 mr-1" />
                    <span>{selectedChallenge.solves || 0} solves</span>
                  </div>
                </div>
              </div>

              {selectedChallenge.hints?.length > 0 && (
                <div className="mb-6">
                  <button 
                    onClick={() => setShowHint(!showHint)}
                    className="flex items-center text-sm text-gray-400 hover:text-[#64ffda]"
                  >
                    <EyeIcon className="w-4 h-4 mr-1" />
                    {showHint ? 'Hide Hint' : 'Show Hint'}
                  </button>
                  {showHint && (
                    <div className="mt-2 p-3 bg-[#1e2a47] rounded">
                      <p>{selectedChallenge.hints[0].content}</p>
                    </div>
                  )}
                </div>
              )}

              <div className="mb-6">
                <div className="flex">
                  <input
                    type="text"
                    placeholder="Enter flag"
                    className="flex-1 p-2 border border-[#1e2a47] bg-[#0a192f] text-white rounded-l focus:outline-none focus:ring-1 focus:ring-[#64ffda]"
                    value={flag}
                    onChange={(e) => setFlag(e.target.value)}
                  />
                  <button 
  onClick={submitFlag}
  disabled={isSubmitting}
  className={`bg-[#64ffda] text-[#0a192f] px-4 rounded-r flex items-center hover:bg-[#48aff0] transition-colors ${
    isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
  }`}
>
  {isSubmitting ? (
    <>
      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-[#0a192f]" 
           xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      Verifying...
    </>
  ) : (
    <>
      <FlagIcon className="w-4 h-4 mr-1" />
      Submit Flag
    </>
  )}
</button>
                </div>
                {message && (
                  <p className={`mt-2 text-sm ${
                    message.includes('correct') ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {message}
                  </p>
                )}
              </div>

              <div className="flex justify-between">
                <button 
                  onClick={addToTodoList}
                  className="flex items-center text-[#64ffda] hover:text-white transition-colors"
                >
                  <PlusIcon className="h-5 w-5 mr-1" />
                  Add to To-Do List
                </button>
                <button 
                  onClick={closeChallengeModal}
                  className="px-4 py-2 bg-[#1e2a47] text-[#64ffda] rounded hover:bg-[#64ffda] hover:text-[#0a192f] transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}