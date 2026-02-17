import React from 'react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  UserCircleIcon,
  MagnifyingGlassIcon,
  PlusCircleIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';

export default function Navbar({ user, onLogout, toggleChatbot, showChatbot }) {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/search?q=${searchQuery}`);
  };

  return (
    <header className="bg-[#0a192f] text-[#64ffda] shadow-lg sticky top-0 z-50 font-mono">
      <div className="container mx-auto flex flex-col md:flex-row justify-between items-center p-4 gap-4">
        <Link to="/" className="text-2xl font-bold flex items-center">
          <span className="text-[#64ffda]">CTF</span>
          <span className="text-white">Platform</span>
        </Link>

        <form onSubmit={handleSearch} className="flex-1 max-w-2xl mx-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search challenges..."
              className="w-full py-2 px-4 pl-10 rounded-lg bg-[#112240] text-white border border-[#1e2a47] focus:outline-none focus:ring-2 focus:ring-[#64ffda]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-[#64ffda]" />
          </div>
        </form>

        <div className="flex items-center space-x-6">
          <nav className="flex space-x-6">
            <Link to="/challenges" className="hover:text-white transition-colors font-medium">
              Challenges
            </Link>
  
            {user && (
              <Link to="/dashboard" className="hover:text-white transition-colors font-medium">
                Dashboard
              </Link>
            )}
            {user && (
              <Link to="/discussions" className="hover:text-white transition-colors font-medium">
                Discussions
              </Link>
            )}
            {user?.role === 'admin' && (
              <Link to="/challenges/create" className="hover:text-white transition-colors font-medium">
                <PlusCircleIcon className="h-5 w-5 inline md:hidden" />
                <span className="hidden md:inline">Create</span>
              </Link>
            )}
          </nav>

          <div className="flex items-center space-x-4">
            {user && (
              <button 
                onClick={toggleChatbot}
                className={`p-2 rounded-full ${showChatbot ? 'bg-[#64ffda] text-[#0a192f]' : 'hover:bg-[#112240] text-[#64ffda]'}`}
                title="AI Assistant"
              >
                <ChatBubbleLeftRightIcon className="h-5 w-5" />
              </button>
            )}
            
            {user ? (
              <Link 
                to="/profile" 
                className="flex items-center space-x-2 hover:text-white transition-colors"
              >
                <UserCircleIcon className="h-6 w-6" />
              </Link>
            ) : (
              <>
                <Link to="/login" className="px-4 py-2 rounded hover:bg-[#1e2a47] transition-colors">
                  Login
                </Link>
                <Link to="/register" className="px-4 py-2 rounded bg-[#64ffda] text-[#0a192f] hover:bg-[#52d3b8] transition-colors">
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}