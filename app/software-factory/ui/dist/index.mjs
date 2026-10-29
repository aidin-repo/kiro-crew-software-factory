import { jsxs as r, jsx as e, Fragment as $ } from "react/jsx-runtime";
import { useAppApi as re } from "@kirocrew/app-sdk";
import { PageHeader as ae, StatCard as N, CardTitle as T, Card as A } from "@kirocrew/app-sdk/ui";
import { AlertTriangle as J, Activity as se, CircleDot as ne, RefreshCw as oe, Zap as K, Eye as X, ExternalLink as P, CheckCircle2 as ie, Bot as Q, Server as le, Clock as de, GitPullRequest as ce, X as pe } from "lucide-react";
import { useState as w, useRef as he, useCallback as me, useEffect as q, useMemo as O } from "react";
const H = "/apps/software-factory/api", F = (t) => {
  if (t == null) return "–";
  const a = Math.round(t / 1e3);
  if (a < 60) return `${a}s`;
  const s = Math.floor(a / 60);
  return s < 60 ? `${s}m ${a % 60}s` : `${Math.floor(s / 60)}h ${s % 60}m`;
}, z = (t) => {
  if (!t) return "–";
  const a = Math.max(0, Date.now() / 1e3 - t);
  return a < 60 ? `${Math.round(a)}s ago` : a < 3600 ? `${Math.round(a / 60)}m ago` : a < 86400 ? `${Math.round(a / 3600)}h ago` : `${Math.round(a / 86400)}d ago`;
}, G = (t) => t ? new Date(t * 1e3).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "–", B = (t) => t.replace("delivery-", "").replace("github-", ""), fe = {
  "delivery-planner": "var(--info)",
  "delivery-implementer": "var(--accent)",
  "delivery-reviewer": "var(--warn)",
  "delivery-scribe": "var(--ok)",
  "github-worker": "var(--muted-strong)",
  "pr-gate": "var(--text)"
}, L = (t) => fe[t] ?? "var(--muted)", Y = {
  planning: "var(--info)",
  "needs-owner": "var(--warn)",
  implementing: "var(--accent)",
  review: "var(--warn)",
  fixing: "var(--warn)",
  gate: "var(--muted-strong)",
  ready: "var(--ok)",
  parked: "var(--danger)",
  shipped: "var(--ok)"
}, Z = (t) => t === "completed" ? "var(--ok)" : t === "running" ? "var(--accent)" : "var(--danger)", ue = `
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
function ge() {
  const t = re(), [a, s] = w(null), [p, h] = w(null), [n, f] = w(!0), [i, d] = w(!1), m = he(null), u = me(async (c = !1) => {
    try {
      const x = [c ? "refresh=1" : "", i ? "limit=0" : ""].filter(Boolean).join("&"), k = await t.get(`${H}/state${x ? `?${x}` : ""}`);
      s(k), h(null);
    } catch (x) {
      h(x instanceof Error ? x.message : String(x));
    } finally {
      f(!1);
    }
  }, [t, i]);
  return q(() => {
    u();
    const c = () => {
      const x = ((a == null ? void 0 : a.stats.live_runs) ?? 0) > 0;
      m.current = window.setTimeout(async () => {
        await u(), c();
      }, x ? 5e3 : 15e3);
    };
    return c(), () => {
      m.current && window.clearTimeout(m.current);
    };
  }, [u]), { state: a, error: p, loading: n, reload: () => u(!0), api: t, showAll: i, setShowAll: d };
}
function R({ tone: t, children: a }) {
  return /* @__PURE__ */ e("span", { className: "sf-pill", style: { background: `color-mix(in srgb, ${t} 16%, transparent)`, color: t }, children: a });
}
function U({ o: t, live: a }) {
  const s = Z(t);
  return /* @__PURE__ */ r(R, { tone: s, children: [
    /* @__PURE__ */ e("span", { className: `sf-dot ${a ? "sf-pulse" : ""}`, style: { background: s, width: 7, height: 7 } }),
    t
  ] });
}
function ve({ value: t, onChange: a, items: s }) {
  return /* @__PURE__ */ e("div", { className: "sf-tabs", role: "tablist", children: s.map(([p, h]) => /* @__PURE__ */ e("button", { role: "tab", "aria-selected": t === p, "data-on": t === p, className: "sf-tab", onClick: () => a(p), children: h }, p)) });
}
function ee({ title: t, sub: a, onClose: s, children: p, wide: h, actions: n }) {
  return q(() => {
    const f = (i) => {
      i.key === "Escape" && s();
    };
    return window.addEventListener("keydown", f), () => window.removeEventListener("keydown", f);
  }, [s]), /* @__PURE__ */ r($, { children: [
    /* @__PURE__ */ e("div", { className: "sf-scrim", onClick: s }),
    /* @__PURE__ */ r("aside", { className: "sf-drawer", "data-wide": !!h, role: "dialog", "aria-modal": "true", children: [
      /* @__PURE__ */ r("div", { className: "sf-dhead", children: [
        /* @__PURE__ */ r("div", { style: { minWidth: 0, flex: 1 }, children: [
          /* @__PURE__ */ e("div", { style: { fontWeight: 600, fontSize: 15, color: "var(--text-strong)" }, children: t }),
          a && /* @__PURE__ */ e("div", { style: { fontSize: 12, color: "var(--muted)", marginTop: 3 }, children: a })
        ] }),
        n,
        /* @__PURE__ */ e("button", { className: "sf-x", onClick: s, "aria-label": "Close", style: { marginLeft: 4 }, children: /* @__PURE__ */ e(pe, { size: 16 }) })
      ] }),
      /* @__PURE__ */ e("div", { className: "sf-dbody", children: p })
    ] })
  ] });
}
function xe({ it: t, onOpen: a }) {
  var p;
  const s = !!t.live_agent;
  return /* @__PURE__ */ r("div", { className: "sf-card", "data-live": s, onClick: a, role: "button", tabIndex: 0, onKeyDown: (h) => h.key === "Enter" && a(), children: [
    /* @__PURE__ */ r("div", { className: "sf-row", style: { justifyContent: "space-between", marginBottom: 4 }, children: [
      /* @__PURE__ */ r("span", { className: "sf-mono", style: { color: "var(--muted)" }, children: [
        "#",
        t.issue
      ] }),
      s && /* @__PURE__ */ r(R, { tone: "var(--accent)", children: [
        /* @__PURE__ */ e("span", { className: "sf-dot sf-pulse", style: { background: "var(--accent)", width: 7, height: 7 } }),
        B(t.live_agent)
      ] }),
      !s && ((p = t.pr) == null ? void 0 : p.checks) && /* @__PURE__ */ e("span", { className: "sf-dot", title: `CI ${t.pr.checks}`, style: { background: t.pr.checks === "passing" ? "var(--ok)" : t.pr.checks === "failing" ? "var(--danger)" : "var(--warn)" } })
    ] }),
    /* @__PURE__ */ e("div", { className: "sf-cardtitle", children: t.title }),
    /* @__PURE__ */ r("div", { className: "sf-meta", children: [
      /* @__PURE__ */ r("span", { title: "Last activity", children: [
        /* @__PURE__ */ e(de, { size: 11, style: { verticalAlign: -1 } }),
        " ",
        z(t.last_activity ?? t.stage_since)
      ] }),
      t.pr && /* @__PURE__ */ r("span", { children: [
        /* @__PURE__ */ e(ce, { size: 11, style: { verticalAlign: -1 } }),
        " PR ",
        t.pr.number
      ] }),
      t.rounds > 1 && /* @__PURE__ */ r("span", { children: [
        t.rounds,
        " rounds"
      ] }),
      t.credits > 0 && /* @__PURE__ */ r("span", { children: [
        /* @__PURE__ */ e(K, { size: 11, style: { verticalAlign: -1 } }),
        " ",
        t.credits.toFixed(1)
      ] })
    ] }),
    t.hops.length > 0 && /* @__PURE__ */ e("div", { className: "sf-hops", title: t.hops.map((h) => `${B(h.agent)} ${h.outcome} ${F(h.duration_ms)}`).join(`
`), children: t.hops.map((h) => /* @__PURE__ */ e("span", { className: `sf-hop ${h.live ? "sf-pulse" : ""}`, style: { background: L(h.agent), opacity: h.outcome === "completed" || h.live ? 0.9 : 0.35 } }, h.id)) })
  ] });
}
function be({ state: t, onOpen: a, showAll: s, onToggleAll: p }) {
  const h = /* @__PURE__ */ new Set(["planning", "needs-owner", "implementing", "review", "ready"]), n = t.stages.filter((i) => h.has(i.id) || t.board.some((d) => d.stage === i.id)), f = t.board_total - t.board.length;
  return /* @__PURE__ */ r($, { children: [
    /* @__PURE__ */ r("div", { className: "sf-row", style: { justifyContent: "space-between", marginBottom: 10, fontSize: 12, color: "var(--muted)" }, children: [
      /* @__PURE__ */ r("span", { children: [
        s ? `All ${t.board_total} items` : `${t.board.length} most recently active${f > 0 ? ` · ${f} older hidden` : ""}`,
        ", newest first in each column"
      ] }),
      /* @__PURE__ */ r("div", { className: "sf-views", role: "tablist", "aria-label": "Board scope", children: [
        /* @__PURE__ */ r("button", { role: "tab", "aria-selected": !s, "data-on": !s, onClick: () => p(!1), children: [
          "Recent ",
          t.board_limit || 20
        ] }),
        /* @__PURE__ */ e("button", { role: "tab", "aria-selected": s, "data-on": s, onClick: () => p(!0), children: "All" })
      ] })
    ] }),
    /* @__PURE__ */ e("div", { className: "sf-board", children: n.map((i) => {
      const d = t.board.filter((m) => m.stage === i.id);
      return /* @__PURE__ */ r("div", { className: "sf-col", children: [
        /* @__PURE__ */ r("div", { className: "sf-colhead", children: [
          /* @__PURE__ */ r("span", { className: "sf-row", children: [
            /* @__PURE__ */ e("span", { className: "sf-dot", style: { background: Y[i.id] } }),
            i.label
          ] }),
          /* @__PURE__ */ e("span", { className: "sf-count", children: d.length })
        ] }),
        d.map((m) => /* @__PURE__ */ e(xe, { it: m, onOpen: () => a(m) }, m.issue)),
        d.length === 0 && /* @__PURE__ */ e("div", { className: "sf-empty", style: { padding: 10 }, children: "empty" })
      ] }, i.id);
    }) })
  ] });
}
function we({ it: t, runs: a, onClose: s, onWatch: p }) {
  var n, f;
  const h = t.hops.map((i) => ({ hop: i, run: a.find((d) => d.id === i.id) }));
  return /* @__PURE__ */ r(ee, { onClose: s, title: /* @__PURE__ */ r("span", { children: [
    "#",
    t.issue,
    " ",
    t.title
  ] }), sub: /* @__PURE__ */ r("span", { className: "sf-row", children: [
    /* @__PURE__ */ e(R, { tone: Y[t.stage], children: t.stage }),
    /* @__PURE__ */ r("a", { className: "sf-link", href: t.url, target: "_blank", rel: "noreferrer", children: [
      "issue ",
      /* @__PURE__ */ e(P, { size: 11 })
    ] }),
    t.pr && /* @__PURE__ */ r("a", { className: "sf-link", href: t.pr.url, target: "_blank", rel: "noreferrer", children: [
      "PR ",
      t.pr.number,
      " ",
      /* @__PURE__ */ e(P, { size: 11 })
    ] }),
    t.docs_pr && /* @__PURE__ */ r("a", { className: "sf-link", href: t.docs_pr.url, target: "_blank", rel: "noreferrer", children: [
      "docs PR ",
      t.docs_pr.number,
      " ",
      /* @__PURE__ */ e(P, { size: 11 })
    ] })
  ] }), children: [
    /* @__PURE__ */ r("dl", { className: "sf-kv", style: { marginTop: 0, marginBottom: 16 }, children: [
      /* @__PURE__ */ e("dt", { children: "Opened" }),
      /* @__PURE__ */ e("dd", { children: G(t.created_at) }),
      /* @__PURE__ */ e("dt", { children: "In stage since" }),
      /* @__PURE__ */ e("dd", { children: z(t.stage_since) }),
      /* @__PURE__ */ e("dt", { children: "Review rounds" }),
      /* @__PURE__ */ e("dd", { children: t.rounds }),
      /* @__PURE__ */ e("dt", { children: "Credits" }),
      /* @__PURE__ */ e("dd", { children: t.credits.toFixed(2) }),
      /* @__PURE__ */ e("dt", { children: "CI" }),
      /* @__PURE__ */ e("dd", { children: ((n = t.pr) == null ? void 0 : n.checks) ?? "–" }),
      /* @__PURE__ */ e("dt", { children: "Labels" }),
      /* @__PURE__ */ e("dd", { style: { display: "flex", flexWrap: "wrap", gap: 4 }, children: [...t.labels, ...((f = t.pr) == null ? void 0 : f.labels) ?? []].filter((i) => i.startsWith("kiro-")).map((i) => /* @__PURE__ */ e("span", { className: "sf-chip", children: i }, i)) })
    ] }),
    /* @__PURE__ */ e(T, { children: "Hops" }),
    h.length === 0 && /* @__PURE__ */ e("div", { className: "sf-empty", children: "No agent run is linked to this issue on this gateway yet." }),
    /* @__PURE__ */ e("div", { className: "sf-tl", children: h.map(({ hop: i, run: d }) => {
      var m, u, c;
      return /* @__PURE__ */ r("div", { className: "sf-tli", children: [
        /* @__PURE__ */ e("span", { className: `sf-dot ${i.live ? "sf-pulse" : ""}`, style: { background: L(i.agent) } }),
        /* @__PURE__ */ r("div", { className: "sf-row", style: { justifyContent: "space-between" }, children: [
          /* @__PURE__ */ r("div", { children: [
            /* @__PURE__ */ e("strong", { style: { color: "var(--text-strong)", fontSize: 13 }, children: B(i.agent) }),
            /* @__PURE__ */ e("span", { style: { color: "var(--muted)", fontSize: 12, marginLeft: 8 }, children: i.kind })
          ] }),
          /* @__PURE__ */ e(U, { o: i.outcome, live: i.live })
        ] }),
        /* @__PURE__ */ r("div", { className: "sf-meta", children: [
          /* @__PURE__ */ e("span", { children: G(i.started_at) }),
          /* @__PURE__ */ e("span", { children: F(i.duration_ms) }),
          i.credits != null && /* @__PURE__ */ r("span", { children: [
            /* @__PURE__ */ e(K, { size: 11, style: { verticalAlign: -1 } }),
            " ",
            i.credits.toFixed(2)
          ] }),
          ((m = d == null ? void 0 : d.session) == null ? void 0 : m.model) && /* @__PURE__ */ e("span", { children: d.session.model }),
          ((u = d == null ? void 0 : d.session) == null ? void 0 : u.tool_calls) != null && /* @__PURE__ */ r("span", { children: [
            d.session.tool_calls,
            " tool calls"
          ] }),
          (d == null ? void 0 : d.session_key) && /* @__PURE__ */ r("button", { className: "sf-btn", style: { padding: "2px 8px" }, onClick: () => p(d), children: [
            /* @__PURE__ */ e(X, { size: 12 }),
            " ",
            i.live ? "watch live" : "steps"
          ] })
        ] }),
        ((c = d == null ? void 0 : d.session) == null ? void 0 : c.last_text) && /* @__PURE__ */ e("div", { className: "sf-text", style: { marginTop: 8, maxHeight: 90, overflow: "hidden" }, children: d.session.last_text })
      ] }, i.id);
    }) })
  ] });
}
function ye({ runs: t, onWatch: a }) {
  return /* @__PURE__ */ r(A, { children: [
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
      /* @__PURE__ */ e("tbody", { children: t.map((s) => {
        var p, h, n, f, i, d;
        return /* @__PURE__ */ r("tr", { children: [
          /* @__PURE__ */ e("td", { title: G(s.started_at), children: z(s.started_at) }),
          /* @__PURE__ */ e("td", { children: /* @__PURE__ */ r("span", { className: "sf-row", children: [
            /* @__PURE__ */ e("span", { className: "sf-dot", style: { background: L(s.agent) } }),
            B(s.agent)
          ] }) }),
          /* @__PURE__ */ e("td", { className: "sf-mono", children: s.kind }),
          /* @__PURE__ */ r("td", { children: [
            (p = s.session) != null && p.issue ? `#${s.session.issue}` : "",
            (h = s.session) != null && h.pr ? ` PR ${s.session.pr}` : ""
          ] }),
          /* @__PURE__ */ e("td", { children: /* @__PURE__ */ e(U, { o: s.outcome, live: s.live }) }),
          /* @__PURE__ */ e("td", { children: F(s.duration_ms) }),
          /* @__PURE__ */ e("td", { className: "sf-mono", children: ((n = s.session) == null ? void 0 : n.model) ?? "–" }),
          /* @__PURE__ */ e("td", { children: ((f = s.session) == null ? void 0 : f.tool_calls) ?? "–" }),
          /* @__PURE__ */ e("td", { children: (i = s.session) != null && i.credits ? s.session.credits.toFixed(2) : "–" }),
          /* @__PURE__ */ e("td", { children: s.session_key && ((d = s.session) == null ? void 0 : d.found) && /* @__PURE__ */ r("button", { className: "sf-btn", onClick: () => a(s), children: [
            /* @__PURE__ */ e(X, { size: 12 }),
            " ",
            s.live ? "watch" : "steps"
          ] }) })
        ] }, s.id);
      }) })
    ] }),
    t.length === 0 && /* @__PURE__ */ e("div", { className: "sf-empty", children: "No webhook runs recorded for this repository on this gateway." })
  ] });
}
const _ = (t) => t < 1e3 ? `${Math.round(t)}ms` : t < 6e4 ? `${(t / 1e3).toFixed(t < 1e4 ? 2 : 1)}s` : `${Math.floor(t / 6e4)}m ${Math.round(t % 6e4 / 1e3)}s`, V = (t) => {
  if (t.status === "error" || t.status === "denied") return "var(--danger)";
  if (t.kind === "run") return "var(--text)";
  if (t.kind === "turn") return "var(--muted-strong)";
  if (t.kind === "model") return "var(--info)";
  const a = t.meta.kind || "";
  return a === "read" || a === "read_files" || a === "search" ? "var(--muted)" : a === "edit" || a === "write" ? "var(--warn)" : "var(--accent)";
}, W = (t) => t.kind === "tool" ? t.meta.title && t.meta.title !== t.name ? t.meta.title : t.name : t.kind === "model" ? `model · ${t.output ? "said" : "thought"}` : t.name;
function ke({ spans: t, live: a }) {
  const [s, p] = w(/* @__PURE__ */ new Set()), [h, n] = w(null), [f, i] = w(""), d = t[0], m = d.start, u = Math.max(1e-3, d.end - d.start), c = O(() => {
    const o = /* @__PURE__ */ new Map();
    for (const b of t) {
      const y = o.get(b.parent) ?? [];
      y.push(b), o.set(b.parent, y);
    }
    return o;
  }, [t]), x = O(() => {
    const o = [], b = f.trim().toLowerCase(), y = (S) => !b || `${W(S)} ${S.input} ${S.name}`.toLowerCase().includes(b), D = (S, I) => {
      var E;
      for (const C of c.get(S) ?? []) {
        const te = ((E = c.get(C.id)) == null ? void 0 : E.length) ?? 0;
        (y(C) || C.kind !== "tool" && C.kind !== "model") && o.push({ sp: C, depth: I, kids: te }), s.has(C.id) || D(C.id, I + 1);
      }
    };
    return D(null, 0), o;
  }, [c, s, f]), k = (o) => p((b) => {
    const y = new Set(b);
    return y.has(o) ? y.delete(o) : y.add(o), y;
  }), g = t.filter((o) => o.kind === "tool").reduce((o, b) => o + (b.end - b.start) * 1e3, 0), v = t.filter((o) => o.kind === "model").reduce((o, b) => o + (b.end - b.start) * 1e3, 0), j = t.filter((o) => o.status === "error" || o.status === "denied").length, l = t.find((o) => o.id === h) ?? null;
  return /* @__PURE__ */ r("div", { children: [
    /* @__PURE__ */ r("div", { className: "sf-tr-sum", children: [
      /* @__PURE__ */ r("span", { children: [
        /* @__PURE__ */ e("b", { children: t.length }),
        "spans"
      ] }),
      /* @__PURE__ */ r("span", { children: [
        /* @__PURE__ */ e("b", { children: _(u * 1e3) }),
        "duration"
      ] }),
      /* @__PURE__ */ r("span", { children: [
        /* @__PURE__ */ e("b", { children: d.meta.tools ?? 0 }),
        "tool calls · ",
        _(g),
        " (",
        Math.round(100 * g / (u * 1e3)),
        "%)"
      ] }),
      /* @__PURE__ */ r("span", { children: [
        /* @__PURE__ */ e("b", { children: d.meta.model_spans ?? 0 }),
        "model spans · ",
        _(v),
        " (",
        Math.round(100 * v / (u * 1e3)),
        "%)"
      ] }),
      /* @__PURE__ */ r("span", { children: [
        /* @__PURE__ */ e("b", { children: (d.meta.credits ?? 0).toFixed(2) }),
        "credits"
      ] }),
      j > 0 && /* @__PURE__ */ r("span", { style: { color: "var(--danger)" }, children: [
        /* @__PURE__ */ e("b", { style: { color: "var(--danger)" }, children: j }),
        "refused or failed"
      ] }),
      a && /* @__PURE__ */ e("span", { style: { color: "var(--accent)" }, children: "live" })
    ] }),
    /* @__PURE__ */ r("div", { className: "sf-tr-tools", children: [
      /* @__PURE__ */ e("input", { value: f, onChange: (o) => i(o.target.value), placeholder: "Filter spans by name, command or path…", "aria-label": "Filter spans" }),
      /* @__PURE__ */ e("button", { className: "sf-btn", onClick: () => p(/* @__PURE__ */ new Set()), children: "Expand all" }),
      /* @__PURE__ */ e("button", { className: "sf-btn", onClick: () => p(new Set(t.filter((o) => o.kind === "turn").map((o) => o.id))), children: "Turns only" })
    ] }),
    /* @__PURE__ */ r("div", { className: "sf-tr", role: "tree", children: [
      /* @__PURE__ */ r("div", { className: "sf-tr-head", children: [
        /* @__PURE__ */ e("div", { children: "Span" }),
        /* @__PURE__ */ e("div", { className: "sf-tr-axis", children: [0, 0.25, 0.5, 0.75, 1].map((o) => /* @__PURE__ */ e("span", { style: { left: `calc(${o * 100}% - ${o === 1 ? 24 : o === 0 ? -6 : 0}px)` }, children: _(o * u * 1e3) }, o)) })
      ] }),
      x.map(({ sp: o, depth: b, kids: y }) => {
        const D = (o.start - m) / u * 100, S = Math.max(0.3, (o.end - o.start) / u * 100), I = V(o);
        return /* @__PURE__ */ r("div", { className: "sf-tr-row", role: "treeitem", "aria-selected": h === o.id, "data-sel": h === o.id, onClick: () => n(o.id === h ? null : o.id), children: [
          /* @__PURE__ */ r("div", { style: { paddingLeft: 10 + b * 16 }, children: [
            /* @__PURE__ */ e("span", { className: "sf-caret", onClick: (E) => {
              E.stopPropagation(), y && k(o.id);
            }, "aria-hidden": "true", children: y ? s.has(o.id) ? "▸" : "▾" : "" }),
            /* @__PURE__ */ e("span", { className: "sf-dot", style: { background: I, width: 8, height: 8, flex: "none" } }),
            /* @__PURE__ */ e("span", { className: "sf-tr-name", title: W(o), children: W(o) }),
            o.kind === "tool" && o.input && /* @__PURE__ */ e("span", { className: "sf-tr-sub", title: o.input, children: o.input }),
            o.kind === "turn" && o.meta.credits != null && /* @__PURE__ */ r("span", { className: "sf-chip", children: [
              o.meta.credits.toFixed(2),
              " cr"
            ] })
          ] }),
          /* @__PURE__ */ r("div", { children: [
            /* @__PURE__ */ e("div", { className: "sf-tr-track", children: /* @__PURE__ */ e("span", { className: "sf-tr-bar", "data-status": o.status, style: { left: `${D}%`, width: `${S}%`, background: I } }) }),
            /* @__PURE__ */ e("span", { className: "sf-tr-dur", children: _((o.end - o.start) * 1e3) })
          ] })
        ] }, o.id);
      })
    ] }),
    l && /* @__PURE__ */ r("div", { className: "sf-tr-detail", children: [
      /* @__PURE__ */ r("div", { className: "sf-row", style: { marginBottom: 6 }, children: [
        /* @__PURE__ */ e("span", { className: "sf-dot", style: { background: V(l), width: 9, height: 9 } }),
        /* @__PURE__ */ e("b", { style: { color: "var(--text-strong)" }, children: W(l) }),
        /* @__PURE__ */ e(R, { tone: l.status === "ok" ? "var(--ok)" : l.status === "running" ? "var(--accent)" : l.status === "warn" ? "var(--warn)" : "var(--danger)", children: l.status }),
        /* @__PURE__ */ r("span", { style: { color: "var(--muted)", fontSize: 12 }, children: [
          l.kind,
          l.meta.tool ? ` · ${l.meta.tool}` : "",
          l.meta.kind ? ` · ${l.meta.kind}` : ""
        ] })
      ] }),
      /* @__PURE__ */ r("div", { className: "sf-tr-kv", children: [
        /* @__PURE__ */ r("span", { children: [
          "start ",
          /* @__PURE__ */ r("b", { children: [
            "+",
            _((l.start - m) * 1e3)
          ] })
        ] }),
        /* @__PURE__ */ r("span", { children: [
          "duration ",
          /* @__PURE__ */ e("b", { children: _((l.end - l.start) * 1e3) })
        ] }),
        l.meta.approval_ms != null && /* @__PURE__ */ r("span", { children: [
          "approval wait ",
          /* @__PURE__ */ e("b", { children: _(l.meta.approval_ms) })
        ] }),
        l.meta.credits != null && l.kind !== "run" && /* @__PURE__ */ r("span", { children: [
          "credits ",
          /* @__PURE__ */ e("b", { children: l.meta.credits.toFixed(3) })
        ] }),
        l.meta.model_calls != null && /* @__PURE__ */ r("span", { children: [
          "model calls ",
          /* @__PURE__ */ e("b", { children: l.meta.model_calls })
        ] }),
        l.meta.context_pct != null && /* @__PURE__ */ r("span", { children: [
          "context used ",
          /* @__PURE__ */ r("b", { children: [
            l.meta.context_pct.toFixed(1),
            "%"
          ] })
        ] }),
        l.meta.model && /* @__PURE__ */ r("span", { children: [
          "model ",
          /* @__PURE__ */ e("b", { children: l.meta.model })
        ] })
      ] }),
      l.input && /* @__PURE__ */ r($, { children: [
        /* @__PURE__ */ e("div", { className: "sf-label", children: l.kind === "turn" ? "prompt" : "input" }),
        /* @__PURE__ */ e("pre", { className: "sf-pre", children: l.input })
      ] }),
      l.output && /* @__PURE__ */ r($, { children: [
        /* @__PURE__ */ e("div", { className: "sf-label", children: l.kind === "turn" ? "stop reason" : "output" }),
        /* @__PURE__ */ e("pre", { className: "sf-pre", children: l.output })
      ] }),
      !l.input && !l.output && /* @__PURE__ */ e("div", { className: "sf-empty", style: { padding: 8 }, children: "No input or output recorded for this span." })
    ] })
  ] });
}
function Ne({ run: t, api: a, onClose: s }) {
  var k;
  const [p, h] = w("steps"), [n, f] = w(null), [i, d] = w(null), [m, u] = w(null);
  q(() => {
    let g = !0;
    const v = async () => {
      try {
        if (p === "steps") {
          const l = await a.get(`${H}/runs/${encodeURIComponent(t.id)}/steps`);
          if (!g) return;
          l.error ? u(l.error) : (f(l.steps), u(null));
        } else {
          const l = await a.get(`${H}/runs/${encodeURIComponent(t.id)}/trace`);
          if (!g) return;
          l.error ? u(l.error) : (d(l.found ? l.spans : []), u(null));
        }
      } catch (l) {
        g && u(String(l));
      }
    };
    v();
    const j = t.live ? window.setInterval(v, 4e3) : null;
    return () => {
      g = !1, j && window.clearInterval(j);
    };
  }, [a, t.id, t.live, p]);
  const c = t.session, x = /* @__PURE__ */ e("div", { className: "sf-views", role: "tablist", "aria-label": "Transcript view", children: ["steps", "trace", "json"].map((g) => /* @__PURE__ */ e("button", { role: "tab", "aria-selected": p === g, "data-on": p === g, onClick: () => h(g), children: g === "steps" ? "Steps" : g === "trace" ? "Trace" : "JSON" }, g)) });
  return /* @__PURE__ */ r(
    ee,
    {
      onClose: s,
      wide: p !== "steps",
      actions: x,
      title: /* @__PURE__ */ r("span", { className: "sf-row", children: [
        /* @__PURE__ */ e(Q, { size: 16, style: { color: L(t.agent) } }),
        B(t.agent),
        " ",
        /* @__PURE__ */ e("span", { style: { color: "var(--muted)", fontWeight: 400 }, children: t.kind }),
        " ",
        /* @__PURE__ */ e(U, { o: t.outcome, live: t.live })
      ] }),
      sub: /* @__PURE__ */ r("span", { children: [
        (c == null ? void 0 : c.title) ?? "",
        " · ",
        (c == null ? void 0 : c.model) ?? "",
        " ",
        c != null && c.effort ? `(${c.effort})` : "",
        " · ",
        F(t.duration_ms),
        " · ",
        (c == null ? void 0 : c.tool_calls) ?? 0,
        " tool calls · ",
        ((k = c == null ? void 0 : c.credits) == null ? void 0 : k.toFixed(2)) ?? "0",
        " credits",
        c != null && c.issue ? ` · #${c.issue}` : "",
        c != null && c.pr ? ` · PR ${c.pr}` : ""
      ] }),
      children: [
        t.detail && /* @__PURE__ */ r("div", { className: "sf-warnbox", children: [
          /* @__PURE__ */ e(J, { size: 13, style: { verticalAlign: -2 } }),
          " ",
          t.detail
        ] }),
        m && /* @__PURE__ */ e("div", { className: "sf-empty", children: m }),
        p !== "steps" && !i && !m && /* @__PURE__ */ e("div", { className: "sf-empty", children: "Building trace…" }),
        p !== "steps" && i && i.length === 0 && /* @__PURE__ */ e("div", { className: "sf-empty", children: "Transcript not available on this gateway (the run happened on another machine)." }),
        p === "trace" && i && i.length > 0 && /* @__PURE__ */ e(ke, { spans: i, live: t.live }),
        p === "json" && i && i.length > 0 && /* @__PURE__ */ e("pre", { className: "sf-pre", style: { maxHeight: "none" }, children: JSON.stringify(i, null, 2) }),
        p === "steps" && !n && !m && /* @__PURE__ */ e("div", { className: "sf-empty", children: "Loading transcript…" }),
        p === "steps" && n && n.length === 0 && /* @__PURE__ */ e("div", { className: "sf-empty", children: "Transcript not available on this gateway (the run happened on another machine)." }),
        p === "steps" && (n == null ? void 0 : n.map((g, v) => g.kind === "tool" ? /* @__PURE__ */ r("div", { className: "sf-step", children: [
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
        ] }, v) : g.kind === "text" ? /* @__PURE__ */ r("div", { className: "sf-step", children: [
          /* @__PURE__ */ e("span", { className: "sf-dot", style: { marginTop: 5, background: L(t.agent) } }),
          /* @__PURE__ */ e("div", { className: "sf-text", style: { flex: 1 }, children: g.text })
        ] }, v) : /* @__PURE__ */ r("div", { className: "sf-step", style: { color: "var(--muted)" }, children: [
          /* @__PURE__ */ e(ie, { size: 14 }),
          " turn ended (",
          g.reason,
          ")"
        ] }, v)))
      ]
    }
  );
}
function _e({ state: t }) {
  const a = Math.max(1, ...t.agents.map((n) => n.avg_duration_ms ?? 0)), s = O(() => {
    var d;
    const n = [], f = /* @__PURE__ */ new Date();
    f.setHours(0, 0, 0, 0);
    for (let m = 13; m >= 0; m--) {
      const u = new Date(f);
      u.setDate(f.getDate() - m), n.push({ day: u.toLocaleDateString([], { weekday: "short" }), completed: 0, failed: 0, credits: 0 });
    }
    const i = f.getTime() / 1e3 - 13 * 86400;
    for (const m of t.runs) {
      if (!m.started_at || m.started_at < i) continue;
      const u = Math.min(13, Math.floor((m.started_at - i) / 86400));
      m.outcome === "completed" ? n[u].completed++ : m.outcome !== "running" && n[u].failed++, n[u].credits += ((d = m.session) == null ? void 0 : d.credits) ?? 0;
    }
    return n;
  }, [t.runs]), p = Math.max(1, ...s.map((n) => n.completed + n.failed)), h = Math.max(1, ...s.map((n) => n.credits));
  return /* @__PURE__ */ r($, { children: [
    /* @__PURE__ */ e("div", { className: "sf-grid", style: { marginBottom: 16 }, children: t.agents.map((n) => /* @__PURE__ */ r("div", { className: "sf-agent", style: { "--sf-c": L(n.id) }, children: [
      /* @__PURE__ */ r("div", { className: "sf-row", style: { justifyContent: "space-between" }, children: [
        /* @__PURE__ */ r("div", { className: "sf-row", children: [
          /* @__PURE__ */ e(Q, { size: 16, style: { color: L(n.id) } }),
          /* @__PURE__ */ e("strong", { style: { color: "var(--text-strong)" }, children: n.label })
        ] }),
        n.live > 0 ? /* @__PURE__ */ r(R, { tone: "var(--accent)", children: [
          /* @__PURE__ */ e("span", { className: "sf-dot sf-pulse", style: { background: "var(--accent)", width: 7, height: 7 } }),
          "running"
        ] }) : n.installed ? /* @__PURE__ */ e(R, { tone: "var(--ok)", children: "template installed" }) : /* @__PURE__ */ e(R, { tone: "var(--danger)", children: "template missing" })
      ] }),
      /* @__PURE__ */ e("div", { style: { fontSize: 12, color: "var(--muted)", marginTop: 4 }, children: n.role }),
      /* @__PURE__ */ r("dl", { className: "sf-kv", children: [
        /* @__PURE__ */ e("dt", { children: "Runs" }),
        /* @__PURE__ */ r("dd", { children: [
          n.runs,
          " ",
          /* @__PURE__ */ r("span", { style: { color: "var(--muted)", fontWeight: 400 }, children: [
            "(",
            n.completed,
            " ok, ",
            n.failed,
            " failed)"
          ] })
        ] }),
        /* @__PURE__ */ e("dt", { children: "Avg / p90" }),
        /* @__PURE__ */ r("dd", { children: [
          F(n.avg_duration_ms),
          " / ",
          F(n.p90_duration_ms)
        ] }),
        /* @__PURE__ */ e("dt", { children: "Avg credits" }),
        /* @__PURE__ */ e("dd", { children: n.avg_credits ?? "–" }),
        /* @__PURE__ */ e("dt", { children: "Model" }),
        /* @__PURE__ */ e("dd", { className: "sf-mono", children: n.model ?? "–" }),
        /* @__PURE__ */ e("dt", { children: "Last run" }),
        /* @__PURE__ */ r("dd", { children: [
          z(n.last_run_at),
          " ",
          n.last_outcome && /* @__PURE__ */ r("span", { style: { color: Z(n.last_outcome) }, children: [
            "· ",
            n.last_outcome
          ] })
        ] })
      ] }),
      /* @__PURE__ */ e("div", { className: "sf-bar", title: "Average duration relative to the slowest agent", children: /* @__PURE__ */ e("i", { style: { width: `${Math.round(100 * (n.avg_duration_ms ?? 0) / a)}%` } }) })
    ] }, n.id)) }),
    /* @__PURE__ */ r("div", { className: "sf-grid", children: [
      /* @__PURE__ */ r(A, { children: [
        /* @__PURE__ */ e(T, { children: "Runs per day (14d)" }),
        /* @__PURE__ */ e("div", { className: "sf-spark", style: { "--sf-c": "var(--accent)" }, children: s.map((n, f) => /* @__PURE__ */ e("i", { title: `${n.day}: ${n.completed} ok, ${n.failed} failed`, style: { height: `${Math.round(100 * (n.completed + n.failed) / p)}%`, background: n.failed ? `linear-gradient(to top, var(--danger) ${Math.round(100 * n.failed / Math.max(1, n.completed + n.failed))}%, var(--accent) 0)` : void 0 } }, f)) }),
        /* @__PURE__ */ r("div", { className: "sf-meta", style: { justifyContent: "space-between" }, children: [
          /* @__PURE__ */ e("span", { children: s[0].day }),
          /* @__PURE__ */ e("span", { children: "today" })
        ] })
      ] }),
      /* @__PURE__ */ r(A, { children: [
        /* @__PURE__ */ e(T, { children: "Credits per day (14d)" }),
        /* @__PURE__ */ e("div", { className: "sf-spark", style: { "--sf-c": "var(--warn)" }, children: s.map((n, f) => /* @__PURE__ */ e("i", { title: `${n.day}: ${n.credits.toFixed(1)} credits`, style: { height: `${Math.round(100 * n.credits / h)}%` } }, f)) }),
        /* @__PURE__ */ r("div", { className: "sf-meta", style: { justifyContent: "space-between" }, children: [
          /* @__PURE__ */ e("span", { children: s[0].day }),
          /* @__PURE__ */ e("span", { children: "today" })
        ] })
      ] })
    ] })
  ] });
}
function M({ ok: t, unknown: a }) {
  return /* @__PURE__ */ e("span", { className: "sf-dot", style: { background: a ? "var(--muted)" : t ? "var(--ok)" : "var(--danger)", width: 10, height: 10 } });
}
function $e({ infra: t }) {
  return /* @__PURE__ */ r("div", { className: "sf-grid", children: [
    /* @__PURE__ */ r(A, { children: [
      /* @__PURE__ */ e(T, { children: "Health" }),
      /* @__PURE__ */ r("dl", { className: "sf-kv", style: { gridTemplateColumns: "auto 1fr" }, children: [
        /* @__PURE__ */ e("dt", { children: /* @__PURE__ */ e(M, { ok: t.runner_ok }) }),
        /* @__PURE__ */ r("dd", { children: [
          "Actions runner ",
          t.runner_ok ? "online" : "offline",
          t.runners.map((a) => ` · ${a.name}${a.busy ? " (busy)" : ""}`)
        ] }),
        /* @__PURE__ */ e("dt", { children: /* @__PURE__ */ e(M, { ok: !!t.webhooks_enabled, unknown: t.webhooks_enabled == null }) }),
        /* @__PURE__ */ r("dd", { children: [
          "Inbound webhooks ",
          t.webhooks_enabled == null ? "unknown (switch not readable here)" : t.webhooks_enabled ? "enabled" : "DISABLED"
        ] }),
        /* @__PURE__ */ e("dt", { children: /* @__PURE__ */ e(M, { ok: t.templates_ok }) }),
        /* @__PURE__ */ r("dd", { children: [
          "Agent templates ",
          Object.values(t.templates).filter(Boolean).length,
          "/",
          Object.keys(t.templates).length,
          " installed on this gateway"
        ] }),
        /* @__PURE__ */ e("dt", { children: /* @__PURE__ */ e(M, { ok: t.workflow_failures_recent === 0 }) }),
        /* @__PURE__ */ r("dd", { children: [
          t.workflow_failures_recent,
          " failed workflow runs in the last 30 · last event ",
          z(t.workflow_last_at)
        ] }),
        /* @__PURE__ */ e("dt", { children: /* @__PURE__ */ e(le, { size: 12 }) }),
        /* @__PURE__ */ r("dd", { children: [
          "Gateway host ",
          /* @__PURE__ */ e("span", { className: "sf-mono", children: t.gateway_host })
        ] })
      ] }),
      t.errors.length > 0 && /* @__PURE__ */ e("div", { className: "sf-warnbox", style: { marginTop: 12 }, children: t.errors.map((a, s) => /* @__PURE__ */ e("div", { children: a }, s)) })
    ] }),
    /* @__PURE__ */ r(A, { children: [
      /* @__PURE__ */ e(T, { children: "Webhook sources" }),
      !t.sources_readable && /* @__PURE__ */ e("div", { className: "sf-empty", children: "Source list not readable from the backend on this host. Check Settings → Webhooks." }),
      t.sources.map((a) => /* @__PURE__ */ r("div", { className: "sf-row", style: { padding: "6px 0", borderBottom: "1px solid var(--border)", fontSize: 12.5 }, children: [
        /* @__PURE__ */ e(M, { ok: a.enabled }),
        /* @__PURE__ */ e("span", { style: { flex: 1 }, children: a.label || a.id }),
        /* @__PURE__ */ e("span", { className: "sf-mono", style: { color: "var(--muted)" }, children: a.agent }),
        a.signed && /* @__PURE__ */ e("span", { className: "sf-chip", children: "signed" }),
        /* @__PURE__ */ e("span", { style: { color: "var(--muted)" }, children: z(a.last_used_at) })
      ] }, a.id))
    ] }),
    /* @__PURE__ */ r(A, { children: [
      /* @__PURE__ */ e(T, { children: "Templates" }),
      Object.entries(t.templates).map(([a, s]) => /* @__PURE__ */ r("div", { className: "sf-row", style: { padding: "6px 0", borderBottom: "1px solid var(--border)", fontSize: 12.5 }, children: [
        /* @__PURE__ */ e(M, { ok: s }),
        /* @__PURE__ */ r("span", { className: "sf-mono", children: [
          a,
          ".json"
        ] }),
        /* @__PURE__ */ e("span", { style: { marginLeft: "auto", color: "var(--muted)" }, children: s ? "~/.kiro/agents" : "run scripts/install-agent.sh" })
      ] }, a))
    ] }),
    /* @__PURE__ */ r(A, { children: [
      /* @__PURE__ */ e(T, { children: "Recent workflow runs" }),
      t.workflow_recent.map((a) => /* @__PURE__ */ r("div", { className: "sf-row", style: { padding: "6px 0", borderBottom: "1px solid var(--border)", fontSize: 12.5 }, children: [
        /* @__PURE__ */ e(M, { ok: a.conclusion === "success", unknown: !a.conclusion }),
        /* @__PURE__ */ e("a", { className: "sf-link", href: a.url, target: "_blank", rel: "noreferrer", style: { flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, children: a.title || a.name }),
        /* @__PURE__ */ e("span", { className: "sf-mono", style: { color: "var(--muted)" }, children: a.event }),
        /* @__PURE__ */ e("span", { style: { color: "var(--muted)" }, children: z(a.created_at) })
      ] }, a.id))
    ] })
  ] });
}
function Ae() {
  const { state: t, error: a, loading: s, reload: p, api: h, showAll: n, setShowAll: f } = ge(), [i, d] = w("board"), [m, u] = w(null), [c, x] = w(null), k = (t == null ? void 0 : t.board.find((v) => v.issue === m)) ?? null, g = c ? (t == null ? void 0 : t.runs.find((v) => v.id === c.id || v.session_key && v.session_key === c.session_key)) ?? c : null;
  return /* @__PURE__ */ r("div", { className: "sf-root", children: [
    /* @__PURE__ */ e("style", { children: ue }),
    /* @__PURE__ */ e(
      ae,
      {
        title: "Software Factory",
        subtitle: t ? `${t.repo} · ${t.stats.live_runs > 0 ? `${t.stats.live_runs} agent${t.stats.live_runs > 1 ? "s" : ""} running` : "idle"} · refreshed ${z(t.generated_at)}` : "Issue to merged PR, observed end to end"
      }
    ),
    /* @__PURE__ */ r("div", { className: "sf-body", children: [
      a && /* @__PURE__ */ r("div", { className: "sf-warnbox", children: [
        /* @__PURE__ */ e(J, { size: 13, style: { verticalAlign: -2 } }),
        " ",
        a
      ] }),
      s && !t && /* @__PURE__ */ e("div", { className: "sf-empty", children: "Reading GitHub and the gateway…" }),
      t && /* @__PURE__ */ r($, { children: [
        /* @__PURE__ */ r("div", { className: "sf-stats", children: [
          /* @__PURE__ */ e(N, { label: "In flight", value: String(t.stats.in_flight), accent: !0 }),
          /* @__PURE__ */ e(N, { label: "Ready to merge", value: String(t.stats.ready) }),
          /* @__PURE__ */ e(N, { label: "Parked", value: String(t.stats.parked) }),
          /* @__PURE__ */ e(N, { label: "Shipped", value: String(t.stats.shipped) }),
          /* @__PURE__ */ e(N, { label: "Median issue → ready", value: t.stats.median_cycle_s != null ? F(t.stats.median_cycle_s * 1e3) : "–" }),
          /* @__PURE__ */ e(N, { label: "Pass rate", value: t.stats.pass_rate != null ? `${t.stats.pass_rate}%` : "–" }),
          /* @__PURE__ */ e(N, { label: "Agent runs (7d)", value: `${t.stats.runs_week}` }),
          /* @__PURE__ */ e(N, { label: "Credits (7d)", value: t.stats.credits_week.toFixed(1) })
        ] }),
        /* @__PURE__ */ r("div", { className: "sf-row", style: { justifyContent: "space-between", flexWrap: "wrap" }, children: [
          /* @__PURE__ */ e(ve, { value: i, onChange: d, items: [["board", "Board"], ["runs", "Agent runs"], ["agents", "Agents"], ["infra", "Infrastructure"]] }),
          /* @__PURE__ */ r("div", { className: "sf-row", style: { marginBottom: 16 }, children: [
            /* @__PURE__ */ e("span", { className: "sf-row", style: { fontSize: 12, color: "var(--muted)" }, children: t.stats.live_runs > 0 ? /* @__PURE__ */ r($, { children: [
              /* @__PURE__ */ e(se, { size: 13, className: "sf-pulse", style: { color: "var(--accent)" } }),
              " live"
            ] }) : /* @__PURE__ */ r($, { children: [
              /* @__PURE__ */ e(ne, { size: 13 }),
              " polling"
            ] }) }),
            /* @__PURE__ */ r("button", { className: "sf-btn", onClick: p, children: [
              /* @__PURE__ */ e(oe, { size: 13 }),
              " Refresh"
            ] })
          ] })
        ] }),
        i === "board" && /* @__PURE__ */ e(be, { state: t, onOpen: (v) => u(v.issue), showAll: n, onToggleAll: f }),
        i === "runs" && /* @__PURE__ */ e(ye, { runs: t.runs, onWatch: x }),
        i === "agents" && /* @__PURE__ */ e(_e, { state: t }),
        i === "infra" && /* @__PURE__ */ e($e, { infra: t.infra })
      ] })
    ] }),
    k && !c && /* @__PURE__ */ e(we, { it: k, runs: t.runs, onClose: () => u(null), onWatch: x }),
    g && /* @__PURE__ */ e(Ne, { run: g, api: h, onClose: () => x(null) })
  ] });
}
export {
  Ae as default
};
