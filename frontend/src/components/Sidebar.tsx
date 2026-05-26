import { useState, useEffect } from 'react'
import { Plus, MessageSquare, Moon, Sun, History, ChevronLeft, Search, Lock, Unlock, Fingerprint, Trash2, Copy, Check, ShieldAlert, Eye, ArrowLeft, Save } from 'lucide-react'
import type { HistoryItem } from '../hooks/useResearch'
import { formatDistanceToNow } from 'date-fns'

interface Props {
  history: HistoryItem[]
  onSelect: (item: HistoryItem) => void
  onClear: () => void
  onNewChat: () => void
  passphrase: string
  onPassphraseChange: (val: string) => void
  hasBiometricCredential: boolean
  isUnlocking: boolean
  biometricError: string | null
  onRegisterBiometric: () => void
  onUnlockBiometric: () => void
  onClearBiometric: () => void
  recoveryCode: string | null
  onDismissRecoveryCode: () => void
  onRecoverWithCode: (code: string) => Promise<void>
  passphraseHint: string
  onSaveHint: (hint: string) => void
  onShowRecoveryCode: () => void
}

export function Sidebar({
  history,
  onSelect,
  onClear,
  onNewChat,
  passphrase,
  onPassphraseChange,
  hasBiometricCredential,
  isUnlocking,
  onRegisterBiometric,
  onUnlockBiometric,
  onClearBiometric,
  biometricError,
  recoveryCode,
  onDismissRecoveryCode,
  onRecoverWithCode,
  passphraseHint,
  onSaveHint,
  onShowRecoveryCode,
}: Props) {
  const [collapsed, setCollapsed] = useState(false)
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark')
    }
    return false
  })
  const [showRecoveryInput, setShowRecoveryInput] = useState(false)
  const [recoveryInputValue, setRecoveryInputValue] = useState('')
  const [recoveryCopied, setRecoveryCopied] = useState(false)
  const [recoveryRecovering, setRecoveryRecovering] = useState(false)
  const [showHintInput, setShowHintInput] = useState(false)
  const [hintDraft, setHintDraft] = useState(passphraseHint)

  // Sync hintDraft when passphraseHint changes (e.g., loaded from localStorage)
  useEffect(() => {
    setHintDraft(passphraseHint)
  }, [passphraseHint])

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark')
      localStorage.theme = 'dark'
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.theme = 'light'
    }
  }, [isDark])

  const toggleTheme = () => setIsDark(!isDark)

  const handleCopyRecoveryCode = async () => {
    if (!recoveryCode) return
    try {
      await navigator.clipboard.writeText(recoveryCode)
      setRecoveryCopied(true)
      setTimeout(() => setRecoveryCopied(false), 2000)
    } catch {
      // Fallback: select the text manually
    }
  }

  const handleRecover = async () => {
    if (!recoveryInputValue.trim()) return
    setRecoveryRecovering(true)
    try {
      await onRecoverWithCode(recoveryInputValue.trim().toLowerCase())
      setShowRecoveryInput(false)
      setRecoveryInputValue('')
    } catch {
      // Error is shown via biometricError in parent
    } finally {
      setRecoveryRecovering(false)
    }
  }

  const handleSaveHintClick = () => {
    onSaveHint(hintDraft)
    setShowHintInput(false)
  }

  return (
    <div className={`relative h-full shrink-0 transition-all duration-300 ease-out ${collapsed ? 'w-[56px]' : 'w-64'}`}>
      <div className="h-full bg-white dark:bg-[#1a1917] border-r border-warm-200 dark:border-[#2a2724] flex flex-col shadow-sm">
        {/* Header */}
        <div className={collapsed ? 'p-3 flex flex-col items-center gap-2' : 'p-4 pb-2'}>
          {collapsed ? (
            <button onClick={onNewChat} className="p-2 rounded-xl bg-gradient-to-br from-primary-600 to-primary-500 text-white hover:from-primary-500 hover:to-primary-400 shadow-sm hover:shadow transition-all duration-200">
              <Plus className="w-4 h-4" />
            </button>
          ) : (
            <>
              <div className="flex items-center justify-between mb-5 px-1">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-600 to-primary-400 flex items-center justify-center shadow-sm">
                    <Search className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-warm-800 dark:text-warm-200">Researcher</span>
                    <p className="text-[10px] text-warm-400 -mt-0.5">AI-powered</p>
                  </div>
                </div>
              </div>
              <button
                onClick={onNewChat}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white rounded-xl text-sm font-medium transition-all duration-200 shadow-sm hover:shadow"
              >
                <Plus className="w-3.5 h-3.5" />
                New chat
              </button>
            </>
          )}
        </div>

        {/* History */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className={collapsed ? 'px-2 py-3 flex flex-col items-center gap-1' : 'p-3'}>
            {!collapsed && (
              <div className="flex items-center justify-between px-2 mb-2">
                <span className="text-[11px] font-medium text-warm-400 dark:text-warm-500 uppercase tracking-wider flex items-center gap-1.5">
                  <History className="w-3 h-3" />
                  History
                </span>
                {history.length > 0 && (
                  <button onClick={onClear} className="text-[10px] text-warm-400 hover:text-red-500 transition-colors px-1.5 py-0.5 rounded hover:bg-red-50 dark:hover:bg-red-950">
                    Clear
                  </button>
                )}
              </div>
            )}

            {history.length === 0 ? (
              !collapsed && (
                <div className="text-center py-10">
                  <div className="w-10 h-10 rounded-xl bg-warm-100 dark:bg-[#2a2724] flex items-center justify-center mx-auto mb-3">
                    <MessageSquare className="w-4 h-4 text-warm-400" />
                  </div>
                  <p className="text-xs text-warm-400">No history yet</p>
                  <p className="text-[10px] text-warm-300 mt-1">Start a research to see it here</p>
                </div>
              )
            ) : collapsed ? (
              <div className="space-y-1">
                {history.slice(0, 8).map((item) => (
                  <button
                    key={item.id}
                    onClick={() => onSelect(item)}
                    className="w-9 h-9 rounded-xl bg-warm-50 dark:bg-[#121110] border border-warm-200 dark:border-[#2a2724] hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-sm transition-all duration-200 flex items-center justify-center shrink-0"
                    title={item.topic}
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-warm-400" />
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-0.5">
                {history.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => onSelect(item)}
                    className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-warm-50 dark:hover:bg-[#121110] transition-all duration-200 group border border-transparent hover:border-warm-200 dark:hover:border-[#2a2724]"
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="w-6 h-6 rounded-lg bg-warm-100 dark:bg-[#2a2724] flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-primary-100 dark:group-hover:bg-primary-950 transition-colors">
                        <MessageSquare className="w-3 h-3 text-warm-400 group-hover:text-primary-500 transition-colors" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm text-warm-700 dark:text-warm-300 line-clamp-1 group-hover:text-warm-900 dark:group-hover:text-warm-100 transition-colors">
                          {item.topic}
                        </p>
                        <p className="text-[11px] text-warm-400 mt-0.5">
                          {formatDistanceToNow(item.timestamp, { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full border border-warm-200 dark:border-[#2a2724] bg-white dark:bg-[#1a1917] flex items-center justify-center text-warm-400 hover:text-warm-600 dark:hover:text-warm-300 shadow-sm hover:shadow transition-all duration-200 z-10"
        >
          <ChevronLeft className={`w-3 h-3 transition-transform duration-200 ${collapsed ? 'rotate-180' : ''}`} />
        </button>

        {/* Footer */}
        <div className="border-t border-warm-200 dark:border-[#2a2724]">
          {/* Zero-knowledge section */}
          {!collapsed && (
            <div className="px-3 pt-2.5 pb-1.5">
              <label className="text-[10px] font-medium text-warm-400 dark:text-warm-500 uppercase tracking-wider flex items-center gap-1 mb-1.5">
                {passphrase ? (
                  <><Lock className="w-2.5 h-2.5 text-emerald-500" /> Encryption active</>
                ) : hasBiometricCredential ? (
                  <><Fingerprint className="w-2.5 h-2.5 text-primary-500" /> Biometric ready</>
                ) : (
                  <><Unlock className="w-2.5 h-2.5 text-warm-400" /> Session passphrase</>
                )}
              </label>

              {/* Biometric error */}
              {biometricError && (
                <div className="mb-2 px-2.5 py-1.5 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg text-[10px] text-red-600 dark:text-red-400 leading-tight">
                  {biometricError}
                </div>
              )}

              {/* ── RECOVERY CODE DISPLAY (shown right after biometric registration) ── */}
              {recoveryCode && (
                <div className="mb-2 p-2.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl space-y-2">
                  <div className="flex items-start gap-2">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 leading-tight">
                        Recovery code saved
                      </p>
                      <p className="text-[9px] text-amber-600 dark:text-amber-500 leading-tight mt-0.5">
                        Save this code somewhere safe — it's the only way to unlock your passphrase if you lose biometric access.
                      </p>
                    </div>
                  </div>

                  {/* Recovery code box */}
                  <div className="flex items-stretch gap-1">
                    <div className="flex-1 min-w-0 px-2 py-1.5 bg-white dark:bg-[#121110] border border-amber-200 dark:border-amber-800 rounded-lg font-mono text-[10px] text-amber-800 dark:text-amber-300 tracking-wide select-all break-all leading-relaxed">
                      {recoveryCode}
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyRecoveryCode}
                      className="px-2 py-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-800/30 transition-all duration-200 shrink-0"
                      title={recoveryCopied ? 'Copied!' : 'Copy code'}
                    >
                      {recoveryCopied ? (
                        <Check className="w-3 h-3" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>

                  {/* Hint field */}
                  <div className="space-y-1">
                    <label className="text-[9px] text-amber-600 dark:text-amber-500 font-medium">
                      Optional hint (reminds you of your passphrase)
                    </label>
                    <div className="flex items-stretch gap-1">
                      <input
                        type="text"
                        value={hintDraft}
                        onChange={(e) => setHintDraft(e.target.value)}
                        placeholder="e.g., my usual research password"
                        maxLength={100}
                        className="flex-1 min-w-0 px-2 py-1.5 text-[10px] rounded-lg border border-amber-200 dark:border-amber-800 bg-white dark:bg-[#121110] text-amber-700 dark:text-amber-300 placeholder:text-amber-400/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30 transition-all duration-200"
                      />
                      <button
                        type="button"
                        onClick={handleSaveHintClick}
                        className="px-2 py-1 rounded-lg bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-800/30 transition-all duration-200 shrink-0"
                        title="Save hint"
                      >
                        <Save className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Dismiss */}
                  <button
                    type="button"
                    onClick={onDismissRecoveryCode}
                    className="w-full py-1.5 text-[10px] font-medium text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 hover:bg-amber-200 dark:hover:bg-amber-800/30 rounded-lg transition-all duration-200"
                  >
                    I've saved it — dismiss
                  </button>
                </div>
              )}

              {/* ── BIOMETRIC UNLOCK VIEW ── */}
              {hasBiometricCredential && !passphrase && !recoveryCode && !showRecoveryInput && (
                <>
                  <button
                    type="button"
                    onClick={onUnlockBiometric}
                    disabled={isUnlocking}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-primary-50 dark:bg-primary-950/30 border border-primary-200 dark:border-primary-800 rounded-lg text-xs font-medium text-primary-700 dark:text-primary-300 hover:bg-primary-100 dark:hover:bg-primary-900/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    {isUnlocking ? (
                      <>
                        <span className="w-3 h-3 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
                        Unlocking...
                      </>
                    ) : (
                      <>
                        <Fingerprint className="w-3.5 h-3.5" />
                        Unlock with biometric
                      </>
                    )}
                  </button>

                  {/* Recovery link */}
                  <button
                    type="button"
                    onClick={() => setShowRecoveryInput(true)}
                    className="w-full text-[10px] text-warm-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors mt-1 py-1"
                  >
                    Lost biometric? Use recovery code
                  </button>
                </>
              )}

              {/* ── RECOVERY INPUT VIEW ── */}
              {hasBiometricCredential && !passphrase && showRecoveryInput && (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => { setShowRecoveryInput(false); setRecoveryInputValue('') }}
                    className="flex items-center gap-1 text-[10px] text-warm-400 hover:text-warm-600 dark:hover:text-warm-300 transition-colors"
                  >
                    <ArrowLeft className="w-2.5 h-2.5" />
                    Back to biometric unlock
                  </button>

                  <p className="text-[10px] font-medium text-warm-600 dark:text-warm-400">
                    {passphraseHint ? (
                      <>Hint: <span className="text-warm-500 dark:text-warm-500 italic">{passphraseHint}</span></>
                    ) : (
                      'Enter your recovery code to unlock'
                    )}
                  </p>

                  <div className="flex items-stretch gap-1">
                    <input
                      type="text"
                      value={recoveryInputValue}
                      onChange={(e) => setRecoveryInputValue(e.target.value.toLowerCase())}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleRecover() }}
                      placeholder="e.g., apple-coral-quill-tiger-zeal"
                      autoFocus
                      className="flex-1 min-w-0 px-2.5 py-1.5 text-[10px] rounded-lg border border-warm-200 dark:border-[#2a2724] bg-warm-50 dark:bg-[#121110] text-warm-700 dark:text-warm-300 focus:outline-none focus:ring-1 focus:ring-primary-500/30 placeholder:text-warm-400 font-mono transition-all duration-200"
                    />
                    <button
                      type="button"
                      onClick={handleRecover}
                      disabled={recoveryRecovering || !recoveryInputValue.trim()}
                      className="px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-white text-[10px] font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shrink-0"
                    >
                      {recoveryRecovering ? (
                        <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin block" />
                      ) : (
                        'Recover'
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* ── PASSPHRASE ACTIVE VIEW ── */}
              {passphrase && !recoveryCode && (
                <>
                  <div className="flex items-stretch gap-1.5">
                    <input
                      type="password"
                      value={passphrase}
                      onChange={(e) => onPassphraseChange(e.target.value)}
                      readOnly={hasBiometricCredential}
                      className={`flex-1 min-w-0 px-2.5 py-1.5 text-xs rounded-lg border transition-all duration-200 ${
                        hasBiometricCredential
                          ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 cursor-default'
                          : 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                      } focus:outline-none focus:ring-1 focus:ring-primary-500/30`}
                    />
                    {!hasBiometricCredential && (
                      <button
                        type="button"
                        onClick={onRegisterBiometric}
                        disabled={isUnlocking}
                        className="px-2 py-1.5 rounded-lg bg-primary-50 dark:bg-primary-950/30 border border-primary-200 dark:border-primary-800 text-primary-600 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-900/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shrink-0"
                        title="Enable biometric unlock"
                      >
                        {isUnlocking ? (
                          <span className="w-3.5 h-3.5 border-2 border-primary-400 border-t-transparent rounded-full animate-spin block" />
                        ) : (
                          <Fingerprint className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>

                  {/* Recovery options (only when biometric is enrolled) */}
                  {hasBiometricCredential && (
                    <div className="mt-1.5 space-y-1">
                      {/* Hint input */}
                      {showHintInput ? (
                        <div className="flex items-stretch gap-1">
                          <input
                            type="text"
                            value={hintDraft}
                            onChange={(e) => setHintDraft(e.target.value)}
                            placeholder="Recovery hint (reminds you of passphrase)"
                            maxLength={100}
                            className="flex-1 min-w-0 px-2 py-1 text-[10px] rounded-lg border border-warm-200 dark:border-[#2a2724] bg-warm-50 dark:bg-[#121110] text-warm-700 dark:text-warm-300 focus:outline-none focus:ring-1 focus:ring-primary-500/30 placeholder:text-warm-400 transition-all duration-200"
                          />
                          <button
                            type="button"
                            onClick={handleSaveHintClick}
                            className="px-1.5 py-1 rounded-lg bg-primary-50 dark:bg-primary-950/30 border border-primary-200 dark:border-primary-800 text-primary-600 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-all duration-200 shrink-0"
                            title="Save hint"
                          >
                            <Save className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setShowHintInput(true)}
                          className="text-[9px] text-warm-400 hover:text-warm-600 dark:hover:text-warm-300 transition-colors"
                        >
                          {passphraseHint
                            ? <>Hint: <span className="italic">{passphraseHint}</span> — edit</>
                            : 'Add a recovery hint'}
                        </button>
                      )}

                      {/* View recovery code button */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={onShowRecoveryCode}
                          className="text-[9px] text-warm-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors flex items-center gap-0.5"
                        >
                          <Eye className="w-2.5 h-2.5" />
                          View recovery code
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Status text + remove biometric */}
                  <div className="flex items-center gap-1 mt-1">
                    <p className="text-[9px] text-warm-400 leading-tight flex-1">
                      {hasBiometricCredential
                        ? 'Unlocked — passphrase in memory for this session'
                        : 'API keys encrypted end-to-end'}
                    </p>
                    {hasBiometricCredential && (
                      <button
                        type="button"
                        onClick={onClearBiometric}
                        className="text-[9px] text-warm-400 hover:text-red-500 dark:hover:text-red-400 transition-colors flex items-center gap-0.5 px-1 py-0.5 rounded hover:bg-red-50 dark:hover:bg-red-950"
                      >
                        <Trash2 className="w-2.5 h-2.5" />
                        Remove
                      </button>
                    )}
                  </div>
                </>
              )}

              {/* ── NO PASSPHRASE, NO BIOMETRIC ── */}
              {!passphrase && !hasBiometricCredential && !recoveryCode && (
                <>
                  <input
                    type="password"
                    value={passphrase}
                    onChange={(e) => onPassphraseChange(e.target.value)}
                    placeholder="Set a passphrase..."
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-warm-200 dark:border-[#2a2724] bg-warm-50 dark:bg-[#121110] text-warm-700 dark:text-warm-300 focus:outline-none focus:ring-1 focus:ring-primary-500/30 placeholder:text-warm-400 transition-all duration-200"
                  />
                  <p className="text-[9px] text-warm-400 mt-1 leading-tight">
                    Unset — API keys sent in plaintext
                  </p>
                </>
              )}
            </div>
          )}

          <div className={collapsed ? 'p-3 flex flex-col items-center gap-2' : 'p-3'}>
            {collapsed ? (
              <button onClick={toggleTheme} className="p-2 rounded-xl hover:bg-warm-50 dark:hover:bg-[#121110] transition-colors text-warm-400 hover:text-warm-600 dark:hover:text-warm-300">
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            ) : (
              <button onClick={toggleTheme} className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl hover:bg-warm-50 dark:hover:bg-[#121110] transition-all duration-200 text-sm text-warm-500 dark:text-warm-400">
                <div className="w-7 h-7 rounded-lg bg-warm-100 dark:bg-[#2a2724] flex items-center justify-center">
                  {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                </div>
                <span>{isDark ? 'Light' : 'Dark'} mode</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
