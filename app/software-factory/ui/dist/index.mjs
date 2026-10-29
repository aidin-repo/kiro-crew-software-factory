import { jsxs as r, jsx as e, Fragment as A } from "react/jsx-runtime";
import { useAppApi as ie } from "@kirocrew/app-sdk";
import { PageHeader as de, StatCard as w, CardTitle as $, Card as C } from "@kirocrew/app-sdk/ui";
import { AlertTriangle as Y, Activity as oe, CircleDot as ce, RefreshCw as pe, Clock as Z, GitPullRequest as ee, Zap as V, Eye as te, ExternalLink as H, CheckCircle2 as he, Bot as re, Server as me, X as fe } from "lucide-react";
import { useState as y, useEffect as O, useRef as ue, useCallback as ge, useMemo as G } from "react";
const q = "/apps/software-factory/api", L = (t) => {
  if (t == null) return "–";
  const a = Math.round(t / 1e3);
  if (a < 60) return `${a}s`;
  const n = Math.floor(a / 60);
  return n < 60 ? `${n}m ${a % 60}s` : `${Math.floor(n / 60)}h ${n % 60}m`;
}, R = (t) => {
  if (!t) return "–";
  const a = Math.max(0, Date.now() / 1e3 - t);
  return a < 60 ? `${Math.round(a)}s ago` : a < 3600 ? `${Math.round(a / 60)}m ago` : a < 86400 ? `${Math.round(a / 3600)}h ago` : `${Math.round(a / 86400)}d ago`;
}, U = (t) => t ? new Date(t * 1e3).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "–", S = (t) => t.replace("delivery-", "").replace("github-", ""), ve = {
  "delivery-planner": "var(--info)",
  "delivery-implementer": "var(--accent)",
  "delivery-reviewer": "var(--warn)",
  "delivery-scribe": "var(--ok)",
  "github-worker": "var(--muted-strong)",
  "pr-gate": "var(--text)"
}, z = (t) => ve[t] ?? "var(--muted)", J = {
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
  const t = ie(), [a, n] = y(null), [h, p] = y(null), [s, v] = y(!0), [d, o] = y(!1), u = ue(null), f = ge(async (m = !1) => {
    try {
      const i = [m ? "refresh=1" : "", d ? "limit=0" : ""].filter(Boolean).join("&"), b = await t.get(`${q}/state${i ? `?${i}` : ""}`);
      n(b), p(null);
    } catch (i) {
      p(i instanceof Error ? i.message : String(i));
    } finally {
      v(!1);
    }
  }, [t, d]);
  return O(() => {
    f();
    const m = () => {
      const i = ((a == null ? void 0 : a.stats.live_runs) ?? 0) > 0;
      u.current = window.setTimeout(async () => {
        await f(), m();
      }, i ? 5e3 : 15e3);
    };
    return m(), () => {
      u.current && window.clearTimeout(u.current);
    };
  }, [f]), { state: a, error: h, loading: s, reload: () => f(!0), api: t, showAll: d, setShowAll: o };
}
function j({ tone: t, children: a }) {
  return /* @__PURE__ */ e("span", { className: "sf-pill", style: { background: `color-mix(in srgb, ${t} 16%, transparent)`, color: t }, children: a });
}
function K({ o: t, live: a }) {
  const n = ae(t);
  return /* @__PURE__ */ r(j, { tone: n, children: [
    /* @__PURE__ */ e("span", { className: `sf-dot ${a ? "sf-pulse" : ""}`, style: { background: n, width: 7, height: 7 } }),
    t
  ] });
}
function ye({ value: t, onChange: a, items: n }) {
  return /* @__PURE__ */ e("div", { className: "sf-tabs", role: "tablist", children: n.map(([h, p]) => /* @__PURE__ */ e("button", { role: "tab", "aria-selected": t === h, "data-on": t === h, className: "sf-tab", onClick: () => a(h), children: p }, h)) });
}
function ne({ title: t, sub: a, onClose: n, children: h, wide: p, actions: s }) {
  return O(() => {
    const v = (d) => {
      d.key === "Escape" && n();
    };
    return window.addEventListener("keydown", v), () => window.removeEventListener("keydown", v);
  }, [n]), /* @__PURE__ */ r(A, { children: [
    /* @__PURE__ */ e("div", { className: "sf-scrim", onClick: n }),
    /* @__PURE__ */ r("aside", { className: "sf-drawer", "data-wide": !!p, role: "dialog", "aria-modal": "true", children: [
      /* @__PURE__ */ r("div", { className: "sf-dhead", children: [
        /* @__PURE__ */ r("div", { style: { minWidth: 0, flex: 1 }, children: [
          /* @__PURE__ */ e("div", { style: { fontWeight: 600, fontSize: 15, color: "var(--text-strong)" }, children: t }),
          a && /* @__PURE__ */ e("div", { style: { fontSize: 12, color: "var(--muted)", marginTop: 3 }, children: a })
        ] }),
        s,
        /* @__PURE__ */ e("button", { className: "sf-x", onClick: n, "aria-label": "Close", style: { marginLeft: 4 }, children: /* @__PURE__ */ e(fe, { size: 16 }) })
      ] }),
      /* @__PURE__ */ e("div", { className: "sf-dbody", children: h })
    ] })
  ] });
}
function we({ it: t, onOpen: a }) {
  var h;
  const n = !!t.live_agent;
  return /* @__PURE__ */ r("div", { className: "sf-card", "data-live": n, onClick: a, role: "button", tabIndex: 0, onKeyDown: (p) => p.key === "Enter" && a(), children: [
    /* @__PURE__ */ r("div", { className: "sf-row", style: { justifyContent: "space-between", marginBottom: 4 }, children: [
      /* @__PURE__ */ r("span", { className: "sf-mono", style: { color: "var(--muted)" }, children: [
        "#",
        t.issue
      ] }),
      n && /* @__PURE__ */ r(j, { tone: "var(--accent)", children: [
        /* @__PURE__ */ e("span", { className: "sf-dot sf-pulse", style: { background: "var(--accent)", width: 7, height: 7 } }),
        S(t.live_agent)
      ] }),
      !n && ((h = t.pr) == null ? void 0 : h.checks) && /* @__PURE__ */ e("span", { className: "sf-dot", title: `CI ${t.pr.checks}`, style: { background: t.pr.checks === "passing" ? "var(--ok)" : t.pr.checks === "failing" ? "var(--danger)" : "var(--warn)" } })
    ] }),
    /* @__PURE__ */ e("div", { className: "sf-cardtitle", children: t.title }),
    /* @__PURE__ */ r("div", { className: "sf-meta", children: [
      /* @__PURE__ */ r("span", { title: "Last activity", children: [
        /* @__PURE__ */ e(Z, { size: 11, style: { verticalAlign: -1 } }),
        " ",
        R(t.last_activity ?? t.stage_since)
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
        /* @__PURE__ */ e(V, { size: 11, style: { verticalAlign: -1 } }),
        " ",
        t.credits.toFixed(1)
      ] })
    ] }),
    t.hops.length > 0 && /* @__PURE__ */ e("div", { className: "sf-hops", title: t.hops.map((p) => `${S(p.agent)} ${p.outcome} ${L(p.duration_ms)}`).join(`
`), children: t.hops.map((p) => /* @__PURE__ */ e("span", { className: `sf-hop ${p.live ? "sf-pulse" : ""}`, style: { background: z(p.agent), opacity: p.outcome === "completed" || p.live ? 0.9 : 0.35 } }, p.id)) })
  ] });
}
function ke({ state: t, onOpen: a, showAll: n, onToggleAll: h }) {
  const p = /* @__PURE__ */ new Set(["planning", "needs-owner", "implementing", "review", "ready"]), s = t.stages.filter((d) => p.has(d.id) || t.board.some((o) => o.stage === d.id)), v = t.board_total - t.board.length;
  return /* @__PURE__ */ r(A, { children: [
    /* @__PURE__ */ r("div", { className: "sf-row", style: { justifyContent: "space-between", marginBottom: 10, fontSize: 12, color: "var(--muted)", flexWrap: "wrap", gap: 10 }, children: [
      /* @__PURE__ */ r("span", { children: [
        n ? `All ${t.board_total} items` : `${t.board.length} most recently active${v > 0 ? ` · ${v} older hidden` : ""}`,
        ", newest first in each column"
      ] }),
      /* @__PURE__ */ r("div", { className: "sf-views", role: "tablist", "aria-label": "Board scope", children: [
        /* @__PURE__ */ r("button", { role: "tab", "aria-selected": !n, "data-on": !n, onClick: () => h(!1), children: [
          "Recent ",
          t.board_limit || 20
        ] }),
        /* @__PURE__ */ e("button", { role: "tab", "aria-selected": n, "data-on": n, onClick: () => h(!0), children: "All" })
      ] })
    ] }),
    /* @__PURE__ */ r("div", { className: "sf-legend", "aria-label": "Legend", children: [
      /* @__PURE__ */ e("span", { className: "sf-legend-h", children: "Bars: one per agent hop, oldest left" }),
      ["delivery-planner", "delivery-implementer", "delivery-reviewer", "delivery-scribe", "github-worker"].map((d) => /* @__PURE__ */ r("span", { children: [
        /* @__PURE__ */ e("i", { className: "sf-hop", style: { background: z(d), width: 18, minWidth: 18, display: "inline-block" } }),
        " ",
        S(d)
      ] }, d)),
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
        /* @__PURE__ */ e(V, { size: 11, style: { verticalAlign: -1 } }),
        " credits"
      ] })
    ] }),
    /* @__PURE__ */ e("div", { className: "sf-board", children: s.map((d) => {
      const o = t.board.filter((u) => u.stage === d.id);
      return /* @__PURE__ */ r("div", { className: "sf-col", children: [
        /* @__PURE__ */ r("div", { className: "sf-colhead", children: [
          /* @__PURE__ */ r("span", { className: "sf-row", children: [
            /* @__PURE__ */ e("span", { className: "sf-dot", style: { background: J[d.id] } }),
            d.label
          ] }),
          /* @__PURE__ */ e("span", { className: "sf-count", children: o.length })
        ] }),
        o.map((u) => /* @__PURE__ */ e(we, { it: u, onOpen: () => a(u) }, u.issue)),
        o.length === 0 && /* @__PURE__ */ e("div", { className: "sf-empty", style: { padding: 10 }, children: "empty" })
      ] }, d.id);
    }) })
  ] });
}
function Ne({ it: t, runs: a, onClose: n, onWatch: h }) {
  var s, v;
  const p = t.hops.map((d) => ({ hop: d, run: a.find((o) => o.id === d.id) }));
  return /* @__PURE__ */ r(ne, { onClose: n, title: /* @__PURE__ */ r("span", { children: [
    "#",
    t.issue,
    " ",
    t.title
  ] }), sub: /* @__PURE__ */ r("span", { className: "sf-row", children: [
    /* @__PURE__ */ e(j, { tone: J[t.stage], children: t.stage }),
    /* @__PURE__ */ r("a", { className: "sf-link", href: t.url, target: "_blank", rel: "noreferrer", children: [
      "issue ",
      /* @__PURE__ */ e(H, { size: 11 })
    ] }),
    t.pr && /* @__PURE__ */ r("a", { className: "sf-link", href: t.pr.url, target: "_blank", rel: "noreferrer", children: [
      "PR ",
      t.pr.number,
      " ",
      /* @__PURE__ */ e(H, { size: 11 })
    ] }),
    t.docs_pr && /* @__PURE__ */ r("a", { className: "sf-link", href: t.docs_pr.url, target: "_blank", rel: "noreferrer", children: [
      "docs PR ",
      t.docs_pr.number,
      " ",
      /* @__PURE__ */ e(H, { size: 11 })
    ] })
  ] }), children: [
    /* @__PURE__ */ r("dl", { className: "sf-kv", style: { marginTop: 0, marginBottom: 16 }, children: [
      /* @__PURE__ */ e("dt", { children: "Opened" }),
      /* @__PURE__ */ e("dd", { children: U(t.created_at) }),
      /* @__PURE__ */ e("dt", { children: "In stage since" }),
      /* @__PURE__ */ e("dd", { children: R(t.stage_since) }),
      /* @__PURE__ */ e("dt", { children: "Review rounds" }),
      /* @__PURE__ */ e("dd", { children: t.rounds }),
      /* @__PURE__ */ e("dt", { children: "Credits" }),
      /* @__PURE__ */ e("dd", { children: t.credits.toFixed(2) }),
      /* @__PURE__ */ e("dt", { children: "CI" }),
      /* @__PURE__ */ e("dd", { children: ((s = t.pr) == null ? void 0 : s.checks) ?? "–" }),
      /* @__PURE__ */ e("dt", { children: "Labels" }),
      /* @__PURE__ */ e("dd", { style: { display: "flex", flexWrap: "wrap", gap: 4 }, children: [...t.labels, ...((v = t.pr) == null ? void 0 : v.labels) ?? []].filter((d) => d.startsWith("kiro-")).map((d) => /* @__PURE__ */ e("span", { className: "sf-chip", children: d }, d)) })
    ] }),
    /* @__PURE__ */ e($, { children: "Hops" }),
    p.length === 0 && /* @__PURE__ */ e("div", { className: "sf-empty", children: "No agent run is linked to this issue on this gateway yet." }),
    /* @__PURE__ */ e("div", { className: "sf-tl", children: p.map(({ hop: d, run: o }) => {
      var u, f, m;
      return /* @__PURE__ */ r("div", { className: "sf-tli", children: [
        /* @__PURE__ */ e("span", { className: `sf-dot ${d.live ? "sf-pulse" : ""}`, style: { background: z(d.agent) } }),
        /* @__PURE__ */ r("div", { className: "sf-row", style: { justifyContent: "space-between" }, children: [
          /* @__PURE__ */ r("div", { children: [
            /* @__PURE__ */ e("strong", { style: { color: "var(--text-strong)", fontSize: 13 }, children: S(d.agent) }),
            /* @__PURE__ */ e("span", { style: { color: "var(--muted)", fontSize: 12, marginLeft: 8 }, children: d.kind })
          ] }),
          /* @__PURE__ */ e(K, { o: d.outcome, live: d.live })
        ] }),
        /* @__PURE__ */ r("div", { className: "sf-meta", children: [
          /* @__PURE__ */ e("span", { children: U(d.started_at) }),
          /* @__PURE__ */ e("span", { children: L(d.duration_ms) }),
          d.credits != null && /* @__PURE__ */ r("span", { children: [
            /* @__PURE__ */ e(V, { size: 11, style: { verticalAlign: -1 } }),
            " ",
            d.credits.toFixed(2)
          ] }),
          ((u = o == null ? void 0 : o.session) == null ? void 0 : u.model) && /* @__PURE__ */ e("span", { children: o.session.model }),
          ((f = o == null ? void 0 : o.session) == null ? void 0 : f.tool_calls) != null && /* @__PURE__ */ r("span", { children: [
            o.session.tool_calls,
            " tool calls"
          ] }),
          (o == null ? void 0 : o.session_key) && /* @__PURE__ */ r("button", { className: "sf-btn", style: { padding: "2px 8px" }, onClick: () => h(o), children: [
            /* @__PURE__ */ e(te, { size: 12 }),
            " ",
            d.live ? "watch live" : "steps"
          ] })
        ] }),
        ((m = o == null ? void 0 : o.session) == null ? void 0 : m.last_text) && /* @__PURE__ */ e("div", { className: "sf-text", style: { marginTop: 8, maxHeight: 90, overflow: "hidden" }, children: o.session.last_text })
      ] }, d.id);
    }) })
  ] });
}
function _e({ runs: t, onWatch: a }) {
  return /* @__PURE__ */ r(C, { children: [
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
        var h, p, s, v, d, o;
        return /* @__PURE__ */ r("tr", { children: [
          /* @__PURE__ */ e("td", { title: U(n.started_at), children: R(n.started_at) }),
          /* @__PURE__ */ e("td", { children: /* @__PURE__ */ r("span", { className: "sf-row", children: [
            /* @__PURE__ */ e("span", { className: "sf-dot", style: { background: z(n.agent) } }),
            S(n.agent)
          ] }) }),
          /* @__PURE__ */ e("td", { className: "sf-mono", children: n.kind }),
          /* @__PURE__ */ r("td", { children: [
            (h = n.session) != null && h.issue ? `#${n.session.issue}` : "",
            (p = n.session) != null && p.pr ? ` PR ${n.session.pr}` : ""
          ] }),
          /* @__PURE__ */ e("td", { children: /* @__PURE__ */ e(K, { o: n.outcome, live: n.live }) }),
          /* @__PURE__ */ e("td", { children: L(n.duration_ms) }),
          /* @__PURE__ */ e("td", { className: "sf-mono", children: ((s = n.session) == null ? void 0 : s.model) ?? "–" }),
          /* @__PURE__ */ e("td", { children: ((v = n.session) == null ? void 0 : v.tool_calls) ?? "–" }),
          /* @__PURE__ */ e("td", { children: (d = n.session) != null && d.credits ? n.session.credits.toFixed(2) : "–" }),
          /* @__PURE__ */ e("td", { children: n.session_key && ((o = n.session) == null ? void 0 : o.found) && /* @__PURE__ */ r("button", { className: "sf-btn", onClick: () => a(n), children: [
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
const T = (t) => t < 1e3 ? `${Math.round(t)}ms` : t < 6e4 ? `${(t / 1e3).toFixed(t < 1e4 ? 2 : 1)}s` : `${Math.floor(t / 6e4)}m ${Math.round(t % 6e4 / 1e3)}s`, X = (t) => {
  if (t.status === "error" || t.status === "denied") return "var(--danger)";
  if (t.kind === "run") return "var(--text)";
  if (t.kind === "turn") return "var(--muted-strong)";
  if (t.kind === "model") return "var(--info)";
  const a = t.meta.kind || "";
  return a === "read" || a === "read_files" || a === "search" ? "var(--muted)" : a === "edit" || a === "write" ? "var(--warn)" : "var(--accent)";
}, P = (t) => t.kind === "tool" ? t.meta.title && t.meta.title !== t.name ? t.meta.title : t.name : t.kind === "model" ? `model · ${t.output ? "said" : "thought"}` : t.name;
function $e({ spans: t, live: a }) {
  const [n, h] = y(/* @__PURE__ */ new Set()), [p, s] = y(null), [v, d] = y(""), o = t[0], u = o.start, f = Math.max(1e-3, o.end - o.start), m = G(() => {
    const l = /* @__PURE__ */ new Map();
    for (const x of t) {
      const N = l.get(x.parent) ?? [];
      N.push(x), l.set(x.parent, N);
    }
    return l;
  }, [t]), i = G(() => {
    const l = [], x = v.trim().toLowerCase(), N = (F) => !x || `${P(F)} ${F.input} ${F.name}`.toLowerCase().includes(x), W = (F, D) => {
      var E;
      for (const I of m.get(F) ?? []) {
        const le = ((E = m.get(I.id)) == null ? void 0 : E.length) ?? 0;
        (N(I) || I.kind !== "tool" && I.kind !== "model") && l.push({ sp: I, depth: D, kids: le }), n.has(I.id) || W(I.id, D + 1);
      }
    };
    return W(null, 0), l;
  }, [m, n, v]), b = (l) => h((x) => {
    const N = new Set(x);
    return N.has(l) ? N.delete(l) : N.add(l), N;
  }), g = t.filter((l) => l.kind === "tool").reduce((l, x) => l + (x.end - x.start) * 1e3, 0), k = t.filter((l) => l.kind === "model").reduce((l, x) => l + (x.end - x.start) * 1e3, 0), M = t.filter((l) => l.status === "error" || l.status === "denied").length, c = t.find((l) => l.id === p) ?? null;
  return /* @__PURE__ */ r("div", { children: [
    /* @__PURE__ */ r("div", { className: "sf-tr-sum", children: [
      /* @__PURE__ */ r("span", { children: [
        /* @__PURE__ */ e("b", { children: t.length }),
        "spans"
      ] }),
      /* @__PURE__ */ r("span", { children: [
        /* @__PURE__ */ e("b", { children: T(f * 1e3) }),
        "duration"
      ] }),
      /* @__PURE__ */ r("span", { children: [
        /* @__PURE__ */ e("b", { children: o.meta.tools ?? 0 }),
        "tool calls · ",
        T(g),
        " (",
        Math.round(100 * g / (f * 1e3)),
        "%)"
      ] }),
      /* @__PURE__ */ r("span", { children: [
        /* @__PURE__ */ e("b", { children: o.meta.model_spans ?? 0 }),
        "model spans · ",
        T(k),
        " (",
        Math.round(100 * k / (f * 1e3)),
        "%)"
      ] }),
      /* @__PURE__ */ r("span", { children: [
        /* @__PURE__ */ e("b", { children: (o.meta.credits ?? 0).toFixed(2) }),
        "credits"
      ] }),
      M > 0 && /* @__PURE__ */ r("span", { style: { color: "var(--danger)" }, children: [
        /* @__PURE__ */ e("b", { style: { color: "var(--danger)" }, children: M }),
        "refused or failed"
      ] }),
      a && /* @__PURE__ */ e("span", { style: { color: "var(--accent)" }, children: "live" })
    ] }),
    /* @__PURE__ */ r("div", { className: "sf-tr-tools", children: [
      /* @__PURE__ */ e("input", { value: v, onChange: (l) => d(l.target.value), placeholder: "Filter spans by name, command or path…", "aria-label": "Filter spans" }),
      /* @__PURE__ */ e("button", { className: "sf-btn", onClick: () => h(/* @__PURE__ */ new Set()), children: "Expand all" }),
      /* @__PURE__ */ e("button", { className: "sf-btn", onClick: () => h(new Set(t.filter((l) => l.kind === "turn").map((l) => l.id))), children: "Turns only" })
    ] }),
    /* @__PURE__ */ r("div", { className: "sf-tr", role: "tree", children: [
      /* @__PURE__ */ r("div", { className: "sf-tr-head", children: [
        /* @__PURE__ */ e("div", { children: "Span" }),
        /* @__PURE__ */ e("div", { className: "sf-tr-axis", children: [0, 0.25, 0.5, 0.75, 1].map((l) => /* @__PURE__ */ e("span", { style: { left: `calc(${l * 100}% - ${l === 1 ? 24 : l === 0 ? -6 : 0}px)` }, children: T(l * f * 1e3) }, l)) })
      ] }),
      i.map(({ sp: l, depth: x, kids: N }) => {
        const W = (l.start - u) / f * 100, F = Math.max(0.3, (l.end - l.start) / f * 100), D = X(l);
        return /* @__PURE__ */ r("div", { className: "sf-tr-row", role: "treeitem", "aria-selected": p === l.id, "data-sel": p === l.id, onClick: () => s(l.id === p ? null : l.id), children: [
          /* @__PURE__ */ r("div", { style: { paddingLeft: 10 + x * 16 }, children: [
            /* @__PURE__ */ e("span", { className: "sf-caret", onClick: (E) => {
              E.stopPropagation(), N && b(l.id);
            }, "aria-hidden": "true", children: N ? n.has(l.id) ? "▸" : "▾" : "" }),
            /* @__PURE__ */ e("span", { className: "sf-dot", style: { background: D, width: 8, height: 8, flex: "none" } }),
            /* @__PURE__ */ e("span", { className: "sf-tr-name", title: P(l), children: P(l) }),
            l.kind === "tool" && l.input && /* @__PURE__ */ e("span", { className: "sf-tr-sub", title: l.input, children: l.input }),
            l.kind === "turn" && l.meta.credits != null && /* @__PURE__ */ r("span", { className: "sf-chip", children: [
              l.meta.credits.toFixed(2),
              " cr"
            ] })
          ] }),
          /* @__PURE__ */ r("div", { children: [
            /* @__PURE__ */ e("div", { className: "sf-tr-track", children: /* @__PURE__ */ e("span", { className: "sf-tr-bar", "data-status": l.status, style: { left: `${W}%`, width: `${F}%`, background: D } }) }),
            /* @__PURE__ */ e("span", { className: "sf-tr-dur", children: T((l.end - l.start) * 1e3) })
          ] })
        ] }, l.id);
      })
    ] }),
    c && /* @__PURE__ */ r("div", { className: "sf-tr-detail", children: [
      /* @__PURE__ */ r("div", { className: "sf-row", style: { marginBottom: 6 }, children: [
        /* @__PURE__ */ e("span", { className: "sf-dot", style: { background: X(c), width: 9, height: 9 } }),
        /* @__PURE__ */ e("b", { style: { color: "var(--text-strong)" }, children: P(c) }),
        /* @__PURE__ */ e(j, { tone: c.status === "ok" ? "var(--ok)" : c.status === "running" ? "var(--accent)" : c.status === "warn" ? "var(--warn)" : "var(--danger)", children: c.status }),
        /* @__PURE__ */ r("span", { style: { color: "var(--muted)", fontSize: 12 }, children: [
          c.kind,
          c.meta.tool ? ` · ${c.meta.tool}` : "",
          c.meta.kind ? ` · ${c.meta.kind}` : ""
        ] })
      ] }),
      /* @__PURE__ */ r("div", { className: "sf-tr-kv", children: [
        /* @__PURE__ */ r("span", { children: [
          "start ",
          /* @__PURE__ */ r("b", { children: [
            "+",
            T((c.start - u) * 1e3)
          ] })
        ] }),
        /* @__PURE__ */ r("span", { children: [
          "duration ",
          /* @__PURE__ */ e("b", { children: T((c.end - c.start) * 1e3) })
        ] }),
        c.meta.approval_ms != null && /* @__PURE__ */ r("span", { children: [
          "approval wait ",
          /* @__PURE__ */ e("b", { children: T(c.meta.approval_ms) })
        ] }),
        c.meta.credits != null && c.kind !== "run" && /* @__PURE__ */ r("span", { children: [
          "credits ",
          /* @__PURE__ */ e("b", { children: c.meta.credits.toFixed(3) })
        ] }),
        c.meta.model_calls != null && /* @__PURE__ */ r("span", { children: [
          "model calls ",
          /* @__PURE__ */ e("b", { children: c.meta.model_calls })
        ] }),
        c.meta.context_pct != null && /* @__PURE__ */ r("span", { children: [
          "context used ",
          /* @__PURE__ */ r("b", { children: [
            c.meta.context_pct.toFixed(1),
            "%"
          ] })
        ] }),
        c.meta.model && /* @__PURE__ */ r("span", { children: [
          "model ",
          /* @__PURE__ */ e("b", { children: c.meta.model })
        ] })
      ] }),
      c.input && /* @__PURE__ */ r(A, { children: [
        /* @__PURE__ */ e("div", { className: "sf-label", children: c.kind === "turn" ? "prompt" : "input" }),
        /* @__PURE__ */ e("pre", { className: "sf-pre", children: c.input })
      ] }),
      c.output && /* @__PURE__ */ r(A, { children: [
        /* @__PURE__ */ e("div", { className: "sf-label", children: c.kind === "turn" ? "stop reason" : "output" }),
        /* @__PURE__ */ e("pre", { className: "sf-pre", children: c.output })
      ] }),
      !c.input && !c.output && /* @__PURE__ */ e("div", { className: "sf-empty", style: { padding: 8 }, children: "No input or output recorded for this span." })
    ] })
  ] });
}
function Ce({ run: t, api: a, onClose: n }) {
  var b;
  const [h, p] = y("steps"), [s, v] = y(null), [d, o] = y(null), [u, f] = y(null);
  O(() => {
    let g = !0;
    const k = async () => {
      try {
        if (h === "steps") {
          const c = await a.get(`${q}/runs/${encodeURIComponent(t.id)}/steps`);
          if (!g) return;
          c.error ? f(c.error) : (v(c.steps), f(null));
        } else {
          const c = await a.get(`${q}/runs/${encodeURIComponent(t.id)}/trace`);
          if (!g) return;
          c.error ? f(c.error) : (o(c.found ? c.spans : []), f(null));
        }
      } catch (c) {
        g && f(String(c));
      }
    };
    k();
    const M = t.live ? window.setInterval(k, 4e3) : null;
    return () => {
      g = !1, M && window.clearInterval(M);
    };
  }, [a, t.id, t.live, h]);
  const m = t.session, i = /* @__PURE__ */ e("div", { className: "sf-views", role: "tablist", "aria-label": "Transcript view", children: ["steps", "trace", "json"].map((g) => /* @__PURE__ */ e("button", { role: "tab", "aria-selected": h === g, "data-on": h === g, onClick: () => p(g), children: g === "steps" ? "Steps" : g === "trace" ? "Trace" : "JSON" }, g)) });
  return /* @__PURE__ */ r(
    ne,
    {
      onClose: n,
      wide: h !== "steps",
      actions: i,
      title: /* @__PURE__ */ r("span", { className: "sf-row", children: [
        /* @__PURE__ */ e(re, { size: 16, style: { color: z(t.agent) } }),
        S(t.agent),
        " ",
        /* @__PURE__ */ e("span", { style: { color: "var(--muted)", fontWeight: 400 }, children: t.kind }),
        " ",
        /* @__PURE__ */ e(K, { o: t.outcome, live: t.live })
      ] }),
      sub: /* @__PURE__ */ r("span", { children: [
        (m == null ? void 0 : m.title) ?? "",
        " · ",
        (m == null ? void 0 : m.model) ?? "",
        " ",
        m != null && m.effort ? `(${m.effort})` : "",
        " · ",
        L(t.duration_ms),
        " · ",
        (m == null ? void 0 : m.tool_calls) ?? 0,
        " tool calls · ",
        ((b = m == null ? void 0 : m.credits) == null ? void 0 : b.toFixed(2)) ?? "0",
        " credits",
        m != null && m.issue ? ` · #${m.issue}` : "",
        m != null && m.pr ? ` · PR ${m.pr}` : ""
      ] }),
      children: [
        t.detail && /* @__PURE__ */ r("div", { className: "sf-warnbox", children: [
          /* @__PURE__ */ e(Y, { size: 13, style: { verticalAlign: -2 } }),
          " ",
          t.detail
        ] }),
        u && /* @__PURE__ */ e("div", { className: "sf-empty", children: u }),
        h !== "steps" && !d && !u && /* @__PURE__ */ e("div", { className: "sf-empty", children: "Building trace…" }),
        h !== "steps" && d && d.length === 0 && /* @__PURE__ */ e("div", { className: "sf-empty", children: "Transcript not available on this gateway (the run happened on another machine)." }),
        h === "trace" && d && d.length > 0 && /* @__PURE__ */ e($e, { spans: d, live: t.live }),
        h === "json" && d && d.length > 0 && /* @__PURE__ */ e("pre", { className: "sf-pre", style: { maxHeight: "none" }, children: JSON.stringify(d, null, 2) }),
        h === "steps" && !s && !u && /* @__PURE__ */ e("div", { className: "sf-empty", children: "Loading transcript…" }),
        h === "steps" && s && s.length === 0 && /* @__PURE__ */ e("div", { className: "sf-empty", children: "Transcript not available on this gateway (the run happened on another machine)." }),
        h === "steps" && (s == null ? void 0 : s.map((g, k) => g.kind === "tool" ? /* @__PURE__ */ r("div", { className: "sf-step", children: [
          /* @__PURE__ */ e("span", { className: "sf-dot", style: { marginTop: 5, background: g.ok === !1 ? "var(--danger)" : g.ok ? "var(--ok)" : "var(--muted)" } }),
          /* @__PURE__ */ r("div", { style: { minWidth: 0, flex: 1 }, children: [
            /* @__PURE__ */ r("div", { style: { color: "var(--text-strong)" }, children: [
              g.title,
              " ",
              /* @__PURE__ */ e("span", { style: { color: "var(--muted)", fontSize: 11 }, children: g.tool })
            ] }),
            g.detail && /* @__PURE__ */ e("div", { className: "sf-mono", children: g.detail })
          ] }),
          /* @__PURE__ */ e("span", { style: { color: "var(--muted)", fontSize: 11, whiteSpace: "nowrap" }, children: g.t ? new Date(g.t).toLocaleTimeString() : "" })
        ] }, k) : g.kind === "text" ? /* @__PURE__ */ r("div", { className: "sf-step", children: [
          /* @__PURE__ */ e("span", { className: "sf-dot", style: { marginTop: 5, background: z(t.agent) } }),
          /* @__PURE__ */ e("div", { className: "sf-text", style: { flex: 1 }, children: g.text })
        ] }, k) : /* @__PURE__ */ r("div", { className: "sf-step", style: { color: "var(--muted)" }, children: [
          /* @__PURE__ */ e(he, { size: 14 }),
          " turn ended (",
          g.reason,
          ")"
        ] }, k)))
      ]
    }
  );
}
function ze({ state: t }) {
  const a = Math.max(1, ...t.agents.map((s) => s.avg_duration_ms ?? 0)), n = G(() => {
    var o;
    const s = [], v = /* @__PURE__ */ new Date();
    v.setHours(0, 0, 0, 0);
    for (let u = 13; u >= 0; u--) {
      const f = new Date(v);
      f.setDate(v.getDate() - u), s.push({ day: f.toLocaleDateString([], { weekday: "short" }), completed: 0, failed: 0, credits: 0 });
    }
    const d = v.getTime() / 1e3 - 13 * 86400;
    for (const u of t.runs) {
      if (!u.started_at || u.started_at < d) continue;
      const f = Math.min(13, Math.floor((u.started_at - d) / 86400));
      u.outcome === "completed" ? s[f].completed++ : u.outcome !== "running" && s[f].failed++, s[f].credits += ((o = u.session) == null ? void 0 : o.credits) ?? 0;
    }
    return s;
  }, [t.runs]), h = Math.max(1, ...n.map((s) => s.completed + s.failed)), p = Math.max(1, ...n.map((s) => s.credits));
  return /* @__PURE__ */ r(A, { children: [
    /* @__PURE__ */ e("div", { className: "sf-grid", style: { marginBottom: 16 }, children: t.agents.map((s) => /* @__PURE__ */ r("div", { className: "sf-agent", style: { "--sf-c": z(s.id) }, children: [
      /* @__PURE__ */ r("div", { className: "sf-row", style: { justifyContent: "space-between" }, children: [
        /* @__PURE__ */ r("div", { className: "sf-row", children: [
          /* @__PURE__ */ e(re, { size: 16, style: { color: z(s.id) } }),
          /* @__PURE__ */ e("strong", { style: { color: "var(--text-strong)" }, children: s.label })
        ] }),
        s.live > 0 ? /* @__PURE__ */ r(j, { tone: "var(--accent)", children: [
          /* @__PURE__ */ e("span", { className: "sf-dot sf-pulse", style: { background: "var(--accent)", width: 7, height: 7 } }),
          "running"
        ] }) : s.installed ? /* @__PURE__ */ e(j, { tone: "var(--ok)", children: "template installed" }) : /* @__PURE__ */ e(j, { tone: "var(--danger)", children: "template missing" })
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
          L(s.avg_duration_ms),
          " / ",
          L(s.p90_duration_ms)
        ] }),
        /* @__PURE__ */ e("dt", { children: "Avg credits" }),
        /* @__PURE__ */ e("dd", { children: s.avg_credits ?? "–" }),
        /* @__PURE__ */ e("dt", { children: "Model" }),
        /* @__PURE__ */ e("dd", { className: "sf-mono", children: s.model ?? "–" }),
        /* @__PURE__ */ e("dt", { children: "Last run" }),
        /* @__PURE__ */ r("dd", { children: [
          R(s.last_run_at),
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
      /* @__PURE__ */ r(C, { children: [
        /* @__PURE__ */ e($, { children: "Runs per day (14d)" }),
        /* @__PURE__ */ e("div", { className: "sf-spark", style: { "--sf-c": "var(--accent)" }, children: n.map((s, v) => /* @__PURE__ */ e("i", { title: `${s.day}: ${s.completed} ok, ${s.failed} failed`, style: { height: `${Math.round(100 * (s.completed + s.failed) / h)}%`, background: s.failed ? `linear-gradient(to top, var(--danger) ${Math.round(100 * s.failed / Math.max(1, s.completed + s.failed))}%, var(--accent) 0)` : void 0 } }, v)) }),
        /* @__PURE__ */ r("div", { className: "sf-meta", style: { justifyContent: "space-between" }, children: [
          /* @__PURE__ */ e("span", { children: n[0].day }),
          /* @__PURE__ */ e("span", { children: "today" })
        ] })
      ] }),
      /* @__PURE__ */ r(C, { children: [
        /* @__PURE__ */ e($, { children: "Credits per day (14d)" }),
        /* @__PURE__ */ e("div", { className: "sf-spark", style: { "--sf-c": "var(--warn)" }, children: n.map((s, v) => /* @__PURE__ */ e("i", { title: `${s.day}: ${s.credits.toFixed(1)} credits`, style: { height: `${Math.round(100 * s.credits / p)}%` } }, v)) }),
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
  const h = Math.max(a, 1e-4);
  return /* @__PURE__ */ e(
    "div",
    {
      style: { display: "flex", height: n, borderRadius: n / 2, overflow: "hidden", background: "var(--bg-elevated)", width: "100%" },
      title: Object.entries(t).map(([p, s]) => `${S(p)} ${s.toFixed(2)}`).join(" · "),
      children: se.filter((p) => t[p]).map((p) => /* @__PURE__ */ e("span", { style: { width: `${100 * t[p] / h}%`, background: z(p) } }, p))
    }
  );
}
function Me({ costs: t, onOpen: a }) {
  var u, f, m;
  const n = t.totals, h = Math.max(1e-4, ...t.per_day.map((i) => i.credits)), p = Math.max(1e-4, ...t.per_issue.map((i) => i.credits)), [s, v] = y(!1), d = s ? t.per_issue : t.per_issue.slice(0, 10), o = t.per_agent.reduce((i, b) => i + b.credits, 0);
  return /* @__PURE__ */ r("div", { children: [
    /* @__PURE__ */ r("div", { className: "sf-stats", children: [
      /* @__PURE__ */ e(w, { label: "Credits, all runs", value: _(n.credits_total), accent: !0 }),
      /* @__PURE__ */ e(w, { label: "Credits, 7 days", value: _(n.credits_week) }),
      /* @__PURE__ */ e(w, { label: "Per hop (avg)", value: _(n.avg_per_hop, 2) }),
      /* @__PURE__ */ e(w, { label: "Per issue (avg)", value: _(n.avg_per_issue) }),
      /* @__PURE__ */ e(w, { label: "Per delivered issue (median)", value: _(n.median_per_delivered_issue) }),
      /* @__PURE__ */ e(w, { label: "Per shipped issue (avg)", value: _(n.avg_per_shipped_issue) })
    ] }),
    !t.tokens_recorded && /* @__PURE__ */ r("div", { className: "sf-legend", children: [
      /* @__PURE__ */ e("span", { className: "sf-legend-h", children: "Unit" }),
      /* @__PURE__ */ e("span", { children: "Credits are what kiro-cli records for a webhook run; token counts are not written on this surface. Model calls and context size stand in for them." })
    ] }),
    /* @__PURE__ */ r("div", { className: "sf-grid", style: { marginBottom: 16, gridTemplateColumns: "minmax(0,2fr) minmax(0,1fr)" }, children: [
      /* @__PURE__ */ r(C, { children: [
        /* @__PURE__ */ e($, { children: "Credits per day, last 14 days" }),
        /* @__PURE__ */ e("div", { className: "sf-spark", style: { height: 120, marginTop: 10 }, children: t.per_day.map((i) => /* @__PURE__ */ r(
          "div",
          {
            title: `${i.day}: ${i.credits.toFixed(1)} credits, ${i.runs} runs
${Object.entries(i.by_agent).map(([b, g]) => `${S(b)} ${g.toFixed(1)}`).join(", ")}`,
            style: { flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", height: "100%", borderRadius: "2px 2px 0 0", overflow: "hidden" },
            children: [
              se.filter((b) => i.by_agent[b]).map((b) => /* @__PURE__ */ e("span", { style: { height: `${Math.round(100 * i.by_agent[b] / h)}%`, background: z(b), display: "block" } }, b)),
              i.credits === 0 && /* @__PURE__ */ e("span", { style: { height: 2, background: "var(--border)", display: "block" } })
            ]
          },
          i.day
        )) }),
        /* @__PURE__ */ r("div", { style: { display: "flex", justifyContent: "space-between", fontSize: 10.5, color: "var(--muted)", marginTop: 4 }, children: [
          /* @__PURE__ */ e("span", { children: (u = t.per_day[0]) == null ? void 0 : u.day.slice(5) }),
          /* @__PURE__ */ e("span", { children: (f = t.per_day[Math.floor(t.per_day.length / 2)]) == null ? void 0 : f.day.slice(5) }),
          /* @__PURE__ */ e("span", { children: (m = t.per_day[t.per_day.length - 1]) == null ? void 0 : m.day.slice(5) })
        ] })
      ] }),
      /* @__PURE__ */ r(C, { children: [
        /* @__PURE__ */ e($, { children: "By agent" }),
        /* @__PURE__ */ e(Q, { parts: Object.fromEntries(t.per_agent.map((i) => [i.agent, i.credits])), total: o, height: 10 }),
        /* @__PURE__ */ r("table", { className: "sf-table", style: { marginTop: 10 }, children: [
          /* @__PURE__ */ e("thead", { children: /* @__PURE__ */ r("tr", { children: [
            /* @__PURE__ */ e("th", { children: "Agent" }),
            /* @__PURE__ */ e("th", { children: "Runs" }),
            /* @__PURE__ */ e("th", { children: "Credits" }),
            /* @__PURE__ */ e("th", { children: "Avg" }),
            /* @__PURE__ */ e("th", { children: "Cr/min" })
          ] }) }),
          /* @__PURE__ */ e("tbody", { children: t.per_agent.map((i) => /* @__PURE__ */ r("tr", { children: [
            /* @__PURE__ */ e("td", { children: /* @__PURE__ */ r("span", { className: "sf-row", children: [
              /* @__PURE__ */ e("span", { className: "sf-dot", style: { background: z(i.agent) } }),
              S(i.agent)
            ] }) }),
            /* @__PURE__ */ e("td", { children: i.runs }),
            /* @__PURE__ */ r("td", { children: [
              _(i.credits),
              " ",
              /* @__PURE__ */ r("span", { style: { color: "var(--muted)", fontSize: 11 }, children: [
                o ? Math.round(100 * i.credits / o) : 0,
                "%"
              ] })
            ] }),
            /* @__PURE__ */ e("td", { children: _(i.avg_credits, 2) }),
            /* @__PURE__ */ e("td", { children: _(i.credits_per_minute, 2) })
          ] }, i.agent)) })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ r(C, { children: [
      /* @__PURE__ */ r("div", { className: "sf-row", style: { justifyContent: "space-between" }, children: [
        /* @__PURE__ */ e($, { children: "Most expensive issues" }),
        t.per_issue.length > 10 && /* @__PURE__ */ e("button", { className: "sf-btn", onClick: () => v((i) => !i), children: s ? "Top 10" : `All ${t.per_issue.length}` })
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
          d.map((i) => /* @__PURE__ */ r("tr", { style: { cursor: "pointer" }, onClick: () => a(i.issue), children: [
            /* @__PURE__ */ r("td", { children: [
              /* @__PURE__ */ r("span", { className: "sf-mono", style: { color: "var(--muted)" }, children: [
                "#",
                i.issue
              ] }),
              " ",
              i.title.length > 48 ? i.title.slice(0, 48) + "…" : i.title
            ] }),
            /* @__PURE__ */ e("td", { children: /* @__PURE__ */ r("div", { className: "sf-row", children: [
              /* @__PURE__ */ e("div", { className: "sf-bar", style: { flex: 1, marginTop: 0 }, children: /* @__PURE__ */ e("i", { style: { width: `${Math.round(100 * i.credits / p)}%`, background: "var(--accent)" } }) }),
              /* @__PURE__ */ e("b", { style: { minWidth: 44, textAlign: "right" }, children: _(i.credits) })
            ] }) }),
            /* @__PURE__ */ e("td", { children: i.hops }),
            /* @__PURE__ */ e("td", { children: i.rounds }),
            /* @__PURE__ */ e("td", { children: /* @__PURE__ */ e(j, { tone: J[i.stage] ?? "var(--muted)", children: i.stage }) }),
            /* @__PURE__ */ e("td", { style: { minWidth: 140 }, children: /* @__PURE__ */ e(Q, { parts: i.by_agent, total: i.credits }) })
          ] }, i.issue)),
          d.length === 0 && /* @__PURE__ */ e("tr", { children: /* @__PURE__ */ e("td", { colSpan: 6, className: "sf-empty", children: "No issue on this board has an agent run recorded on this gateway." }) })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ r(C, { children: [
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
        /* @__PURE__ */ e("tbody", { children: t.per_model.map((i) => /* @__PURE__ */ r("tr", { children: [
          /* @__PURE__ */ e("td", { className: "sf-mono", children: i.model }),
          /* @__PURE__ */ e("td", { children: i.runs }),
          /* @__PURE__ */ e("td", { children: _(i.credits) }),
          /* @__PURE__ */ e("td", { children: _(i.avg_credits, 2) }),
          /* @__PURE__ */ e("td", { children: Se(i.model_calls) }),
          /* @__PURE__ */ e("td", { children: i.avg_context_chars != null ? `${Math.round(i.avg_context_chars / 1e3)}k chars` : "–" })
        ] }, i.model)) })
      ] }),
      t.per_model.length === 1 && t.per_model[0].model === "auto" && /* @__PURE__ */ r("div", { style: { fontSize: 12, color: "var(--muted)", marginTop: 8 }, children: [
        "Every template runs on ",
        /* @__PURE__ */ e("code", { children: "auto" }),
        ", so there is one row. Pin a model in a template (doc 08) and it appears here on its own."
      ] })
    ] })
  ] });
}
function B({ ok: t, unknown: a }) {
  return /* @__PURE__ */ e("span", { className: "sf-dot", style: { background: a ? "var(--muted)" : t ? "var(--ok)" : "var(--danger)", width: 10, height: 10 } });
}
function Te({ infra: t }) {
  return /* @__PURE__ */ r("div", { className: "sf-grid", children: [
    /* @__PURE__ */ r(C, { children: [
      /* @__PURE__ */ e($, { children: "Health" }),
      /* @__PURE__ */ r("dl", { className: "sf-kv", style: { gridTemplateColumns: "auto 1fr" }, children: [
        /* @__PURE__ */ e("dt", { children: /* @__PURE__ */ e(B, { ok: t.runner_ok }) }),
        /* @__PURE__ */ r("dd", { children: [
          "Actions runner ",
          t.runner_ok ? "online" : "offline",
          t.runners.map((a) => ` · ${a.name}${a.busy ? " (busy)" : ""}`)
        ] }),
        /* @__PURE__ */ e("dt", { children: /* @__PURE__ */ e(B, { ok: !!t.webhooks_enabled, unknown: t.webhooks_enabled == null }) }),
        /* @__PURE__ */ r("dd", { children: [
          "Inbound webhooks ",
          t.webhooks_enabled == null ? "unknown (switch not readable here)" : t.webhooks_enabled ? "enabled" : "DISABLED"
        ] }),
        /* @__PURE__ */ e("dt", { children: /* @__PURE__ */ e(B, { ok: t.templates_ok }) }),
        /* @__PURE__ */ r("dd", { children: [
          "Agent templates ",
          Object.values(t.templates).filter(Boolean).length,
          "/",
          Object.keys(t.templates).length,
          " installed on this gateway"
        ] }),
        /* @__PURE__ */ e("dt", { children: /* @__PURE__ */ e(B, { ok: t.workflow_failures_recent === 0 }) }),
        /* @__PURE__ */ r("dd", { children: [
          t.workflow_failures_recent,
          " failed workflow runs in the last 30 · last event ",
          R(t.workflow_last_at)
        ] }),
        /* @__PURE__ */ e("dt", { children: /* @__PURE__ */ e(me, { size: 12 }) }),
        /* @__PURE__ */ r("dd", { children: [
          "Gateway host ",
          /* @__PURE__ */ e("span", { className: "sf-mono", children: t.gateway_host })
        ] })
      ] }),
      t.errors.length > 0 && /* @__PURE__ */ e("div", { className: "sf-warnbox", style: { marginTop: 12 }, children: t.errors.map((a, n) => /* @__PURE__ */ e("div", { children: a }, n)) })
    ] }),
    /* @__PURE__ */ r(C, { children: [
      /* @__PURE__ */ e($, { children: "Webhook sources" }),
      !t.sources_readable && /* @__PURE__ */ e("div", { className: "sf-empty", children: "Source list not readable from the backend on this host. Check Settings → Webhooks." }),
      t.sources.map((a) => /* @__PURE__ */ r("div", { className: "sf-row", style: { padding: "6px 0", borderBottom: "1px solid var(--border)", fontSize: 12.5 }, children: [
        /* @__PURE__ */ e(B, { ok: a.enabled }),
        /* @__PURE__ */ e("span", { style: { flex: 1 }, children: a.label || a.id }),
        /* @__PURE__ */ e("span", { className: "sf-mono", style: { color: "var(--muted)" }, children: a.agent }),
        a.signed && /* @__PURE__ */ e("span", { className: "sf-chip", children: "signed" }),
        /* @__PURE__ */ e("span", { style: { color: "var(--muted)" }, children: R(a.last_used_at) })
      ] }, a.id))
    ] }),
    /* @__PURE__ */ r(C, { children: [
      /* @__PURE__ */ e($, { children: "Templates" }),
      Object.entries(t.templates).map(([a, n]) => /* @__PURE__ */ r("div", { className: "sf-row", style: { padding: "6px 0", borderBottom: "1px solid var(--border)", fontSize: 12.5 }, children: [
        /* @__PURE__ */ e(B, { ok: n }),
        /* @__PURE__ */ r("span", { className: "sf-mono", children: [
          a,
          ".json"
        ] }),
        /* @__PURE__ */ e("span", { style: { marginLeft: "auto", color: "var(--muted)" }, children: n ? "~/.kiro/agents" : "run scripts/install-agent.sh" })
      ] }, a))
    ] }),
    /* @__PURE__ */ r(C, { children: [
      /* @__PURE__ */ e($, { children: "Recent workflow runs" }),
      t.workflow_recent.map((a) => /* @__PURE__ */ r("div", { className: "sf-row", style: { padding: "6px 0", borderBottom: "1px solid var(--border)", fontSize: 12.5 }, children: [
        /* @__PURE__ */ e(B, { ok: a.conclusion === "success", unknown: !a.conclusion }),
        /* @__PURE__ */ e("a", { className: "sf-link", href: a.url, target: "_blank", rel: "noreferrer", style: { flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, children: a.title || a.name }),
        /* @__PURE__ */ e("span", { className: "sf-mono", style: { color: "var(--muted)" }, children: a.event }),
        /* @__PURE__ */ e("span", { style: { color: "var(--muted)" }, children: R(a.created_at) })
      ] }, a.id))
    ] })
  ] });
}
function Be() {
  const { state: t, error: a, loading: n, reload: h, api: p, showAll: s, setShowAll: v } = xe(), [d, o] = y(null), u = (l) => {
    if (t != null && t.board.some((x) => x.issue === l)) {
      b(l);
      return;
    }
    o(l), v(!0);
  };
  O(() => {
    d != null && (t != null && t.board.some((l) => l.issue === d)) && (b(d), o(null));
  }, [d, t]);
  const [f, m] = y("board"), [i, b] = y(null), [g, k] = y(null), M = (t == null ? void 0 : t.board.find((l) => l.issue === i)) ?? null, c = g ? (t == null ? void 0 : t.runs.find((l) => l.id === g.id || l.session_key && l.session_key === g.session_key)) ?? g : null;
  return /* @__PURE__ */ r("div", { className: "sf-root", children: [
    /* @__PURE__ */ e("style", { children: be }),
    /* @__PURE__ */ e(
      de,
      {
        title: "Software Factory",
        subtitle: t ? `${t.repo} · ${t.stats.live_runs > 0 ? `${t.stats.live_runs} agent${t.stats.live_runs > 1 ? "s" : ""} running` : "idle"} · refreshed ${R(t.generated_at)}` : "Issue to merged PR, observed end to end"
      }
    ),
    /* @__PURE__ */ r("div", { className: "sf-body", children: [
      a && /* @__PURE__ */ r("div", { className: "sf-warnbox", children: [
        /* @__PURE__ */ e(Y, { size: 13, style: { verticalAlign: -2 } }),
        " ",
        a
      ] }),
      n && !t && /* @__PURE__ */ e("div", { className: "sf-empty", children: "Reading GitHub and the gateway…" }),
      t && /* @__PURE__ */ r(A, { children: [
        /* @__PURE__ */ r("div", { className: "sf-stats", children: [
          /* @__PURE__ */ e(w, { label: "In flight", value: String(t.stats.in_flight), accent: !0 }),
          /* @__PURE__ */ e(w, { label: "Ready to merge", value: String(t.stats.ready) }),
          /* @__PURE__ */ e(w, { label: "Parked", value: String(t.stats.parked) }),
          /* @__PURE__ */ e(w, { label: "Shipped", value: String(t.stats.shipped) }),
          /* @__PURE__ */ e(w, { label: "Median issue → ready", value: t.stats.median_cycle_s != null ? L(t.stats.median_cycle_s * 1e3) : "–" }),
          /* @__PURE__ */ e(w, { label: "Pass rate", value: t.stats.pass_rate != null ? `${t.stats.pass_rate}%` : "–" }),
          /* @__PURE__ */ e(w, { label: "Agent runs (7d)", value: `${t.stats.runs_week}` }),
          /* @__PURE__ */ e(w, { label: "Credits (7d)", value: t.stats.credits_week.toFixed(1) })
        ] }),
        /* @__PURE__ */ r("div", { className: "sf-row", style: { justifyContent: "space-between", flexWrap: "wrap" }, children: [
          /* @__PURE__ */ e(ye, { value: f, onChange: m, items: [["board", "Board"], ["runs", "Agent runs"], ["agents", "Agents"], ["costs", "Costs"], ["infra", "Infrastructure"]] }),
          /* @__PURE__ */ r("div", { className: "sf-row", style: { marginBottom: 16 }, children: [
            /* @__PURE__ */ e("span", { className: "sf-row", style: { fontSize: 12, color: "var(--muted)" }, children: t.stats.live_runs > 0 ? /* @__PURE__ */ r(A, { children: [
              /* @__PURE__ */ e(oe, { size: 13, className: "sf-pulse", style: { color: "var(--accent)" } }),
              " live"
            ] }) : /* @__PURE__ */ r(A, { children: [
              /* @__PURE__ */ e(ce, { size: 13 }),
              " polling"
            ] }) }),
            /* @__PURE__ */ r("button", { className: "sf-btn", onClick: h, children: [
              /* @__PURE__ */ e(pe, { size: 13 }),
              " Refresh"
            ] })
          ] })
        ] }),
        f === "board" && /* @__PURE__ */ e(ke, { state: t, onOpen: (l) => b(l.issue), showAll: s, onToggleAll: v }),
        f === "runs" && /* @__PURE__ */ e(_e, { runs: t.runs, onWatch: k }),
        f === "agents" && /* @__PURE__ */ e(ze, { state: t }),
        f === "costs" && /* @__PURE__ */ e(Me, { costs: t.costs, onOpen: u }),
        f === "infra" && /* @__PURE__ */ e(Te, { infra: t.infra })
      ] })
    ] }),
    M && !g && /* @__PURE__ */ e(Ne, { it: M, runs: t.runs, onClose: () => b(null), onWatch: k }),
    c && /* @__PURE__ */ e(Ce, { run: c, api: p, onClose: () => k(null) })
  ] });
}
export {
  Be as default
};
