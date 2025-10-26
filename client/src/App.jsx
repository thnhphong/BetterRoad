import { useState } from 'react'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md text-center">
        <h1 className="text-4xl font-bold text-blue-600 mb-4">
          🛣️ BetterRoad
        </h1>
        <p className="text-gray-600 mb-6">
          Road Management System
        </p>
        <div className="space-y-4">
          <button
            onClick={() => setCount((count) => count + 1)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition"
          >
            Count is {count}
          </button>
          <p className="text-sm text-gray-500">
            Click the button to test React
          </p>
        </div>
      </div>
    </div>
  )
}

export default App