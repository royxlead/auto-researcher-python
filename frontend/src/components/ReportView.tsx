import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import { ExternalLink, FileText, Copy, Check, Download, Volume2, StopCircle, Maximize2, Minimize2, Quote } from 'lucide-react'
import { useState, useEffect } from 'react'
import type { ResearchResponse } from '../types'
import { KnowledgeGraph } from './KnowledgeGraph'
import { ErrorBoundary } from './ErrorBoundary'

interface Props {
  data: ResearchResponse
}

export function ReportView({ data }: Props) {
  const [copied, setCopied] = useState(false)
  const [showGraph, setShowGraph] = useState(true)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [speechSupported, setSpeechSupported] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    setSpeechSupported('speechSynthesis' in window)
    return () => window.speechSynthesis.cancel()
  }, [])

  const handleCopy = () => {
    navigator.clipboard.writeText(data.final_report || '')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const blob = new Blob([data.final_report || ''], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'research-report.md'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const toggleSpeech = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
    } else {
      const utterance = new SpeechSynthesisUtterance(data.final_report || "No content to read.")
      utterance.onend = () => setIsSpeaking(false)
      utterance.rate = 1.1
      window.speechSynthesis.speak(utterance)
      setIsSpeaking(true)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={`grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8 mt-4 ${isFullscreen ? 'fixed inset-0 z-50 bg-warm-50 dark:bg-[#121110] p-8 overflow-y-auto' : ''}`}
    >
      <div className="min-w-0 space-y-6">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-white dark:bg-[#1a1917] border border-warm-200 dark:border-[#2a2724] rounded-xl shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-400 flex items-center justify-center shadow-sm">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="text-sm font-semibold text-warm-800 dark:text-warm-200">Report</span>
              <p className="text-[11px] text-warm-400">Auto-Researcher</p>
            </div>
          </div>
          <div className="flex items-center gap-0.5">
            {speechSupported && (
              <button onClick={toggleSpeech} className={`p-2 rounded-lg transition-all duration-200 ${isSpeaking ? 'text-primary-600 bg-primary-50 dark:bg-primary-950 dark:text-primary-400' : 'text-warm-400 hover:text-warm-600 dark:hover:text-warm-300 hover:bg-warm-50 dark:hover:bg-[#121110]'}`}>
                {isSpeaking ? <StopCircle className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            )}
            <div className="w-px h-5 bg-warm-200 dark:bg-[#2a2724] mx-0.5" />
            <button onClick={() => setShowGraph(!showGraph)} className={`p-2 rounded-lg transition-all duration-200 ${showGraph ? 'text-primary-600 bg-primary-50 dark:bg-primary-950 dark:text-primary-400' : 'text-warm-400 hover:text-warm-600 dark:hover:text-warm-300 hover:bg-warm-50 dark:hover:bg-[#121110]'}`}>
              <ExternalLink className="w-4 h-4" />
            </button>
            <button onClick={handleDownload} className="p-2 rounded-lg text-warm-400 hover:text-warm-600 dark:hover:text-warm-300 hover:bg-warm-50 dark:hover:bg-[#121110] transition-all duration-200">
              <Download className="w-4 h-4" />
            </button>
            <button onClick={handleCopy} className="p-2 rounded-lg text-warm-400 hover:text-warm-600 dark:hover:text-warm-300 hover:bg-warm-50 dark:hover:bg-[#121110] transition-all duration-200">
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            </button>
            <button onClick={() => setIsFullscreen(!isFullscreen)} className="p-2 rounded-lg text-warm-400 hover:text-warm-600 dark:hover:text-warm-300 hover:bg-warm-50 dark:hover:bg-[#121110] transition-all duration-200 hidden md:block">
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Knowledge Graph */}
        {showGraph && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="border border-warm-200 dark:border-[#2a2724] rounded-xl overflow-hidden shadow-sm"
          >
            <ErrorBoundary>
              <KnowledgeGraph
                topic={data.topic || "Research Topic"}
                sources={Array.isArray(data.sources) ? data.sources : []}
                graphData={data.graph_data}
              />
            </ErrorBoundary>
          </motion.div>
        )}

        {/* Report content */}
        <div className="prose-warm bg-white dark:bg-[#1a1917] border border-warm-200 dark:border-[#2a2724] rounded-xl p-6 sm:p-8 shadow-sm">
          <ReactMarkdown>{data.final_report || '*No report content available.*'}</ReactMarkdown>
        </div>
      </div>

      {/* References */}
      <div className="space-y-1">
        <div className="sticky top-4">
          <div className="flex items-center gap-2 mb-3 px-1">
            <Quote className="w-3.5 h-3.5 text-warm-400" />
            <span className="text-xs font-medium text-warm-500 dark:text-warm-400 uppercase tracking-wider">References</span>
            <span className="text-[11px] text-warm-400 font-mono ml-auto bg-warm-100 dark:bg-[#2a2724] px-1.5 py-0.5 rounded">{data.sources?.length || 0}</span>
          </div>
          <div className="space-y-0.5 max-h-[calc(100vh-180px)] overflow-y-auto">
            {(data.sources || []).map((source, i) => (
              <a
                key={i}
                href={source}
                target="_blank"
                rel="noreferrer"
                className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl hover:bg-white dark:hover:bg-[#1a1917] transition-all duration-200 group border border-transparent hover:border-warm-200 dark:hover:border-[#2a2724]"
              >
                <span className="text-[11px] font-medium text-warm-400 w-4 shrink-0 mt-0.5 font-mono">{i + 1}</span>
                <span className="text-xs text-warm-600 dark:text-warm-400 line-clamp-2 group-hover:text-warm-800 dark:group-hover:text-warm-200 transition-colors break-all">
                  {source}
                </span>
                <ExternalLink className="w-3 h-3 text-warm-300 dark:text-warm-700 group-hover:text-primary-500 transition-colors shrink-0 mt-0.5" />
              </a>
            ))}
            {(data.sources || []).length === 0 && (
              <p className="text-xs text-warm-400 text-center py-8">No references</p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
