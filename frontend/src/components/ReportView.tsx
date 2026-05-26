import { motion, AnimatePresence } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import {
  ExternalLink, FileText, Copy, Check, Download,
  Volume2, StopCircle, Maximize2, Minimize2, Quote,
  Bookmark, ChevronDown, Eye, ArrowUp, Clock,
  Layers, Globe, BookOpen
} from 'lucide-react'
import { useState, useEffect, useRef, useMemo } from 'react'
import type { ResearchResponse } from '../types'
import { KnowledgeGraph } from './KnowledgeGraph'
import { ErrorBoundary } from './ErrorBoundary'

interface Props {
  data: ResearchResponse
}

/* ─── Helpers ─── */

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '')
  } catch {
    return url
  }
}

function estimateReadingTime(text: string): number {
  const wpm = 200
  return Math.max(1, Math.ceil(text.split(/\s+/).length / wpm))
}

function formatDate(ts?: number): string {
  const d = ts ? new Date(ts) : new Date()
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

/* ─── Component ─── */

export function ReportView({ data }: Props) {
  const [copied, setCopied] = useState(false)
  const [showGraph, setShowGraph] = useState(true)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [speechSupported, setSpeechSupported] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [scrollProgress, setScrollProgress] = useState(0)
  const [showBackToTop, setShowBackToTop] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const readingTime = useMemo(() => estimateReadingTime(data.final_report || ''), [data.final_report])
  const sources = useMemo(() => (
    Array.isArray(data.sources)
      ? [...new Set(data.sources.filter(s => typeof s === 'string').map(s => s.trim()).filter(Boolean))]
      : []
  ), [data.sources])

  /* ─── Lifecycle ─── */
  useEffect(() => {
    setSpeechSupported('speechSynthesis' in window)
    return () => window.speechSynthesis.cancel()
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const onScroll = () => {
      const p = el.scrollHeight > el.clientHeight
        ? Math.min(el.scrollTop / (el.scrollHeight - el.clientHeight), 1)
        : 0
      setScrollProgress(p)
      setShowBackToTop(el.scrollTop > 500)
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [])

  /* ─── Handlers ─── */
  const handleCopy = () => {
    navigator.clipboard.writeText(data.final_report || '')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const blob = new Blob([data.final_report || ''], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'research-report.md'
    document.body.appendChild(a); a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const toggleSpeech = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel(); setIsSpeaking(false)
    } else {
      const u = new SpeechSynthesisUtterance(data.final_report || 'No content.')
      u.onend = () => setIsSpeaking(false)
      u.rate = 1.1
      window.speechSynthesis.speak(u); setIsSpeaking(true)
    }
  }

  const scrollToTop = () => scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })

  /* ─── Render ─── */
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={`relative ${isFullscreen ? 'fixed inset-0 z-50 bg-[#0c0b0a]' : ''}`}
    >
      {/* ── Scroll progress bar ── */}
      <div className="fixed left-0 top-0 w-full h-[3px] z-[60] pointer-events-none">
        <div
          className="h-full bg-gradient-to-r from-primary-600 via-primary-400 to-accent-500 transition-all duration-150 ease-out"
          style={{ width: `${scrollProgress * 100}%` }}
        />
      </div>

      {/* ── Fullscreen overlay contents ── */}
      <div
        ref={scrollRef}
        className={`${isFullscreen ? 'h-full overflow-y-auto relative z-20' : ''}`}
      >
        <div className={isFullscreen ? 'max-w-5xl mx-auto px-6 sm:px-10 py-8' : ''}>
          {/* ════════════════════════════════════════════
              HEADER — Topic, metadata, action buttons
              ════════════════════════════════════════════ */}
          <div className="mb-8 group">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-3 mb-2.5">
                  {/* Icon */}
                  <div className="relative shrink-0">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary-600 via-primary-500 to-primary-400 flex items-center justify-center shadow-lg shadow-primary-500/25 ring-1 ring-white/10">
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[#0c0b0a] flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 text-white" />
                    </div>
                  </div>

                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-warm-900 dark:text-warm-100 tracking-tight line-clamp-2 leading-tight">
                      {data.topic || 'Research Report'}
                    </h1>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
                      <span className="text-xs text-warm-400 flex items-center gap-1.5">
                        <Clock className="w-3 h-3" />
                        {readingTime} min read
                      </span>
                      <span className="text-warm-300 dark:text-warm-600 hidden sm:inline">·</span>
                      <span className="text-xs text-warm-400 flex items-center gap-1.5">
                        <Layers className="w-3 h-3" />
                        {sources.length} source{sources.length !== 1 ? 's' : ''}
                      </span>
                      <span className="text-warm-300 dark:text-warm-600 hidden sm:inline">·</span>
                      <span className="text-xs text-warm-400 flex items-center gap-1.5">
                        <Globe className="w-3 h-3" />
                        {formatDate()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Action buttons ── */}
              <div className="flex items-center gap-0.5 shrink-0 bg-white/40 dark:bg-white/[0.03] rounded-2xl p-1 border border-warm-200/40 dark:border-white/[0.06] shadow-sm">
                {speechSupported && (
                  <button
                    onClick={toggleSpeech}
                    className={`p-2.5 rounded-xl transition-all duration-200 ${
                      isSpeaking
                        ? 'text-primary-600 bg-primary-50 dark:bg-primary-950/40 dark:text-primary-400 ring-1 ring-primary-200/60 dark:ring-primary-800/40'
                        : 'text-warm-400 hover:text-warm-600 dark:hover:text-warm-300 hover:bg-white/70 dark:hover:bg-white/[0.06]'
                    }`}
                    title={isSpeaking ? 'Stop reading' : 'Read aloud'}
                  >
                    {isSpeaking ? <StopCircle className="w-[18px] h-[18px]" /> : <Volume2 className="w-[18px] h-[18px]" />}
                  </button>
                )}
                <div className="w-px h-5 bg-warm-200/40 dark:bg-white/[0.06]" />
                <button
                  onClick={handleDownload}
                  className="p-2.5 rounded-xl text-warm-400 hover:text-warm-600 dark:hover:text-warm-300 hover:bg-white/70 dark:hover:bg-white/[0.06] transition-all duration-200"
                  title="Download markdown"
                >
                  <Download className="w-[18px] h-[18px]" />
                </button>
                <button
                  onClick={handleCopy}
                  className="p-2.5 rounded-xl text-warm-400 hover:text-warm-600 dark:hover:text-warm-300 hover:bg-white/70 dark:hover:bg-white/[0.06] transition-all duration-200 relative"
                  title="Copy report"
                >
                  {copied ? <Check className="w-[18px] h-[18px] text-emerald-500" /> : <Copy className="w-[18px] h-[18px]" />}
                </button>
                <div className="w-px h-5 bg-warm-200/40 dark:bg-white/[0.06]" />
                <button
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="p-2.5 rounded-xl text-warm-400 hover:text-warm-600 dark:hover:text-warm-300 hover:bg-white/70 dark:hover:bg-white/[0.06] transition-all duration-200 hidden sm:block"
                  title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                >
                  {isFullscreen ? <Minimize2 className="w-[18px] h-[18px]" /> : <Maximize2 className="w-[18px] h-[18px]" />}
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8 lg:gap-10 items-start">
            {/* ── LEFT COLUMN: Report content ── */}
            <div className="min-w-0 space-y-6">
              <div className="glass-card !rounded-2xl p-6 sm:p-8 lg:p-10">
                <div className="prose-warm">
                  <ReactMarkdown
                    components={{
                      // Custom link handling — open in new tab
                      a: ({ href, children, ...props }) => (
                        <a
                          href={href}
                          target="_blank"
                          rel="noreferrer"
                          className="inline items-center gap-1 text-primary-600 dark:text-primary-400 no-underline border-b border-primary-300/30 dark:border-primary-700/30 hover:border-primary-400 dark:hover:border-primary-500 transition-colors"
                          {...props}
                        >
                          {children}
                          <ExternalLink className="w-3 h-3 inline-block opacity-60 ml-0.5" />
                        </a>
                      ),
                      // Highlight code blocks with a subtle accent
                      pre: ({ children }) => (
                        <div className="relative group/code">
                          <div className="absolute top-3 right-3 opacity-0 group-hover/code:opacity-100 transition-opacity">
                            <span className="text-[10px] text-warm-400 font-mono bg-black/30 px-2 py-1 rounded-md">code</span>
                          </div>
                          <pre className="!mt-0">{children}</pre>
                        </div>
                      ),
                    }}
                  >
                    {data.final_report || '*No report content available.*'}
                  </ReactMarkdown>
                </div>
              </div>

              {/* Report footer */}
              <div className="flex items-center justify-center gap-3 py-4 text-warm-400">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-warm-200/50 dark:via-white/[0.06] to-transparent" />
                <span className="text-[11px] font-medium tracking-wider uppercase flex items-center gap-2">
                  <BookOpen className="w-3 h-3" />
                  End of report
                </span>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-warm-200/50 dark:via-white/[0.06] to-transparent" />
              </div>
            </div>

            {/* ── RIGHT COLUMN: References sidebar ── */}
            <div className="lg:sticky lg:top-6 space-y-4">
              
              {/* ═══════════════════════════════════════════════════
                  KNOWLEDGE GRAPH — Collapsible accordion card
                  ═══════════════════════════════════════════════════ */}
              <div className="mb-4">
                <div
                  className={`rounded-2xl overflow-hidden border transition-all duration-300 ${
                    showGraph
                      ? 'border-warm-200/50 dark:border-white/[0.08] shadow-md shadow-primary-500/5'
                      : 'border-warm-200/30 dark:border-white/[0.04] shadow-sm'
                  }`}
                >
                  {/* Accordion header */}
                  <button
                    onClick={() => setShowGraph(!showGraph)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-warm-100/60 dark:bg-white/[0.03] hover:bg-warm-200/50 dark:hover:bg-white/[0.06] transition-colors"
                    aria-expanded={showGraph}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-950/40 dark:to-primary-900/20 flex items-center justify-center ring-1 ring-primary-200/30 dark:ring-primary-800/20">
                        <Eye className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                      </div>
                      <div className="text-left">
                        <span className="text-sm font-semibold text-warm-800 dark:text-warm-200">Knowledge Graph</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <motion.div
                        animate={{ rotate: showGraph ? 180 : 0 }}
                        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                        className="w-7 h-7 rounded-lg bg-white/50 dark:bg-white/[0.04] flex items-center justify-center"
                      >
                        <ChevronDown className="w-4 h-4 text-warm-400" />
                      </motion.div>
                    </div>
                  </button>

                  {/* Collapsible content */}
                  <motion.div
                    initial={false}
                    animate={{ height: showGraph ? 'auto' : 0, opacity: showGraph ? 1 : 0 }}
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <ErrorBoundary>
                      <KnowledgeGraph
                        topic={data.topic || 'Research Topic'}
                        sources={sources}
                        graphData={data.graph_data}
                      />
                    </ErrorBoundary>
                  </motion.div>
                </div>
              </div>

              {/* Header */}
              <div className="flex items-center gap-3 px-1">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-50 to-accent-100 dark:from-accent-950/30 dark:to-accent-900/20 flex items-center justify-center ring-1 ring-accent-200/30 dark:ring-accent-800/20">
                  <Bookmark className="w-4 h-4 text-accent-600 dark:text-accent-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-warm-800 dark:text-warm-200">References</h3>
                  <p className="text-[11px] text-warm-400">{sources.length} source{sources.length !== 1 ? 's' : ''}</p>
                </div>
              </div>

              {/* Reference cards */}
              <div
                className="space-y-2 max-h-[calc(100vh-220px)] overflow-y-auto pr-1"
              >
                {sources.map((source, i) => {
                  const domain = extractDomain(source)
                  return (
                    <div
                      key={i}
                      id={`ref-${i}`}
                      onClick={() => window.open(source, '_blank')}
                      className="group relative px-4 py-3.5 rounded-xl border cursor-pointer transition-all duration-200 bg-white/50 dark:bg-white/[0.03] border-warm-200/40 dark:border-white/[0.06] hover:border-warm-300 dark:hover:border-white/[0.12] hover:shadow-md hover:-translate-y-0.5"
                    >
                      <div className="flex items-start gap-3 relative">
                        {/* Number badge */}
                        <span
                          className="w-7 h-7 rounded-xl flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5 transition-all duration-200 bg-warm-200/60 dark:bg-white/[0.08] text-warm-500 dark:text-warm-400 group-hover:bg-primary-100 dark:group-hover:bg-primary-950/40 group-hover:text-primary-600 dark:group-hover:text-primary-400 group-hover:scale-105"
                        >
                          {i + 1}
                        </span>

                        <div className="min-w-0 flex-1">
                          {/* Source URL */}
                          <p className="text-xs text-warm-700 dark:text-warm-300 line-clamp-2 leading-relaxed break-all">
                            {source}
                          </p>

                          {/* Domain + open link */}
                          <div className="flex items-center gap-2 mt-2">
                            <Globe className="w-3 h-3 text-warm-300 dark:text-warm-600 shrink-0" />
                            <span className="text-[10px] text-warm-400 font-mono truncate">{domain}</span>
                            <ExternalLink className="w-3 h-3 text-warm-300 dark:text-warm-600 opacity-0 group-hover:opacity-100 transition-all duration-200 shrink-0 ml-auto group-hover:text-primary-500" />
                          </div>
                        </div>
                      </div>

                      {/* Bottom accent line on hover */}
                      <div className="absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-primary-500/0 via-primary-500/0 group-hover:via-primary-500/30 to-primary-500/0 transition-all duration-300" />
                    </div>
                  )
                })}

                {/* Empty state */}
                {sources.length === 0 && (
                  <div className="text-center py-16 px-4">
                    <Quote className="w-8 h-8 text-warm-200 dark:text-warm-700 mx-auto mb-3" />
                    <p className="text-sm text-warm-400">No references available</p>
                    <p className="text-[11px] text-warm-500 mt-1">Sources will appear here once the research is complete</p>
                  </div>
                )}
              </div>

              {/* Sources summary */}
              {sources.length > 0 && (
                <div className="flex items-center gap-2 px-1 pt-2 border-t border-warm-200/30 dark:border-white/[0.04]">
                  <span className="text-[10px] text-warm-400">
                    {sources.length} source{sources.length !== 1 ? 's' : ''} — click to open
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Bottom spacing */}
          <div className="h-16 sm:h-20" />
        </div>
      </div>

      {/* ── Back-to-top button ── */}
      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            onClick={scrollToTop}
            className="fixed bottom-8 right-8 z-50 w-11 h-11 rounded-2xl bg-primary-500 text-white shadow-lg shadow-primary-500/30 flex items-center justify-center hover:bg-primary-600 active:scale-90 transition-all duration-200 ring-1 ring-white/10"
          >
            <ArrowUp className="w-[18px] h-[18px]" />
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
