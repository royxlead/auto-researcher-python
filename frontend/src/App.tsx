import { Sidebar } from './components/Sidebar'
import { ResearchForm } from './components/ResearchForm'
import { ReportView } from './components/ReportView'
import { LoadingState } from './components/LoadingState'
import { useResearch } from './hooks/useResearch'
import { TrendingUp, AlertCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { ErrorBoundary } from './components/ErrorBoundary'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
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
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const heroRef = useRef<HTMLDivElement>(null)
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 })
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Read ?topic= from URL (e.g. when coming from Welcome page)
  useEffect(() => {
    const topicParam = searchParams.get('topic')
    if (topicParam) {
      setSelectedTopic(topicParam)
    }
  }, [searchParams])

  useEffect(() => {
    if (biometricError) {
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current)
      errorTimerRef.current = setTimeout(() => setBiometricError(null), 5000)
    }
    return () => {
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current)
    }
  }, [biometricError])

  const handleRegisterBiometric = useCallback(async () => {
    if (!passphrase) return
    setIsUnlocking(true)
    setBiometricError(null)
    try {
      const { credentialId, keyMaterial } = await registerBiometricKey()
      const encryptedBiometric = await encryptWithRawKey(passphrase, keyMaterial)
      localStorage.setItem('webauthn-credential-id', credentialId)
      localStorage.setItem('webauthn-encrypted-passphrase', encryptedBiometric.encrypted)
      localStorage.setItem('webauthn-encryption-iv', encryptedBiometric.iv)
      const code = generateRecoveryCode()
      const encryptedRecovery = await encryptField(passphrase, code)
      localStorage.setItem('webauthn-recovery-encrypted', encryptedRecovery.encrypted)
      localStorage.setItem('webauthn-recovery-iv', encryptedRecovery.iv)
      localStorage.setItem('webauthn-recovery-salt', encryptedRecovery.salt)
      const encryptedCodeView = await encryptField(code, passphrase)
      localStorage.setItem('webauthn-recovery-code-encrypted', encryptedCodeView.encrypted)
      localStorage.setItem('webauthn-recovery-code-iv', encryptedCodeView.iv)
      localStorage.setItem('webauthn-recovery-code-salt', encryptedCodeView.salt)
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

  const handleUnlockBiometric = useCallback(async () => {
    setIsUnlocking(true)
    setBiometricError(null)
    try {
      const credentialId = localStorage.getItem('webauthn-credential-id')
      if (!credentialId) throw new Error('No biometric credential found')
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
      clearBiometricCredential()
      setHasBiometric(false)
      setPassphrase(decrypted)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Recovery failed — check your code and try again'
      setBiometricError(msg)
      throw err
    } finally {
      setIsUnlocking(false)
    }
  }, [])

  const handleDismissRecoveryCode = useCallback(() => {
    setRecoveryCode(null)
  }, [])

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

  const handleSaveHint = useCallback((hint: string) => {
    setPassphraseHint(hint)
    localStorage.setItem('webauthn-recovery-hint', hint)
  }, [])

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

  return (
    <div className="flex h-screen bg-warm-50 dark:bg-[#0c0b0a] text-warm-800 dark:text-warm-300 overflow-hidden selection:bg-primary-500 selection:text-white dark:selection:bg-primary-400 dark:selection:text-[#0c0b0a]">
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

      <main className="flex-1 flex flex-col h-full min-w-0">
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            {!currentResult && !isLoading ? (
              <motion.div
                key="hero"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                ref={heroRef}
                className="relative max-w-2xl mx-auto px-6 sm:px-8 lg:px-12 h-full flex flex-col items-center justify-center"
              >
                {/* Animated background blobs */}
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                  <div
                    className="absolute top-[20%] left-[10%] w-[400px] h-[400px] rounded-full opacity-15 dark:opacity-8 animate-float-slow"
                    style={{
                      background: 'radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)',
                    }}
                  />
                  <div
                    className="absolute bottom-[10%] right-[5%] w-[300px] h-[300px] rounded-full opacity-10 dark:opacity-5 animate-float-medium"
                    style={{
                      background: 'radial-gradient(circle, rgba(245,158,11,0.15) 0%, transparent 70%)',
                    }}
                  />
                </div>

                {/* Mouse-tracking ambient glow */}
                <div
                  className="pointer-events-none fixed top-0 left-0 w-full h-full opacity-20 dark:opacity-10"
                  style={{
                    background: `radial-gradient(600px circle at ${mousePos.x}% ${mousePos.y}%, rgba(99,102,241,0.08) 0%, rgba(245,158,11,0.03) 30%, transparent 60%)`,
                  }}
                />

                <div className="relative z-10 w-full flex flex-col items-center text-center">
                  {/* Compact hero */}
                  <div className="mb-8">
                    <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-warm-900 dark:text-warm-100 leading-[1.1]">
                      Research anything.{' '}
                      <span className="gradient-text">Instantly.</span>
                    </h1>
                    <p className="text-sm text-warm-400 mt-2 max-w-md mx-auto leading-relaxed">
                      Enter a topic to generate a comprehensive research report powered by autonomous agents.
                    </p>
                  </div>

                  {/* Form */}
                  <div className="w-full max-w-xl">
                    <div className="relative">
                      <div className="absolute -inset-4 bg-gradient-to-r from-primary-500/8 via-accent-500/5 to-primary-500/8 rounded-[24px] blur-2xl" />
                      <div className="relative">
                        <ResearchForm
                          onSubmit={handleResearch}
                          isLoading={isLoading}
                          selectedTopic={selectedTopic}
                          encryptionPassphrase={passphrase}
                        />
                      </div>
                    </div>

                    {/* Trending chips */}
                    <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                      <span className="flex items-center gap-1.5 text-[11px] text-warm-400 font-medium mr-0.5">
                        <TrendingUp className="w-3 h-3" />
                        Trending
                      </span>
                      {TRENDING_TOPICS.map((topic, i) => (
                        <button
                          key={i}
                          onClick={() => setSelectedTopic(topic)}
                          className="px-3 py-1 text-[11px] text-warm-400 hover:text-warm-700 dark:hover:text-warm-300 glass-card hover:shadow-sm transition-all duration-200"
                        >
                          {topic}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Subtle link to welcome page */}
                  <button
                    onClick={() => navigate('/')}
                    className="mt-10 text-[11px] text-warm-400 hover:text-primary-500 dark:hover:text-primary-400 transition-colors flex items-center gap-1"
                  >
                    Learn more about Auto-Researcher
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="max-w-[1440px] mx-auto px-6 sm:px-8 lg:px-10"
              >
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 flex items-center gap-3 px-5 py-4 bg-red-50/80 dark:bg-red-950/30 backdrop-blur-sm border border-red-200/60 dark:border-red-900/50 rounded-xl text-sm text-red-600 dark:text-red-400 shadow-sm"
                  >
                    <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                      <AlertCircle className="w-4 h-4" />
                    </div>
                    <p className="flex-1">{error}</p>
                  </motion.div>
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
      </main>
    </div>
  )
}

export default App
