import { useAppApi } from '@kirocrew/app-sdk'
import { Card, CardTitle, PageHeader, StatCard } from '@kirocrew/app-sdk/ui'
import {
  Activity, AlertTriangle, Bot, CheckCircle2, CircleDot, Clock, ExternalLink, Eye,
  GitPullRequest, RefreshCw, Server, X, Zap,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

// ---------------------------------------------------------------------------
// Types (mirror backend/server.py)
// ---------------------------------------------------------------------------

type Stage = { id: string; label: string; agent: string | null }
type Hop = { id: string; agent: string; kind: string; outcome: string; started_at: number | null; duration_ms: number | null; credits: number | null; live: boolean }
type PR = { number: number; url: string; title: string; labels: string[]; state: string; merged_at: number | null; review_decision: string | null; checks: string | null }
type Item = {
  issue: number; title: string; url: string; state: string; labels: string[]; stage: string; stage_since: number | null
  created_at: number | null; closed_at: number | null; pr: PR | null; docs_pr: { number: number; url: string } | null
  rounds: number; hops: Hop[]; live_agent: string | null; credits: number; last_activity: number | null
}
type Session = {
  found: boolean; agent?: string; model?: string; effort?: string; status?: string; title?: string; tool_calls: number
  tools: Record<string, number>; model_calls: number; credits: number; elapsed_ms: number | null; issue: number | null; pr: number | null; last_text: string
}
type Run = {
  id: string; kind: string; agent: string; workflow_run_id: number; attempt: number; outcome: string; started_at: number | null
  duration_ms: number | null; delivered: boolean; detail: string; session_key: string | null; live: boolean; session: Session | null
}
type AgentStat = {
  id: string; label: string; role: string; runs: number; completed: number; failed: number; live: number
  avg_duration_ms: number | null; p90_duration_ms: number | null; avg_credits: number | null; model: string | null
  last_run_at: number | null; last_outcome: string | null; installed: boolean
}
type Infra = {
  repo: string; runners: { name: string; status: string; busy: boolean; labels: string[] }[]; runner_ok: boolean
  workflow_recent: { id: number; name: string; event: string; status: string; conclusion: string | null; created_at: number | null; url: string; title: string }[]
  workflow_failures_recent: number; workflow_last_at: number | null; webhooks_enabled: boolean | null
  sources: { id: string; label: string; agent: string; enabled: boolean; signed: boolean; last_used_at: number | null }[]
  sources_readable: boolean; templates: Record<string, boolean>; templates_ok: boolean; gateway_host: string; errors: string[]
}
type Stats = {
  in_flight: number; ready: number; parked: number; shipped: number; by_stage: Record<string, number>; median_cycle_s: number | null
  pass_rate: number | null; runs_total: number; runs_week: number; runs_completed: number; runs_failed: number; live_runs: number
  credits_total: number; credits_week: number; run_success_rate: number | null
}
type CostIssue = { issue: number; title: string; url: string; stage: string; pr: number | null; hops: number; rounds: number; credits: number; by_agent: Record<string, number>; last_activity: number | null }
type CostAgent = { agent: string; runs: number; credits: number; model_calls: number; tool_calls: number; duration_ms: number; avg_credits: number | null; credits_per_minute: number | null }
type CostModel = { model: string; runs: number; credits: number; model_calls: number; avg_credits: number | null; avg_context_chars: number | null }
type CostDay = { day: string; credits: number; runs: number; by_agent: Record<string, number> }
type Costs = {
  unit: string; tokens_recorded: boolean
  totals: { credits_total: number; credits_week: number; runs: number; issues_with_cost: number; avg_per_issue: number | null; median_per_delivered_issue: number | null; avg_per_shipped_issue: number | null; avg_per_hop: number | null }
  per_issue: CostIssue[]; per_agent: CostAgent[]; per_model: CostModel[]; per_day: CostDay[]
}
type State = { generated_at: number; repo: string; stages: Stage[]; stats: Stats; board: Item[]; board_total: number; board_limit: number; runs: Run[]; agents: AgentStat[]; costs: Costs; infra: Infra }
type Step = { t: string; kind: 'tool' | 'text' | 'end'; tool?: string; title?: string; detail?: string; status?: string; ok?: boolean | null; text?: string; reason?: string }
type Span = {
  id: string; parent: string | null; kind: 'run' | 'turn' | 'model' | 'tool'; name: string; start: number; end: number
  status: 'ok' | 'error' | 'denied' | 'running' | 'pending' | 'warn'; input: string; output: string
  meta: { title?: string; tool?: string; kind?: string; approval_ms?: number; credits?: number; model_calls?: number; tools?: number; context_pct?: number; model?: string; turns?: number; model_spans?: number }
}

const API = '/apps/software-factory/api'

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

const fmtDur = (ms: number | null | undefined) => {
  if (ms == null) return '–'
  const s = Math.round(ms / 1000)
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ${s % 60}s`
  const h = Math.floor(m / 60)
  return `${h}h ${m % 60}m`
}
const fmtAgo = (ts: number | null | undefined) => {
  if (!ts) return '–'
  const s = Math.max(0, Date.now() / 1000 - ts)
  if (s < 60) return `${Math.round(s)}s ago`
  if (s < 3600) return `${Math.round(s / 60)}m ago`
  if (s < 86400) return `${Math.round(s / 3600)}h ago`
  return `${Math.round(s / 86400)}d ago`
}
const fmtTime = (ts: number | null | undefined) => (ts ? new Date(ts * 1000).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '–')
const shortAgent = (a: string) => a.replace('delivery-', '').replace('github-', '')

const AGENT_HUE: Record<string, string> = {
  'delivery-planner': 'var(--info)',
  'delivery-implementer': 'var(--accent)',
  'delivery-reviewer': 'var(--warn)',
  'delivery-scribe': 'var(--ok)',
  'github-worker': 'var(--muted-strong)',
  'pr-gate': 'var(--text)',
}
const agentColor = (a: string) => AGENT_HUE[a] ?? 'var(--muted)'

const STAGE_TONE: Record<string, string> = {
  planning: 'var(--info)', 'needs-owner': 'var(--warn)', implementing: 'var(--accent)', review: 'var(--warn)',
  fixing: 'var(--warn)', gate: 'var(--muted-strong)', ready: 'var(--ok)', parked: 'var(--danger)', shipped: 'var(--ok)',
}
const outcomeTone = (o: string) => (o === 'completed' ? 'var(--ok)' : o === 'running' ? 'var(--accent)' : 'var(--danger)')

// ---------------------------------------------------------------------------
// Styles: theme variables only, so light/dark and every palette work
// ---------------------------------------------------------------------------

const CSS = `
.sf-root{display:flex;flex-direction:column;min-height:0;flex:1;color:var(--text)}
.sf-body{padding:0 24px 32px;overflow-y:auto;flex:1;min-height:0}
.sf-row{display:flex;align-items:center;gap:8px}
.sf-stats{display:grid;gap:14px;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));margin-bottom:18px}
.sf-tabs{display:inline-flex;gap:2px;padding:3px;border-radius:10px;background:var(--bg-elevated);border:1px solid var(--border);margin-bottom:16px}
.sf-tab{border:0;background:transparent;color:var(--muted);padding:6px 14px;border-radius:8px;font-size:13px;cursor:pointer;font-weight:500}
.sf-tab:hover{color:var(--text)}
.sf-tab[data-on=true]{background:var(--card);color:var(--text-strong);box-shadow:var(--shadow-sm)}
.sf-btn{border:1px solid var(--border);background:var(--card);color:var(--text);padding:5px 10px;border-radius:8px;font-size:12.5px;cursor:pointer;display:inline-flex;align-items:center;gap:6px}
.sf-btn:hover{background:var(--bg-hover);border-color:var(--border-hover,var(--border-strong))}
.sf-board{display:grid;grid-auto-flow:column;grid-auto-columns:minmax(230px,1fr);gap:12px;overflow-x:auto;padding-bottom:8px;align-items:start}
.sf-col{background:var(--bg-elevated);border:1px solid var(--border);border-radius:12px;padding:10px;min-height:120px}
.sf-colhead{display:flex;justify-content:space-between;align-items:center;font-size:12px;font-weight:600;color:var(--text-strong);padding:2px 4px 10px;text-transform:uppercase;letter-spacing:.04em}
.sf-count{background:var(--card);border:1px solid var(--border);border-radius:999px;padding:0 8px;font-size:11px;color:var(--muted)}
.sf-card{background:var(--card);border:1px solid var(--border);border-radius:10px;padding:10px 12px;margin-bottom:8px;cursor:pointer;transition:border-color .15s,transform .15s;position:relative}
.sf-card:hover{border-color:var(--accent);transform:translateY(-1px);box-shadow:var(--shadow-sm)}
.sf-card[data-live=true]{border-color:var(--accent)}
.sf-cardtitle{font-size:13px;font-weight:500;color:var(--text-strong);line-height:1.3;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.sf-meta{font-size:11px;color:var(--muted);display:flex;gap:10px;flex-wrap:wrap;margin-top:6px;align-items:center}
.sf-chip{font-size:10.5px;padding:1px 7px;border-radius:999px;border:1px solid var(--border);color:var(--muted);background:var(--bg)}
.sf-dot{width:9px;height:9px;border-radius:999px;display:inline-block}
.sf-pulse{animation:sf-pulse 1.4s ease-in-out infinite}
@keyframes sf-pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.45;transform:scale(1.25)}}
@media (prefers-reduced-motion: reduce){.sf-pulse{animation:none}}
.sf-hops{display:flex;gap:4px;margin-top:8px;align-items:center}
.sf-hop{height:6px;border-radius:3px;flex:1;min-width:10px;max-width:46px;opacity:.9}
.sf-table{width:100%;border-collapse:collapse;font-size:12.5px}
.sf-table th{text-align:left;font-size:11px;color:var(--muted);font-weight:600;text-transform:uppercase;letter-spacing:.04em;padding:8px 10px;border-bottom:1px solid var(--border)}
.sf-table td{padding:9px 10px;border-bottom:1px solid var(--border);vertical-align:middle;color:var(--text)}
.sf-table tr:hover td{background:var(--bg-hover)}
.sf-mono{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11.5px}
.sf-pill{display:inline-flex;align-items:center;gap:5px;font-size:11px;padding:2px 8px;border-radius:999px;font-weight:500}
.sf-grid{display:grid;gap:14px;grid-template-columns:repeat(auto-fit,minmax(260px,1fr))}
.sf-agent{background:var(--card);border:1px solid var(--border);border-radius:12px;padding:14px;position:relative;overflow:hidden}
.sf-agent::before{content:"";position:absolute;left:0;top:0;bottom:0;width:4px;background:var(--sf-c)}
.sf-kv{display:grid;grid-template-columns:1fr 1fr;gap:6px 12px;margin-top:10px;font-size:12px}
.sf-kv dt{color:var(--muted)}.sf-kv dd{margin:0;color:var(--text-strong);font-weight:500}
.sf-bar{height:6px;border-radius:3px;background:var(--bg-elevated);overflow:hidden;margin-top:10px}
.sf-bar i{display:block;height:100%;background:var(--sf-c)}
.sf-drawer{position:fixed;top:0;right:0;bottom:0;width:min(560px,92vw);background:var(--panel,var(--card));border-left:1px solid var(--border);box-shadow:var(--shadow-lg);z-index:50;display:flex;flex-direction:column}
.sf-scrim{position:fixed;inset:0;background:rgba(0,0,0,.35);z-index:49}
.sf-dhead{padding:16px 18px;border-bottom:1px solid var(--border);display:flex;align-items:flex-start;gap:10px}
.sf-dbody{padding:16px 18px;overflow-y:auto;flex:1}
.sf-x{margin-left:auto;border:0;background:transparent;color:var(--muted);cursor:pointer;padding:4px;border-radius:6px}
.sf-x:hover{background:var(--bg-hover);color:var(--text)}
.sf-tl{position:relative;padding-left:22px}
.sf-tl::before{content:"";position:absolute;left:7px;top:6px;bottom:6px;width:2px;background:var(--border)}
.sf-tli{position:relative;padding:6px 0 12px}
.sf-tli .sf-dot{position:absolute;left:-19px;top:10px;border:2px solid var(--panel,var(--card))}
.sf-step{display:flex;gap:10px;padding:7px 0;border-bottom:1px dashed var(--border);font-size:12.5px;align-items:flex-start}
.sf-step .sf-mono{color:var(--muted);word-break:break-all}
.sf-text{background:var(--bg-elevated);border-radius:8px;padding:8px 10px;white-space:pre-wrap;font-size:12.5px;color:var(--text)}
.sf-link{color:var(--accent);text-decoration:none;display:inline-flex;align-items:center;gap:4px}
.sf-link:hover{text-decoration:underline}
.sf-empty{color:var(--muted);font-size:13px;padding:20px;text-align:center}
.sf-spark{display:flex;align-items:flex-end;gap:3px;height:56px}
.sf-spark i{flex:1;border-radius:2px 2px 0 0;background:var(--sf-c);min-height:2px}
.sf-warnbox{border:1px solid var(--warn);background:var(--warn-subtle);color:var(--text);border-radius:10px;padding:10px 12px;font-size:12.5px;margin-bottom:14px}
.sf-drawer[data-wide=true]{width:min(1100px,96vw)}
.sf-legend{display:flex;flex-wrap:wrap;gap:6px 14px;align-items:center;font-size:11.5px;color:var(--muted);padding:8px 12px;border:1px solid var(--border);border-radius:10px;background:var(--bg-elevated);margin-bottom:12px}
.sf-legend>span{display:inline-flex;align-items:center;gap:5px}
.sf-legend-h{color:var(--text-strong);font-weight:600;text-transform:uppercase;letter-spacing:.04em;font-size:10.5px}
.sf-views{display:inline-flex;gap:2px;padding:2px;border-radius:8px;background:var(--bg-elevated);border:1px solid var(--border)}
.sf-views button{border:0;background:transparent;color:var(--muted);padding:3px 10px;border-radius:6px;font-size:12px;cursor:pointer}
.sf-views button[data-on=true]{background:var(--card);color:var(--text-strong);box-shadow:var(--shadow-sm)}
.sf-tr-sum{display:flex;gap:18px;flex-wrap:wrap;font-size:12px;color:var(--muted);padding:10px 12px;border:1px solid var(--border);border-radius:10px;background:var(--bg-elevated);margin-bottom:12px}
.sf-tr-sum b{color:var(--text-strong);font-weight:600;margin-right:4px}
.sf-tr-tools{display:flex;gap:8px;align-items:center;margin-bottom:10px}
.sf-tr-tools input{flex:1;border:1px solid var(--border);background:var(--card);color:var(--text);border-radius:8px;padding:6px 10px;font-size:12.5px}
.sf-tr{display:grid;grid-template-columns:minmax(260px,38%) 1fr;font-size:12.5px;border:1px solid var(--border);border-radius:10px;overflow:hidden}
.sf-tr-head{display:contents}
.sf-tr-head>div{background:var(--bg-elevated);color:var(--muted);font-size:11px;text-transform:uppercase;letter-spacing:.04em;padding:7px 10px;border-bottom:1px solid var(--border)}
.sf-tr-axis{position:relative;height:100%}
.sf-tr-axis span{position:absolute;top:7px;transform:translateX(-50%);font-size:10.5px;color:var(--muted)}
.sf-tr-row{display:contents;cursor:pointer}
.sf-tr-row>div{padding:5px 10px;border-bottom:1px solid var(--border);min-height:30px;display:flex;align-items:center;gap:6px;min-width:0}
.sf-tr-row:hover>div{background:var(--bg-hover)}
.sf-tr-row[data-sel=true]>div{background:color-mix(in srgb, var(--accent) 12%, transparent)}
.sf-tr-name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--text-strong)}
.sf-tr-sub{color:var(--muted);font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.sf-caret{width:14px;height:14px;display:inline-flex;align-items:center;justify-content:center;color:var(--muted);flex:none;font-size:10px}
.sf-tr-track{position:relative;flex:1;height:18px}
.sf-tr-track::before{content:"";position:absolute;inset:0;background:repeating-linear-gradient(90deg,transparent 0 calc(25% - 1px),var(--border) calc(25% - 1px) 25%)}
.sf-tr-bar{position:absolute;top:3px;height:12px;border-radius:4px;min-width:2px;opacity:.9}
.sf-tr-bar[data-status=error],.sf-tr-bar[data-status=denied]{outline:2px solid var(--danger);outline-offset:-1px}
.sf-tr-bar[data-status=running]{animation:sf-pulse 1.4s ease-in-out infinite}
.sf-tr-dur{font-size:11px;color:var(--muted);white-space:nowrap;font-variant-numeric:tabular-nums;min-width:52px;text-align:right}
.sf-tr-detail{margin-top:12px;border:1px solid var(--border);border-radius:10px;padding:12px;background:var(--card)}
.sf-tr-kv{display:flex;gap:14px;flex-wrap:wrap;font-size:12px;color:var(--muted);margin-bottom:10px}
.sf-tr-kv b{color:var(--text-strong);font-weight:600}
.sf-pre{background:var(--bg-elevated);border-radius:8px;padding:8px 10px;white-space:pre-wrap;word-break:break-word;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11.5px;color:var(--text);max-height:260px;overflow:auto;margin:4px 0 10px}
.sf-label{font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.04em;margin-top:6px}
`

// ---------------------------------------------------------------------------
// Data hook
// ---------------------------------------------------------------------------

function useFactory() {
  const api = useAppApi()
  const [state, setState] = useState<State | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAll, setShowAll] = useState(false)
  const timer = useRef<number | null>(null)

  const load = useCallback(async (force = false) => {
    try {
      const q = [force ? 'refresh=1' : '', showAll ? 'limit=0' : ''].filter(Boolean).join('&')
      const data = (await api.get(`${API}/state${q ? `?${q}` : ''}`)) as State
      setState(data)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [api, showAll])

  useEffect(() => {
    void load()
    const tick = () => {
      const live = (state?.stats.live_runs ?? 0) > 0
      timer.current = window.setTimeout(async () => { await load(); tick() }, live ? 5000 : 15000)
    }
    tick()
    return () => { if (timer.current) window.clearTimeout(timer.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load])

  return { state, error, loading, reload: () => load(true), api, showAll, setShowAll }
}

// ---------------------------------------------------------------------------
// Pieces
// ---------------------------------------------------------------------------

function Pill({ tone, children }: { tone: string; children: React.ReactNode }) {
  return <span className="sf-pill" style={{ background: `color-mix(in srgb, ${tone} 16%, transparent)`, color: tone }}>{children}</span>
}

function Outcome({ o, live }: { o: string; live?: boolean }) {
  const tone = outcomeTone(o)
  return (
    <Pill tone={tone}>
      <span className={`sf-dot ${live ? 'sf-pulse' : ''}`} style={{ background: tone, width: 7, height: 7 }} />
      {o}
    </Pill>
  )
}

function Tabs({ value, onChange, items }: { value: string; onChange: (v: string) => void; items: [string, string][] }) {
  return (
    <div className="sf-tabs" role="tablist">
      {items.map(([id, label]) => (
        <button key={id} role="tab" aria-selected={value === id} data-on={value === id} className="sf-tab" onClick={() => onChange(id)}>{label}</button>
      ))}
    </div>
  )
}

function Drawer({ title, sub, onClose, children, wide, actions }: { title: React.ReactNode; sub?: React.ReactNode; onClose: () => void; children: React.ReactNode; wide?: boolean; actions?: React.ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <>
      <div className="sf-scrim" onClick={onClose} />
      <aside className="sf-drawer" data-wide={!!wide} role="dialog" aria-modal="true">
        <div className="sf-dhead">
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-strong)' }}>{title}</div>
            {sub && <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 3 }}>{sub}</div>}
          </div>
          {actions}
          <button className="sf-x" onClick={onClose} aria-label="Close" style={{ marginLeft: 4 }}><X size={16} /></button>
        </div>
        <div className="sf-dbody">{children}</div>
      </aside>
    </>
  )
}

// ---------------------------------------------------------------------------
// Board
// ---------------------------------------------------------------------------

function BoardCard({ it, onOpen }: { it: Item; onOpen: () => void }) {
  const live = !!it.live_agent
  return (
    <div className="sf-card" data-live={live} onClick={onOpen} role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && onOpen()}>
      <div className="sf-row" style={{ justifyContent: 'space-between', marginBottom: 4 }}>
        <span className="sf-mono" style={{ color: 'var(--muted)' }}>#{it.issue}</span>
        {live && <Pill tone="var(--accent)"><span className="sf-dot sf-pulse" style={{ background: 'var(--accent)', width: 7, height: 7 }} />{shortAgent(it.live_agent!)}</Pill>}
        {!live && it.pr?.checks && <span className="sf-dot" title={`CI ${it.pr.checks}`} style={{ background: it.pr.checks === 'passing' ? 'var(--ok)' : it.pr.checks === 'failing' ? 'var(--danger)' : 'var(--warn)' }} />}
      </div>
      <div className="sf-cardtitle">{it.title}</div>
      <div className="sf-meta">
        <span title="Last activity"><Clock size={11} style={{ verticalAlign: -1 }} /> {fmtAgo(it.last_activity ?? it.stage_since)}</span>
        {it.pr && <span><GitPullRequest size={11} style={{ verticalAlign: -1 }} /> PR {it.pr.number}</span>}
        {it.rounds > 1 && <span>{it.rounds} rounds</span>}
        {it.credits > 0 && <span><Zap size={11} style={{ verticalAlign: -1 }} /> {it.credits.toFixed(1)}</span>}
      </div>
      {it.hops.length > 0 && (
        <div className="sf-hops" title={it.hops.map(h => `${shortAgent(h.agent)} ${h.outcome} ${fmtDur(h.duration_ms)}`).join('\n')}>
          {it.hops.map(h => <span key={h.id} className={`sf-hop ${h.live ? 'sf-pulse' : ''}`} style={{ background: agentColor(h.agent), opacity: h.outcome === 'completed' || h.live ? 0.9 : 0.35 }} />)}
        </div>
      )}
    </div>
  )
}

function Board({ state, onOpen, showAll, onToggleAll }: { state: State; onOpen: (it: Item) => void; showAll: boolean; onToggleAll: (v: boolean) => void }) {
  // Columns hold only the stages that have cards, plus the ones work can be waiting in.
  const always = new Set(['planning', 'needs-owner', 'implementing', 'review', 'ready'])
  const cols = state.stages.filter(s => always.has(s.id) || state.board.some(it => it.stage === s.id))
  const hidden = state.board_total - state.board.length
  return (
    <>
      <div className="sf-row" style={{ justifyContent: 'space-between', marginBottom: 10, fontSize: 12, color: 'var(--muted)', flexWrap: 'wrap', gap: 10 }}>
        <span>
          {showAll ? `All ${state.board_total} items` : `${state.board.length} most recently active${hidden > 0 ? ` · ${hidden} older hidden` : ''}`}, newest first in each column
        </span>
        <div className="sf-views" role="tablist" aria-label="Board scope">
          <button role="tab" aria-selected={!showAll} data-on={!showAll} onClick={() => onToggleAll(false)}>Recent {state.board_limit || 20}</button>
          <button role="tab" aria-selected={showAll} data-on={showAll} onClick={() => onToggleAll(true)}>All</button>
        </div>
      </div>
      <div className="sf-legend" aria-label="Legend">
        <span className="sf-legend-h">Bars: one per agent hop, oldest left</span>
        {(['delivery-planner', 'delivery-implementer', 'delivery-reviewer', 'delivery-scribe', 'github-worker'] as const).map(a => (
          <span key={a}><i className="sf-hop" style={{ background: agentColor(a), width: 18, minWidth: 18, display: 'inline-block' }} /> {shortAgent(a)}</span>
        ))}
        <span><i className="sf-hop" style={{ background: 'var(--muted)', opacity: 0.35, width: 18, minWidth: 18, display: 'inline-block' }} /> failed or stopped</span>
        <span><i className="sf-hop sf-pulse" style={{ background: 'var(--accent)', width: 18, minWidth: 18, display: 'inline-block' }} /> running</span>
        <span className="sf-legend-h" style={{ marginLeft: 8 }}>Card</span>
        <span><span className="sf-dot" style={{ background: 'var(--ok)' }} /> CI passing</span>
        <span><span className="sf-dot" style={{ background: 'var(--warn)' }} /> CI pending</span>
        <span><span className="sf-dot" style={{ background: 'var(--danger)' }} /> CI failing</span>
        <span><Clock size={11} style={{ verticalAlign: -1 }} /> last activity</span>
        <span><GitPullRequest size={11} style={{ verticalAlign: -1 }} /> PR</span>
        <span><Zap size={11} style={{ verticalAlign: -1 }} /> credits</span>
      </div>
      <div className="sf-board">
        {cols.map(s => {
          const items = state.board.filter(it => it.stage === s.id)
          return (
            <div className="sf-col" key={s.id}>
              <div className="sf-colhead">
                <span className="sf-row"><span className="sf-dot" style={{ background: STAGE_TONE[s.id] }} />{s.label}</span>
                <span className="sf-count">{items.length}</span>
              </div>
              {items.map(it => <BoardCard key={it.issue} it={it} onOpen={() => onOpen(it)} />)}
              {items.length === 0 && <div className="sf-empty" style={{ padding: 10 }}>empty</div>}
            </div>
          )
        })}
      </div>
    </>
  )
}

function IssueDrawer({ it, runs, onClose, onWatch }: { it: Item; runs: Run[]; onClose: () => void; onWatch: (r: Run) => void }) {
  const hops = it.hops.map(h => ({ hop: h, run: runs.find(r => r.id === h.id) }))
  return (
    <Drawer onClose={onClose} title={<span>#{it.issue} {it.title}</span>} sub={<span className="sf-row">
      <Pill tone={STAGE_TONE[it.stage]}>{it.stage}</Pill>
      <a className="sf-link" href={it.url} target="_blank" rel="noreferrer">issue <ExternalLink size={11} /></a>
      {it.pr && <a className="sf-link" href={it.pr.url} target="_blank" rel="noreferrer">PR {it.pr.number} <ExternalLink size={11} /></a>}
      {it.docs_pr && <a className="sf-link" href={it.docs_pr.url} target="_blank" rel="noreferrer">docs PR {it.docs_pr.number} <ExternalLink size={11} /></a>}
    </span>}>
      <dl className="sf-kv" style={{ marginTop: 0, marginBottom: 16 }}>
        <dt>Opened</dt><dd>{fmtTime(it.created_at)}</dd>
        <dt>In stage since</dt><dd>{fmtAgo(it.stage_since)}</dd>
        <dt>Review rounds</dt><dd>{it.rounds}</dd>
        <dt>Credits</dt><dd>{it.credits.toFixed(2)}</dd>
        <dt>CI</dt><dd>{it.pr?.checks ?? '–'}</dd>
        <dt>Labels</dt><dd style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>{[...it.labels, ...(it.pr?.labels ?? [])].filter(l => l.startsWith('kiro-')).map(l => <span key={l} className="sf-chip">{l}</span>)}</dd>
      </dl>
      <CardTitle>Hops</CardTitle>
      {hops.length === 0 && <div className="sf-empty">No agent run is linked to this issue on this gateway yet.</div>}
      <div className="sf-tl">
        {hops.map(({ hop, run }) => (
          <div className="sf-tli" key={hop.id}>
            <span className={`sf-dot ${hop.live ? 'sf-pulse' : ''}`} style={{ background: agentColor(hop.agent) }} />
            <div className="sf-row" style={{ justifyContent: 'space-between' }}>
              <div>
                <strong style={{ color: 'var(--text-strong)', fontSize: 13 }}>{shortAgent(hop.agent)}</strong>
                <span style={{ color: 'var(--muted)', fontSize: 12, marginLeft: 8 }}>{hop.kind}</span>
              </div>
              <Outcome o={hop.outcome} live={hop.live} />
            </div>
            <div className="sf-meta">
              <span>{fmtTime(hop.started_at)}</span>
              <span>{fmtDur(hop.duration_ms)}</span>
              {hop.credits != null && <span><Zap size={11} style={{ verticalAlign: -1 }} /> {hop.credits.toFixed(2)}</span>}
              {run?.session?.model && <span>{run.session.model}</span>}
              {run?.session?.tool_calls != null && <span>{run.session.tool_calls} tool calls</span>}
              {run?.session_key && <button className="sf-btn" style={{ padding: '2px 8px' }} onClick={() => onWatch(run)}><Eye size={12} /> {hop.live ? 'watch live' : 'steps'}</button>}
            </div>
            {run?.session?.last_text && <div className="sf-text" style={{ marginTop: 8, maxHeight: 90, overflow: 'hidden' }}>{run.session.last_text}</div>}
          </div>
        ))}
      </div>
    </Drawer>
  )
}

// ---------------------------------------------------------------------------
// Runs
// ---------------------------------------------------------------------------

function RunsTable({ runs, onWatch }: { runs: Run[]; onWatch: (r: Run) => void }) {
  return (
    <Card>
      <table className="sf-table">
        <thead><tr><th>When</th><th>Agent</th><th>Hop</th><th>Item</th><th>Outcome</th><th>Duration</th><th>Model</th><th>Tools</th><th>Credits</th><th /></tr></thead>
        <tbody>
          {runs.map(r => (
            <tr key={r.id}>
              <td title={fmtTime(r.started_at)}>{fmtAgo(r.started_at)}</td>
              <td><span className="sf-row"><span className="sf-dot" style={{ background: agentColor(r.agent) }} />{shortAgent(r.agent)}</span></td>
              <td className="sf-mono">{r.kind}</td>
              <td>{r.session?.issue ? `#${r.session.issue}` : ''}{r.session?.pr ? ` PR ${r.session.pr}` : ''}</td>
              <td><Outcome o={r.outcome} live={r.live} /></td>
              <td>{fmtDur(r.duration_ms)}</td>
              <td className="sf-mono">{r.session?.model ?? '–'}</td>
              <td>{r.session?.tool_calls ?? '–'}</td>
              <td>{r.session?.credits ? r.session.credits.toFixed(2) : '–'}</td>
              <td>{r.session_key && r.session?.found && <button className="sf-btn" onClick={() => onWatch(r)}><Eye size={12} /> {r.live ? 'watch' : 'steps'}</button>}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {runs.length === 0 && <div className="sf-empty">No webhook runs recorded for this repository on this gateway.</div>}
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Trace view: the hop as a span tree on a shared time axis
// ---------------------------------------------------------------------------

const fmtMs = (ms: number) => (ms < 1000 ? `${Math.round(ms)}ms` : ms < 60000 ? `${(ms / 1000).toFixed(ms < 10000 ? 2 : 1)}s` : `${Math.floor(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`)

const spanColor = (sp: Span) => {
  if (sp.status === 'error' || sp.status === 'denied') return 'var(--danger)'
  if (sp.kind === 'run') return 'var(--text)'
  if (sp.kind === 'turn') return 'var(--muted-strong)'
  if (sp.kind === 'model') return 'var(--info)'
  const k = sp.meta.kind || ''
  if (k === 'read' || k === 'read_files' || k === 'search') return 'var(--muted)'
  if (k === 'edit' || k === 'write') return 'var(--warn)'
  return 'var(--accent)'
}
const spanLabel = (sp: Span) => {
  if (sp.kind === 'tool') return sp.meta.title && sp.meta.title !== sp.name ? sp.meta.title : sp.name
  if (sp.kind === 'model') return `model · ${sp.output ? 'said' : 'thought'}`
  return sp.name
}

function TraceView({ spans, live }: { spans: Span[]; live: boolean }) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [sel, setSel] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const root = spans[0]
  const t0 = root.start
  const total = Math.max(0.001, root.end - root.start)
  const children = useMemo(() => {
    const m = new Map<string | null, Span[]>()
    for (const sp of spans) { const arr = m.get(sp.parent) ?? []; arr.push(sp); m.set(sp.parent, arr) }
    return m
  }, [spans])
  const rows = useMemo(() => {
    const out: { sp: Span; depth: number; kids: number }[] = []
    const ql = q.trim().toLowerCase()
    const matches = (sp: Span) => !ql || `${spanLabel(sp)} ${sp.input} ${sp.name}`.toLowerCase().includes(ql)
    const walk = (id: string | null, depth: number) => {
      for (const sp of children.get(id) ?? []) {
        const kids = children.get(sp.id)?.length ?? 0
        if (matches(sp) || sp.kind !== 'tool' && sp.kind !== 'model') out.push({ sp, depth, kids })
        if (!collapsed.has(sp.id)) walk(sp.id, depth + 1)
      }
    }
    walk(null, 0)
    return out
  }, [children, collapsed, q])
  const toggle = (id: string) => setCollapsed(c => { const n = new Set(c); if (n.has(id)) n.delete(id); else n.add(id); return n })
  const toolMs = spans.filter(s => s.kind === 'tool').reduce((a, s) => a + (s.end - s.start) * 1000, 0)
  const modelMs = spans.filter(s => s.kind === 'model').reduce((a, s) => a + (s.end - s.start) * 1000, 0)
  const errors = spans.filter(s => s.status === 'error' || s.status === 'denied').length
  const selected = spans.find(s => s.id === sel) ?? null
  return (
    <div>
      <div className="sf-tr-sum">
        <span><b>{spans.length}</b>spans</span>
        <span><b>{fmtMs(total * 1000)}</b>duration</span>
        <span><b>{root.meta.tools ?? 0}</b>tool calls · {fmtMs(toolMs)} ({Math.round(100 * toolMs / (total * 1000))}%)</span>
        <span><b>{root.meta.model_spans ?? 0}</b>model spans · {fmtMs(modelMs)} ({Math.round(100 * modelMs / (total * 1000))}%)</span>
        <span><b>{(root.meta.credits ?? 0).toFixed(2)}</b>credits</span>
        {errors > 0 && <span style={{ color: 'var(--danger)' }}><b style={{ color: 'var(--danger)' }}>{errors}</b>refused or failed</span>}
        {live && <span style={{ color: 'var(--accent)' }}>live</span>}
      </div>
      <div className="sf-tr-tools">
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Filter spans by name, command or path…" aria-label="Filter spans" />
        <button className="sf-btn" onClick={() => setCollapsed(new Set())}>Expand all</button>
        <button className="sf-btn" onClick={() => setCollapsed(new Set(spans.filter(s => s.kind === 'turn').map(s => s.id)))}>Turns only</button>
      </div>
      <div className="sf-tr" role="tree">
        <div className="sf-tr-head">
          <div>Span</div>
          <div className="sf-tr-axis">{[0, 0.25, 0.5, 0.75, 1].map(f => <span key={f} style={{ left: `calc(${f * 100}% - ${f === 1 ? 24 : f === 0 ? -6 : 0}px)` }}>{fmtMs(f * total * 1000)}</span>)}</div>
        </div>
        {rows.map(({ sp, depth, kids }) => {
          const left = ((sp.start - t0) / total) * 100
          const width = Math.max(0.3, ((sp.end - sp.start) / total) * 100)
          const color = spanColor(sp)
          return (
            <div key={sp.id} className="sf-tr-row" role="treeitem" aria-selected={sel === sp.id} data-sel={sel === sp.id} onClick={() => setSel(sp.id === sel ? null : sp.id)}>
              <div style={{ paddingLeft: 10 + depth * 16 }}>
                <span className="sf-caret" onClick={e => { e.stopPropagation(); if (kids) toggle(sp.id) }} aria-hidden="true">{kids ? (collapsed.has(sp.id) ? '▸' : '▾') : ''}</span>
                <span className="sf-dot" style={{ background: color, width: 8, height: 8, flex: 'none' }} />
                <span className="sf-tr-name" title={spanLabel(sp)}>{spanLabel(sp)}</span>
                {sp.kind === 'tool' && sp.input && <span className="sf-tr-sub" title={sp.input}>{sp.input}</span>}
                {sp.kind === 'turn' && sp.meta.credits != null && <span className="sf-chip">{sp.meta.credits.toFixed(2)} cr</span>}
              </div>
              <div>
                <div className="sf-tr-track"><span className="sf-tr-bar" data-status={sp.status} style={{ left: `${left}%`, width: `${width}%`, background: color }} /></div>
                <span className="sf-tr-dur">{fmtMs((sp.end - sp.start) * 1000)}</span>
              </div>
            </div>
          )
        })}
      </div>
      {selected && (
        <div className="sf-tr-detail">
          <div className="sf-row" style={{ marginBottom: 6 }}>
            <span className="sf-dot" style={{ background: spanColor(selected), width: 9, height: 9 }} />
            <b style={{ color: 'var(--text-strong)' }}>{spanLabel(selected)}</b>
            <Pill tone={selected.status === 'ok' ? 'var(--ok)' : selected.status === 'running' ? 'var(--accent)' : selected.status === 'warn' ? 'var(--warn)' : 'var(--danger)'}>{selected.status}</Pill>
            <span style={{ color: 'var(--muted)', fontSize: 12 }}>{selected.kind}{selected.meta.tool ? ` · ${selected.meta.tool}` : ''}{selected.meta.kind ? ` · ${selected.meta.kind}` : ''}</span>
          </div>
          <div className="sf-tr-kv">
            <span>start <b>+{fmtMs((selected.start - t0) * 1000)}</b></span>
            <span>duration <b>{fmtMs((selected.end - selected.start) * 1000)}</b></span>
            {selected.meta.approval_ms != null && <span>approval wait <b>{fmtMs(selected.meta.approval_ms)}</b></span>}
            {selected.meta.credits != null && selected.kind !== 'run' && <span>credits <b>{selected.meta.credits.toFixed(3)}</b></span>}
            {selected.meta.model_calls != null && <span>model calls <b>{selected.meta.model_calls}</b></span>}
            {selected.meta.context_pct != null && <span>context used <b>{selected.meta.context_pct.toFixed(1)}%</b></span>}
            {selected.meta.model && <span>model <b>{selected.meta.model}</b></span>}
          </div>
          {selected.input && <><div className="sf-label">{selected.kind === 'turn' ? 'prompt' : 'input'}</div><pre className="sf-pre">{selected.input}</pre></>}
          {selected.output && <><div className="sf-label">{selected.kind === 'turn' ? 'stop reason' : 'output'}</div><pre className="sf-pre">{selected.output}</pre></>}
          {!selected.input && !selected.output && <div className="sf-empty" style={{ padding: 8 }}>No input or output recorded for this span.</div>}
        </div>
      )}
    </div>
  )
}

function StepsDrawer({ run, api, onClose }: { run: Run; api: ReturnType<typeof useAppApi>; onClose: () => void }) {
  const [view, setView] = useState<'steps' | 'trace' | 'json'>('steps')
  const [steps, setSteps] = useState<Step[] | null>(null)
  const [spans, setSpans] = useState<Span[] | null>(null)
  const [err, setErr] = useState<string | null>(null)
  useEffect(() => {
    let alive = true
    const load = async () => {
      try {
        if (view === 'steps') {
          const d = (await api.get(`${API}/runs/${encodeURIComponent(run.id)}/steps`)) as { steps: Step[]; error?: string }
          if (!alive) return
          if (d.error) setErr(d.error); else { setSteps(d.steps); setErr(null) }
        } else {
          const d = (await api.get(`${API}/runs/${encodeURIComponent(run.id)}/trace`)) as { spans: Span[]; found: boolean; error?: string }
          if (!alive) return
          if (d.error) setErr(d.error); else { setSpans(d.found ? d.spans : []); setErr(null) }
        }
      } catch (e) { if (alive) setErr(String(e)) }
    }
    void load()
    const t = run.live ? window.setInterval(load, 4000) : null
    return () => { alive = false; if (t) window.clearInterval(t) }
  }, [api, run.id, run.live, view])
  const s = run.session
  const views = (
    <div className="sf-views" role="tablist" aria-label="Transcript view">
      {(['steps', 'trace', 'json'] as const).map(v => <button key={v} role="tab" aria-selected={view === v} data-on={view === v} onClick={() => setView(v)}>{v === 'steps' ? 'Steps' : v === 'trace' ? 'Trace' : 'JSON'}</button>)}
    </div>
  )
  return (
    <Drawer onClose={onClose} wide={view !== 'steps'} actions={views}
      title={<span className="sf-row"><Bot size={16} style={{ color: agentColor(run.agent) }} />{shortAgent(run.agent)} <span style={{ color: 'var(--muted)', fontWeight: 400 }}>{run.kind}</span> <Outcome o={run.outcome} live={run.live} /></span>}
      sub={<span>{s?.title ?? ''} · {s?.model ?? ''} {s?.effort ? `(${s.effort})` : ''} · {fmtDur(run.duration_ms)} · {s?.tool_calls ?? 0} tool calls · {s?.credits?.toFixed(2) ?? '0'} credits{s?.issue ? ` · #${s.issue}` : ''}{s?.pr ? ` · PR ${s.pr}` : ''}</span>}>
      {run.detail && <div className="sf-warnbox"><AlertTriangle size={13} style={{ verticalAlign: -2 }} /> {run.detail}</div>}
      {err && <div className="sf-empty">{err}</div>}
      {view !== 'steps' && !spans && !err && <div className="sf-empty">Building trace…</div>}
      {view !== 'steps' && spans && spans.length === 0 && <div className="sf-empty">Transcript not available on this gateway (the run happened on another machine).</div>}
      {view === 'trace' && spans && spans.length > 0 && <TraceView spans={spans} live={run.live} />}
      {view === 'json' && spans && spans.length > 0 && <pre className="sf-pre" style={{ maxHeight: 'none' }}>{JSON.stringify(spans, null, 2)}</pre>}
      {view === 'steps' && !steps && !err && <div className="sf-empty">Loading transcript…</div>}
      {view === 'steps' && steps && steps.length === 0 && <div className="sf-empty">Transcript not available on this gateway (the run happened on another machine).</div>}
      {view === 'steps' && steps?.map((st, i) => st.kind === 'tool' ? (
        <div className="sf-step" key={i}>
          <span className="sf-dot" style={{ marginTop: 5, background: st.ok === false ? 'var(--danger)' : st.ok ? 'var(--ok)' : 'var(--muted)' }} />
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ color: 'var(--text-strong)' }}>{st.title} <span style={{ color: 'var(--muted)', fontSize: 11 }}>{st.tool}</span></div>
            {st.detail && <div className="sf-mono">{st.detail}</div>}
          </div>
          <span style={{ color: 'var(--muted)', fontSize: 11, whiteSpace: 'nowrap' }}>{st.t ? new Date(st.t).toLocaleTimeString() : ''}</span>
        </div>
      ) : st.kind === 'text' ? (
        <div className="sf-step" key={i}><span className="sf-dot" style={{ marginTop: 5, background: agentColor(run.agent) }} /><div className="sf-text" style={{ flex: 1 }}>{st.text}</div></div>
      ) : (
        <div className="sf-step" key={i} style={{ color: 'var(--muted)' }}><CheckCircle2 size={14} /> turn ended ({st.reason})</div>
      ))}
    </Drawer>
  )
}

// ---------------------------------------------------------------------------
// Agents and trends
// ---------------------------------------------------------------------------

function Agents({ state }: { state: State }) {
  const maxDur = Math.max(1, ...state.agents.map(a => a.avg_duration_ms ?? 0))
  const days = useMemo(() => {
    const out: { day: string; completed: number; failed: number; credits: number }[] = []
    const today = new Date(); today.setHours(0, 0, 0, 0)
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today); d.setDate(today.getDate() - i)
      out.push({ day: d.toLocaleDateString([], { weekday: 'short' }), completed: 0, failed: 0, credits: 0 })
    }
    const start = today.getTime() / 1000 - 13 * 86400
    for (const r of state.runs) {
      if (!r.started_at || r.started_at < start) continue
      const idx = Math.min(13, Math.floor((r.started_at - start) / 86400))
      if (r.outcome === 'completed') out[idx].completed++; else if (r.outcome !== 'running') out[idx].failed++
      out[idx].credits += r.session?.credits ?? 0
    }
    return out
  }, [state.runs])
  const maxRuns = Math.max(1, ...days.map(d => d.completed + d.failed))
  const maxCredits = Math.max(1, ...days.map(d => d.credits))
  return (
    <>
      <div className="sf-grid" style={{ marginBottom: 16 }}>
        {state.agents.map(a => (
          <div className="sf-agent" key={a.id} style={{ ['--sf-c' as string]: agentColor(a.id) }}>
            <div className="sf-row" style={{ justifyContent: 'space-between' }}>
              <div className="sf-row"><Bot size={16} style={{ color: agentColor(a.id) }} /><strong style={{ color: 'var(--text-strong)' }}>{a.label}</strong></div>
              {a.live > 0 ? <Pill tone="var(--accent)"><span className="sf-dot sf-pulse" style={{ background: 'var(--accent)', width: 7, height: 7 }} />running</Pill>
                : a.installed ? <Pill tone="var(--ok)">template installed</Pill> : <Pill tone="var(--danger)">template missing</Pill>}
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>{a.role}</div>
            <dl className="sf-kv">
              <dt>Runs</dt><dd>{a.runs} <span style={{ color: 'var(--muted)', fontWeight: 400 }}>({a.completed} ok, {a.failed} failed)</span></dd>
              <dt>Avg / p90</dt><dd>{fmtDur(a.avg_duration_ms)} / {fmtDur(a.p90_duration_ms)}</dd>
              <dt>Avg credits</dt><dd>{a.avg_credits ?? '–'}</dd>
              <dt>Model</dt><dd className="sf-mono">{a.model ?? '–'}</dd>
              <dt>Last run</dt><dd>{fmtAgo(a.last_run_at)} {a.last_outcome && <span style={{ color: outcomeTone(a.last_outcome) }}>· {a.last_outcome}</span>}</dd>
            </dl>
            <div className="sf-bar" title="Average duration relative to the slowest agent"><i style={{ width: `${Math.round(100 * (a.avg_duration_ms ?? 0) / maxDur)}%` }} /></div>
          </div>
        ))}
      </div>
      <div className="sf-grid">
        <Card>
          <CardTitle>Runs per day (14d)</CardTitle>
          <div className="sf-spark" style={{ ['--sf-c' as string]: 'var(--accent)' }}>
            {days.map((d, i) => <i key={i} title={`${d.day}: ${d.completed} ok, ${d.failed} failed`} style={{ height: `${Math.round(100 * (d.completed + d.failed) / maxRuns)}%`, background: d.failed ? `linear-gradient(to top, var(--danger) ${Math.round(100 * d.failed / Math.max(1, d.completed + d.failed))}%, var(--accent) 0)` : undefined }} />)}
          </div>
          <div className="sf-meta" style={{ justifyContent: 'space-between' }}><span>{days[0].day}</span><span>today</span></div>
        </Card>
        <Card>
          <CardTitle>Credits per day (14d)</CardTitle>
          <div className="sf-spark" style={{ ['--sf-c' as string]: 'var(--warn)' }}>
            {days.map((d, i) => <i key={i} title={`${d.day}: ${d.credits.toFixed(1)} credits`} style={{ height: `${Math.round(100 * d.credits / maxCredits)}%` }} />)}
          </div>
          <div className="sf-meta" style={{ justifyContent: 'space-between' }}><span>{days[0].day}</span><span>today</span></div>
        </Card>
      </div>
    </>
  )
}

// ---------------------------------------------------------------------------
// Infrastructure
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Costs: credits by issue, agent, model and day
// ---------------------------------------------------------------------------

const fmtCr = (n: number | null | undefined, d = 1) => (n == null ? '–' : n.toFixed(d))
const fmtInt = (n: number | null | undefined) => (n == null ? '–' : n.toLocaleString())
const AGENT_ORDER = ['delivery-planner', 'delivery-implementer', 'delivery-reviewer', 'delivery-scribe', 'github-worker']

function StackBar({ parts, total, height = 8 }: { parts: Record<string, number>; total: number; height?: number }) {
  const t = Math.max(total, 0.0001)
  return (
    <div style={{ display: 'flex', height, borderRadius: height / 2, overflow: 'hidden', background: 'var(--bg-elevated)', width: '100%' }}
      title={Object.entries(parts).map(([a, c]) => `${shortAgent(a)} ${c.toFixed(2)}`).join(' · ')}>
      {AGENT_ORDER.filter(a => parts[a]).map(a => <span key={a} style={{ width: `${(100 * parts[a]) / t}%`, background: agentColor(a) }} />)}
    </div>
  )
}

function CostsView({ costs, onOpen }: { costs: Costs; onOpen: (issue: number) => void }) {
  const t = costs.totals
  const maxDay = Math.max(0.0001, ...costs.per_day.map(d => d.credits))
  const maxIssue = Math.max(0.0001, ...costs.per_issue.map(i => i.credits))
  const [showAll, setShowAll] = useState(false)
  const issues = showAll ? costs.per_issue : costs.per_issue.slice(0, 10)
  const agentTotal = costs.per_agent.reduce((a, x) => a + x.credits, 0)
  return (
    <div>
      <div className="sf-stats">
        <StatCard label="Credits, all runs" value={fmtCr(t.credits_total)} accent />
        <StatCard label="Credits, 7 days" value={fmtCr(t.credits_week)} />
        <StatCard label="Per hop (avg)" value={fmtCr(t.avg_per_hop, 2)} />
        <StatCard label="Per issue (avg)" value={fmtCr(t.avg_per_issue)} />
        <StatCard label="Per delivered issue (median)" value={fmtCr(t.median_per_delivered_issue)} />
        <StatCard label="Per shipped issue (avg)" value={fmtCr(t.avg_per_shipped_issue)} />
      </div>
      {!costs.tokens_recorded && (
        <div className="sf-legend"><span className="sf-legend-h">Unit</span><span>Credits are what kiro-cli records for a webhook run; token counts are not written on this surface. Model calls and context size stand in for them.</span></div>
      )}

      <div className="sf-grid" style={{ marginBottom: 16, gridTemplateColumns: 'minmax(0,2fr) minmax(0,1fr)' }}>
        <Card>
          <CardTitle>Credits per day, last 14 days</CardTitle>
          <div className="sf-spark" style={{ height: 120, marginTop: 10 }}>
            {costs.per_day.map(d => (
              <div key={d.day} title={`${d.day}: ${d.credits.toFixed(1)} credits, ${d.runs} runs\n${Object.entries(d.by_agent).map(([a, c]) => `${shortAgent(a)} ${c.toFixed(1)}`).join(', ')}`}
                style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '100%', borderRadius: '2px 2px 0 0', overflow: 'hidden' }}>
                {AGENT_ORDER.filter(a => d.by_agent[a]).map(a => <span key={a} style={{ height: `${Math.round((100 * d.by_agent[a]) / maxDay)}%`, background: agentColor(a), display: 'block' }} />)}
                {d.credits === 0 && <span style={{ height: 2, background: 'var(--border)', display: 'block' }} />}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: 'var(--muted)', marginTop: 4 }}>
            <span>{costs.per_day[0]?.day.slice(5)}</span><span>{costs.per_day[Math.floor(costs.per_day.length / 2)]?.day.slice(5)}</span><span>{costs.per_day[costs.per_day.length - 1]?.day.slice(5)}</span>
          </div>
        </Card>
        <Card>
          <CardTitle>By agent</CardTitle>
          <StackBar parts={Object.fromEntries(costs.per_agent.map(a => [a.agent, a.credits]))} total={agentTotal} height={10} />
          <table className="sf-table" style={{ marginTop: 10 }}>
            <thead><tr><th>Agent</th><th>Runs</th><th>Credits</th><th>Avg</th><th>Cr/min</th></tr></thead>
            <tbody>
              {costs.per_agent.map(a => (
                <tr key={a.agent}>
                  <td><span className="sf-row"><span className="sf-dot" style={{ background: agentColor(a.agent) }} />{shortAgent(a.agent)}</span></td>
                  <td>{a.runs}</td><td>{fmtCr(a.credits)} <span style={{ color: 'var(--muted)', fontSize: 11 }}>{agentTotal ? Math.round((100 * a.credits) / agentTotal) : 0}%</span></td>
                  <td>{fmtCr(a.avg_credits, 2)}</td><td>{fmtCr(a.credits_per_minute, 2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      <Card>
        <div className="sf-row" style={{ justifyContent: 'space-between' }}>
          <CardTitle>Most expensive issues</CardTitle>
          {costs.per_issue.length > 10 && <button className="sf-btn" onClick={() => setShowAll(v => !v)}>{showAll ? 'Top 10' : `All ${costs.per_issue.length}`}</button>}
        </div>
        <table className="sf-table" style={{ marginTop: 8 }}>
          <thead><tr><th>Issue</th><th style={{ width: '32%' }}>Credits</th><th>Hops</th><th>Rounds</th><th>Stage</th><th>Split by agent</th></tr></thead>
          <tbody>
            {issues.map(i => (
              <tr key={i.issue} style={{ cursor: 'pointer' }} onClick={() => onOpen(i.issue)}>
                <td><span className="sf-mono" style={{ color: 'var(--muted)' }}>#{i.issue}</span> {i.title.length > 48 ? i.title.slice(0, 48) + '…' : i.title}</td>
                <td>
                  <div className="sf-row">
                    <div className="sf-bar" style={{ flex: 1, marginTop: 0 }}><i style={{ width: `${Math.round((100 * i.credits) / maxIssue)}%`, background: 'var(--accent)' }} /></div>
                    <b style={{ minWidth: 44, textAlign: 'right' }}>{fmtCr(i.credits)}</b>
                  </div>
                </td>
                <td>{i.hops}</td><td>{i.rounds}</td>
                <td><Pill tone={STAGE_TONE[i.stage] ?? 'var(--muted)'}>{i.stage}</Pill></td>
                <td style={{ minWidth: 140 }}><StackBar parts={i.by_agent} total={i.credits} /></td>
              </tr>
            ))}
            {issues.length === 0 && <tr><td colSpan={6} className="sf-empty">No issue on this board has an agent run recorded on this gateway.</td></tr>}
          </tbody>
        </table>
      </Card>

      <Card>
        <CardTitle>By model</CardTitle>
        <table className="sf-table" style={{ marginTop: 8 }}>
          <thead><tr><th>Model</th><th>Runs</th><th>Credits</th><th>Avg per run</th><th>Model calls</th><th>Avg context</th></tr></thead>
          <tbody>
            {costs.per_model.map(m => (
              <tr key={m.model}>
                <td className="sf-mono">{m.model}</td><td>{m.runs}</td><td>{fmtCr(m.credits)}</td><td>{fmtCr(m.avg_credits, 2)}</td>
                <td>{fmtInt(m.model_calls)}</td><td>{m.avg_context_chars != null ? `${Math.round(m.avg_context_chars / 1000)}k chars` : '–'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {costs.per_model.length === 1 && costs.per_model[0].model === 'auto' && (
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8 }}>Every template runs on <code>auto</code>, so there is one row. Pin a model in a template (doc 08) and it appears here on its own.</div>
        )}
      </Card>
    </div>
  )
}

function Light({ ok, unknown }: { ok: boolean; unknown?: boolean }) {
  return <span className="sf-dot" style={{ background: unknown ? 'var(--muted)' : ok ? 'var(--ok)' : 'var(--danger)', width: 10, height: 10 }} />
}

function InfraView({ infra }: { infra: Infra }) {
  return (
    <div className="sf-grid">
      <Card>
        <CardTitle>Health</CardTitle>
        <dl className="sf-kv" style={{ gridTemplateColumns: 'auto 1fr' }}>
          <dt><Light ok={infra.runner_ok} /></dt><dd>Actions runner {infra.runner_ok ? 'online' : 'offline'}{infra.runners.map(r => ` · ${r.name}${r.busy ? ' (busy)' : ''}`)}</dd>
          <dt><Light ok={!!infra.webhooks_enabled} unknown={infra.webhooks_enabled == null} /></dt><dd>Inbound webhooks {infra.webhooks_enabled == null ? 'unknown (switch not readable here)' : infra.webhooks_enabled ? 'enabled' : 'DISABLED'}</dd>
          <dt><Light ok={infra.templates_ok} /></dt><dd>Agent templates {Object.values(infra.templates).filter(Boolean).length}/{Object.keys(infra.templates).length} installed on this gateway</dd>
          <dt><Light ok={infra.workflow_failures_recent === 0} /></dt><dd>{infra.workflow_failures_recent} failed workflow runs in the last 30 · last event {fmtAgo(infra.workflow_last_at)}</dd>
          <dt><Server size={12} /></dt><dd>Gateway host <span className="sf-mono">{infra.gateway_host}</span></dd>
        </dl>
        {infra.errors.length > 0 && <div className="sf-warnbox" style={{ marginTop: 12 }}>{infra.errors.map((e, i) => <div key={i}>{e}</div>)}</div>}
      </Card>
      <Card>
        <CardTitle>Webhook sources</CardTitle>
        {!infra.sources_readable && <div className="sf-empty">Source list not readable from the backend on this host. Check Settings → Webhooks.</div>}
        {infra.sources.map(s => (
          <div className="sf-row" key={s.id} style={{ padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: 12.5 }}>
            <Light ok={s.enabled} /><span style={{ flex: 1 }}>{s.label || s.id}</span>
            <span className="sf-mono" style={{ color: 'var(--muted)' }}>{s.agent}</span>
            {s.signed && <span className="sf-chip">signed</span>}
            <span style={{ color: 'var(--muted)' }}>{fmtAgo(s.last_used_at)}</span>
          </div>
        ))}
      </Card>
      <Card>
        <CardTitle>Templates</CardTitle>
        {Object.entries(infra.templates).map(([name, ok]) => (
          <div className="sf-row" key={name} style={{ padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: 12.5 }}>
            <Light ok={ok} /><span className="sf-mono">{name}.json</span><span style={{ marginLeft: 'auto', color: 'var(--muted)' }}>{ok ? '~/.kiro/agents' : 'run scripts/install-agent.sh'}</span>
          </div>
        ))}
      </Card>
      <Card>
        <CardTitle>Recent workflow runs</CardTitle>
        {infra.workflow_recent.map(w => (
          <div className="sf-row" key={w.id} style={{ padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: 12.5 }}>
            <Light ok={w.conclusion === 'success'} unknown={!w.conclusion} />
            <a className="sf-link" href={w.url} target="_blank" rel="noreferrer" style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{w.title || w.name}</a>
            <span className="sf-mono" style={{ color: 'var(--muted)' }}>{w.event}</span>
            <span style={{ color: 'var(--muted)' }}>{fmtAgo(w.created_at)}</span>
          </div>
        ))}
      </Card>
    </div>
  )
}

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

export default function SoftwareFactory() {
  const { state, error, loading, reload, api, showAll, setShowAll } = useFactory()
  const [tab, setTab] = useState('board')
  const [openIssue, setOpenIssue] = useState<number | null>(null)
  const [watch, setWatch] = useState<Run | null>(null)

  const item = state?.board.find(it => it.issue === openIssue) ?? null
  const liveRun = watch ? state?.runs.find(r => r.id === watch.id || (r.session_key && r.session_key === watch.session_key)) ?? watch : null

  return (
    <div className="sf-root">
      <style>{CSS}</style>
      <PageHeader
        title="Software Factory"
        subtitle={state ? `${state.repo} · ${state.stats.live_runs > 0 ? `${state.stats.live_runs} agent${state.stats.live_runs > 1 ? 's' : ''} running` : 'idle'} · refreshed ${fmtAgo(state.generated_at)}` : 'Issue to merged PR, observed end to end'}
      />
      <div className="sf-body">
        {error && <div className="sf-warnbox"><AlertTriangle size={13} style={{ verticalAlign: -2 }} /> {error}</div>}
        {loading && !state && <div className="sf-empty">Reading GitHub and the gateway…</div>}
        {state && (
          <>
            <div className="sf-stats">
              <StatCard label="In flight" value={String(state.stats.in_flight)} accent />
              <StatCard label="Ready to merge" value={String(state.stats.ready)} />
              <StatCard label="Parked" value={String(state.stats.parked)} />
              <StatCard label="Shipped" value={String(state.stats.shipped)} />
              <StatCard label="Median issue → ready" value={state.stats.median_cycle_s != null ? fmtDur(state.stats.median_cycle_s * 1000) : '–'} />
              <StatCard label="Pass rate" value={state.stats.pass_rate != null ? `${state.stats.pass_rate}%` : '–'} />
              <StatCard label="Agent runs (7d)" value={`${state.stats.runs_week}`} />
              <StatCard label="Credits (7d)" value={state.stats.credits_week.toFixed(1)} />
            </div>
            <div className="sf-row" style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
              <Tabs value={tab} onChange={setTab} items={[['board', 'Board'], ['runs', 'Agent runs'], ['agents', 'Agents'], ['costs', 'Costs'], ['infra', 'Infrastructure']]} />
              <div className="sf-row" style={{ marginBottom: 16 }}>
                <span className="sf-row" style={{ fontSize: 12, color: 'var(--muted)' }}>
                  {state.stats.live_runs > 0 ? <><Activity size={13} className="sf-pulse" style={{ color: 'var(--accent)' }} /> live</> : <><CircleDot size={13} /> polling</>}
                </span>
                <button className="sf-btn" onClick={reload}><RefreshCw size={13} /> Refresh</button>
              </div>
            </div>
            {tab === 'board' && <Board state={state} onOpen={it => setOpenIssue(it.issue)} showAll={showAll} onToggleAll={setShowAll} />}
            {tab === 'runs' && <RunsTable runs={state.runs} onWatch={setWatch} />}
            {tab === 'agents' && <Agents state={state} />}
            {tab === 'costs' && <CostsView costs={state.costs} onOpen={setOpenIssue} />}
            {tab === 'infra' && <InfraView infra={state.infra} />}
          </>
        )}
      </div>
      {item && !watch && <IssueDrawer it={item} runs={state!.runs} onClose={() => setOpenIssue(null)} onWatch={setWatch} />}
      {liveRun && <StepsDrawer run={liveRun} api={api} onClose={() => setWatch(null)} />}
    </div>
  )
}
