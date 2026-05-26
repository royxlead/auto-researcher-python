import { Sidebar } from './components/Sidebar'
import { ResearchForm } from './components/ResearchForm'
import { ReportView } from './components/ReportView'
import { LoadingState } from './components/LoadingState'
import { useResearch } from './hooks/useResearch'
import { AlertCircle, TrendingUp, BookOpen, Network, FileSearch } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { ErrorBoundary } from './components/ErrorBoundary'
import { useState, useEffect, useRef, useCallback } from 'react'
import {
  hasBiometricCredential,
  getRecoveryHint,
  generateRecoveryCode,
  registerBiometricKey,
  unlockWithBiometric,
  clearBiometricCredential,
} from './lib/webauthn'
import { encryptWithRawKey, decryptWithRawKey, encryptField, decryptField } from './lib/crypto'

const TRENDING_TOPICS = [
  "Future of Solid State Batteries",
  "CRISPR Gene Editing Ethics",
  "Impact of AI on Labor Markets",
  "Quantum Computing in 2025",
  "Sustainable Urban Planning"
]

function App() {
  const {
    isLoading,
    error,
    currentResult,
    history,
    executeResearch,
    stopResearch,
    clearHistory,
    setCurrentResult
  } = useResearch()

  const [selectedTopic, setSelectedTopic] = useState<string>("")
  const [passphrase, setPassphrase] = useState('')
  const [hasBiometric, setHasBiometric] = useState(() => hasBiometricCredential())
  const [isUnlocking, setIsUnlocking] = useState(false)
  const [biometricError, setBiometricError] = useState<string | null>(null)
  const [recoveryCode, setRecoveryCode] = useState<string | null>(null)
  const [passphraseHint, setPassphraseHint] = useState(() => getRecoveryHint())
  const heroRef = useRef<HTMLDivElement>(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Auto-clear biometric error after 5 seconds
  useEffect(() => {
    if (biometricError) {
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current)
      errorTimerRef.current = setTimeout(() => setBiometricError(null), 5000)
    }
    return () => {
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current)
    }
  }, [biometricError])

  // Register biometric credential — encrypt passphrase + generate recovery code
  const handleRegisterBiometric = useCallback(async () => {
    if (!passphrase) return
    setIsUnlocking(true)
    setBiometricError(null)
    try {
      const { credentialId, keyMaterial } = await registerBiometricKey()

      // 1. Encrypt passphrase with PRF key (biometric unlock)
      const encryptedBiometric = await encryptWithRawKey(passphrase, keyMaterial)
      localStorage.setItem('webauthn-credential-id', credentialId)
      localStorage.setItem('webauthn-encrypted-passphrase', encryptedBiometric.encrypted)
      localStorage.setItem('webauthn-encryption-iv', encryptedBiometric.iv)

      // 2. Generate a recovery code and encrypt passphrase with it
      const code = generateRecoveryCode()
      const encryptedRecovery = await encryptField(passphrase, code)
      localStorage.setItem('webauthn-recovery-encrypted', encryptedRecovery.encrypted)
      localStorage.setItem('webauthn-recovery-iv', encryptedRecovery.iv)
      localStorage.setItem('webauthn-recovery-salt', encryptedRecovery.salt)

      // 3. Also encrypt the recovery code with the passphrase (for viewing later)
      const encryptedCodeView = await encryptField(code, passphrase)
      localStorage.setItem('webauthn-recovery-code-encrypted', encryptedCodeView.encrypted)
      localStorage.setItem('webauthn-recovery-code-iv', encryptedCodeView.iv)
      localStorage.setItem('webauthn-recovery-code-salt', encryptedCodeView.salt)

      // 4. Save current hint
      localStorage.setItem('webauthn-recovery-hint', passphraseHint)

      setHasBiometric(true)
      setRecoveryCode(code)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Biometric registration failed'
      setBiometricError(msg)
    } finally {
      setIsUnlocking(false)
    }
  }, [passphrase, passphraseHint])

  // Unlock with biometric — decrypt stored passphrase
  const handleUnlockBiometric = useCallback(async () => {
    setIsUnlocking(true)
    setBiometricError(null)
    try {
      const credentialId = localStorage.getItem('webauthn-credential-id')
      if (!credentialId) {
        throw new Error('No biometric credential found')
      }

      const keyMaterial = await unlockWithBiometric(credentialId)

      const encryptedPayload = {
        encrypted: localStorage.getItem('webauthn-encrypted-passphrase') || '',
        iv: localStorage.getItem('webauthn-encryption-iv') || '',
        salt: '',
      }

      const decrypted = await decryptWithRawKey(encryptedPayload, keyMaterial)
      setPassphrase(decrypted)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Biometric unlock failed'
      setBiometricError(msg)
    } finally {
      setIsUnlocking(false)
    }
  }, [])

  // Recover passphrase using the emergency recovery code
  const handleRecoverWithCode = useCallback(async (code: string) => {
    setIsUnlocking(true)
    setBiometricError(null)
    try {
      const payload = {
        encrypted: localStorage.getItem('webauthn-recovery-encrypted') || '',
        iv: localStorage.getItem('webauthn-recovery-iv') || '',
        salt: localStorage.getItem('webauthn-recovery-salt') || '',
      }

      if (!payload.encrypted || !payload.iv || !payload.salt) {
        throw new Error('No recovery data found. Did you set up biometric unlock?')
      }

      const decrypted = await decryptField(payload, code)

      // Clean up biometric credential since it's dead
      clearBiometricCredential()
      setHasBiometric(false)

      setPassphrase(decrypted)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Recovery failed — check your code and try again'
      setBiometricError(msg)
      throw err // let Sidebar know it failed
    } finally {
      setIsUnlocking(false)
    }
  }, [])

  // Dismiss the recovery code display after user has saved it
  const handleDismissRecoveryCode = useCallback(() => {
    setRecoveryCode(null)
  }, [])

  // Show stored recovery code again (requires passphrase in memory)
  const handleShowRecoveryCode = useCallback(async () => {
    if (!passphrase) return
    try {
      const payload = {
        encrypted: localStorage.getItem('webauthn-recovery-code-encrypted') || '',
        iv: localStorage.getItem('webauthn-recovery-code-iv') || '',
        salt: localStorage.getItem('webauthn-recovery-code-salt') || '',
      }
      const code = await decryptField(payload, passphrase)
      setRecoveryCode(code)
    } catch {
      setBiometricError('Could not load recovery code — passphrase mismatch')
    }
  }, [passphrase])

  // Save hint to localStorage
  const handleSaveHint = useCallback((hint: string) => {
    setPassphraseHint(hint)
    localStorage.setItem('webauthn-recovery-hint', hint)
  }, [])

  // Clear biometric credential
  const handleClearBiometric = useCallback(() => {
    clearBiometricCredential()
    setHasBiometric(false)
    setPassphraseHint('')
  }, [])

  useEffect(() => {
    const handleMouse = (e: MouseEvent) => {
      if (heroRef.current) {
        const rect = heroRef.current.getBoundingClientRect()
        setMousePos({
          x: ((e.clientX - rect.left) / rect.width) * 100,
          y: ((e.clientY - rect.top) / rect.height) * 100
        })
      }
    }
    window.addEventListener('mousemove', handleMouse)
    return () => window.removeEventListener('mousemove', handleMouse)
  }, [])

  const handleResearch = (
    topic: string,
    depth: number,
    numPapers: number,
    provider: string,
    apiKey?: string,
    model?: string,
    strictness?: number,
    encryptedApiKey?: string,
    encryptionIv?: string,
    encryptionSalt?: string
  ) => {
    executeResearch({
      topic,
      max_depth: depth,
      num_papers: numPapers,
      provider,
      openrouter_api_key: apiKey,
      api_key: apiKey,
      model,
      critic_strictness: strictness,
      encrypted_api_key: encryptedApiKey,
      encryption_iv: encryptionIv,
      encryption_salt: encryptionSalt,
      encryption_passphrase: passphrase,
    })
  }

  const heroVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.05 }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } }
  }

  return (
    <div className="flex h-screen bg-warm-50 dark:bg-[#121110] text-warm-800 dark:text-warm-300 overflow-hidden selection:bg-primary-500 selection:text-white dark:selection:bg-primary-400 dark:selection:text-[#121110]">
      {/* Sidebar */}
      <Sidebar
        history={history}
        onSelect={setCurrentResult}
        onClear={clearHistory}
        onNewChat={() => setCurrentResult(null)}
        passphrase={passphrase}
        onPassphraseChange={setPassphrase}
        hasBiometricCredential={hasBiometric}
        isUnlocking={isUnlocking}
        biometricError={biometricError}
        onRegisterBiometric={handleRegisterBiometric}
        onUnlockBiometric={handleUnlockBiometric}
        onClearBiometric={handleClearBiometric}
        recoveryCode={recoveryCode}
        onDismissRecoveryCode={handleDismissRecoveryCode}
        onRecoverWithCode={handleRecoverWithCode}
        passphraseHint={passphraseHint}
        onSaveHint={handleSaveHint}
        onShowRecoveryCode={handleShowRecoveryCode}
      />

      {/* Main */}
      <main className="flex-1 flex flex-col h-full min-w-0">
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-8 py-12 lg:py-16">
            <AnimatePresence mode="wait">
              {!currentResult && !isLoading ? (
                <motion.div
                  key="hero"
                  variants={heroVariants}
                  initial="hidden"
                  animate="visible"
                  exit={{ opacity: 0 }}
                  ref={heroRef}
                  className="relative"
                >
                  {/* Ambient glow that follows mouse */}
                  <div
                    className="pointer-events-none absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full opacity-40 dark:opacity-50"
                    style={{
                      background: `radial-gradient(circle at ${mousePos.x}% ${mousePos.y}%, rgba(99,102,241,0.10) 0%, rgba(245,158,11,0.05) 40%, transparent 70%)`,
                      transition: 'background 0.3s ease'
                    }}
                  />

                  <div className="relative z-10 flex flex-col items-center text-center">
                    {/* Brand badge */}
                    <motion.div variants={itemVariants} className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white dark:bg-[#1a1917] border border-warm-200 dark:border-[#2a2724] shadow-sm text-xs font-medium text-warm-500 dark:text-warm-400 mb-8">
                      <div className="w-2 h-2 rounded-full bg-primary-500" />
                      AI-Powered Research Assistant
                    </motion.div>

                    {/* Hero text */}
                    <motion.div variants={itemVariants} className="space-y-3">
                      <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-warm-900 dark:text-warm-100 leading-[1.05] max-w-2xl">
                        Research anything.{' '}
                        <span className="bg-gradient-to-r from-primary-600 to-primary-400 dark:from-primary-400 dark:to-primary-300 bg-clip-text text-transparent">Instantly.</span>
                      </h1>
                      <p className="text-base sm:text-lg text-warm-500 dark:text-warm-400 max-w-lg mx-auto leading-relaxed">
                        Autonomous agents search, analyze, and synthesize academic papers into comprehensive reports.
                      </p>
                    </motion.div>

                    {/* Form */}
                    <motion.div variants={itemVariants} className="w-full max-w-xl mt-10">
                      <div className="relative">
                        {/* Subtle glow behind form */}
                        <div className="absolute -inset-8 bg-gradient-to-r from-primary-500/5 via-accent-500/5 to-primary-500/5 rounded-[32px] blur-2xl" />
                        <div className="relative">
                          <ResearchForm
                            onSubmit={handleResearch}
                            isLoading={isLoading}
                            selectedTopic={selectedTopic}
                            encryptionPassphrase={passphrase}
                          />
                        </div>
                      </div>

                      {/* Trending */}
                      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                        <span className="flex items-center gap-1 text-xs text-warm-400 font-medium mr-0.5">
                          <TrendingUp className="w-3 h-3" />
                          Trending
                        </span>
                        {TRENDING_TOPICS.map((topic, i) => (
                          <button
                            key={i}
                            onClick={() => setSelectedTopic(topic)}
                            className="px-3 py-1 text-xs text-warm-500 dark:text-warm-400 hover:text-warm-800 dark:hover:text-warm-200 bg-white dark:bg-[#1a1917] hover:bg-warm-100 dark:hover:bg-[#2a2724] border border-warm-200 dark:border-[#2a2724] rounded-full transition-all duration-200 shadow-sm hover:shadow"
                          >
                            {topic}
                          </button>
                        ))}
                      </div>
                    </motion.div>

                    {/* Features */}
                    <motion.div variants={itemVariants} className="w-full max-w-xl mt-16 pt-12 border-t border-warm-200 dark:border-[#2a2724]">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {[
                          { icon: FileSearch, label: "Multi-agent pipeline", desc: "Research, draft, critique", color: "text-primary-500" },
                          { icon: BookOpen, label: "Academic sources", desc: "ArXiv & repositories", color: "text-accent-500" },
                          { icon: Network, label: "Structured reports", desc: "Markdown with citations", color: "text-emerald-500" }
                        ].map((f, i) => (
                          <div key={i} className="group card-subtle p-4 text-left cursor-default">
                            <div className={`w-8 h-8 rounded-lg bg-white dark:bg-[#121110] border border-warm-200 dark:border-[#2a2724] flex items-center justify-center mb-3 group-hover:border-primary-200 dark:group-hover:border-primary-800 transition-colors`}>
                              <f.icon className={`w-4 h-4 ${f.color}`} />
                            </div>
                            <div className="text-sm font-semibold text-warm-800 dark:text-warm-200">{f.label}</div>
                            <div className="text-xs text-warm-400 mt-0.5">{f.desc}</div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="results"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] as const }}
                >
                  {error && (
                    <div className="mb-6 flex items-center gap-2.5 px-4 py-3.5 bg-red-50 dark:bg-red-950 border border-red-100 dark:border-red-900 rounded-xl text-sm text-red-600 dark:text-red-400 shadow-sm">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <p>{error}</p>
                    </div>
                  )}

                  {isLoading ? (
                    <LoadingState onStop={stopResearch} />
                  ) : currentResult ? (
                    <ErrorBoundary>
                      <ReportView data={currentResult} />
                    </ErrorBoundary>
                  ) : null}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
