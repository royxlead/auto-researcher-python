import { useMemo, useRef, useState, useEffect, useCallback } from 'react'
import ForceGraph2D, { type ForceGraphMethods } from 'react-force-graph-2d'
import { ZoomIn, ZoomOut, Crosshair } from 'lucide-react'

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
  const [dimensions, setDimensions] = useState({ width: 800, height: 420 })
  const [hoverNode, setHoverNode] = useState<string | null>(null)

  useEffect(() => {
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

    if (graphData && graphData.nodes && graphData.nodes.length > 0) {
      const nodes: Node[] = [
        {
          id: 'root',
          name: safeTopic,
          shortName: safeTopic.length > 40 ? safeTopic.slice(0, 40) + '...' : safeTopic,
          val: 30,
          color: '#6366f1',
          group: 'topic'
        },
        ...graphData.nodes.map(n => ({
          id: n.id,
          name: n.url || n.label || n.id,
          shortName: n.label || n.id,
          val: 10,
          color: '#8b8375',
          group: 'source' as const,
          url: n.url
        }))
      ]
      const links: Link[] = [
        ...(graphData.links || []).map(l => ({ source: l.source, target: l.target })),
        ...graphData.nodes.map(n => ({ source: 'root', target: n.id }))
      ]
      return { nodes, links }
    }

    const validSources = Array.isArray(sources)
      ? Array.from(new Set(sources.filter(s => typeof s === 'string').map(s => s.trim()).filter(s => s.length > 0 && !['http://', 'https://'].includes(s))))
      : []

    return {
      nodes: [
        {
          id: 'root',
          name: safeTopic,
          shortName: safeTopic.length > 40 ? safeTopic.slice(0, 40) + '...' : safeTopic,
          val: 30,
          color: '#6366f1',
          group: 'topic'
        },
        ...validSources.map(s => ({
          id: s,
          name: s,
          shortName: extractLabel(s),
          val: 10,
          color: '#8b8375',
          group: 'source' as const,
          url: s
        }))
      ],
      links: validSources.map(s => ({ source: 'root', target: s }))
    }
  }, [topic, sources, graphData])

  useEffect(() => {
    if (graphRef.current) {
      graphRef.current.d3Force('charge')?.strength(-300)
      graphRef.current.d3Force('link')?.distance(100)
      graphRef.current.d3ReheatSimulation()
    }
  }, [data])

  const paintNode = useCallback((node: Node, ctx: CanvasRenderingContext2D, globalScale: number) => {
    if (typeof node.x !== 'number' || typeof node.y !== 'number') return
    const isRoot = node.group === 'topic'
    const isHovered = node.id === hoverNode
    const r = isRoot ? 5 : 3

    // Glow on hover
    if (isHovered) {
      ctx.beginPath()
      ctx.arc(node.x, node.y, r * 5, 0, 2 * Math.PI)
      const gradient = ctx.createRadialGradient(node.x, node.y, r, node.x, node.y, r * 5)
      gradient.addColorStop(0, 'rgba(99, 102, 241, 0.25)')
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
      ctx.fillStyle = gradient
      ctx.fill()
    }

    // Outer ring for topic
    if (isRoot) {
      ctx.beginPath()
      ctx.arc(node.x, node.y, r + 3, 0, 2 * Math.PI)
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.3)'
      ctx.lineWidth = 1.5
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(node.x, node.y, r + 6, 0, 2 * Math.PI)
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.1)'
      ctx.lineWidth = 1
      ctx.stroke()
    }

    // Node
    ctx.beginPath()
    ctx.arc(node.x, node.y, r, 0, 2 * Math.PI)
    ctx.fillStyle = isRoot ? '#6366f1' : (isHovered ? '#f5f3f0' : '#8b8375')
    ctx.fill()

    if (isRoot) {
      ctx.beginPath()
      ctx.arc(node.x, node.y, r, 0, 2 * Math.PI)
      ctx.strokeStyle = '#818cf8'
      ctx.lineWidth = 1.5
      ctx.stroke()
    }

    // Label
    if (isHovered || isRoot) {
      const label = node.shortName
      const fontSize = isRoot ? 11/globalScale : 9/globalScale
      ctx.font = `${isRoot ? '600' : ''} ${fontSize}px Inter, sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = isHovered ? '#f5f3f0' : '#b0a99b'
      ctx.shadowColor = 'rgba(0,0,0,0.6)'
      ctx.shadowBlur = 4
      ctx.fillText(label, node.x, node.y + r + 7 + fontSize / 2)
      ctx.shadowBlur = 0
    }
  }, [hoverNode])

  const nodePointerAreaPaint = useCallback((node: Node, color: string, ctx: CanvasRenderingContext2D) => {
    if (typeof node.x !== 'number' || typeof node.y !== 'number') return
    const isRoot = node.group === 'topic'
    const r = isRoot ? 5 : 3
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(node.x, node.y, r + 8, 0, 2 * Math.PI)
    ctx.fill()
  }, [])

  const handleZoom = (factor: number) => {
    if (graphRef.current) graphRef.current.zoom(graphRef.current.zoom() * factor, 400)
  }

  const handleFit = () => {
    if (graphRef.current) graphRef.current.zoomToFit(400, 50)
  }

  return (
    <div ref={containerRef} className="relative w-full h-[420px] bg-[#121110]">
      {/* Controls */}
      <div className="absolute top-3 right-3 z-10 flex gap-0.5 bg-black/40 backdrop-blur-sm rounded-lg p-1 border border-white/5">
        <button onClick={() => handleZoom(1.2)} className="p-1.5 rounded hover:bg-white/10 text-neutral-500 hover:text-primary-400 transition-colors">
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => handleZoom(0.8)} className="p-1.5 rounded hover:bg-white/10 text-neutral-500 hover:text-primary-400 transition-colors">
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <button onClick={handleFit} className="p-1.5 rounded hover:bg-white/10 text-neutral-500 hover:text-primary-400 transition-colors">
          <Crosshair className="w-3.5 h-3.5" />
        </button>
      </div>

      <ForceGraph2D
        ref={graphRef}
        width={dimensions.width}
        height={dimensions.height}
        graphData={data}
        nodeCanvasObject={(node, ctx, globalScale) => paintNode(node as Node, ctx, globalScale)}
        nodePointerAreaPaint={(node, color, ctx) => nodePointerAreaPaint(node as Node, color, ctx)}
        linkColor={() => '#2a2724'}
        linkWidth={1}
        linkDirectionalParticles={2}
        linkDirectionalParticleWidth={1.5}
        linkDirectionalParticleSpeed={0.004}
        linkDirectionalParticleColor={() => '#6366f1'}
        backgroundColor="#121110"
        onNodeClick={(node) => {
          if (node.group === 'source') {
            const url = (node as Node).url || node.id
            if (url.startsWith('http')) window.open(url, '_blank')
            else window.open(`https://scholar.google.com/scholar?q=${encodeURIComponent(url)}`, '_blank')
          }
        }}
        onNodeHover={(node) => setHoverNode(node ? node.id : null)}
        cooldownTicks={100}
        d3VelocityDecay={0.2}
        d3AlphaDecay={0.02}
      />

      {/* Legend */}
      <div className="absolute bottom-3 left-3">
        <div className="flex items-center gap-3 bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-white/5">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-primary-500" />
            <span className="text-[10px] text-warm-400">Topic</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-warm-500" />
            <span className="text-[10px] text-warm-400">Source</span>
          </div>
        </div>
      </div>
    </div>
  )
}
