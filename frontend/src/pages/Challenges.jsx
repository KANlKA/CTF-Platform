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
  XMarkIcon,
  LockClosedIcon,
  CheckIcon,
  BoltIcon,
  CubeIcon,
  TrophyIcon
} from '@heroicons/react/24/outline';
import Editor from '@monaco-editor/react';
import { Terminal } from 'xterm';
import 'xterm/css/xterm.css';

export default function Challenges({ user: initialUser }) {
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
  const [user, setUser] = useState(initialUser);
  const [code, setCode] = useState('');
  const [terminal, setTerminal] = useState(null);
  const [output, setOutput] = useState('');
  const [dailyPoints, setDailyPoints] = useState(0);
  const [answer, setAnswer] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  // Update local user state when prop changes
  useEffect(() => {
    setUser(initialUser);
    if (initialUser?.todoList) {
      setTodoList(initialUser.todoList);
    }
  }, [initialUser]);

  // Initialize terminal
  useEffect(() => {
    if (selectedChallenge && !terminal) {
      const newTerminal = new Terminal({
        theme: {
          background: '#0f172a',
          foreground: '#e2e8f0',
          cursor: '#38bdf8'
        },
        fontSize: 14,
        fontFamily: 'monospace',
        cursorBlink: true,
        rows: 15
      });
      newTerminal.open(document.getElementById('terminal'));
      newTerminal.write('$ Terminal initialized - ready for commands\r\n');
      setTerminal(newTerminal);
      
      // Cleanup
      return () => {
        newTerminal.dispose();
      };
    }
  }, [selectedChallenge]);

  // Track daily points
  useEffect(() => {
    const today = new Date().toLocaleDateString();
    const storedPoints = localStorage.getItem(`dailyPoints-${today}`);
    setDailyPoints(storedPoints ? parseInt(storedPoints) : 0);
  }, [user]);

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
  }, [difficulty, activeTab]);

  const displayedChallenges = (() => {
    if (activeTab === 'all') {
      return challenges;
    }
    if (activeTab === 'todo') {
      return todoList;
    }
    if (activeTab === 'solved' && user?.solvedChallenges) {
      return challenges.filter(challenge => 
        user.solvedChallenges.includes(challenge._id)
      );
    }
    return [];
  })();

  const openChallengeModal = (challenge) => {
    setSelectedChallenge(challenge);
    setShowHint(false);
    setFlag('');
    setMessage('');
    setAnswer('');
    setOutput('');
    setCode(challenge.initialCode || '// Write your code here\n// Click "Run Code" to execute');
    
    // Reset terminal
    if (terminal) {
      terminal.reset();
      terminal.write('$ Ready to execute code...\r\n');
    }
  };

  const closeChallengeModal = () => {
    setSelectedChallenge(null);
  };

  const runCode = async () => {
    if (!terminal) return;
    
    terminal.write('\r\n$ Executing code...\r\n');
    
    try {
      // Simulate execution with a loading effect
      const loadingInterval = setInterval(() => {
        terminal.write('.');
      }, 300);
      
      // In a real app, you would send this to your backend for execution
      const response = await api.post('/api/execute', {
        code,
        language: selectedChallenge.language || 'javascript'
      });
      
      clearInterval(loadingInterval);
      terminal.write('\r\n' + response.data.output + '\r\n');
      terminal.write('$ Execution complete. Ready for next command.\r\n');
      setOutput(response.data.output);
    } catch (err) {
      terminal.write('\r\nError: ' + (err.response?.data?.error || 'Failed to execute') + '\r\n');
      setOutput('Error: ' + (err.response?.data?.error || 'Failed to execute'));
    }
  };

  const submitAnswer = async () => {
    try {
      setIsSubmitting(true);
      setMessage('');

      if (!answer.trim()) {
        setMessage('Please enter an answer');
        return;
      }

      const res = await api.post(
        `/api/challenges/${selectedChallenge._id}/submit`,
        { flag: answer.trim() }  // Changed from 'answer' to 'flag'
      );

      setMessage(res.data.message);
      
      if (res.data.success) {
        // Update daily points
        const today = new Date().toLocaleDateString();
        const newPoints = dailyPoints + selectedChallenge.points;
        localStorage.setItem(`dailyPoints-${today}`, newPoints.toString());
        setDailyPoints(newPoints);
        
        // Refresh data
        const [challengesRes, userRes] = await Promise.all([
          api.get(difficulty === 'all' ? '/api/challenges' : `/api/challenges/difficulty/${difficulty}`),
          api.get('/api/profile')
        ]);
        
        setChallenges(challengesRes.data || []);
        setUser(userRes.data);
        setAnswer('');
      }
    } catch (err) {
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
      
      // Update user data
      const userRes = await api.get('/api/profile');
      setUser(userRes.data);
    } catch (err) {
      setMessage('Failed to add to todo list: ' + (err.response?.data?.message || err.message));
    }
  };

  const removeFromTodoList = async (challengeId) => {
    try {
      await api.delete(`/api/user/todo/${challengeId}`);
      setTodoList(todoList.filter(item => item._id !== challengeId));
      setMessage('Removed from todo list');
      
      // Update user data
      const userRes = await api.get('/api/profile');
      setUser(userRes.data);
    } catch (err) {
      setMessage('Failed to remove from todo list');
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch(difficulty) {
      case 'easy': return 'bg-emerald-900/30 text-emerald-400 border-emerald-700';
      case 'medium': return 'bg-amber-900/30 text-amber-400 border-amber-700';
      case 'hard': return 'bg-rose-900/30 text-rose-400 border-rose-700';
      default: return 'bg-slate-700/30 text-slate-400 border-slate-700';
    }
  };

  return (
    <div className="min-h-screen bg-[#0a192f] text-[#64ffda] p-8 font-mono">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <header className="mb-8 border-b border-[#1e2a47] pb-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-[#112240] border border-[#1e2a47] mr-4">
                <CubeIcon className="h-8 w-8 text-[#64ffda]" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#64ffda] to-[#48aff0]">
                  Challenge Arena
                </h1>
                <p className="text-gray-400">Test your skills and climb the ranks</p>
              </div>
            </div>
  
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <div className="relative w-full">
                <select
                  className="appearance-none bg-[#112240] text-[#ccd6f6] border border-[#1e2a47] rounded-lg px-4 py-2 pr-8 w-full focus:outline-none focus:ring-2 focus:ring-[#64ffda] focus:border-transparent"
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                >
                  <option value="all">All Difficulties</option>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                  <svg
                    className="fill-current h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                  </svg>
                </div>
              </div>
              
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2 flex items-center">
                <TrophyIcon className="h-5 w-5 text-amber-400 mr-2" />
                  <span className="font-medium text-amber-400">{dailyPoints}</span>
                     <span className="text-slate-200 ml-1" />
              </div>
            </div>
          </div>
          
          {/* Tabs */}
          <div className="flex border-b border-[#1e2a47] mt-6">
            <button
              className={`px-4 py-2 font-medium text-sm flex items-center ${activeTab === 'all' ? 'text-[#64ffda] border-b-2 border-[#64ffda]' : 'text-[#8892b0] hover:text-[#ccd6f6]'}`}
              onClick={() => setActiveTab('all')}
            >
              <BoltIcon className="h-4 w-4 mr-2" />
              All Challenges
            </button>
            <button
              className={`px-4 py-2 font-medium text-sm flex items-center ${activeTab === 'todo' ? 'text-[#64ffda] border-b-2 border-[#64ffda]' : 'text-[#8892b0] hover:text-[#ccd6f6]'}`}
              onClick={() => setActiveTab('todo')}
            >
              <StarIcon className="h-4 w-4 mr-2" />
              My To-Do List
            </button>
            <button
              className={`px-4 py-2 font-medium text-sm flex items-center ${activeTab === 'solved' ? 'text-[#64ffda] border-b-2 border-[#64ffda]' : 'text-[#8892b0] hover:text-[#ccd6f6]'}`}
              onClick={() => setActiveTab('solved')}
            >
              <CheckIcon className="h-4 w-4 mr-2" />
              Solved Challenges
            </button>
          </div>
        </header>
        
        {/* Main Content */}
        <main className="mt-6">
          {error && (
            <div className="bg-red-900/30 text-red-400 p-4 rounded border border-red-700 mb-6 flex items-center">
              <XMarkIcon className="h-5 w-5 mr-2" />
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#64ffda]"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayedChallenges.length > 0 ? (
                displayedChallenges.map(challenge => (
                  <div 
                    key={challenge._id} 
                    className="bg-[#112240] rounded-lg p-6 border border-[#1e2a47] hover:border-[#64ffda] transition-all hover:shadow-lg hover:shadow-[#64ffda]/10"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-xl font-semibold text-[#ccd6f6]">{challenge.title}</h3>
                      <span className={`text-xs px-2 py-1 rounded ${
                        challenge.difficulty === 'easy' ? 'bg-green-900 text-green-400' :
                        challenge.difficulty === 'medium' ? 'bg-yellow-900 text-yellow-400' :
                        'bg-red-900 text-red-400'
                      }`}>
                        {challenge.difficulty}
                      </span>
                    </div>
                    
                    <p className="text-[#8892b0] mb-4 line-clamp-3">{challenge.description}</p>
                    
                    <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                      <div className="flex items-center text-[#8892b0]">
                        <UserIcon className="h-4 w-4 mr-2" />
                        <span>{challenge.creator || "Anonymous"}</span>
                      </div>
                      <div className="flex items-center text-[#8892b0]">
                        <CalendarIcon className="h-4 w-4 mr-2" />
                        <span>{new Date(challenge.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center text-[#8892b0]">
                        <FlagIcon className="h-4 w-4 mr-2" />
                        <span>{challenge.solves || 0} solves</span>
                      </div>
                      <div className="flex items-center text-[#8892b0]">
                        <StarIcon className="h-4 w-4 mr-2" />
                        <span>{challenge.points} points</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center pt-3 border-t border-[#1e2a47]">
                      <div>
                        {user?.solvedChallenges?.includes(challenge._id) ? (
                          <span className="bg-green-900/30 text-green-400 px-3 py-1 rounded-full text-xs font-medium border border-green-800">
                            Solved
                          </span>
                        ) : (
                          <span className="bg-[#64ffda]/10 text-[#64ffda] px-3 py-1 rounded-full text-xs font-medium border border-[#64ffda]/30">
                            {challenge.points} pts
                          </span>
                        )}
                      </div>
                      
                      <button 
                        className="flex items-center text-[#64ffda] hover:text-white transition-colors group"
                        onClick={() => openChallengeModal(challenge)}
                      >
                        <span>View Challenge</span>
                        <ArrowRightIcon className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-16">
                  <div className="bg-[#112240] rounded-xl p-8 max-w-md mx-auto border border-[#1e2a47]">
                    <CubeIcon className="h-10 w-10 mx-auto text-[#8892b0] mb-4" />
                    <h3 className="text-lg font-medium text-[#ccd6f6] mb-2">
                      {activeTab === 'todo' ? 'Your to-do list is empty' : 
                       activeTab === 'solved' ? 'No solved challenges yet' : 
                       'No challenges found'}
                    </h3>
                    <p className="text-[#8892b0]">
                      {activeTab === 'todo' ? 'Add challenges to your to-do list to see them here' : 
                       activeTab === 'solved' ? 'Solve some challenges to see them here' : 
                       'Try adjusting your filters or check back later for new challenges.'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
        
        {/* Challenge Modal */}
        {selectedChallenge && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-6xl max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="sticky top-0 bg-slate-800/90 backdrop-blur-sm border-b border-slate-700 p-4 flex justify-between items-center z-10">
                <h2 className="text-2xl font-bold text-white flex items-center">
                  <span className={`mr-3 ${getDifficultyColor(selectedChallenge.difficulty)} px-3 py-1 rounded-full text-sm`}>
                    {selectedChallenge.difficulty}
                  </span>
                  {selectedChallenge.title}
                </h2>
                <button 
                  onClick={closeChallengeModal}
                  className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-700 transition-colors"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
                {/* Left Column - Challenge Details */}
                <div className="space-y-6">
                  <div className="bg-slate-900/50 rounded-lg p-5 border border-slate-700">
                    <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                      <CubeIcon className="h-5 w-5 mr-2 text-indigo-400" />
                      Challenge Description
                    </h3>
                    <div className="prose prose-invert max-w-none">
                      <pre className="whitespace-pre-wrap font-sans text-slate-300">{selectedChallenge.description}</pre>
                    </div>
                  </div>

                  <div className="bg-slate-900/50 rounded-lg p-5 border border-slate-700">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-lg font-semibold text-white flex items-center">
                        <EyeIcon className="h-5 w-5 mr-2 text-amber-400" />
                        Hint
                      </h3>
                      <div className="flex items-center text-sm">
                        {dailyPoints >= 300 ? (
                          <button 
                            onClick={() => setShowHint(!showHint)}
                            className="flex items-center text-amber-400 hover:text-amber-300 transition-colors"
                          >
                            {showHint ? 'Hide Hint' : 'Show Hint'}
                            <ArrowRightIcon className={`h-4 w-4 ml-1 transition-transform ${showHint ? 'rotate-90' : ''}`} />
                          </button>
                        ) : (
                          <span className="flex items-center text-slate-500">
                            <LockClosedIcon className="w-4 h-4 mr-1" />
                            Need 300 daily points to unlock
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {showHint && dailyPoints >= 300 && (
                      <div className="mt-3 p-3 bg-slate-800 rounded border border-slate-700">
                        <p className="text-slate-300">{selectedChallenge.hint || 'No hint available for this challenge.'}</p>
                      </div>
                    )}
                  </div>

                  <div className="bg-slate-900/50 rounded-lg p-5 border border-slate-700">
                    <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                      <FlagIcon className="h-5 w-5 mr-2 text-emerald-400" />
                      Submit Solution
                    </h3>
                    <p className="text-slate-400 text-sm mb-3">
                      Run your code and enter the output below to verify your solution.
                    </p>
                    
                    <div className="flex mb-2">
                      <input
                        type="text"
                        placeholder="Enter your answer..."
                        className="flex-1 p-3 bg-slate-900 border border-slate-700 text-white rounded-l-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                      />
                      <button 
                        onClick={submitAnswer}
                        disabled={isSubmitting}
                        className={`bg-indigo-600 text-white px-4 rounded-r-lg flex items-center hover:bg-indigo-500 transition-colors ${
                          isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
                        }`}
                      >
                        {isSubmitting ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" 
                                xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Verifying...
                          </>
                        ) : (
                          <>
                            <CheckIcon className="w-5 h-5 mr-1" />
                            Submit
                          </>
                        )}
                      </button>
                    </div>
                    
                    {message && (
                      <div className={`mt-2 p-2 rounded text-sm ${
                        message.includes('correct') ? 
                          'bg-emerald-900/30 text-emerald-400 border border-emerald-800' : 
                          'bg-rose-900/30 text-rose-400 border border-rose-800'
                      }`}>
                        {message}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column - Code Editor and Terminal */}
                <div className="space-y-6">
                  <div className="h-96 rounded-lg overflow-hidden border border-slate-700">
                    <div className="bg-slate-900 px-4 py-2 border-b border-slate-700 flex justify-between items-center">
                      <span className="text-sm font-mono text-slate-400">
                        {selectedChallenge.language || 'javascript'}
                      </span>
                      <button
                        onClick={runCode}
                        className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded flex items-center transition-colors"
                      >
                        <BoltIcon className="h-3 w-3 mr-1" />
                        Run Code
                      </button>
                    </div>
                    <Editor
                      height="calc(100% - 40px)"
                      defaultLanguage={selectedChallenge.language || 'javascript'}
                      theme="vs-dark"
                      value={code}
                      onChange={setCode}
                      options={{
                        minimap: { enabled: false },
                        fontSize: 14,
                        wordWrap: 'on',
                        automaticLayout: true,
                        scrollBeyondLastLine: false,
                        padding: { top: 10 }
                      }}
                    />
                  </div>
                  
                  <div className="rounded-lg overflow-hidden border border-slate-700">
                    <div className="bg-slate-900 px-4 py-2 border-b border-slate-700">
                      <span className="text-sm font-mono text-slate-400">Terminal</span>
                    </div>
                    <div id="terminal" className="h-48 w-full p-2 font-mono text-sm"></div>
                  </div>
                </div>
              </div>

              <div className="sticky bottom-0 bg-slate-800/90 backdrop-blur-sm border-t border-slate-700 p-4 flex justify-between items-center">
                <button 
                  onClick={addToTodoList}
                  className="flex items-center text-indigo-400 hover:text-indigo-300 transition-colors group"
                >
                  <PlusIcon className="h-5 w-5 mr-1 group-hover:rotate-90 transition-transform" />
                  Add to To-Do List
                </button>
                <button 
                  onClick={closeChallengeModal}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                >
                  Close Challenge
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}