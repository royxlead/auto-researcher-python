import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, CheckCircle2, Circle, Brain, Search, FileText, PenTool, Scale, Terminal, Sparkles, Lightbulb, XCircle, Globe, Cpu, Zap, Activity, Network, Share2, BarChart3 } from 'lucide-react'
import { useState, useEffect } from 'react'

const STEPS = [
  { id: 'research', label: "Searching academic databases", icon: Search, color: "text-blue-500", agent: "Researcher" },
  { id: 'draft', label: "Synthesizing & Drafting", icon: PenTool, color: "text-purple-500", agent: "Writer" },
  { id: 'critique', label: "Critiquing & Refining", icon: Scale, color: "text-rose-500", agent: "Critic" }
]

const TRIVIA = [
  "The first scientific journal, Philosophical Transactions, was published in 1665.",
  "Over 2.5 million scientific papers are published every year.",
  "The term 'scientist' was not coined until 1833 by William Whewell.",
  "The longest scientific paper ever published has over 5,000 authors.",
  "Peer review became a mainstream practice only in the mid-20th century.",
  "The h-index was suggested by Jorge Hirsch in 2005 to measure productivity.",
  "arXiv.org was founded in 1991, predating the World Wide Web.",
  "The most cited paper of all time describes a protein assay method.",
]

const LOG_MESSAGES = {
  research: [
    "Querying ArXiv for relevant papers...",
    "Filtering results by citation count...",
    "Downloading PDF metadata...",
    "Analyzing abstract relevance...",
    "Extracting key methodologies...",
    "Cross-referencing authors...",
    "Detecting potential biases...",
    "Indexing semantic embeddings...",
  ],
  draft: [
    "Structuring the argument flow...",
    "Synthesizing introduction...",
    "Connecting related concepts...",
    "Formatting citations...",
    "Generating section headers...",
    "Summarizing key findings...",
    "Drafting conclusion...",
    "Reviewing narrative coherence...",
  ],
  critique: [
    "Checking for logical fallacies...",
    "Verifying citation accuracy...",
    "Analyzing tone and style...",
    "Identifying missing perspectives...",
    "Refining sentence structure...",
    "Ensuring factual consistency...",
    "Polishing final output...",
    "Generating quality metrics...",
  ]
}

interface Props {
  onStop?: () => void
}

export function LoadingState({ onStop }: Props) {
  const [activeStepId, setActiveStepId] = useState<string>('research')
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set())
  const [triviaIndex, setTriviaIndex] = useState(0)
  const [logs, setLogs] = useState<string[]>([])
  const [logIndex, setLogIndex] = useState(0)
  const [streamedText, setStreamedText] = useState<string>("")
  
  // Simulated Metrics
  const [metrics, setMetrics] = useState({
    sources: 0,
    words: 0,
    confidence: 85,
    cpu: 45,
    ram: 120
  })

  useEffect(() => {
    const handleProgress = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (detail.status === 'running') {
        setActiveStepId(detail.step)
        setLogs([]) // Clear logs on step change
        setLogIndex(0)
        if (detail.step === 'draft') {
          setStreamedText("")
        }
      } else if (detail.status === 'completed') {
        setCompletedSteps(prev => new Set(prev).add(detail.step))
      }
    }

    const handleToken = (e: Event) => {
      const detail = (e as CustomEvent).detail
      setStreamedText(prev => prev + detail.content)
      setMetrics(prev => ({ ...prev, words: prev.words + 1 }))
    }

    window.addEventListener('research-progress', handleProgress)
    window.addEventListener('research-token', handleToken)
    return () => {
      window.removeEventListener('research-progress', handleProgress)
      window.removeEventListener('research-token', handleToken)
    }
  }, [])

  // Rotate Trivia
  useEffect(() => {
    const interval = setInterval(() => {
      setTriviaIndex(prev => (prev + 1) % TRIVIA.length)
    }, 8000)
    return () => clearInterval(interval)
  }, [])

  // Simulate Logs & Metrics
  useEffect(() => {
    if (activeStepId === 'draft' && streamedText) return // Don't simulate logs if we have real text

    const currentLogs = LOG_MESSAGES[activeStepId as keyof typeof LOG_MESSAGES] || LOG_MESSAGES.research
    const interval = setInterval(() => {
      setLogs(prev => {
        const nextLog = currentLogs[logIndex % currentLogs.length]
        const newLogs = [...prev, `> ${nextLog}`]
        if (newLogs.length > 6) newLogs.shift()
        return newLogs
      })
      setLogIndex(prev => prev + 1)
      
      // Simulate metrics updates
      setMetrics(prev => ({
        ...prev,
        sources: activeStepId === 'research' ? prev.sources + 1 : prev.sources,
        confidence: Math.min(99, Math.max(80, prev.confidence + (Math.random() * 2 - 1))),
        cpu: Math.min(90, Math.max(20, prev.cpu + (Math.random() * 20 - 10))),
        ram: Math.min(512, Math.max(100, prev.ram + (Math.random() * 10 - 2)))
      }))

    }, 1500)
    return () => clearInterval(interval)
  }, [activeStepId, logIndex, streamedText])

  const activeStep = STEPS.find(s => s.id === activeStepId) || STEPS[0]

  return (
    <div className="flex flex-col items-center justify-center py-8 space-y-8 w-full max-w-5xl mx-auto relative">
      
      {onStop && (
        <button 
          onClick={onStop}
          className="absolute -top-2 right-0 z-20 flex items-center gap-2 px-4 py-2 text-xs font-bold tracking-wider text-red-500 hover:text-red-400 bg-red-500/10 hover:bg-red-500/20 rounded-full transition-all border border-red-500/20 hover:border-red-500/50 backdrop-blur-sm"
        >
          <XCircle className="w-4 h-4" />
          ABORT MISSION
        </button>
      )}

      {/* Active Agent Card */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div 
          layoutId="active-agent"
          className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-3xl p-1 border border-slate-200 dark:border-slate-800 shadow-2xl relative overflow-hidden group"
        >
          {/* Animated Border Gradient */}
          <div className={`absolute inset-0 bg-gradient-to-r ${activeStep.color.replace('text-', 'from-').replace('500', '500/20')} via-transparent to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-1000`} />
          
          <div className="relative bg-slate-50 dark:bg-slate-950/50 rounded-[22px] p-6 md:p-8 overflow-hidden">
            {/* Background Grid Animation */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_80%)] pointer-events-none" />
            
            <div className="flex flex-col md:flex-row items-start md:items-center gap-8 relative z-10">
              
              {/* Agent Avatar */}
              <div className="relative shrink-0">
                <div className={`absolute inset-0 ${activeStep.color.replace('text-', 'bg-')} blur-2xl opacity-20 animate-pulse`} />
                <div className="w-24 h-24 rounded-2xl bg-white dark:bg-slate-900 flex items-center justify-center border border-slate-200 dark:border-slate-800 shadow-xl relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 opacity-50" />
                  <activeStep.icon className={`w-10 h-10 ${activeStep.color} relative z-10`} />
                  
                  {/* Scanning Effect */}
                  <motion.div 
                    animate={{ top: ['-100%', '200%'] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className={`absolute left-0 right-0 h-1/2 bg-gradient-to-b from-transparent ${activeStep.color.replace('text-', 'via-').replace('500', '500/20')} to-transparent opacity-50`}
                  />
                </div>
                <div className="absolute -bottom-2 -right-2 px-2 py-0.5 bg-green-500 text-white text-[10px] font-bold uppercase tracking-wider rounded-full border-2 border-white dark:border-slate-900 shadow-sm">
                  Online
                </div>
              </div>
              
              {/* Agent Info */}
              <div className="flex-1 space-y-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Active Agent Protocol</span>
                    <div className="h-px flex-1 bg-gradient-to-r from-slate-200 dark:from-slate-800 to-transparent" />
                    <span className={`text-xs font-bold px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 ${activeStep.color}`}>
                      {activeStep.agent}_V1.0
                    </span>
                  </div>
                  <h2 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
                    {activeStep.label}
                  </h2>
                </div>

                {/* System Stats */}
                <div className="grid grid-cols-3 gap-4 max-w-md">
                  <div className="bg-white dark:bg-slate-900/50 rounded-lg p-3 border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2 text-slate-400 mb-1">
                      <Cpu className="w-3 h-3" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">CPU Load</span>
                    </div>
                    <div className="flex items-end gap-2">
                      <span className="text-lg font-mono font-bold text-slate-700 dark:text-slate-200">{Math.floor(metrics.cpu)}%</span>
                      <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-1.5">
                        <motion.div 
                          animate={{ width: `${metrics.cpu}%` }}
                          className="h-full bg-indigo-500 rounded-full"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-900/50 rounded-lg p-3 border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2 text-slate-400 mb-1">
                      <Zap className="w-3 h-3" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Memory</span>
                    </div>
                    <div className="flex items-end gap-2">
                      <span className="text-lg font-mono font-bold text-slate-700 dark:text-slate-200">{Math.floor(metrics.ram)}MB</span>
                      <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-1.5">
                        <motion.div 
                          animate={{ width: `${(metrics.ram / 512) * 100}%` }}
                          className="h-full bg-purple-500 rounded-full"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-900/50 rounded-lg p-3 border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2 text-slate-400 mb-1">
                      <Activity className="w-3 h-3" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Confidence</span>
                    </div>
                    <div className="flex items-end gap-2">
                      <span className="text-lg font-mono font-bold text-green-500">{Math.floor(metrics.confidence)}%</span>
                      <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-1.5">
                        <motion.div 
                          animate={{ width: `${metrics.confidence}%` }}
                          className="h-full bg-green-500 rounded-full"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side Visuals */}
              <div className="hidden md:flex flex-col gap-4 items-end">
                <div className="flex gap-2">
                  {[...Array(3)].map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{ 
                        scale: [1, 1.5, 1],
                        opacity: [0.3, 1, 0.3]
                      }}
                      transition={{ 
                        duration: 2,
                        delay: i * 0.2,
                        repeat: Infinity 
                      }}
                      className={`w-2 h-2 rounded-full ${activeStep.color.replace('text-', 'bg-')}`}
                    />
                  ))}
                </div>
                <div className="text-right">
                  <div className="text-4xl font-mono font-bold text-slate-800 dark:text-slate-100">
                    {metrics.sources}
                  </div>
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Sources Analyzed</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Left Column: Progress Pipeline */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-lg">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6 flex items-center gap-2">
              <Network className="w-3 h-3" />
              Execution Pipeline
            </h3>
            <div className="space-y-0 relative pl-2">
              {/* Connecting Line */}
              <div className="absolute left-[27px] top-4 bottom-4 w-0.5 bg-slate-100 dark:bg-slate-800" />
              
              {STEPS.map((step, i) => {
                const isCompleted = completedSteps.has(step.id)
                const isCurrent = activeStepId === step.id && !isCompleted
                
                return (
                  <div key={step.id} className="relative flex items-center gap-4 py-4 group">
                    <div className={`relative z-10 w-10 h-10 rounded-xl flex items-center justify-center border-2 transition-all duration-500 ${
                      isCurrent 
                        ? `bg-white dark:bg-slate-900 border-${step.color.split('-')[1]}-500 shadow-lg shadow-${step.color.split('-')[1]}-500/20 scale-110 rotate-3` 
                        : isCompleted 
                          ? 'bg-green-50 dark:bg-green-900/20 border-green-500 rotate-0' 
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rotate-0'
                    }`}>
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      ) : isCurrent ? (
                        <step.icon className={`w-5 h-5 ${step.color} animate-pulse`} />
                      ) : (
                        <step.icon className="w-4 h-4 text-slate-300 dark:text-slate-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className={`text-sm font-bold transition-colors ${
                          isCurrent ? 'text-slate-800 dark:text-slate-200' : 'text-slate-500'
                        }`}>
                          {step.label}
                        </p>
                        {isCurrent && (
                          <span className="flex h-2 w-2">
                            <span className={`animate-ping absolute inline-flex h-2 w-2 rounded-full ${step.color.replace('text-', 'bg-')} opacity-75`}></span>
                            <span className={`relative inline-flex rounded-full h-2 w-2 ${step.color.replace('text-', 'bg-')}`}></span>
                          </span>
                        )}
                      </div>
                      {isCurrent && (
                        <motion.div 
                          layoutId="step-indicator"
                          className="h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full mt-2 overflow-hidden"
                        >
                          <motion.div 
                            animate={{ x: ['-100%', '100%'] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                            className={`h-full w-1/2 ${step.color.replace('text-', 'bg-')}`}
                          />
                        </motion.div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Trivia Card */}
          <motion.div 
            key={triviaIndex}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-gradient-to-br from-indigo-500 to-purple-600 p-5 rounded-2xl shadow-lg relative overflow-hidden text-white"
          >
            <div className="absolute top-0 right-0 p-3 opacity-10">
              <Lightbulb className="w-24 h-24 rotate-12" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2 opacity-80">
                <Sparkles className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Did you know?</span>
              </div>
              <p className="text-sm font-medium leading-relaxed opacity-90">
                {TRIVIA[triviaIndex]}
              </p>
            </div>
          </motion.div>
        </div>

        {/* Right Column: Terminal */}
        <div className="lg:col-span-2 h-full min-h-[400px]">
          <div className="bg-[#0d1117] rounded-2xl p-0 font-mono text-xs shadow-2xl h-full flex flex-col border border-slate-800 overflow-hidden relative group ring-1 ring-white/5">
            {/* Terminal Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-[#161b22] border-b border-slate-800">
              <div className="flex items-center gap-4">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-[#ff5f56] border border-[#e0443e]" />
                  <div className="w-3 h-3 rounded-full bg-[#ffbd2e] border border-[#dea123]" />
                  <div className="w-3 h-3 rounded-full bg-[#27c93f] border border-[#1aab29]" />
                </div>
                <div className="flex gap-1">
                  <div className="px-3 py-1 rounded-t-md bg-[#0d1117] text-slate-300 text-[10px] font-medium border-t border-x border-slate-800 flex items-center gap-2">
                    <Terminal className="w-3 h-3 text-blue-400" />
                    output.log
                  </div>
                  <div className="px-3 py-1 rounded-t-md bg-transparent text-slate-500 text-[10px] font-medium flex items-center gap-2 hover:bg-slate-800/50 transition-colors cursor-pointer">
                    <BarChart3 className="w-3 h-3" />
                    metrics.json
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 text-slate-500">
                <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-800/50">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-[10px]">Connected</span>
                </div>
              </div>
            </div>

            {/* Terminal Content */}
            <div className="flex-1 p-6 overflow-y-auto custom-scrollbar relative font-mono">
              {/* Scanline effect */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 pointer-events-none bg-[length:100%_4px,3px_100%] opacity-20" />
              
              {activeStepId === 'draft' && streamedText ? (
                 <div className="whitespace-pre-wrap text-slate-300 text-sm leading-relaxed opacity-90">
                   <span className="text-blue-400"># Generating draft content...</span>
                   <br /><br />
                   {streamedText}
                   <span className="inline-block w-2.5 h-5 bg-blue-500 ml-1 animate-pulse align-middle shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                 </div>
              ) : (
                <div className="space-y-2">
                  {logs.map((log, i) => (
                    <motion.div
                      key={`${log}-${i}`}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex gap-3 text-sm group/line"
                    >
                      <span className="text-slate-600 shrink-0 select-none w-20 text-right">
                        {new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                      <span className="text-blue-500 select-none">info</span>
                      <span className="text-slate-300 group-hover/line:text-white transition-colors">{log}</span>
                    </motion.div>
                  ))}
                  <motion.div 
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                    className="flex gap-3 text-sm"
                  >
                    <span className="text-slate-600 shrink-0 select-none w-20 text-right">...</span>
                    <span className="w-2.5 h-5 bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                  </motion.div>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
