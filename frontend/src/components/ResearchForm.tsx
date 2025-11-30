import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Search, Sliders, ArrowRight, Cpu, Key, Scale, Sparkles, Zap, BookOpen, Globe } from 'lucide-react'

interface Props {
  onSubmit: (topic: string, depth: number, numPapers: number, provider: string, apiKey?: string, model?: string, strictness?: number) => void
  isLoading: boolean
  selectedTopic?: string
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

export function ResearchForm({ onSubmit, isLoading, selectedTopic }: Props) {
  const [topic, setTopic] = useState('')
  const [depth, setDepth] = useState(3)
  const [numPapers, setNumPapers] = useState(10)
  const [strictness, setStrictness] = useState(5)
  const [provider, setProvider] = useState('ollama')
  const [apiKey, setApiKey] = useState('')
  const [model, setModel] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)

  useEffect(() => {
    if (selectedTopic) setTopic(selectedTopic)
  }, [selectedTopic])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (topic.trim()) onSubmit(topic, depth, numPapers, provider, apiKey, model, strictness)
  }

  const handleSurpriseMe = () => {
    const randomTopic = SURPRISE_TOPICS[Math.floor(Math.random() * SURPRISE_TOPICS.length)]
    setTopic(randomTopic)
  }

  return (
    <motion.form 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      onSubmit={handleSubmit}
      className="w-full space-y-6"
    >
      <div className="relative group z-10">
        {/* Animated Gradient Background */}
        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl opacity-20 group-hover:opacity-40 group-focus-within:opacity-100 transition duration-1000 blur-xl" />
        
        <div className="relative bg-white dark:bg-slate-900 rounded-2xl p-2 flex items-start gap-3 shadow-2xl transition-all duration-300 border border-slate-100 dark:border-slate-800 group-focus-within:border-transparent">
          
          {/* Icon */}
          <div className="p-4 mt-1 text-slate-400 group-focus-within:text-indigo-500 transition-colors duration-300">
            <Search className="w-6 h-6" />
          </div>

          {/* Input Area */}
          <div className="flex-1 py-3 relative">
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="What do you want to research today?"
              className={`w-full bg-transparent border-none text-xl text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:ring-0 focus:outline-none resize-none min-h-[60px] leading-relaxed font-medium ${!topic ? 'pr-32' : 'pr-8'}`}
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
                className="absolute right-0 top-3 text-xs flex items-center gap-1.5 text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-all bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 px-3 py-1.5 rounded-full font-medium"
              >
                <Sparkles className="w-3 h-3" />
                Surprise me
              </button>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || !topic.trim()}
            className="self-start mt-2 mr-2 p-3 bg-slate-900 dark:bg-slate-100 hover:bg-indigo-600 dark:hover:bg-indigo-500 disabled:opacity-30 disabled:hover:bg-slate-900 dark:disabled:hover:bg-slate-100 text-white dark:text-slate-900 dark:hover:text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-indigo-500/25 active:scale-95"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Advanced Options Toggle */}
      <div className="flex justify-center">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-indigo-500 transition-colors uppercase tracking-wider"
        >
          <Sliders className="w-3 h-3" />
          {showAdvanced ? 'Hide Configuration' : 'Configure Research Parameters'}
        </button>
      </div>

      <motion.div 
        initial={false}
        animate={{ height: showAdvanced ? 'auto' : 0, opacity: showAdvanced ? 1 : 0 }}
        className="overflow-hidden"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-4 pb-4 pt-2">
          {/* Depth Slider */}
          <div className="space-y-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 font-medium">
                <Zap className="w-4 h-4 text-amber-500" />
                <span>Research Depth</span>
              </div>
              <span className="text-xs font-bold px-2 py-1 rounded bg-white dark:bg-slate-900 text-slate-500 border border-slate-200 dark:border-slate-700">
                Level {depth}
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={depth}
              onChange={(e) => setDepth(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
            <div className="flex justify-between text-[10px] text-slate-400 uppercase font-bold tracking-wider">
              <span>Fast</span>
              <span>Deep</span>
            </div>
          </div>

          {/* Papers Slider */}
          <div className="space-y-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 font-medium">
                <BookOpen className="w-4 h-4 text-blue-500" />
                <span>Sources Limit</span>
              </div>
              <span className="text-xs font-bold px-2 py-1 rounded bg-white dark:bg-slate-900 text-slate-500 border border-slate-200 dark:border-slate-700">
                {numPapers} Papers
              </span>
            </div>
            <input
              type="range"
              min="5"
              max="50"
              step="5"
              value={numPapers}
              onChange={(e) => setNumPapers(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <div className="flex justify-between text-[10px] text-slate-400 uppercase font-bold tracking-wider">
              <span>Brief</span>
              <span>Extensive</span>
            </div>
          </div>

          {/* Strictness Slider */}
          <div className="space-y-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 md:col-span-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 font-medium">
                <Scale className="w-4 h-4 text-rose-500" />
                <span>Critic Strictness</span>
              </div>
              <span className="text-xs font-bold px-2 py-1 rounded bg-white dark:bg-slate-900 text-slate-500 border border-slate-200 dark:border-slate-700">
                {strictness}/10
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={strictness}
              onChange={(e) => setStrictness(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-rose-500"
            />
            <div className="flex justify-between text-[10px] text-slate-400 uppercase font-bold tracking-wider">
              <span>Lenient</span>
              <span>Rigorous</span>
            </div>
          </div>

          {/* Provider Selection */}
          <div className="md:col-span-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <Globe className="w-3 h-3" />
                  <span>Provider</span>
                </div>
                <select
                  value={provider}
                  onChange={(e) => {
                    setProvider(e.target.value)
                    if (e.target.value === 'openrouter') {
                      setModel('x-ai/grok-4.1-fast')
                    } else {
                      setModel('llama3')
                    }
                  }}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                >
                  <option value="ollama">Ollama (Local)</option>
                  <option value="openrouter">OpenRouter (Cloud)</option>
                </select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <Cpu className="w-3 h-3" />
                  <span>Model</span>
                </div>
                <input
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder={provider === 'openrouter' ? 'x-ai/grok-4.1-fast' : 'llama3'}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder:text-slate-400"
                />
              </div>

              {provider === 'openrouter' && (
                <div className="space-y-2 md:col-span-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <Key className="w-3 h-3" />
                    <span>API Key</span>
                  </div>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="sk-or-..."
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder:text-slate-400"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.form>
  )
}
