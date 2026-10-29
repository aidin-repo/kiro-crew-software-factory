import { jsxs as r, jsx as e, Fragment as T } from "react/jsx-runtime";
import { useAppApi as ie } from "@kirocrew/app-sdk";
import { PageHeader as de, StatCard as k, CardTitle as $, Card as z } from "@kirocrew/app-sdk/ui";
import { AlertTriangle as Y, Activity as oe, CircleDot as ce, RefreshCw as pe, Clock as Z, GitPullRequest as ee, Zap as U, Eye as te, ExternalLink as O, CheckCircle2 as he, Bot as re, Server as me, X as fe } from "lucide-react";
import { useState as w, useRef as ue, useCallback as ge, useEffect as V, useMemo as H } from "react";
const G = "/apps/software-factory/api", B = (t) => {
  if (t == null) return "–";
  const a = Math.round(t / 1e3);
  if (a < 60) return `${a}s`;
  const n = Math.floor(a / 60);
  return n < 60 ? `${n}m ${a % 60}s` : `${Math.floor(n / 60)}h ${n % 60}m`;
}, A = (t) => {
  if (!t) return "–";
  const a = Math.max(0, Date.now() / 1e3 - t);
  return a < 60 ? `${Math.round(a)}s ago` : a < 3600 ? `${Math.round(a / 60)}m ago` : a < 86400 ? `${Math.round(a / 3600)}h ago` : `${Math.round(a / 86400)}d ago`;
}, q = (t) => t ? new Date(t * 1e3).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "–", S = (t) => t.replace("delivery-", "").replace("github-", ""), ve = {
  "delivery-planner": "var(--info)",
  "delivery-implementer": "var(--accent)",
  "delivery-reviewer": "var(--warn)",
  "delivery-scribe": "var(--ok)",
  "github-worker": "var(--muted-strong)",
  "pr-gate": "var(--text)"
}, C = (t) => ve[t] ?? "var(--muted)", J = {
  planning: "var(--info)",
  "needs-owner": "var(--warn)",
  implementing: "var(--accent)",
  review: "var(--warn)",
  fixing: "var(--warn)",
  gate: "var(--muted-strong)",
  ready: "var(--ok)",
  parked: "var(--danger)",
  shipped: "var(--ok)"
}, ae = (t) => t === "completed" ? "var(--ok)" : t === "running" ? "var(--accent)" : "var(--danger)", be = `
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
`;
function xe() {
  const t = ie(), [a, n] = w(null), [p, o] = w(null), [s, g] = w(!0), [i, c] = w(!1), f = ue(null), u = ge(async (h = !1) => {
    try {
      const l = [h ? "refresh=1" : "", i ? "limit=0" : ""].filter(Boolean).join("&"), b = await t.get(`${G}/state${l ? `?${l}` : ""}`);
      n(b), o(null);
    } catch (l) {
      o(l instanceof Error ? l.message : String(l));
    } finally {
      g(!1);
    }
  }, [t, i]);
  return V(() => {
    u();
    const h = () => {
      const l = ((a == null ? void 0 : a.stats.live_runs) ?? 0) > 0;
      f.current = window.setTimeout(async () => {
        await u(), h();
      }, l ? 5e3 : 15e3);
    };
    return h(), () => {
      f.current && window.clearTimeout(f.current);
    };
  }, [u]), { state: a, error: p, loading: s, reload: () => u(!0), api: t, showAll: i, setShowAll: c };
}
function R({ tone: t, children: a }) {
  return /* @__PURE__ */ e("span", { className: "sf-pill", style: { background: `color-mix(in srgb, ${t} 16%, transparent)`, color: t }, children: a });
}
function K({ o: t, live: a }) {
  const n = ae(t);
  return /* @__PURE__ */ r(R, { tone: n, children: [
    /* @__PURE__ */ e("span", { className: `sf-dot ${a ? "sf-pulse" : ""}`, style: { background: n, width: 7, height: 7 } }),
    t
  ] });
}
function ye({ value: t, onChange: a, items: n }) {
  return /* @__PURE__ */ e("div", { className: "sf-tabs", role: "tablist", children: n.map(([p, o]) => /* @__PURE__ */ e("button", { role: "tab", "aria-selected": t === p, "data-on": t === p, className: "sf-tab", onClick: () => a(p), children: o }, p)) });
}
function ne({ title: t, sub: a, onClose: n, children: p, wide: o, actions: s }) {
  return V(() => {
    const g = (i) => {
      i.key === "Escape" && n();
    };
    return window.addEventListener("keydown", g), () => window.removeEventListener("keydown", g);
  }, [n]), /* @__PURE__ */ r(T, { children: [
    /* @__PURE__ */ e("div", { className: "sf-scrim", onClick: n }),
    /* @__PURE__ */ r("aside", { className: "sf-drawer", "data-wide": !!o, role: "dialog", "aria-modal": "true", children: [
      /* @__PURE__ */ r("div", { className: "sf-dhead", children: [
        /* @__PURE__ */ r("div", { style: { minWidth: 0, flex: 1 }, children: [
          /* @__PURE__ */ e("div", { style: { fontWeight: 600, fontSize: 15, color: "var(--text-strong)" }, children: t }),
          a && /* @__PURE__ */ e("div", { style: { fontSize: 12, color: "var(--muted)", marginTop: 3 }, children: a })
        ] }),
        s,
        /* @__PURE__ */ e("button", { className: "sf-x", onClick: n, "aria-label": "Close", style: { marginLeft: 4 }, children: /* @__PURE__ */ e(fe, { size: 16 }) })
      ] }),
      /* @__PURE__ */ e("div", { className: "sf-dbody", children: p })
    ] })
  ] });
}
function we({ it: t, onOpen: a }) {
  var p;
  const n = !!t.live_agent;
  return /* @__PURE__ */ r("div", { className: "sf-card", "data-live": n, onClick: a, role: "button", tabIndex: 0, onKeyDown: (o) => o.key === "Enter" && a(), children: [
    /* @__PURE__ */ r("div", { className: "sf-row", style: { justifyContent: "space-between", marginBottom: 4 }, children: [
      /* @__PURE__ */ r("span", { className: "sf-mono", style: { color: "var(--muted)" }, children: [
        "#",
        t.issue
      ] }),
      n && /* @__PURE__ */ r(R, { tone: "var(--accent)", children: [
        /* @__PURE__ */ e("span", { className: "sf-dot sf-pulse", style: { background: "var(--accent)", width: 7, height: 7 } }),
        S(t.live_agent)
      ] }),
      !n && ((p = t.pr) == null ? void 0 : p.checks) && /* @__PURE__ */ e("span", { className: "sf-dot", title: `CI ${t.pr.checks}`, style: { background: t.pr.checks === "passing" ? "var(--ok)" : t.pr.checks === "failing" ? "var(--danger)" : "var(--warn)" } })
    ] }),
    /* @__PURE__ */ e("div", { className: "sf-cardtitle", children: t.title }),
    /* @__PURE__ */ r("div", { className: "sf-meta", children: [
      /* @__PURE__ */ r("span", { title: "Last activity", children: [
        /* @__PURE__ */ e(Z, { size: 11, style: { verticalAlign: -1 } }),
        " ",
        A(t.last_activity ?? t.stage_since)
      ] }),
      t.pr && /* @__PURE__ */ r("span", { children: [
        /* @__PURE__ */ e(ee, { size: 11, style: { verticalAlign: -1 } }),
        " PR ",
        t.pr.number
      ] }),
      t.rounds > 1 && /* @__PURE__ */ r("span", { children: [
        t.rounds,
        " rounds"
      ] }),
      t.credits > 0 && /* @__PURE__ */ r("span", { children: [
        /* @__PURE__ */ e(U, { size: 11, style: { verticalAlign: -1 } }),
        " ",
        t.credits.toFixed(1)
      ] })
    ] }),
    t.hops.length > 0 && /* @__PURE__ */ e("div", { className: "sf-hops", title: t.hops.map((o) => `${S(o.agent)} ${o.outcome} ${B(o.duration_ms)}`).join(`
`), children: t.hops.map((o) => /* @__PURE__ */ e("span", { className: `sf-hop ${o.live ? "sf-pulse" : ""}`, style: { background: C(o.agent), opacity: o.outcome === "completed" || o.live ? 0.9 : 0.35 } }, o.id)) })
  ] });
}
function ke({ state: t, onOpen: a, showAll: n, onToggleAll: p }) {
  const o = /* @__PURE__ */ new Set(["planning", "needs-owner", "implementing", "review", "ready"]), s = t.stages.filter((i) => o.has(i.id) || t.board.some((c) => c.stage === i.id)), g = t.board_total - t.board.length;
  return /* @__PURE__ */ r(T, { children: [
    /* @__PURE__ */ r("div", { className: "sf-row", style: { justifyContent: "space-between", marginBottom: 10, fontSize: 12, color: "var(--muted)", flexWrap: "wrap", gap: 10 }, children: [
      /* @__PURE__ */ r("span", { children: [
        n ? `All ${t.board_total} items` : `${t.board.length} most recently active${g > 0 ? ` · ${g} older hidden` : ""}`,
        ", newest first in each column"
      ] }),
      /* @__PURE__ */ r("div", { className: "sf-views", role: "tablist", "aria-label": "Board scope", children: [
        /* @__PURE__ */ r("button", { role: "tab", "aria-selected": !n, "data-on": !n, onClick: () => p(!1), children: [
          "Recent ",
          t.board_limit || 20
        ] }),
        /* @__PURE__ */ e("button", { role: "tab", "aria-selected": n, "data-on": n, onClick: () => p(!0), children: "All" })
      ] })
    ] }),
    /* @__PURE__ */ r("div", { className: "sf-legend", "aria-label": "Legend", children: [
      /* @__PURE__ */ e("span", { className: "sf-legend-h", children: "Bars: one per agent hop, oldest left" }),
      ["delivery-planner", "delivery-implementer", "delivery-reviewer", "delivery-scribe", "github-worker"].map((i) => /* @__PURE__ */ r("span", { children: [
        /* @__PURE__ */ e("i", { className: "sf-hop", style: { background: C(i), width: 18, minWidth: 18, display: "inline-block" } }),
        " ",
        S(i)
      ] }, i)),
      /* @__PURE__ */ r("span", { children: [
        /* @__PURE__ */ e("i", { className: "sf-hop", style: { background: "var(--muted)", opacity: 0.35, width: 18, minWidth: 18, display: "inline-block" } }),
        " failed or stopped"
      ] }),
      /* @__PURE__ */ r("span", { children: [
        /* @__PURE__ */ e("i", { className: "sf-hop sf-pulse", style: { background: "var(--accent)", width: 18, minWidth: 18, display: "inline-block" } }),
        " running"
      ] }),
      /* @__PURE__ */ e("span", { className: "sf-legend-h", style: { marginLeft: 8 }, children: "Card" }),
      /* @__PURE__ */ r("span", { children: [
        /* @__PURE__ */ e("span", { className: "sf-dot", style: { background: "var(--ok)" } }),
        " CI passing"
      ] }),
      /* @__PURE__ */ r("span", { children: [
        /* @__PURE__ */ e("span", { className: "sf-dot", style: { background: "var(--warn)" } }),
        " CI pending"
      ] }),
      /* @__PURE__ */ r("span", { children: [
        /* @__PURE__ */ e("span", { className: "sf-dot", style: { background: "var(--danger)" } }),
        " CI failing"
      ] }),
      /* @__PURE__ */ r("span", { children: [
        /* @__PURE__ */ e(Z, { size: 11, style: { verticalAlign: -1 } }),
        " last activity"
      ] }),
      /* @__PURE__ */ r("span", { children: [
        /* @__PURE__ */ e(ee, { size: 11, style: { verticalAlign: -1 } }),
        " PR"
      ] }),
      /* @__PURE__ */ r("span", { children: [
        /* @__PURE__ */ e(U, { size: 11, style: { verticalAlign: -1 } }),
        " credits"
      ] })
    ] }),
    /* @__PURE__ */ e("div", { className: "sf-board", children: s.map((i) => {
      const c = t.board.filter((f) => f.stage === i.id);
      return /* @__PURE__ */ r("div", { className: "sf-col", children: [
        /* @__PURE__ */ r("div", { className: "sf-colhead", children: [
          /* @__PURE__ */ r("span", { className: "sf-row", children: [
            /* @__PURE__ */ e("span", { className: "sf-dot", style: { background: J[i.id] } }),
            i.label
          ] }),
          /* @__PURE__ */ e("span", { className: "sf-count", children: c.length })
        ] }),
        c.map((f) => /* @__PURE__ */ e(we, { it: f, onOpen: () => a(f) }, f.issue)),
        c.length === 0 && /* @__PURE__ */ e("div", { className: "sf-empty", style: { padding: 10 }, children: "empty" })
      ] }, i.id);
    }) })
  ] });
}
function Ne({ it: t, runs: a, onClose: n, onWatch: p }) {
  var s, g;
  const o = t.hops.map((i) => ({ hop: i, run: a.find((c) => c.id === i.id) }));
  return /* @__PURE__ */ r(ne, { onClose: n, title: /* @__PURE__ */ r("span", { children: [
    "#",
    t.issue,
    " ",
    t.title
  ] }), sub: /* @__PURE__ */ r("span", { className: "sf-row", children: [
    /* @__PURE__ */ e(R, { tone: J[t.stage], children: t.stage }),
    /* @__PURE__ */ r("a", { className: "sf-link", href: t.url, target: "_blank", rel: "noreferrer", children: [
      "issue ",
      /* @__PURE__ */ e(O, { size: 11 })
    ] }),
    t.pr && /* @__PURE__ */ r("a", { className: "sf-link", href: t.pr.url, target: "_blank", rel: "noreferrer", children: [
      "PR ",
      t.pr.number,
      " ",
      /* @__PURE__ */ e(O, { size: 11 })
    ] }),
    t.docs_pr && /* @__PURE__ */ r("a", { className: "sf-link", href: t.docs_pr.url, target: "_blank", rel: "noreferrer", children: [
      "docs PR ",
      t.docs_pr.number,
      " ",
      /* @__PURE__ */ e(O, { size: 11 })
    ] })
  ] }), children: [
    /* @__PURE__ */ r("dl", { className: "sf-kv", style: { marginTop: 0, marginBottom: 16 }, children: [
      /* @__PURE__ */ e("dt", { children: "Opened" }),
      /* @__PURE__ */ e("dd", { children: q(t.created_at) }),
      /* @__PURE__ */ e("dt", { children: "In stage since" }),
      /* @__PURE__ */ e("dd", { children: A(t.stage_since) }),
      /* @__PURE__ */ e("dt", { children: "Review rounds" }),
      /* @__PURE__ */ e("dd", { children: t.rounds }),
      /* @__PURE__ */ e("dt", { children: "Credits" }),
      /* @__PURE__ */ e("dd", { children: t.credits.toFixed(2) }),
      /* @__PURE__ */ e("dt", { children: "CI" }),
      /* @__PURE__ */ e("dd", { children: ((s = t.pr) == null ? void 0 : s.checks) ?? "–" }),
      /* @__PURE__ */ e("dt", { children: "Labels" }),
      /* @__PURE__ */ e("dd", { style: { display: "flex", flexWrap: "wrap", gap: 4 }, children: [...t.labels, ...((g = t.pr) == null ? void 0 : g.labels) ?? []].filter((i) => i.startsWith("kiro-")).map((i) => /* @__PURE__ */ e("span", { className: "sf-chip", children: i }, i)) })
    ] }),
    /* @__PURE__ */ e($, { children: "Hops" }),
    o.length === 0 && /* @__PURE__ */ e("div", { className: "sf-empty", children: "No agent run is linked to this issue on this gateway yet." }),
    /* @__PURE__ */ e("div", { className: "sf-tl", children: o.map(({ hop: i, run: c }) => {
      var f, u, h;
      return /* @__PURE__ */ r("div", { className: "sf-tli", children: [
        /* @__PURE__ */ e("span", { className: `sf-dot ${i.live ? "sf-pulse" : ""}`, style: { background: C(i.agent) } }),
        /* @__PURE__ */ r("div", { className: "sf-row", style: { justifyContent: "space-between" }, children: [
          /* @__PURE__ */ r("div", { children: [
            /* @__PURE__ */ e("strong", { style: { color: "var(--text-strong)", fontSize: 13 }, children: S(i.agent) }),
            /* @__PURE__ */ e("span", { style: { color: "var(--muted)", fontSize: 12, marginLeft: 8 }, children: i.kind })
          ] }),
          /* @__PURE__ */ e(K, { o: i.outcome, live: i.live })
        ] }),
        /* @__PURE__ */ r("div", { className: "sf-meta", children: [
          /* @__PURE__ */ e("span", { children: q(i.started_at) }),
          /* @__PURE__ */ e("span", { children: B(i.duration_ms) }),
          i.credits != null && /* @__PURE__ */ r("span", { children: [
            /* @__PURE__ */ e(U, { size: 11, style: { verticalAlign: -1 } }),
            " ",
            i.credits.toFixed(2)
          ] }),
          ((f = c == null ? void 0 : c.session) == null ? void 0 : f.model) && /* @__PURE__ */ e("span", { children: c.session.model }),
          ((u = c == null ? void 0 : c.session) == null ? void 0 : u.tool_calls) != null && /* @__PURE__ */ r("span", { children: [
            c.session.tool_calls,
            " tool calls"
          ] }),
          (c == null ? void 0 : c.session_key) && /* @__PURE__ */ r("button", { className: "sf-btn", style: { padding: "2px 8px" }, onClick: () => p(c), children: [
            /* @__PURE__ */ e(te, { size: 12 }),
            " ",
            i.live ? "watch live" : "steps"
          ] })
        ] }),
        ((h = c == null ? void 0 : c.session) == null ? void 0 : h.last_text) && /* @__PURE__ */ e("div", { className: "sf-text", style: { marginTop: 8, maxHeight: 90, overflow: "hidden" }, children: c.session.last_text })
      ] }, i.id);
    }) })
  ] });
}
function _e({ runs: t, onWatch: a }) {
  return /* @__PURE__ */ r(z, { children: [
    /* @__PURE__ */ r("table", { className: "sf-table", children: [
      /* @__PURE__ */ e("thead", { children: /* @__PURE__ */ r("tr", { children: [
        /* @__PURE__ */ e("th", { children: "When" }),
        /* @__PURE__ */ e("th", { children: "Agent" }),
        /* @__PURE__ */ e("th", { children: "Hop" }),
        /* @__PURE__ */ e("th", { children: "Item" }),
        /* @__PURE__ */ e("th", { children: "Outcome" }),
        /* @__PURE__ */ e("th", { children: "Duration" }),
        /* @__PURE__ */ e("th", { children: "Model" }),
        /* @__PURE__ */ e("th", { children: "Tools" }),
        /* @__PURE__ */ e("th", { children: "Credits" }),
        /* @__PURE__ */ e("th", {})
      ] }) }),
      /* @__PURE__ */ e("tbody", { children: t.map((n) => {
        var p, o, s, g, i, c;
        return /* @__PURE__ */ r("tr", { children: [
          /* @__PURE__ */ e("td", { title: q(n.started_at), children: A(n.started_at) }),
          /* @__PURE__ */ e("td", { children: /* @__PURE__ */ r("span", { className: "sf-row", children: [
            /* @__PURE__ */ e("span", { className: "sf-dot", style: { background: C(n.agent) } }),
            S(n.agent)
          ] }) }),
          /* @__PURE__ */ e("td", { className: "sf-mono", children: n.kind }),
          /* @__PURE__ */ r("td", { children: [
            (p = n.session) != null && p.issue ? `#${n.session.issue}` : "",
            (o = n.session) != null && o.pr ? ` PR ${n.session.pr}` : ""
          ] }),
          /* @__PURE__ */ e("td", { children: /* @__PURE__ */ e(K, { o: n.outcome, live: n.live }) }),
          /* @__PURE__ */ e("td", { children: B(n.duration_ms) }),
          /* @__PURE__ */ e("td", { className: "sf-mono", children: ((s = n.session) == null ? void 0 : s.model) ?? "–" }),
          /* @__PURE__ */ e("td", { children: ((g = n.session) == null ? void 0 : g.tool_calls) ?? "–" }),
          /* @__PURE__ */ e("td", { children: (i = n.session) != null && i.credits ? n.session.credits.toFixed(2) : "–" }),
          /* @__PURE__ */ e("td", { children: n.session_key && ((c = n.session) == null ? void 0 : c.found) && /* @__PURE__ */ r("button", { className: "sf-btn", onClick: () => a(n), children: [
            /* @__PURE__ */ e(te, { size: 12 }),
            " ",
            n.live ? "watch" : "steps"
          ] }) })
        ] }, n.id);
      }) })
    ] }),
    t.length === 0 && /* @__PURE__ */ e("div", { className: "sf-empty", children: "No webhook runs recorded for this repository on this gateway." })
  ] });
}
const M = (t) => t < 1e3 ? `${Math.round(t)}ms` : t < 6e4 ? `${(t / 1e3).toFixed(t < 1e4 ? 2 : 1)}s` : `${Math.floor(t / 6e4)}m ${Math.round(t % 6e4 / 1e3)}s`, X = (t) => {
  if (t.status === "error" || t.status === "denied") return "var(--danger)";
  if (t.kind === "run") return "var(--text)";
  if (t.kind === "turn") return "var(--muted-strong)";
  if (t.kind === "model") return "var(--info)";
  const a = t.meta.kind || "";
  return a === "read" || a === "read_files" || a === "search" ? "var(--muted)" : a === "edit" || a === "write" ? "var(--warn)" : "var(--accent)";
}, P = (t) => t.kind === "tool" ? t.meta.title && t.meta.title !== t.name ? t.meta.title : t.name : t.kind === "model" ? `model · ${t.output ? "said" : "thought"}` : t.name;
function $e({ spans: t, live: a }) {
  const [n, p] = w(/* @__PURE__ */ new Set()), [o, s] = w(null), [g, i] = w(""), c = t[0], f = c.start, u = Math.max(1e-3, c.end - c.start), h = H(() => {
    const d = /* @__PURE__ */ new Map();
    for (const y of t) {
      const N = d.get(y.parent) ?? [];
      N.push(y), d.set(y.parent, N);
    }
    return d;
  }, [t]), l = H(() => {
    const d = [], y = g.trim().toLowerCase(), N = (j) => !y || `${P(j)} ${j.input} ${j.name}`.toLowerCase().includes(y), W = (j, D) => {
      var E;
      for (const F of h.get(j) ?? []) {
        const le = ((E = h.get(F.id)) == null ? void 0 : E.length) ?? 0;
        (N(F) || F.kind !== "tool" && F.kind !== "model") && d.push({ sp: F, depth: D, kids: le }), n.has(F.id) || W(F.id, D + 1);
      }
    };
    return W(null, 0), d;
  }, [h, n, g]), b = (d) => p((y) => {
    const N = new Set(y);
    return N.has(d) ? N.delete(d) : N.add(d), N;
  }), v = t.filter((d) => d.kind === "tool").reduce((d, y) => d + (y.end - y.start) * 1e3, 0), x = t.filter((d) => d.kind === "model").reduce((d, y) => d + (y.end - y.start) * 1e3, 0), L = t.filter((d) => d.status === "error" || d.status === "denied").length, m = t.find((d) => d.id === o) ?? null;
  return /* @__PURE__ */ r("div", { children: [
    /* @__PURE__ */ r("div", { className: "sf-tr-sum", children: [
      /* @__PURE__ */ r("span", { children: [
        /* @__PURE__ */ e("b", { children: t.length }),
        "spans"
      ] }),
      /* @__PURE__ */ r("span", { children: [
        /* @__PURE__ */ e("b", { children: M(u * 1e3) }),
        "duration"
      ] }),
      /* @__PURE__ */ r("span", { children: [
        /* @__PURE__ */ e("b", { children: c.meta.tools ?? 0 }),
        "tool calls · ",
        M(v),
        " (",
        Math.round(100 * v / (u * 1e3)),
        "%)"
      ] }),
      /* @__PURE__ */ r("span", { children: [
        /* @__PURE__ */ e("b", { children: c.meta.model_spans ?? 0 }),
        "model spans · ",
        M(x),
        " (",
        Math.round(100 * x / (u * 1e3)),
        "%)"
      ] }),
      /* @__PURE__ */ r("span", { children: [
        /* @__PURE__ */ e("b", { children: (c.meta.credits ?? 0).toFixed(2) }),
        "credits"
      ] }),
      L > 0 && /* @__PURE__ */ r("span", { style: { color: "var(--danger)" }, children: [
        /* @__PURE__ */ e("b", { style: { color: "var(--danger)" }, children: L }),
        "refused or failed"
      ] }),
      a && /* @__PURE__ */ e("span", { style: { color: "var(--accent)" }, children: "live" })
    ] }),
    /* @__PURE__ */ r("div", { className: "sf-tr-tools", children: [
      /* @__PURE__ */ e("input", { value: g, onChange: (d) => i(d.target.value), placeholder: "Filter spans by name, command or path…", "aria-label": "Filter spans" }),
      /* @__PURE__ */ e("button", { className: "sf-btn", onClick: () => p(/* @__PURE__ */ new Set()), children: "Expand all" }),
      /* @__PURE__ */ e("button", { className: "sf-btn", onClick: () => p(new Set(t.filter((d) => d.kind === "turn").map((d) => d.id))), children: "Turns only" })
    ] }),
    /* @__PURE__ */ r("div", { className: "sf-tr", role: "tree", children: [
      /* @__PURE__ */ r("div", { className: "sf-tr-head", children: [
        /* @__PURE__ */ e("div", { children: "Span" }),
        /* @__PURE__ */ e("div", { className: "sf-tr-axis", children: [0, 0.25, 0.5, 0.75, 1].map((d) => /* @__PURE__ */ e("span", { style: { left: `calc(${d * 100}% - ${d === 1 ? 24 : d === 0 ? -6 : 0}px)` }, children: M(d * u * 1e3) }, d)) })
      ] }),
      l.map(({ sp: d, depth: y, kids: N }) => {
        const W = (d.start - f) / u * 100, j = Math.max(0.3, (d.end - d.start) / u * 100), D = X(d);
        return /* @__PURE__ */ r("div", { className: "sf-tr-row", role: "treeitem", "aria-selected": o === d.id, "data-sel": o === d.id, onClick: () => s(d.id === o ? null : d.id), children: [
          /* @__PURE__ */ r("div", { style: { paddingLeft: 10 + y * 16 }, children: [
            /* @__PURE__ */ e("span", { className: "sf-caret", onClick: (E) => {
              E.stopPropagation(), N && b(d.id);
            }, "aria-hidden": "true", children: N ? n.has(d.id) ? "▸" : "▾" : "" }),
            /* @__PURE__ */ e("span", { className: "sf-dot", style: { background: D, width: 8, height: 8, flex: "none" } }),
            /* @__PURE__ */ e("span", { className: "sf-tr-name", title: P(d), children: P(d) }),
            d.kind === "tool" && d.input && /* @__PURE__ */ e("span", { className: "sf-tr-sub", title: d.input, children: d.input }),
            d.kind === "turn" && d.meta.credits != null && /* @__PURE__ */ r("span", { className: "sf-chip", children: [
              d.meta.credits.toFixed(2),
              " cr"
            ] })
          ] }),
          /* @__PURE__ */ r("div", { children: [
            /* @__PURE__ */ e("div", { className: "sf-tr-track", children: /* @__PURE__ */ e("span", { className: "sf-tr-bar", "data-status": d.status, style: { left: `${W}%`, width: `${j}%`, background: D } }) }),
            /* @__PURE__ */ e("span", { className: "sf-tr-dur", children: M((d.end - d.start) * 1e3) })
          ] })
        ] }, d.id);
      })
    ] }),
    m && /* @__PURE__ */ r("div", { className: "sf-tr-detail", children: [
      /* @__PURE__ */ r("div", { className: "sf-row", style: { marginBottom: 6 }, children: [
        /* @__PURE__ */ e("span", { className: "sf-dot", style: { background: X(m), width: 9, height: 9 } }),
        /* @__PURE__ */ e("b", { style: { color: "var(--text-strong)" }, children: P(m) }),
        /* @__PURE__ */ e(R, { tone: m.status === "ok" ? "var(--ok)" : m.status === "running" ? "var(--accent)" : m.status === "warn" ? "var(--warn)" : "var(--danger)", children: m.status }),
        /* @__PURE__ */ r("span", { style: { color: "var(--muted)", fontSize: 12 }, children: [
          m.kind,
          m.meta.tool ? ` · ${m.meta.tool}` : "",
          m.meta.kind ? ` · ${m.meta.kind}` : ""
        ] })
      ] }),
      /* @__PURE__ */ r("div", { className: "sf-tr-kv", children: [
        /* @__PURE__ */ r("span", { children: [
          "start ",
          /* @__PURE__ */ r("b", { children: [
            "+",
            M((m.start - f) * 1e3)
          ] })
        ] }),
        /* @__PURE__ */ r("span", { children: [
          "duration ",
          /* @__PURE__ */ e("b", { children: M((m.end - m.start) * 1e3) })
        ] }),
        m.meta.approval_ms != null && /* @__PURE__ */ r("span", { children: [
          "approval wait ",
          /* @__PURE__ */ e("b", { children: M(m.meta.approval_ms) })
        ] }),
        m.meta.credits != null && m.kind !== "run" && /* @__PURE__ */ r("span", { children: [
          "credits ",
          /* @__PURE__ */ e("b", { children: m.meta.credits.toFixed(3) })
        ] }),
        m.meta.model_calls != null && /* @__PURE__ */ r("span", { children: [
          "model calls ",
          /* @__PURE__ */ e("b", { children: m.meta.model_calls })
        ] }),
        m.meta.context_pct != null && /* @__PURE__ */ r("span", { children: [
          "context used ",
          /* @__PURE__ */ r("b", { children: [
            m.meta.context_pct.toFixed(1),
            "%"
          ] })
        ] }),
        m.meta.model && /* @__PURE__ */ r("span", { children: [
          "model ",
          /* @__PURE__ */ e("b", { children: m.meta.model })
        ] })
      ] }),
      m.input && /* @__PURE__ */ r(T, { children: [
        /* @__PURE__ */ e("div", { className: "sf-label", children: m.kind === "turn" ? "prompt" : "input" }),
        /* @__PURE__ */ e("pre", { className: "sf-pre", children: m.input })
      ] }),
      m.output && /* @__PURE__ */ r(T, { children: [
        /* @__PURE__ */ e("div", { className: "sf-label", children: m.kind === "turn" ? "stop reason" : "output" }),
        /* @__PURE__ */ e("pre", { className: "sf-pre", children: m.output })
      ] }),
      !m.input && !m.output && /* @__PURE__ */ e("div", { className: "sf-empty", style: { padding: 8 }, children: "No input or output recorded for this span." })
    ] })
  ] });
}
function ze({ run: t, api: a, onClose: n }) {
  var b;
  const [p, o] = w("steps"), [s, g] = w(null), [i, c] = w(null), [f, u] = w(null);
  V(() => {
    let v = !0;
    const x = async () => {
      try {
        if (p === "steps") {
          const m = await a.get(`${G}/runs/${encodeURIComponent(t.id)}/steps`);
          if (!v) return;
          m.error ? u(m.error) : (g(m.steps), u(null));
        } else {
          const m = await a.get(`${G}/runs/${encodeURIComponent(t.id)}/trace`);
          if (!v) return;
          m.error ? u(m.error) : (c(m.found ? m.spans : []), u(null));
        }
      } catch (m) {
        v && u(String(m));
      }
    };
    x();
    const L = t.live ? window.setInterval(x, 4e3) : null;
    return () => {
      v = !1, L && window.clearInterval(L);
    };
  }, [a, t.id, t.live, p]);
  const h = t.session, l = /* @__PURE__ */ e("div", { className: "sf-views", role: "tablist", "aria-label": "Transcript view", children: ["steps", "trace", "json"].map((v) => /* @__PURE__ */ e("button", { role: "tab", "aria-selected": p === v, "data-on": p === v, onClick: () => o(v), children: v === "steps" ? "Steps" : v === "trace" ? "Trace" : "JSON" }, v)) });
  return /* @__PURE__ */ r(
    ne,
    {
      onClose: n,
      wide: p !== "steps",
      actions: l,
      title: /* @__PURE__ */ r("span", { className: "sf-row", children: [
        /* @__PURE__ */ e(re, { size: 16, style: { color: C(t.agent) } }),
        S(t.agent),
        " ",
        /* @__PURE__ */ e("span", { style: { color: "var(--muted)", fontWeight: 400 }, children: t.kind }),
        " ",
        /* @__PURE__ */ e(K, { o: t.outcome, live: t.live })
      ] }),
      sub: /* @__PURE__ */ r("span", { children: [
        (h == null ? void 0 : h.title) ?? "",
        " · ",
        (h == null ? void 0 : h.model) ?? "",
        " ",
        h != null && h.effort ? `(${h.effort})` : "",
        " · ",
        B(t.duration_ms),
        " · ",
        (h == null ? void 0 : h.tool_calls) ?? 0,
        " tool calls · ",
        ((b = h == null ? void 0 : h.credits) == null ? void 0 : b.toFixed(2)) ?? "0",
        " credits",
        h != null && h.issue ? ` · #${h.issue}` : "",
        h != null && h.pr ? ` · PR ${h.pr}` : ""
      ] }),
      children: [
        t.detail && /* @__PURE__ */ r("div", { className: "sf-warnbox", children: [
          /* @__PURE__ */ e(Y, { size: 13, style: { verticalAlign: -2 } }),
          " ",
          t.detail
        ] }),
        f && /* @__PURE__ */ e("div", { className: "sf-empty", children: f }),
        p !== "steps" && !i && !f && /* @__PURE__ */ e("div", { className: "sf-empty", children: "Building trace…" }),
        p !== "steps" && i && i.length === 0 && /* @__PURE__ */ e("div", { className: "sf-empty", children: "Transcript not available on this gateway (the run happened on another machine)." }),
        p === "trace" && i && i.length > 0 && /* @__PURE__ */ e($e, { spans: i, live: t.live }),
        p === "json" && i && i.length > 0 && /* @__PURE__ */ e("pre", { className: "sf-pre", style: { maxHeight: "none" }, children: JSON.stringify(i, null, 2) }),
        p === "steps" && !s && !f && /* @__PURE__ */ e("div", { className: "sf-empty", children: "Loading transcript…" }),
        p === "steps" && s && s.length === 0 && /* @__PURE__ */ e("div", { className: "sf-empty", children: "Transcript not available on this gateway (the run happened on another machine)." }),
        p === "steps" && (s == null ? void 0 : s.map((v, x) => v.kind === "tool" ? /* @__PURE__ */ r("div", { className: "sf-step", children: [
          /* @__PURE__ */ e("span", { className: "sf-dot", style: { marginTop: 5, background: v.ok === !1 ? "var(--danger)" : v.ok ? "var(--ok)" : "var(--muted)" } }),
          /* @__PURE__ */ r("div", { style: { minWidth: 0, flex: 1 }, children: [
            /* @__PURE__ */ r("div", { style: { color: "var(--text-strong)" }, children: [
              v.title,
              " ",
              /* @__PURE__ */ e("span", { style: { color: "var(--muted)", fontSize: 11 }, children: v.tool })
            ] }),
            v.detail && /* @__PURE__ */ e("div", { className: "sf-mono", children: v.detail })
          ] }),
          /* @__PURE__ */ e("span", { style: { color: "var(--muted)", fontSize: 11, whiteSpace: "nowrap" }, children: v.t ? new Date(v.t).toLocaleTimeString() : "" })
        ] }, x) : v.kind === "text" ? /* @__PURE__ */ r("div", { className: "sf-step", children: [
          /* @__PURE__ */ e("span", { className: "sf-dot", style: { marginTop: 5, background: C(t.agent) } }),
          /* @__PURE__ */ e("div", { className: "sf-text", style: { flex: 1 }, children: v.text })
        ] }, x) : /* @__PURE__ */ r("div", { className: "sf-step", style: { color: "var(--muted)" }, children: [
          /* @__PURE__ */ e(he, { size: 14 }),
          " turn ended (",
          v.reason,
          ")"
        ] }, x)))
      ]
    }
  );
}
function Ce({ state: t }) {
  const a = Math.max(1, ...t.agents.map((s) => s.avg_duration_ms ?? 0)), n = H(() => {
    var c;
    const s = [], g = /* @__PURE__ */ new Date();
    g.setHours(0, 0, 0, 0);
    for (let f = 13; f >= 0; f--) {
      const u = new Date(g);
      u.setDate(g.getDate() - f), s.push({ day: u.toLocaleDateString([], { weekday: "short" }), completed: 0, failed: 0, credits: 0 });
    }
    const i = g.getTime() / 1e3 - 13 * 86400;
    for (const f of t.runs) {
      if (!f.started_at || f.started_at < i) continue;
      const u = Math.min(13, Math.floor((f.started_at - i) / 86400));
      f.outcome === "completed" ? s[u].completed++ : f.outcome !== "running" && s[u].failed++, s[u].credits += ((c = f.session) == null ? void 0 : c.credits) ?? 0;
    }
    return s;
  }, [t.runs]), p = Math.max(1, ...n.map((s) => s.completed + s.failed)), o = Math.max(1, ...n.map((s) => s.credits));
  return /* @__PURE__ */ r(T, { children: [
    /* @__PURE__ */ e("div", { className: "sf-grid", style: { marginBottom: 16 }, children: t.agents.map((s) => /* @__PURE__ */ r("div", { className: "sf-agent", style: { "--sf-c": C(s.id) }, children: [
      /* @__PURE__ */ r("div", { className: "sf-row", style: { justifyContent: "space-between" }, children: [
        /* @__PURE__ */ r("div", { className: "sf-row", children: [
          /* @__PURE__ */ e(re, { size: 16, style: { color: C(s.id) } }),
          /* @__PURE__ */ e("strong", { style: { color: "var(--text-strong)" }, children: s.label })
        ] }),
        s.live > 0 ? /* @__PURE__ */ r(R, { tone: "var(--accent)", children: [
          /* @__PURE__ */ e("span", { className: "sf-dot sf-pulse", style: { background: "var(--accent)", width: 7, height: 7 } }),
          "running"
        ] }) : s.installed ? /* @__PURE__ */ e(R, { tone: "var(--ok)", children: "template installed" }) : /* @__PURE__ */ e(R, { tone: "var(--danger)", children: "template missing" })
      ] }),
      /* @__PURE__ */ e("div", { style: { fontSize: 12, color: "var(--muted)", marginTop: 4 }, children: s.role }),
      /* @__PURE__ */ r("dl", { className: "sf-kv", children: [
        /* @__PURE__ */ e("dt", { children: "Runs" }),
        /* @__PURE__ */ r("dd", { children: [
          s.runs,
          " ",
          /* @__PURE__ */ r("span", { style: { color: "var(--muted)", fontWeight: 400 }, children: [
            "(",
            s.completed,
            " ok, ",
            s.failed,
            " failed)"
          ] })
        ] }),
        /* @__PURE__ */ e("dt", { children: "Avg / p90" }),
        /* @__PURE__ */ r("dd", { children: [
          B(s.avg_duration_ms),
          " / ",
          B(s.p90_duration_ms)
        ] }),
        /* @__PURE__ */ e("dt", { children: "Avg credits" }),
        /* @__PURE__ */ e("dd", { children: s.avg_credits ?? "–" }),
        /* @__PURE__ */ e("dt", { children: "Model" }),
        /* @__PURE__ */ e("dd", { className: "sf-mono", children: s.model ?? "–" }),
        /* @__PURE__ */ e("dt", { children: "Last run" }),
        /* @__PURE__ */ r("dd", { children: [
          A(s.last_run_at),
          " ",
          s.last_outcome && /* @__PURE__ */ r("span", { style: { color: ae(s.last_outcome) }, children: [
            "· ",
            s.last_outcome
          ] })
        ] })
      ] }),
      /* @__PURE__ */ e("div", { className: "sf-bar", title: "Average duration relative to the slowest agent", children: /* @__PURE__ */ e("i", { style: { width: `${Math.round(100 * (s.avg_duration_ms ?? 0) / a)}%` } }) })
    ] }, s.id)) }),
    /* @__PURE__ */ r("div", { className: "sf-grid", children: [
      /* @__PURE__ */ r(z, { children: [
        /* @__PURE__ */ e($, { children: "Runs per day (14d)" }),
        /* @__PURE__ */ e("div", { className: "sf-spark", style: { "--sf-c": "var(--accent)" }, children: n.map((s, g) => /* @__PURE__ */ e("i", { title: `${s.day}: ${s.completed} ok, ${s.failed} failed`, style: { height: `${Math.round(100 * (s.completed + s.failed) / p)}%`, background: s.failed ? `linear-gradient(to top, var(--danger) ${Math.round(100 * s.failed / Math.max(1, s.completed + s.failed))}%, var(--accent) 0)` : void 0 } }, g)) }),
        /* @__PURE__ */ r("div", { className: "sf-meta", style: { justifyContent: "space-between" }, children: [
          /* @__PURE__ */ e("span", { children: n[0].day }),
          /* @__PURE__ */ e("span", { children: "today" })
        ] })
      ] }),
      /* @__PURE__ */ r(z, { children: [
        /* @__PURE__ */ e($, { children: "Credits per day (14d)" }),
        /* @__PURE__ */ e("div", { className: "sf-spark", style: { "--sf-c": "var(--warn)" }, children: n.map((s, g) => /* @__PURE__ */ e("i", { title: `${s.day}: ${s.credits.toFixed(1)} credits`, style: { height: `${Math.round(100 * s.credits / o)}%` } }, g)) }),
        /* @__PURE__ */ r("div", { className: "sf-meta", style: { justifyContent: "space-between" }, children: [
          /* @__PURE__ */ e("span", { children: n[0].day }),
          /* @__PURE__ */ e("span", { children: "today" })
        ] })
      ] })
    ] })
  ] });
}
const _ = (t, a = 1) => t == null ? "–" : t.toFixed(a), Se = (t) => t == null ? "–" : t.toLocaleString(), se = ["delivery-planner", "delivery-implementer", "delivery-reviewer", "delivery-scribe", "github-worker"];
function Q({ parts: t, total: a, height: n = 8 }) {
  const p = Math.max(a, 1e-4);
  return /* @__PURE__ */ e(
    "div",
    {
      style: { display: "flex", height: n, borderRadius: n / 2, overflow: "hidden", background: "var(--bg-elevated)", width: "100%" },
      title: Object.entries(t).map(([o, s]) => `${S(o)} ${s.toFixed(2)}`).join(" · "),
      children: se.filter((o) => t[o]).map((o) => /* @__PURE__ */ e("span", { style: { width: `${100 * t[o] / p}%`, background: C(o) } }, o))
    }
  );
}
function Me({ costs: t, onOpen: a }) {
  var f, u, h;
  const n = t.totals, p = Math.max(1e-4, ...t.per_day.map((l) => l.credits)), o = Math.max(1e-4, ...t.per_issue.map((l) => l.credits)), [s, g] = w(!1), i = s ? t.per_issue : t.per_issue.slice(0, 10), c = t.per_agent.reduce((l, b) => l + b.credits, 0);
  return /* @__PURE__ */ r("div", { children: [
    /* @__PURE__ */ r("div", { className: "sf-stats", children: [
      /* @__PURE__ */ e(k, { label: "Credits, all runs", value: _(n.credits_total), accent: !0 }),
      /* @__PURE__ */ e(k, { label: "Credits, 7 days", value: _(n.credits_week) }),
      /* @__PURE__ */ e(k, { label: "Per hop (avg)", value: _(n.avg_per_hop, 2) }),
      /* @__PURE__ */ e(k, { label: "Per issue (avg)", value: _(n.avg_per_issue) }),
      /* @__PURE__ */ e(k, { label: "Per delivered issue (median)", value: _(n.median_per_delivered_issue) }),
      /* @__PURE__ */ e(k, { label: "Per shipped issue (avg)", value: _(n.avg_per_shipped_issue) })
    ] }),
    !t.tokens_recorded && /* @__PURE__ */ r("div", { className: "sf-legend", children: [
      /* @__PURE__ */ e("span", { className: "sf-legend-h", children: "Unit" }),
      /* @__PURE__ */ e("span", { children: "Credits are what kiro-cli records for a webhook run; token counts are not written on this surface. Model calls and context size stand in for them." })
    ] }),
    /* @__PURE__ */ r("div", { className: "sf-grid", style: { marginBottom: 16, gridTemplateColumns: "minmax(0,2fr) minmax(0,1fr)" }, children: [
      /* @__PURE__ */ r(z, { children: [
        /* @__PURE__ */ e($, { children: "Credits per day, last 14 days" }),
        /* @__PURE__ */ e("div", { className: "sf-spark", style: { height: 120, marginTop: 10 }, children: t.per_day.map((l) => /* @__PURE__ */ r(
          "div",
          {
            title: `${l.day}: ${l.credits.toFixed(1)} credits, ${l.runs} runs
${Object.entries(l.by_agent).map(([b, v]) => `${S(b)} ${v.toFixed(1)}`).join(", ")}`,
            style: { flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", height: "100%", borderRadius: "2px 2px 0 0", overflow: "hidden" },
            children: [
              se.filter((b) => l.by_agent[b]).map((b) => /* @__PURE__ */ e("span", { style: { height: `${Math.round(100 * l.by_agent[b] / p)}%`, background: C(b), display: "block" } }, b)),
              l.credits === 0 && /* @__PURE__ */ e("span", { style: { height: 2, background: "var(--border)", display: "block" } })
            ]
          },
          l.day
        )) }),
        /* @__PURE__ */ r("div", { style: { display: "flex", justifyContent: "space-between", fontSize: 10.5, color: "var(--muted)", marginTop: 4 }, children: [
          /* @__PURE__ */ e("span", { children: (f = t.per_day[0]) == null ? void 0 : f.day.slice(5) }),
          /* @__PURE__ */ e("span", { children: (u = t.per_day[Math.floor(t.per_day.length / 2)]) == null ? void 0 : u.day.slice(5) }),
          /* @__PURE__ */ e("span", { children: (h = t.per_day[t.per_day.length - 1]) == null ? void 0 : h.day.slice(5) })
        ] })
      ] }),
      /* @__PURE__ */ r(z, { children: [
        /* @__PURE__ */ e($, { children: "By agent" }),
        /* @__PURE__ */ e(Q, { parts: Object.fromEntries(t.per_agent.map((l) => [l.agent, l.credits])), total: c, height: 10 }),
        /* @__PURE__ */ r("table", { className: "sf-table", style: { marginTop: 10 }, children: [
          /* @__PURE__ */ e("thead", { children: /* @__PURE__ */ r("tr", { children: [
            /* @__PURE__ */ e("th", { children: "Agent" }),
            /* @__PURE__ */ e("th", { children: "Runs" }),
            /* @__PURE__ */ e("th", { children: "Credits" }),
            /* @__PURE__ */ e("th", { children: "Avg" }),
            /* @__PURE__ */ e("th", { children: "Cr/min" })
          ] }) }),
          /* @__PURE__ */ e("tbody", { children: t.per_agent.map((l) => /* @__PURE__ */ r("tr", { children: [
            /* @__PURE__ */ e("td", { children: /* @__PURE__ */ r("span", { className: "sf-row", children: [
              /* @__PURE__ */ e("span", { className: "sf-dot", style: { background: C(l.agent) } }),
              S(l.agent)
            ] }) }),
            /* @__PURE__ */ e("td", { children: l.runs }),
            /* @__PURE__ */ r("td", { children: [
              _(l.credits),
              " ",
              /* @__PURE__ */ r("span", { style: { color: "var(--muted)", fontSize: 11 }, children: [
                c ? Math.round(100 * l.credits / c) : 0,
                "%"
              ] })
            ] }),
            /* @__PURE__ */ e("td", { children: _(l.avg_credits, 2) }),
            /* @__PURE__ */ e("td", { children: _(l.credits_per_minute, 2) })
          ] }, l.agent)) })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ r(z, { children: [
      /* @__PURE__ */ r("div", { className: "sf-row", style: { justifyContent: "space-between" }, children: [
        /* @__PURE__ */ e($, { children: "Most expensive issues" }),
        t.per_issue.length > 10 && /* @__PURE__ */ e("button", { className: "sf-btn", onClick: () => g((l) => !l), children: s ? "Top 10" : `All ${t.per_issue.length}` })
      ] }),
      /* @__PURE__ */ r("table", { className: "sf-table", style: { marginTop: 8 }, children: [
        /* @__PURE__ */ e("thead", { children: /* @__PURE__ */ r("tr", { children: [
          /* @__PURE__ */ e("th", { children: "Issue" }),
          /* @__PURE__ */ e("th", { style: { width: "32%" }, children: "Credits" }),
          /* @__PURE__ */ e("th", { children: "Hops" }),
          /* @__PURE__ */ e("th", { children: "Rounds" }),
          /* @__PURE__ */ e("th", { children: "Stage" }),
          /* @__PURE__ */ e("th", { children: "Split by agent" })
        ] }) }),
        /* @__PURE__ */ r("tbody", { children: [
          i.map((l) => /* @__PURE__ */ r("tr", { style: { cursor: "pointer" }, onClick: () => a(l.issue), children: [
            /* @__PURE__ */ r("td", { children: [
              /* @__PURE__ */ r("span", { className: "sf-mono", style: { color: "var(--muted)" }, children: [
                "#",
                l.issue
              ] }),
              " ",
              l.title.length > 48 ? l.title.slice(0, 48) + "…" : l.title
            ] }),
            /* @__PURE__ */ e("td", { children: /* @__PURE__ */ r("div", { className: "sf-row", children: [
              /* @__PURE__ */ e("div", { className: "sf-bar", style: { flex: 1, marginTop: 0 }, children: /* @__PURE__ */ e("i", { style: { width: `${Math.round(100 * l.credits / o)}%`, background: "var(--accent)" } }) }),
              /* @__PURE__ */ e("b", { style: { minWidth: 44, textAlign: "right" }, children: _(l.credits) })
            ] }) }),
            /* @__PURE__ */ e("td", { children: l.hops }),
            /* @__PURE__ */ e("td", { children: l.rounds }),
            /* @__PURE__ */ e("td", { children: /* @__PURE__ */ e(R, { tone: J[l.stage] ?? "var(--muted)", children: l.stage }) }),
            /* @__PURE__ */ e("td", { style: { minWidth: 140 }, children: /* @__PURE__ */ e(Q, { parts: l.by_agent, total: l.credits }) })
          ] }, l.issue)),
          i.length === 0 && /* @__PURE__ */ e("tr", { children: /* @__PURE__ */ e("td", { colSpan: 6, className: "sf-empty", children: "No issue on this board has an agent run recorded on this gateway." }) })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ r(z, { children: [
      /* @__PURE__ */ e($, { children: "By model" }),
      /* @__PURE__ */ r("table", { className: "sf-table", style: { marginTop: 8 }, children: [
        /* @__PURE__ */ e("thead", { children: /* @__PURE__ */ r("tr", { children: [
          /* @__PURE__ */ e("th", { children: "Model" }),
          /* @__PURE__ */ e("th", { children: "Runs" }),
          /* @__PURE__ */ e("th", { children: "Credits" }),
          /* @__PURE__ */ e("th", { children: "Avg per run" }),
          /* @__PURE__ */ e("th", { children: "Model calls" }),
          /* @__PURE__ */ e("th", { children: "Avg context" })
        ] }) }),
        /* @__PURE__ */ e("tbody", { children: t.per_model.map((l) => /* @__PURE__ */ r("tr", { children: [
          /* @__PURE__ */ e("td", { className: "sf-mono", children: l.model }),
          /* @__PURE__ */ e("td", { children: l.runs }),
          /* @__PURE__ */ e("td", { children: _(l.credits) }),
          /* @__PURE__ */ e("td", { children: _(l.avg_credits, 2) }),
          /* @__PURE__ */ e("td", { children: Se(l.model_calls) }),
          /* @__PURE__ */ e("td", { children: l.avg_context_chars != null ? `${Math.round(l.avg_context_chars / 1e3)}k chars` : "–" })
        ] }, l.model)) })
      ] }),
      t.per_model.length === 1 && t.per_model[0].model === "auto" && /* @__PURE__ */ r("div", { style: { fontSize: 12, color: "var(--muted)", marginTop: 8 }, children: [
        "Every template runs on ",
        /* @__PURE__ */ e("code", { children: "auto" }),
        ", so there is one row. Pin a model in a template (doc 08) and it appears here on its own."
      ] })
    ] })
  ] });
}
function I({ ok: t, unknown: a }) {
  return /* @__PURE__ */ e("span", { className: "sf-dot", style: { background: a ? "var(--muted)" : t ? "var(--ok)" : "var(--danger)", width: 10, height: 10 } });
}
function Te({ infra: t }) {
  return /* @__PURE__ */ r("div", { className: "sf-grid", children: [
    /* @__PURE__ */ r(z, { children: [
      /* @__PURE__ */ e($, { children: "Health" }),
      /* @__PURE__ */ r("dl", { className: "sf-kv", style: { gridTemplateColumns: "auto 1fr" }, children: [
        /* @__PURE__ */ e("dt", { children: /* @__PURE__ */ e(I, { ok: t.runner_ok }) }),
        /* @__PURE__ */ r("dd", { children: [
          "Actions runner ",
          t.runner_ok ? "online" : "offline",
          t.runners.map((a) => ` · ${a.name}${a.busy ? " (busy)" : ""}`)
        ] }),
        /* @__PURE__ */ e("dt", { children: /* @__PURE__ */ e(I, { ok: !!t.webhooks_enabled, unknown: t.webhooks_enabled == null }) }),
        /* @__PURE__ */ r("dd", { children: [
          "Inbound webhooks ",
          t.webhooks_enabled == null ? "unknown (switch not readable here)" : t.webhooks_enabled ? "enabled" : "DISABLED"
        ] }),
        /* @__PURE__ */ e("dt", { children: /* @__PURE__ */ e(I, { ok: t.templates_ok }) }),
        /* @__PURE__ */ r("dd", { children: [
          "Agent templates ",
          Object.values(t.templates).filter(Boolean).length,
          "/",
          Object.keys(t.templates).length,
          " installed on this gateway"
        ] }),
        /* @__PURE__ */ e("dt", { children: /* @__PURE__ */ e(I, { ok: t.workflow_failures_recent === 0 }) }),
        /* @__PURE__ */ r("dd", { children: [
          t.workflow_failures_recent,
          " failed workflow runs in the last 30 · last event ",
          A(t.workflow_last_at)
        ] }),
        /* @__PURE__ */ e("dt", { children: /* @__PURE__ */ e(me, { size: 12 }) }),
        /* @__PURE__ */ r("dd", { children: [
          "Gateway host ",
          /* @__PURE__ */ e("span", { className: "sf-mono", children: t.gateway_host })
        ] })
      ] }),
      t.errors.length > 0 && /* @__PURE__ */ e("div", { className: "sf-warnbox", style: { marginTop: 12 }, children: t.errors.map((a, n) => /* @__PURE__ */ e("div", { children: a }, n)) })
    ] }),
    /* @__PURE__ */ r(z, { children: [
      /* @__PURE__ */ e($, { children: "Webhook sources" }),
      !t.sources_readable && /* @__PURE__ */ e("div", { className: "sf-empty", children: "Source list not readable from the backend on this host. Check Settings → Webhooks." }),
      t.sources.map((a) => /* @__PURE__ */ r("div", { className: "sf-row", style: { padding: "6px 0", borderBottom: "1px solid var(--border)", fontSize: 12.5 }, children: [
        /* @__PURE__ */ e(I, { ok: a.enabled }),
        /* @__PURE__ */ e("span", { style: { flex: 1 }, children: a.label || a.id }),
        /* @__PURE__ */ e("span", { className: "sf-mono", style: { color: "var(--muted)" }, children: a.agent }),
        a.signed && /* @__PURE__ */ e("span", { className: "sf-chip", children: "signed" }),
        /* @__PURE__ */ e("span", { style: { color: "var(--muted)" }, children: A(a.last_used_at) })
      ] }, a.id))
    ] }),
    /* @__PURE__ */ r(z, { children: [
      /* @__PURE__ */ e($, { children: "Templates" }),
      Object.entries(t.templates).map(([a, n]) => /* @__PURE__ */ r("div", { className: "sf-row", style: { padding: "6px 0", borderBottom: "1px solid var(--border)", fontSize: 12.5 }, children: [
        /* @__PURE__ */ e(I, { ok: n }),
        /* @__PURE__ */ r("span", { className: "sf-mono", children: [
          a,
          ".json"
        ] }),
        /* @__PURE__ */ e("span", { style: { marginLeft: "auto", color: "var(--muted)" }, children: n ? "~/.kiro/agents" : "run scripts/install-agent.sh" })
      ] }, a))
    ] }),
    /* @__PURE__ */ r(z, { children: [
      /* @__PURE__ */ e($, { children: "Recent workflow runs" }),
      t.workflow_recent.map((a) => /* @__PURE__ */ r("div", { className: "sf-row", style: { padding: "6px 0", borderBottom: "1px solid var(--border)", fontSize: 12.5 }, children: [
        /* @__PURE__ */ e(I, { ok: a.conclusion === "success", unknown: !a.conclusion }),
        /* @__PURE__ */ e("a", { className: "sf-link", href: a.url, target: "_blank", rel: "noreferrer", style: { flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, children: a.title || a.name }),
        /* @__PURE__ */ e("span", { className: "sf-mono", style: { color: "var(--muted)" }, children: a.event }),
        /* @__PURE__ */ e("span", { style: { color: "var(--muted)" }, children: A(a.created_at) })
      ] }, a.id))
    ] })
  ] });
}
function Be() {
  const { state: t, error: a, loading: n, reload: p, api: o, showAll: s, setShowAll: g } = xe(), [i, c] = w("board"), [f, u] = w(null), [h, l] = w(null), b = (t == null ? void 0 : t.board.find((x) => x.issue === f)) ?? null, v = h ? (t == null ? void 0 : t.runs.find((x) => x.id === h.id || x.session_key && x.session_key === h.session_key)) ?? h : null;
  return /* @__PURE__ */ r("div", { className: "sf-root", children: [
    /* @__PURE__ */ e("style", { children: be }),
    /* @__PURE__ */ e(
      de,
      {
        title: "Software Factory",
        subtitle: t ? `${t.repo} · ${t.stats.live_runs > 0 ? `${t.stats.live_runs} agent${t.stats.live_runs > 1 ? "s" : ""} running` : "idle"} · refreshed ${A(t.generated_at)}` : "Issue to merged PR, observed end to end"
      }
    ),
    /* @__PURE__ */ r("div", { className: "sf-body", children: [
      a && /* @__PURE__ */ r("div", { className: "sf-warnbox", children: [
        /* @__PURE__ */ e(Y, { size: 13, style: { verticalAlign: -2 } }),
        " ",
        a
      ] }),
      n && !t && /* @__PURE__ */ e("div", { className: "sf-empty", children: "Reading GitHub and the gateway…" }),
      t && /* @__PURE__ */ r(T, { children: [
        /* @__PURE__ */ r("div", { className: "sf-stats", children: [
          /* @__PURE__ */ e(k, { label: "In flight", value: String(t.stats.in_flight), accent: !0 }),
          /* @__PURE__ */ e(k, { label: "Ready to merge", value: String(t.stats.ready) }),
          /* @__PURE__ */ e(k, { label: "Parked", value: String(t.stats.parked) }),
          /* @__PURE__ */ e(k, { label: "Shipped", value: String(t.stats.shipped) }),
          /* @__PURE__ */ e(k, { label: "Median issue → ready", value: t.stats.median_cycle_s != null ? B(t.stats.median_cycle_s * 1e3) : "–" }),
          /* @__PURE__ */ e(k, { label: "Pass rate", value: t.stats.pass_rate != null ? `${t.stats.pass_rate}%` : "–" }),
          /* @__PURE__ */ e(k, { label: "Agent runs (7d)", value: `${t.stats.runs_week}` }),
          /* @__PURE__ */ e(k, { label: "Credits (7d)", value: t.stats.credits_week.toFixed(1) })
        ] }),
        /* @__PURE__ */ r("div", { className: "sf-row", style: { justifyContent: "space-between", flexWrap: "wrap" }, children: [
          /* @__PURE__ */ e(ye, { value: i, onChange: c, items: [["board", "Board"], ["runs", "Agent runs"], ["agents", "Agents"], ["costs", "Costs"], ["infra", "Infrastructure"]] }),
          /* @__PURE__ */ r("div", { className: "sf-row", style: { marginBottom: 16 }, children: [
            /* @__PURE__ */ e("span", { className: "sf-row", style: { fontSize: 12, color: "var(--muted)" }, children: t.stats.live_runs > 0 ? /* @__PURE__ */ r(T, { children: [
              /* @__PURE__ */ e(oe, { size: 13, className: "sf-pulse", style: { color: "var(--accent)" } }),
              " live"
            ] }) : /* @__PURE__ */ r(T, { children: [
              /* @__PURE__ */ e(ce, { size: 13 }),
              " polling"
            ] }) }),
            /* @__PURE__ */ r("button", { className: "sf-btn", onClick: p, children: [
              /* @__PURE__ */ e(pe, { size: 13 }),
              " Refresh"
            ] })
          ] })
        ] }),
        i === "board" && /* @__PURE__ */ e(ke, { state: t, onOpen: (x) => u(x.issue), showAll: s, onToggleAll: g }),
        i === "runs" && /* @__PURE__ */ e(_e, { runs: t.runs, onWatch: l }),
        i === "agents" && /* @__PURE__ */ e(Ce, { state: t }),
        i === "costs" && /* @__PURE__ */ e(Me, { costs: t.costs, onOpen: u }),
        i === "infra" && /* @__PURE__ */ e(Te, { infra: t.infra })
      ] })
    ] }),
    b && !h && /* @__PURE__ */ e(Ne, { it: b, runs: t.runs, onClose: () => u(null), onWatch: l }),
    v && /* @__PURE__ */ e(ze, { run: v, api: o, onClose: () => l(null) })
  ] });
}
export {
  Be as default
};
