import React from 'react'
import { useState } from 'react'
import { FlagIcon, EyeIcon } from '@heroicons/react/24/outline' // Removed /24/ from path
import api from '../api'

export default function ChallengeCard({ challenge }) {
  const [showHint, setShowHint] = useState(false)
  const [flag, setFlag] = useState('')
  const [message, setMessage] = useState('')

  const submitFlag = async () => {
    try {
      const res = await api.post(`/challenges/${challenge._id}/submit`, { flag })
      setMessage(res.data.message)
    } catch (err) {
      setMessage(err.response?.data?.message || 'Submission failed')
    }
  }

  return (
    <div className="card">
      <div className="p-6">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl font-semibold">{challenge.title}</h3>
          <span className={`px-2 py-1 rounded text-xs ${
            challenge.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
            challenge.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {challenge.difficulty}
          </span>
        </div>
        <p className="text-gray-600 mb-4">{challenge.description}</p>
        <p className="font-medium mb-2">{challenge.points} points</p>
        
        {challenge.hints?.length > 0 && (
          <div className="mb-4">
            <button 
              onClick={() => setShowHint(!showHint)}
              className="flex items-center text-sm text-gray-500 hover:text-ctf-primary"
            >
              <EyeIcon className="w-4 h-4 mr-1" />
              {showHint ? 'Hide Hint' : 'Show Hint'}
            </button>
            {showHint && (
              <div className="mt-2 p-3 bg-gray-50 rounded">
                <p>{challenge.hints[0].content}</p>
              </div>
            )}
          </div>
        )}

        <div className="mt-4">
          <div className="flex">
            <input
              type="text"
              placeholder="Enter flag"
              className="flex-1 p-2 border rounded-l"
              value={flag}
              onChange={(e) => setFlag(e.target.value)}
            />
            <button 
              onClick={submitFlag}
              className="bg-ctf-primary text-white px-4 rounded-r flex items-center"
            >
              <FlagIcon className="w-4 h-4 mr-1" />
              Submit
            </button>
          </div>
          {message && <p className="mt-2 text-sm">{message}</p>}
        </div>
      </div>
    </div>
  )
}