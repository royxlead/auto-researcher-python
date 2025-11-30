import { useMemo, useRef, useState, useEffect, useCallback } from 'react'
import ForceGraph2D, { type ForceGraphMethods } from 'react-force-graph-2d'
import { Maximize, ZoomIn, ZoomOut } from 'lucide-react'

interface Props {
  topic: string
  sources: string[]
  graphData?: {
    nodes: Array<{ id: string; type?: string; label?: string; url?: string }>
    links: Array<{ source: string; target: string; weight?: number }>
  }
}

interface Node {
  id: string
  name: string
  shortName: string
  val: number
  color: string
  group: 'topic' | 'source'
  url?: string
  x?: number
  y?: number
}

interface Link {
  source: string | Node
  target: string | Node
}

export function KnowledgeGraph({ topic, sources, graphData }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const graphRef = useRef<ForceGraphMethods<any, any> | undefined>(undefined)
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })
  const [isDark, setIsDark] = useState(false)
  const [highlightNodes, setHighlightNodes] = useState(new Set<string>())
  const [highlightLinks, setHighlightLinks] = useState(new Set<string>())
  const [hoverNode, setHoverNode] = useState<string | null>(null)

  useEffect(() => {
    const checkDark = () => document.documentElement.classList.contains('dark')
    setIsDark(checkDark())

    const observer = new MutationObserver(() => setIsDark(checkDark()))
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })

    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        })
      }
    }

    const resizeObserver = new ResizeObserver(() => updateDimensions())
    if (containerRef.current) resizeObserver.observe(containerRef.current)

    window.addEventListener('resize', updateDimensions)
    updateDimensions()

    return () => {
      observer.disconnect()
      resizeObserver.disconnect()
      window.removeEventListener('resize', updateDimensions)
    }
  }, [])

  const extractLabel = (url: string) => {
    if (!url || typeof url !== 'string') return 'Unknown Source'
    try {
      const urlObj = new URL(url)
      const domain = urlObj.hostname.replace('www.', '')
      const path = urlObj.pathname
      const file = path.split('/').pop() || ''
      
      if (domain.includes('arxiv')) return `arXiv:${file.replace('.pdf', '')}`
      if (file.length > 15) return `${domain}/...${file.slice(-10)}`
      return `${domain}/${file}`
    } catch {
      return url.slice(0, 30) + '...'
    }
  }

  const data = useMemo(() => {
    const safeTopic = (topic && typeof topic === 'string') ? topic : 'Research Topic'
    
    // If we have backend graph data, use it but augment with topic node
    if (graphData && graphData.nodes && graphData.nodes.length > 0) {
        const nodes: Node[] = [
            { 
                id: 'root', 
                name: safeTopic,
                shortName: safeTopic.length > 40 ? safeTopic.slice(0, 40) + '...' : safeTopic,
                val: 40, 
                color: '#22d3ee', 
                group: 'topic'
            },
            ...graphData.nodes.map(n => ({
                id: n.id,
                name: n.url || n.label || n.id,
                shortName: n.label || n.id,
                val: 15,
                color: '#94a3b8',
                group: 'source' as const,
                url: n.url
            }))
        ]

        // Links from backend + links from topic to all nodes (optional, to keep it connected)
        // We'll add links from topic to all nodes to ensure connectivity, 
        // but maybe with less weight or different visual style?
        // For now, let's just add them.
        const links: Link[] = [
            ...(graphData.links || []).map(l => ({
                source: l.source,
                target: l.target
            })),
            ...graphData.nodes.map(n => ({
                source: 'root',
                target: n.id
            }))
        ]
        
        return { nodes, links }
    }
    
    // Normalize and filter sources
    const validSources = Array.isArray(sources) 
      ? Array.from(new Set(
          sources
            .filter(s => typeof s === 'string')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !['http://', 'https://'].includes(s))
        ))
      : []

    const nodes: Node[] = [
      { 
        id: 'root', 
        name: safeTopic,
        shortName: safeTopic.length > 40 ? safeTopic.slice(0, 40) + '...' : safeTopic,
        val: 40, // Increased size
        color: '#22d3ee', 
        group: 'topic'
      },
      ...validSources.map(source => ({
        id: source,
        name: source,
        shortName: extractLabel(source),
        val: 15, // Increased size
        color: '#94a3b8',
        group: 'source' as const,
        url: source
      }))
    ]

    const links: Link[] = validSources.map(source => ({
      source: 'root',
      target: source
    }))

    return { nodes, links }
  }, [topic, sources, graphData])

  // Apply custom physics forces
  useEffect(() => {
    if (graphRef.current) {
      // Increase repulsion to prevent bunching
      graphRef.current.d3Force('charge')?.strength(-400)
      // Set optimal link distance
      graphRef.current.d3Force('link')?.distance(120)
      // Re-heat simulation
      graphRef.current.d3ReheatSimulation()
    }
  }, [data])

  const handleNodeHover = (node: Node | null) => {
    setHoverNode(node ? node.id : null)
    const newHighlightNodes = new Set<string>()
    const newHighlightLinks = new Set<string>()

    if (node) {
      newHighlightNodes.add(node.id)
      // Find neighbors
      data.links.forEach(link => {
        const sourceId = typeof link.source === 'object' ? (link.source as Node).id : link.source
        const targetId = typeof link.target === 'object' ? (link.target as Node).id : link.target
        
        if (sourceId === node.id || targetId === node.id) {
          // Create a consistent key for the link
          const linkKey = [sourceId, targetId].sort().join('-')
          newHighlightLinks.add(linkKey)
          newHighlightNodes.add(sourceId === node.id ? targetId as string : sourceId as string)
        }
      })
    }

    setHighlightNodes(newHighlightNodes)
    setHighlightLinks(newHighlightLinks)
  }

  const paintNode = useCallback((node: Node, ctx: CanvasRenderingContext2D, globalScale: number) => {
    if (typeof node.x !== 'number' || typeof node.y !== 'number') return

    const isHovered = node.id === hoverNode
    const isHighlighted = highlightNodes.has(node.id)
    const isRoot = node.group === 'topic'
    
    // Base size
    const r = isRoot ? 6 : 3
    
    // Draw Glow (Outer Ring)
    if (isHovered || isHighlighted || isRoot) {
      ctx.beginPath()
      const glowSize = isRoot ? r * 4 : r * 3
      ctx.arc(node.x!, node.y!, glowSize, 0, 2 * Math.PI, false)
      // Radial gradient for glow
      const gradient = ctx.createRadialGradient(node.x!, node.y!, r, node.x!, node.y!, glowSize)
      gradient.addColorStop(0, isRoot ? 'rgba(34, 211, 238, 0.3)' : 'rgba(148, 163, 184, 0.2)')
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
      ctx.fillStyle = gradient
      ctx.fill()
    }

    // Draw Node Core
    ctx.beginPath()
    ctx.arc(node.x!, node.y!, r, 0, 2 * Math.PI, false)
    ctx.fillStyle = isRoot ? '#22d3ee' : (isHovered || isHighlighted ? '#f8fafc' : '#94a3b8')
    ctx.fill()
    
    // Draw Ring for Root
    if (isRoot) {
      ctx.beginPath()
      ctx.arc(node.x!, node.y!, r + 2, 0, 2 * Math.PI, false)
      ctx.strokeStyle = '#22d3ee'
      ctx.lineWidth = 1
      ctx.stroke()
    }

    // Draw Label
    const label = node.shortName
    const fontSize = isRoot ? 14/globalScale : 10/globalScale
    ctx.font = `${isRoot ? 'bold' : ''} ${fontSize}px "Inter", sans-serif`
    
    // Text Shadow for readability (Neon effect)
    ctx.shadowColor = 'black'
    ctx.shadowBlur = 4
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 0

    // Label Text - Always visible but dimmed when not hovered
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    
    if (isHovered || isRoot) {
      ctx.fillStyle = '#ffffff'
      ctx.globalAlpha = 1
    } else {
      ctx.fillStyle = '#94a3b8' // Slate 400
      ctx.globalAlpha = 0.7
    }
    
    ctx.fillText(label, node.x!, node.y! + r + 8 + fontSize / 2)
    
    // Reset global alpha and shadow
    ctx.globalAlpha = 1
    ctx.shadowBlur = 0
  }, [hoverNode, highlightNodes])

  const nodePointerAreaPaint = useCallback((node: Node, color: string, ctx: CanvasRenderingContext2D) => {
    if (typeof node.x !== 'number' || typeof node.y !== 'number') return

    const isRoot = node.group === 'topic'
    const r = isRoot ? 6 : 3
    const fontSize = isRoot ? 14 : 10

    ctx.fillStyle = color
    
    // Draw Circle (Hit Area)
    ctx.beginPath()
    ctx.arc(node.x, node.y, r + 8, 0, 2 * Math.PI, false) // Larger hit area
    ctx.fill()

    // Draw Label Rect (Hit Area)
    ctx.font = `${isRoot ? 'bold' : ''} ${fontSize}px "Inter", sans-serif`
    const textWidth = ctx.measureText(node.shortName).width
    
    // Label position matches paintNode
    ctx.fillRect(
        node.x - textWidth / 2 - 4, 
        node.y + r + 4, 
        textWidth + 8, 
        fontSize + 8
    )
  }, [])

  const handleZoom = (factor: number) => {
    if (graphRef.current) {
      graphRef.current.zoom(graphRef.current.zoom() * factor, 400)
    }
  }

  const handleFit = () => {
    if (graphRef.current) {
      graphRef.current.zoomToFit(400, 50)
    }
  }

  return (
    <div ref={containerRef} className="relative w-full h-[600px] bg-[#020617] rounded-xl border border-slate-800 overflow-hidden shadow-2xl ring-1 ring-white/10">
      {/* Controls */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2 bg-black/40 backdrop-blur-md p-2 rounded-lg border border-white/10 shadow-lg">
        <button onClick={() => handleZoom(1.2)} className="p-2 hover:bg-white/10 rounded-md text-slate-400 hover:text-cyan-400 transition-colors" title="Zoom In">
          <ZoomIn className="w-4 h-4" />
        </button>
        <button onClick={() => handleZoom(0.8)} className="p-2 hover:bg-white/10 rounded-md text-slate-400 hover:text-cyan-400 transition-colors" title="Zoom Out">
          <ZoomOut className="w-4 h-4" />
        </button>
        <button onClick={handleFit} className="p-2 hover:bg-white/10 rounded-md text-slate-400 hover:text-cyan-400 transition-colors" title="Fit to View">
          <Maximize className="w-4 h-4" />
        </button>
      </div>

      <ForceGraph2D
        ref={graphRef}
        width={dimensions.width}
        height={dimensions.height}
        graphData={data}
        nodeLabel="name"
        nodeCanvasObject={(node, ctx, globalScale) => paintNode(node as Node, ctx, globalScale)}
        nodePointerAreaPaint={(node, color, ctx) => nodePointerAreaPaint(node as Node, color, ctx)}
        linkColor={() => '#1e293b'} // Dark Slate lines
        linkWidth={link => {
            const sourceId = typeof link.source === 'object' ? (link.source as Node).id : link.source
            const targetId = typeof link.target === 'object' ? (link.target as Node).id : link.target
            const linkKey = [sourceId, targetId].sort().join('-')
            return highlightLinks.has(linkKey) ? 2 : 1
        }}
        linkDirectionalParticles={2}
        linkDirectionalParticleWidth={2}
        linkDirectionalParticleSpeed={0.005}
        linkDirectionalParticleColor={() => '#22d3ee'} // Cyan particles
        backgroundColor="#020617"
        onNodeClick={(node) => {
          if (node.group === 'source') {
            const url = (node as Node).url || node.id
            if (url.startsWith('http')) {
              window.open(url, '_blank')
            } else {
              // Fallback for non-URL sources -> Search Google Scholar
              window.open(`https://scholar.google.com/scholar?q=${encodeURIComponent(url)}`, '_blank')
            }
          }
        }}
        onNodeHover={(node) => handleNodeHover(node as Node | null)}
        cooldownTicks={100}
        d3VelocityDecay={0.2}
        d3AlphaDecay={0.02}
      />
      
      {/* Legend */}
      <div className="absolute bottom-4 left-4 pointer-events-none">
        <div className="bg-black/40 backdrop-blur-md p-3 rounded-lg border border-white/10 text-xs text-slate-400 shadow-lg">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]"></div>
            <span className="font-medium text-slate-200">Research Topic</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-slate-400"></div>
            <span>Source Document</span>
          </div>
        </div>
      </div>
    </div>
  )
}
