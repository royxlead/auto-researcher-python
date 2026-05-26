import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Shuffle, Zap, BookOpen, Scale, Globe, Cpu, Key, Sliders, ChevronDown, ArrowRight, Star, Check } from 'lucide-react'
import { encryptField } from '../lib/crypto'

interface Props {
  onSubmit: (
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
  ) => void
  isLoading: boolean
  selectedTopic?: string
  encryptionPassphrase?: string
}

const PROVIDERS = [
  { value: "ollama", label: "Ollama (Local)", needsKey: false, defaultModel: "llama3" },
  { value: "openrouter", label: "OpenRouter", needsKey: true, defaultModel: "x-ai/grok-4.1-fast", apiKeyPlaceholder: "sk-or-..." },
  { value: "openai", label: "OpenAI", needsKey: true, defaultModel: "gpt-4o", apiKeyPlaceholder: "sk-proj-..." },
  { value: "anthropic", label: "Anthropic", needsKey: true, defaultModel: "claude-sonnet-4-20250514", apiKeyPlaceholder: "sk-ant-..." },
  { value: "google", label: "Google (Gemini)", needsKey: true, defaultModel: "gemini-2.0-flash", apiKeyPlaceholder: "AIza..." },
  { value: "perplexity", label: "Perplexity", needsKey: true, defaultModel: "sonar-pro", apiKeyPlaceholder: "pplx-..." },
  { value: "groq", label: "Groq", needsKey: true, defaultModel: "mixtral-8x7b-32768", apiKeyPlaceholder: "gsk_..." },
  { value: "together", label: "Together AI", needsKey: true, defaultModel: "mistralai/Mixtral-8x22B-Instruct-v0.1", apiKeyPlaceholder: "tgp-..." },
  { value: "deepseek", label: "DeepSeek", needsKey: true, defaultModel: "deepseek-chat", apiKeyPlaceholder: "sk-..." },
  { value: "mistral", label: "Mistral AI", needsKey: true, defaultModel: "mistral-large-latest", apiKeyPlaceholder: "x_..." },
]

const FAVORITES_KEY = 'research-provider-favorites'

const SHORT_LABEL: Record<string, string> = {
  ollama: 'Ollama',
  openrouter: 'OpenRouter',
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  google: 'Gemini',
  perplexity: 'Perplexity',
  groq: 'Groq',
  together: 'Together',
  deepseek: 'DeepSeek',
  mistral: 'Mistral',
}

const SURPRISE_TOPICS = [
  "The impact of quantum computing on cryptography",
  "Biomimicry in sustainable architecture",
  "The role of gut microbiome in mental health",
  "Future of fusion energy reactors",
  "Ethical implications of brain-computer interfaces",
  "Dark matter detection methodologies",
  "CRISPR applications in agriculture",
  "The history of non-Euclidean geometry",
  "Socio-economic effects of universal basic income",
  "Plastic degradation by bacteria"
]

export function ResearchForm({ onSubmit, isLoading, selectedTopic, encryptionPassphrase }: Props) {
  const [topic, setTopic] = useState('')
  const [depth, setDepth] = useState(3)
  const [numPapers, setNumPapers] = useState(10)
  const [strictness, setStrictness] = useState(5)
  const [provider, setProvider] = useState('ollama')
  const [apiKey, setApiKey] = useState('')
  const [model, setModel] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(FAVORITES_KEY)
      return stored ? JSON.parse(stored) : ['ollama', 'openai']
    } catch {
      return ['ollama', 'openai']
    }
  })
  const [providerSearchOpen, setProviderSearchOpen] = useState(false)
  const [providerSearch, setProviderSearch] = useState('')
  const [highlightedIdx, setHighlightedIdx] = useState(0)
  const comboboxRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites))
  }, [favorites])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (comboboxRef.current && !comboboxRef.current.contains(e.target as Node)) {
        setProviderSearchOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const toggleFavorite = (value: string) => {
    setFavorites(prev =>
      prev.includes(value)
        ? prev.filter(v => v !== value)
        : [...prev, value]
    )
  }

  const selectProvider = (val: string) => {
    const prov = PROVIDERS.find(p => p.value === val)
    setProvider(val)
    setModel(prov?.defaultModel || '')
    setProviderSearchOpen(false)
    setProviderSearch('')
  }

  const filteredProviders = PROVIDERS.filter(p =>
    p.label.toLowerCase().includes(providerSearch.toLowerCase())
  )

  useEffect(() => {
    if (providerSearchOpen) {
      setHighlightedIdx(0)
    }
  }, [providerSearch, providerSearchOpen])

  useEffect(() => {
    if (selectedTopic) setTopic(selectedTopic)
  }, [selectedTopic])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!topic.trim()) return

    let encApiKey: string | undefined
    let encIv: string | undefined
    let encSalt: string | undefined

    // Zero-knowledge: encrypt API key client-side if passphrase is set
    if (encryptionPassphrase && apiKey) {
      const prov = PROVIDERS.find(p => p.value === provider)
      if (prov?.needsKey) {
        try {
          const result = await encryptField(apiKey, encryptionPassphrase)
          encApiKey = result.encrypted
          encIv = result.iv
          encSalt = result.salt
        } catch (err) {
          console.error('Encryption failed, falling back to plaintext', err)
        }
      }
    }

    onSubmit(topic, depth, numPapers, provider, apiKey, model, strictness, encApiKey, encIv, encSalt)
  }

  const handleSurpriseMe = () => {
    const randomTopic = SURPRISE_TOPICS[Math.floor(Math.random() * SURPRISE_TOPICS.length)]
    setTopic(randomTopic)
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      {/* Input */}
      <div className="group relative">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary-500/20 via-accent-500/10 to-primary-500/20 rounded-[14px] opacity-0 group-focus-within:opacity-100 blur-sm transition-opacity duration-300" />
        <div className="relative flex items-start gap-3 px-4 py-3.5 bg-white dark:bg-[#1a1917] border border-warm-200 dark:border-[#2a2724] rounded-xl focus-within:border-primary-400 dark:focus-within:border-primary-600 transition-all duration-200 shadow-sm group-focus-within:shadow-md">
          <Search className="w-5 h-5 text-warm-400 mt-2.5 shrink-0 group-focus-within:text-primary-500 transition-colors" />
          <div className="flex-1 relative">
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="What topic do you want to research?"
              className="w-full bg-transparent border-none text-base text-warm-800 dark:text-warm-100 placeholder-warm-400 focus:ring-0 focus:outline-none resize-none min-h-[44px] leading-relaxed pr-24"
              rows={2}
              required
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSubmit(e)
                }
              }}
            />
            {!topic && (
              <button
                type="button"
                onClick={handleSurpriseMe}
                className="absolute right-0 top-1 text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-all duration-200 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-950"
              >
                <Shuffle className="w-3 h-3" />
                Surprise me
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={isLoading || !topic.trim()}
            className="mt-1 p-2.5 rounded-lg bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 disabled:from-warm-300 disabled:to-warm-300 dark:disabled:from-warm-700 dark:disabled:to-warm-700 text-white disabled:text-warm-400 dark:disabled:text-warm-500 transition-all duration-200 shadow-sm hover:shadow shrink-0 disabled:cursor-not-allowed"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Advanced toggle */}
      <div className="flex justify-center mt-3">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-1.5 text-xs text-warm-400 hover:text-warm-600 dark:hover:text-warm-300 transition-colors px-3 py-1.5 rounded-lg hover:bg-warm-100 dark:hover:bg-[#2a2724]"
        >
          <Sliders className="w-3 h-3" />
          {showAdvanced ? 'Hide options' : 'Options'}
          <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${showAdvanced ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Advanced options */}
      <AnimatePresence>
        {showAdvanced && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 pt-4 border-t border-warm-200 dark:border-[#2a2724]">
              {/* Depth */}
              <div className="card-subtle p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="flex items-center gap-1.5 text-xs font-medium text-warm-600 dark:text-warm-400">
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    Depth
                  </span>
                  <span className="text-xs text-warm-400 font-mono bg-warm-100 dark:bg-[#2a2724] px-2 py-0.5 rounded">{depth}</span>
                </div>
                <input type="range" min="1" max="10" value={depth} onChange={(e) => setDepth(Number(e.target.value))} className="w-full" />
                <div className="flex justify-between text-[10px] text-warm-400 mt-1">
                  <span>Fast</span>
                  <span>Deep</span>
                </div>
              </div>

              {/* Papers */}
              <div className="card-subtle p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="flex items-center gap-1.5 text-xs font-medium text-warm-600 dark:text-warm-400">
                    <BookOpen className="w-3.5 h-3.5 text-primary-500" />
                    Sources
                  </span>
                  <span className="text-xs text-warm-400 font-mono bg-warm-100 dark:bg-[#2a2724] px-2 py-0.5 rounded">{numPapers}</span>
                </div>
                <input type="range" min="5" max="50" step="5" value={numPapers} onChange={(e) => setNumPapers(Number(e.target.value))} className="w-full" />
                <div className="flex justify-between text-[10px] text-warm-400 mt-1">
                  <span>Brief</span>
                  <span>Extensive</span>
                </div>
              </div>

              {/* Strictness */}
              <div className="card-subtle p-4 sm:col-span-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="flex items-center gap-1.5 text-xs font-medium text-warm-600 dark:text-warm-400">
                    <Scale className="w-3.5 h-3.5 text-rose-500" />
                    Critic strictness
                  </span>
                  <span className="text-xs text-warm-400 font-mono bg-warm-100 dark:bg-[#2a2724] px-2 py-0.5 rounded">{strictness}/10</span>
                </div>
                <input type="range" min="1" max="10" value={strictness} onChange={(e) => setStrictness(Number(e.target.value))} className="w-full" />
                <div className="flex justify-between text-[10px] text-warm-400 mt-1">
                  <span>Lenient</span>
                  <span>Rigorous</span>
                </div>
              </div>

              {/* Provider & Model */}
              <div className="sm:col-span-2 pt-3 mt-1 border-t border-warm-100 dark:border-[#2a2724]">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-warm-500 dark:text-warm-400 flex items-center gap-1.5">
                      <Globe className="w-3 h-3 text-primary-500" />
                      Provider
                    </label>

                    {/* Favorites row */}
                    {favorites.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {favorites.map(favVal => {
                          const favProv = PROVIDERS.find(p => p.value === favVal)
                          if (!favProv) return null
                          const isActive = provider === favVal
                          return (
                            <button
                              key={favVal}
                              type="button"
                              onClick={() => selectProvider(favVal)}
                              className={`px-2 py-1 text-[11px] rounded-lg transition-all duration-150 ${
                                isActive
                                  ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 font-medium shadow-sm'
                                  : 'bg-warm-100 dark:bg-[#2a2724] text-warm-500 dark:text-warm-400 hover:text-warm-700 dark:hover:text-warm-300 hover:bg-warm-200 dark:hover:bg-[#32302d]'
                              }`}
                            >
                              {SHORT_LABEL[favVal] || favVal}
                            </button>
                          )
                        })}
                        <button
                          type="button"
                          onClick={() => setProviderSearchOpen(true)}
                          className="px-1.5 text-[11px] text-warm-400 hover:text-warm-600 dark:hover:text-warm-300 transition-colors"
                          title="Show all providers"
                        >
                          +{PROVIDERS.length - favorites.length} more
                        </button>
                      </div>
                    )}

                    {/* Searchable combobox */}
                    <div ref={comboboxRef} className="relative">
                      <button
                        type="button"
                        onClick={() => {
                          setProviderSearchOpen(!providerSearchOpen)
                          if (!providerSearchOpen) {
                            setProviderSearch('')
                          }
                        }}
                        className="w-full flex items-center justify-between px-3 py-2.5 bg-warm-50 dark:bg-[#121110] border border-warm-200 dark:border-[#2a2724] rounded-lg text-sm text-warm-700 dark:text-warm-300 hover:border-warm-300 dark:hover:border-warm-600 focus:outline-none focus:border-primary-400 dark:focus:border-primary-600 focus:ring-1 focus:ring-primary-500/20 transition-all duration-200"
                      >
                        <span className="flex items-center gap-2">
                          {PROVIDERS.find(p => p.value === provider)?.label || provider}
                          {PROVIDERS.find(p => p.value === provider)?.needsKey && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">API key</span>
                          )}
                        </span>
                        <ChevronDown className={`w-3.5 h-3.5 text-warm-400 transition-transform duration-200 ${providerSearchOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {providerSearchOpen && (
                        <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-white dark:bg-[#1a1917] border border-warm-200 dark:border-[#2a2724] rounded-xl shadow-xl shadow-black/5 dark:shadow-black/20 overflow-hidden">
                          {/* Search input */}
                          <div className="p-2 border-b border-warm-100 dark:border-[#2a2724]">
                            <div className="relative">
                              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-warm-400 pointer-events-none" />
                              <input
                                type="text"
                                value={providerSearch}
                                onChange={(e) => setProviderSearch(e.target.value)}
                                placeholder="Search providers..."
                                className="w-full pl-8 pr-3 py-2 bg-warm-50 dark:bg-[#121110] border border-warm-200 dark:border-[#2a2724] rounded-lg text-xs text-warm-700 dark:text-warm-300 focus:outline-none focus:border-primary-400 placeholder:text-warm-400 transition-colors"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === 'ArrowDown') {
                                    e.preventDefault()
                                    setHighlightedIdx(i => Math.min(i + 1, filteredProviders.length - 1))
                                  } else if (e.key === 'ArrowUp') {
                                    e.preventDefault()
                                    setHighlightedIdx(i => Math.max(i - 1, 0))
                                  } else if (e.key === 'Enter' && filteredProviders[highlightedIdx]) {
                                    e.preventDefault()
                                    selectProvider(filteredProviders[highlightedIdx].value)
                                  } else if (e.key === 'Escape') {
                                    setProviderSearchOpen(false)
                                  }
                                }}
                              />
                            </div>
                          </div>

                          {/* Options */}
                          <div className="max-h-56 overflow-y-auto py-1">
                            {filteredProviders.length === 0 ? (
                              <div className="px-4 py-6 text-center">
                                <p className="text-xs text-warm-400">No providers match "{providerSearch}"</p>
                              </div>
                            ) : (
                              filteredProviders.map((p, i) => {
                                const isFav = favorites.includes(p.value)
                                const isSelected = provider === p.value
                                return (
                                  <button
                                    key={p.value}
                                    type="button"
                                    onMouseEnter={() => setHighlightedIdx(i)}
                                    onClick={() => selectProvider(p.value)}
                                    className={`w-full flex items-center justify-between px-3 py-2.5 text-xs transition-colors ${
                                      i === highlightedIdx
                                        ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                                        : isSelected
                                          ? 'text-warm-800 dark:text-warm-200 bg-warm-50 dark:bg-[#121110]'
                                          : 'text-warm-600 dark:text-warm-400 hover:bg-warm-50 dark:hover:bg-[#121110]'
                                    }`}
                                  >
                                    <span className="flex items-center gap-2.5">
                                      {isSelected ? (
                                        <Check className="w-3.5 h-3.5 text-primary-500 shrink-0" />
                                      ) : (
                                        <span className="w-3.5 shrink-0" />
                                      )}
                                      <span className="font-medium">{p.label}</span>
                                      {p.needsKey && (
                                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-warm-100 dark:bg-[#2a2724] text-warm-400 dark:text-warm-500">key</span>
                                      )}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        toggleFavorite(p.value)
                                      }}
                                      className={`p-1 rounded-md transition-colors ${
                                        isFav
                                          ? 'text-amber-500 hover:text-amber-600'
                                          : 'text-warm-300 hover:text-warm-500 dark:text-warm-500 dark:hover:text-warm-300'
                                      }`}
                                      title={isFav ? 'Remove from favorites' : 'Add to favorites'}
                                    >
                                      <Star className={`w-3 h-3 ${isFav ? 'fill-current' : ''}`} />
                                    </button>
                                  </button>
                                )
                              })
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-warm-500 dark:text-warm-400 flex items-center gap-1.5">
                      <Cpu className="w-3 h-3 text-accent-500" />
                      Model
                    </label>
                    <input
                      type="text"
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      placeholder={PROVIDERS.find(p => p.value === provider)?.defaultModel || 'Enter model name'}
                      className="w-full px-3 py-2.5 bg-warm-50 dark:bg-[#121110] border border-warm-200 dark:border-[#2a2724] rounded-lg text-sm text-warm-700 dark:text-warm-300 focus:outline-none focus:border-primary-400 dark:focus:border-primary-600 focus:ring-1 focus:ring-primary-500/20 transition-all duration-200 placeholder:text-warm-400"
                    />
                  </div>

                  {(() => {
                    const prov = PROVIDERS.find(p => p.value === provider)
                    if (!prov?.needsKey) return null
                    return (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="sm:col-span-2 space-y-1.5"
                      >
                        <label className="text-[11px] font-medium text-warm-500 dark:text-warm-400 flex items-center gap-1.5">
                          <Key className="w-3 h-3 text-amber-500" />
                          {prov.label} API Key
                        </label>
                        <input
                          type="password"
                          value={apiKey}
                          onChange={(e) => setApiKey(e.target.value)}
                          placeholder={prov.apiKeyPlaceholder}
                          className="w-full px-3 py-2.5 bg-warm-50 dark:bg-[#121110] border border-warm-200 dark:border-[#2a2724] rounded-lg text-sm text-warm-700 dark:text-warm-300 focus:outline-none focus:border-primary-400 dark:focus:border-primary-600 focus:ring-1 focus:ring-primary-500/20 transition-all duration-200 placeholder:text-warm-400"
                        />
                      </motion.div>
                    )
                  })()}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </form>
  )
}
