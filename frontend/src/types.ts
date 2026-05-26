export type ResearchRequest = {
  topic: string
  max_depth: number
  num_papers: number
  provider: string
  openrouter_api_key?: string
  api_key?: string
  model?: string
  critic_strictness?: number

  // Zero-knowledge encrypted API key fields
  encrypted_api_key?: string
  encryption_iv?: string
  encryption_salt?: string
  encryption_passphrase?: string
}

export type ResearchResponse = {
  final_report: string
  sources: string[]
  topic: string
  graph_data?: {
    nodes: Array<{ id: string; type?: string; label?: string; url?: string }>
    links: Array<{ source: string; target: string; weight?: number }>
  }
}
