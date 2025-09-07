'use client'

import { useChat } from 'ai/react'
import { useEffect, useRef, useState } from 'react'

export default function ChatPage() {
  const [provider, setProvider] = useState("openai")
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chat',
    body: { provider }, // pass provider to backend
  })

  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="p-4 bg-blue-600 text-white font-bold text-lg shadow flex justify-between items-center">
        🚀 SmartGrowth AI
        <select
          value={provider}
          onChange={(e) => setProvider(e.target.value)}
          className="ml-4 border rounded px-2 py-1 text-black"
        >
          <option value="openai">OpenAI</option>
          <option value="gemini">Google Gemini</option>
        </select>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`p-3 rounded-xl max-w-[75%] ${
              m.role === 'user'
                ? 'ml-auto bg-blue-600 text-white'
                : 'mr-auto bg-gray-200 text-gray-900'
            }`}
          >
            {m.content}
          </div>
        ))}

        {isLoading && (
          <div className="mr-auto bg-gray-200 text-gray-600 px-3 py-2 rounded-xl text-sm italic">
            {provider} is thinking...
          </div>
        )}

        <div ref={messagesEndRef} />
      </main>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="p-4 flex items-center gap-2 border-t bg-white"
      >
        <input
          className="flex-1 border rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={input}
          onChange={handleInputChange}
          placeholder="Type your message..."
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  )
}
