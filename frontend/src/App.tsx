import { Sidebar } from './components/Sidebar'
import { ResearchForm } from './components/ResearchForm'
import { ReportView } from './components/ReportView'
import { LoadingState } from './components/LoadingState'
import { useResearch } from './hooks/useResearch'
import { AlertCircle, Sparkles, Brain, Database, FileText, TrendingUp, Zap, Globe } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { ErrorBoundary } from './components/ErrorBoundary'
import { useState } from 'react'

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

  const handleResearch = (topic: string, depth: number, numPapers: number, provider: string, apiKey?: string, model?: string, strictness?: number) => {
    executeResearch({ 
      topic, 
      max_depth: depth, 
      num_papers: numPapers,
      provider,
      openrouter_api_key: apiKey,
      model,
      critic_strictness: strictness
    })
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-200 overflow-hidden selection:bg-indigo-200 selection:text-indigo-900 dark:selection:bg-indigo-900 dark:selection:text-indigo-100 transition-colors duration-300 relative font-sans">
      
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Modern Grid Background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-indigo-500 opacity-20 blur-[100px]" />
        <div className="absolute right-0 bottom-0 -z-10 h-[310px] w-[310px] rounded-full bg-purple-500 opacity-20 blur-[100px]" />
      </div>

      {/* Sidebar Navigation */}
      <Sidebar 
        history={history} 
        onSelect={setCurrentResult} 
        onClear={clearHistory} 
        onNewChat={() => setCurrentResult(null)}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full relative overflow-hidden z-10">
        
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8 lg:p-12">
          <div className="max-w-5xl mx-auto w-full h-full flex flex-col">
            
            <AnimatePresence mode="wait">
              {!currentResult && !isLoading ? (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="flex-1 flex flex-col justify-center items-center text-center space-y-10 min-h-[70vh]"
                >
                  {/* Hero Section */}
                  <div className="space-y-6 max-w-3xl">
                    <motion.div 
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider border border-indigo-100 dark:border-indigo-800"
                    >
                      <Sparkles className="w-3 h-3" />
                      AI-Powered Research Assistant
                    </motion.div>
                    
                    <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
                      Discover knowledge <br />
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
                        at the speed of thought.
                      </span>
                    </h1>
                    
                    <p className="text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
                      Deep dive into any topic with autonomous agents that read, analyze, and synthesize academic papers for you.
                    </p>
                  </div>

                  {/* Research Form */}
                  <div className="w-full max-w-2xl relative z-20">
                    <ResearchForm 
                      onSubmit={handleResearch} 
                      isLoading={isLoading} 
                      selectedTopic={selectedTopic}
                    />
                    
                    {/* Trending Topics */}
                    <div className="mt-6 flex flex-wrap justify-center gap-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mr-2">
                        <TrendingUp className="w-3 h-3" />
                        Trending:
                      </div>
                      {TRENDING_TOPICS.map((topic, i) => (
                        <button
                          key={i}
                          onClick={() => setSelectedTopic(topic)}
                          className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200 dark:border-slate-700 rounded-full transition-all hover:scale-105 active:scale-95"
                        >
                          {topic}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Features Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl mt-16">
                    {[
                      {
                        icon: Brain,
                        title: "Deep Analysis",
                        desc: "Multi-agent cognitive architecture breaks down complex queries into sub-tasks.",
                        color: "text-indigo-500",
                        bg: "bg-indigo-500/10"
                      },
                      {
                        icon: Database,
                        title: "Academic Sources",
                        desc: "Directly accesses ArXiv and other repositories for peer-reviewed citations.",
                        color: "text-purple-500",
                        bg: "bg-purple-500/10"
                      },
                      {
                        icon: FileText,
                        title: "Structured Reports",
                        desc: "Generates comprehensive markdown reports with proper citations and references.",
                        color: "text-pink-500",
                        bg: "bg-pink-500/10"
                      }
                    ].map((feature, i) => (
                      <motion.div 
                        key={i} 
                        whileHover={{ y: -5 }}
                        className="p-6 rounded-2xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border border-slate-200 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-800 transition-all text-left group"
                      >
                        <div className={`w-12 h-12 rounded-xl ${feature.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                          <feature.icon className={`w-6 h-6 ${feature.color}`} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">{feature.title}</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{feature.desc}</p>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="w-full pb-20"
                >
                  {error && (
                    <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50 rounded-xl flex items-center gap-3 text-red-600 dark:text-red-400">
                      <AlertCircle className="w-5 h-5 shrink-0" />
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
// End of file
