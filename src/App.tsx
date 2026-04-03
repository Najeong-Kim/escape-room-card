import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import type { QuizProfile } from './lib/traitMap'
import { QuizFlow } from './components/Quiz/QuizFlow'
import { ResultCard } from './components/ResultCard/ResultCard'

export default function App() {
  const [profile, setProfile] = useState<QuizProfile | null>(null)

  return (
    <div className="min-h-dvh bg-[#0a0a0f]">
      <AnimatePresence mode="wait">
        {!profile ? (
          <QuizFlow key="quiz" onComplete={setProfile} />
        ) : (
          <ResultCard key="result" profile={profile} onReset={() => setProfile(null)} />
        )}
      </AnimatePresence>
    </div>
  )
}
