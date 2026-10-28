import { jsxs as r, jsx as e, Fragment as T } from "react/jsx-runtime";
import { useAppApi as re } from "@kirocrew/app-sdk";
import { PageHeader as ae, StatCard as k, CardTitle as C, Card as M } from "@kirocrew/app-sdk/ui";
import { AlertTriangle as J, Activity as se, CircleDot as ne, RefreshCw as oe, Zap as K, Eye as X, ExternalLink as P, CheckCircle2 as ie, Bot as Q, Server as le, Clock as de, GitPullRequest as ce, X as pe } from "lucide-react";
import { useState as x, useRef as he, useCallback as me, useEffect as q, useMemo as O } from "react";
const H = "/apps/software-factory/api", R = (t) => {
  if (t == null) return "–";
  const a = Math.round(t / 1e3);
  if (a < 60) return `${a}s`;
  const n = Math.floor(a / 60);
  return n < 60 ? `${n}m ${a % 60}s` : `${Math.floor(n / 60)}h ${n % 60}m`;
}, _ = (t) => {
  if (!t) return "–";
  const a = Math.max(0, Date.now() / 1e3 - t);
  return a < 60 ? `${Math.round(a)}s ago` : a < 3600 ? `${Math.round(a / 60)}m ago` : a < 86400 ? `${Math.round(a / 3600)}h ago` : `${Math.round(a / 86400)}d ago`;
}, G = (t) => t ? new Date(t * 1e3).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "–", j = (t) => t.replace("delivery-", "").replace("github-", ""), fe = {
  "delivery-planner": "var(--info)",
  "delivery-implementer": "var(--accent)",
  "delivery-reviewer": "var(--warn)",
  "delivery-scribe": "var(--ok)",
  "github-worker": "var(--muted-strong)",
  "pr-gate": "var(--text)"
}, F = (t) => fe[t] ?? "var(--muted)", Y = {
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
  const t = re(), [a, n] = x(null), [i, c] = x(null), [s, f] = x(!0), l = he(null), p = me(async (u = !1) => {
    try {
      const h = await t.get(`${H}/state${u ? "?refresh=1" : ""}`);
      n(h), c(null);
    } catch (h) {
      c(h instanceof Error ? h.message : String(h));
    } finally {
      f(!1);
    }
  }, [t]);
  return q(() => {
    p();
    const u = () => {
      const h = ((a == null ? void 0 : a.stats.live_runs) ?? 0) > 0;
      l.current = window.setTimeout(async () => {
        await p(), u();
      }, h ? 5e3 : 15e3);
    };
    return u(), () => {
      l.current && window.clearTimeout(l.current);
    };
  }, [p]), { state: a, error: i, loading: s, reload: () => p(!0), api: t };
}
function A({ tone: t, children: a }) {
  return /* @__PURE__ */ e("span", { className: "sf-pill", style: { background: `color-mix(in srgb, ${t} 16%, transparent)`, color: t }, children: a });
}
function U({ o: t, live: a }) {
  const n = Z(t);
  return /* @__PURE__ */ r(A, { tone: n, children: [
    /* @__PURE__ */ e("span", { className: `sf-dot ${a ? "sf-pulse" : ""}`, style: { background: n, width: 7, height: 7 } }),
    t
  ] });
}
function ve({ value: t, onChange: a, items: n }) {
  return /* @__PURE__ */ e("div", { className: "sf-tabs", role: "tablist", children: n.map(([i, c]) => /* @__PURE__ */ e("button", { role: "tab", "aria-selected": t === i, "data-on": t === i, className: "sf-tab", onClick: () => a(i), children: c }, i)) });
}
function ee({ title: t, sub: a, onClose: n, children: i, wide: c, actions: s }) {
  return q(() => {
    const f = (l) => {
      l.key === "Escape" && n();
    };
    return window.addEventListener("keydown", f), () => window.removeEventListener("keydown", f);
  }, [n]), /* @__PURE__ */ r(T, { children: [
    /* @__PURE__ */ e("div", { className: "sf-scrim", onClick: n }),
    /* @__PURE__ */ r("aside", { className: "sf-drawer", "data-wide": !!c, role: "dialog", "aria-modal": "true", children: [
      /* @__PURE__ */ r("div", { className: "sf-dhead", children: [
        /* @__PURE__ */ r("div", { style: { minWidth: 0, flex: 1 }, children: [
          /* @__PURE__ */ e("div", { style: { fontWeight: 600, fontSize: 15, color: "var(--text-strong)" }, children: t }),
          a && /* @__PURE__ */ e("div", { style: { fontSize: 12, color: "var(--muted)", marginTop: 3 }, children: a })
        ] }),
        s,
        /* @__PURE__ */ e("button", { className: "sf-x", onClick: n, "aria-label": "Close", style: { marginLeft: 4 }, children: /* @__PURE__ */ e(pe, { size: 16 }) })
      ] }),
      /* @__PURE__ */ e("div", { className: "sf-dbody", children: i })
    ] })
  ] });
}
function xe({ it: t, onOpen: a }) {
  var i;
  const n = !!t.live_agent;
  return /* @__PURE__ */ r("div", { className: "sf-card", "data-live": n, onClick: a, role: "button", tabIndex: 0, onKeyDown: (c) => c.key === "Enter" && a(), children: [
    /* @__PURE__ */ r("div", { className: "sf-row", style: { justifyContent: "space-between", marginBottom: 4 }, children: [
      /* @__PURE__ */ r("span", { className: "sf-mono", style: { color: "var(--muted)" }, children: [
        "#",
        t.issue
      ] }),
      n && /* @__PURE__ */ r(A, { tone: "var(--accent)", children: [
        /* @__PURE__ */ e("span", { className: "sf-dot sf-pulse", style: { background: "var(--accent)", width: 7, height: 7 } }),
        j(t.live_agent)
      ] }),
      !n && ((i = t.pr) == null ? void 0 : i.checks) && /* @__PURE__ */ e("span", { className: "sf-dot", title: `CI ${t.pr.checks}`, style: { background: t.pr.checks === "passing" ? "var(--ok)" : t.pr.checks === "failing" ? "var(--danger)" : "var(--warn)" } })
    ] }),
    /* @__PURE__ */ e("div", { className: "sf-cardtitle", children: t.title }),
    /* @__PURE__ */ r("div", { className: "sf-meta", children: [
      /* @__PURE__ */ r("span", { title: "Time in stage", children: [
        /* @__PURE__ */ e(de, { size: 11, style: { verticalAlign: -1 } }),
        " ",
        _(t.stage_since)
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
    t.hops.length > 0 && /* @__PURE__ */ e("div", { className: "sf-hops", title: t.hops.map((c) => `${j(c.agent)} ${c.outcome} ${R(c.duration_ms)}`).join(`
`), children: t.hops.map((c) => /* @__PURE__ */ e("span", { className: `sf-hop ${c.live ? "sf-pulse" : ""}`, style: { background: F(c.agent), opacity: c.outcome === "completed" || c.live ? 0.9 : 0.35 } }, c.id)) })
  ] });
}
function be({ state: t, onOpen: a }) {
  const n = t.stages.filter((i) => i.id !== "shipped" || t.stats.by_stage.shipped > 0);
  return /* @__PURE__ */ e("div", { className: "sf-board", children: n.map((i) => {
    const c = t.board.filter((f) => f.stage === i.id), s = i.id === "shipped" ? c.slice(0, 6) : c;
    return /* @__PURE__ */ r("div", { className: "sf-col", children: [
      /* @__PURE__ */ r("div", { className: "sf-colhead", children: [
        /* @__PURE__ */ r("span", { className: "sf-row", children: [
          /* @__PURE__ */ e("span", { className: "sf-dot", style: { background: Y[i.id] } }),
          i.label
        ] }),
        /* @__PURE__ */ e("span", { className: "sf-count", children: c.length })
      ] }),
      s.map((f) => /* @__PURE__ */ e(xe, { it: f, onOpen: () => a(f) }, f.issue)),
      c.length === 0 && /* @__PURE__ */ e("div", { className: "sf-empty", style: { padding: 10 }, children: "empty" }),
      s.length < c.length && /* @__PURE__ */ r("div", { className: "sf-empty", style: { padding: 6 }, children: [
        "+",
        c.length - s.length,
        " more"
      ] })
    ] }, i.id);
  }) });
}
function we({ it: t, runs: a, onClose: n, onWatch: i }) {
  var s, f;
  const c = t.hops.map((l) => ({ hop: l, run: a.find((p) => p.id === l.id) }));
  return /* @__PURE__ */ r(ee, { onClose: n, title: /* @__PURE__ */ r("span", { children: [
    "#",
    t.issue,
    " ",
    t.title
  ] }), sub: /* @__PURE__ */ r("span", { className: "sf-row", children: [
    /* @__PURE__ */ e(A, { tone: Y[t.stage], children: t.stage }),
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
      /* @__PURE__ */ e("dd", { children: _(t.stage_since) }),
      /* @__PURE__ */ e("dt", { children: "Review rounds" }),
      /* @__PURE__ */ e("dd", { children: t.rounds }),
      /* @__PURE__ */ e("dt", { children: "Credits" }),
      /* @__PURE__ */ e("dd", { children: t.credits.toFixed(2) }),
      /* @__PURE__ */ e("dt", { children: "CI" }),
      /* @__PURE__ */ e("dd", { children: ((s = t.pr) == null ? void 0 : s.checks) ?? "–" }),
      /* @__PURE__ */ e("dt", { children: "Labels" }),
      /* @__PURE__ */ e("dd", { style: { display: "flex", flexWrap: "wrap", gap: 4 }, children: [...t.labels, ...((f = t.pr) == null ? void 0 : f.labels) ?? []].filter((l) => l.startsWith("kiro-")).map((l) => /* @__PURE__ */ e("span", { className: "sf-chip", children: l }, l)) })
    ] }),
    /* @__PURE__ */ e(C, { children: "Hops" }),
    c.length === 0 && /* @__PURE__ */ e("div", { className: "sf-empty", children: "No agent run is linked to this issue on this gateway yet." }),
    /* @__PURE__ */ e("div", { className: "sf-tl", children: c.map(({ hop: l, run: p }) => {
      var u, h, m;
      return /* @__PURE__ */ r("div", { className: "sf-tli", children: [
        /* @__PURE__ */ e("span", { className: `sf-dot ${l.live ? "sf-pulse" : ""}`, style: { background: F(l.agent) } }),
        /* @__PURE__ */ r("div", { className: "sf-row", style: { justifyContent: "space-between" }, children: [
          /* @__PURE__ */ r("div", { children: [
            /* @__PURE__ */ e("strong", { style: { color: "var(--text-strong)", fontSize: 13 }, children: j(l.agent) }),
            /* @__PURE__ */ e("span", { style: { color: "var(--muted)", fontSize: 12, marginLeft: 8 }, children: l.kind })
          ] }),
          /* @__PURE__ */ e(U, { o: l.outcome, live: l.live })
        ] }),
        /* @__PURE__ */ r("div", { className: "sf-meta", children: [
          /* @__PURE__ */ e("span", { children: G(l.started_at) }),
          /* @__PURE__ */ e("span", { children: R(l.duration_ms) }),
          l.credits != null && /* @__PURE__ */ r("span", { children: [
            /* @__PURE__ */ e(K, { size: 11, style: { verticalAlign: -1 } }),
            " ",
            l.credits.toFixed(2)
          ] }),
          ((u = p == null ? void 0 : p.session) == null ? void 0 : u.model) && /* @__PURE__ */ e("span", { children: p.session.model }),
          ((h = p == null ? void 0 : p.session) == null ? void 0 : h.tool_calls) != null && /* @__PURE__ */ r("span", { children: [
            p.session.tool_calls,
            " tool calls"
          ] }),
          (p == null ? void 0 : p.session_key) && /* @__PURE__ */ r("button", { className: "sf-btn", style: { padding: "2px 8px" }, onClick: () => i(p), children: [
            /* @__PURE__ */ e(X, { size: 12 }),
            " ",
            l.live ? "watch live" : "steps"
          ] })
        ] }),
        ((m = p == null ? void 0 : p.session) == null ? void 0 : m.last_text) && /* @__PURE__ */ e("div", { className: "sf-text", style: { marginTop: 8, maxHeight: 90, overflow: "hidden" }, children: p.session.last_text })
      ] }, l.id);
    }) })
  ] });
}
function ye({ runs: t, onWatch: a }) {
  return /* @__PURE__ */ r(M, { children: [
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
        var i, c, s, f, l, p;
        return /* @__PURE__ */ r("tr", { children: [
          /* @__PURE__ */ e("td", { title: G(n.started_at), children: _(n.started_at) }),
          /* @__PURE__ */ e("td", { children: /* @__PURE__ */ r("span", { className: "sf-row", children: [
            /* @__PURE__ */ e("span", { className: "sf-dot", style: { background: F(n.agent) } }),
            j(n.agent)
          ] }) }),
          /* @__PURE__ */ e("td", { className: "sf-mono", children: n.kind }),
          /* @__PURE__ */ r("td", { children: [
            (i = n.session) != null && i.issue ? `#${n.session.issue}` : "",
            (c = n.session) != null && c.pr ? ` PR ${n.session.pr}` : ""
          ] }),
          /* @__PURE__ */ e("td", { children: /* @__PURE__ */ e(U, { o: n.outcome, live: n.live }) }),
          /* @__PURE__ */ e("td", { children: R(n.duration_ms) }),
          /* @__PURE__ */ e("td", { className: "sf-mono", children: ((s = n.session) == null ? void 0 : s.model) ?? "–" }),
          /* @__PURE__ */ e("td", { children: ((f = n.session) == null ? void 0 : f.tool_calls) ?? "–" }),
          /* @__PURE__ */ e("td", { children: (l = n.session) != null && l.credits ? n.session.credits.toFixed(2) : "–" }),
          /* @__PURE__ */ e("td", { children: n.session_key && ((p = n.session) == null ? void 0 : p.found) && /* @__PURE__ */ r("button", { className: "sf-btn", onClick: () => a(n), children: [
            /* @__PURE__ */ e(X, { size: 12 }),
            " ",
            n.live ? "watch" : "steps"
          ] }) })
        ] }, n.id);
      }) })
    ] }),
    t.length === 0 && /* @__PURE__ */ e("div", { className: "sf-empty", children: "No webhook runs recorded for this repository on this gateway." })
  ] });
}
const N = (t) => t < 1e3 ? `${Math.round(t)}ms` : t < 6e4 ? `${(t / 1e3).toFixed(t < 1e4 ? 2 : 1)}s` : `${Math.floor(t / 6e4)}m ${Math.round(t % 6e4 / 1e3)}s`, V = (t) => {
  if (t.status === "error" || t.status === "denied") return "var(--danger)";
  if (t.kind === "run") return "var(--text)";
  if (t.kind === "turn") return "var(--muted-strong)";
  if (t.kind === "model") return "var(--info)";
  const a = t.meta.kind || "";
  return a === "read" || a === "read_files" || a === "search" ? "var(--muted)" : a === "edit" || a === "write" ? "var(--warn)" : "var(--accent)";
}, W = (t) => t.kind === "tool" ? t.meta.title && t.meta.title !== t.name ? t.meta.title : t.name : t.kind === "model" ? `model · ${t.output ? "said" : "thought"}` : t.name;
function ke({ spans: t, live: a }) {
  const [n, i] = x(/* @__PURE__ */ new Set()), [c, s] = x(null), [f, l] = x(""), p = t[0], u = p.start, h = Math.max(1e-3, p.end - p.start), m = O(() => {
    const o = /* @__PURE__ */ new Map();
    for (const v of t) {
      const w = o.get(v.parent) ?? [];
      w.push(v), o.set(v.parent, w);
    }
    return o;
  }, [t]), I = O(() => {
    const o = [], v = f.trim().toLowerCase(), w = (z) => !v || `${W(z)} ${z.input} ${z.name}`.toLowerCase().includes(v), E = (z, D) => {
      var B;
      for (const $ of m.get(z) ?? []) {
        const te = ((B = m.get($.id)) == null ? void 0 : B.length) ?? 0;
        (w($) || $.kind !== "tool" && $.kind !== "model") && o.push({ sp: $, depth: D, kids: te }), n.has($.id) || E($.id, D + 1);
      }
    };
    return E(null, 0), o;
  }, [m, n, f]), b = (o) => i((v) => {
    const w = new Set(v);
    return w.has(o) ? w.delete(o) : w.add(o), w;
  }), g = t.filter((o) => o.kind === "tool").reduce((o, v) => o + (v.end - v.start) * 1e3, 0), y = t.filter((o) => o.kind === "model").reduce((o, v) => o + (v.end - v.start) * 1e3, 0), L = t.filter((o) => o.status === "error" || o.status === "denied").length, d = t.find((o) => o.id === c) ?? null;
  return /* @__PURE__ */ r("div", { children: [
    /* @__PURE__ */ r("div", { className: "sf-tr-sum", children: [
      /* @__PURE__ */ r("span", { children: [
        /* @__PURE__ */ e("b", { children: t.length }),
        "spans"
      ] }),
      /* @__PURE__ */ r("span", { children: [
        /* @__PURE__ */ e("b", { children: N(h * 1e3) }),
        "duration"
      ] }),
      /* @__PURE__ */ r("span", { children: [
        /* @__PURE__ */ e("b", { children: p.meta.tools ?? 0 }),
        "tool calls · ",
        N(g),
        " (",
        Math.round(100 * g / (h * 1e3)),
        "%)"
      ] }),
      /* @__PURE__ */ r("span", { children: [
        /* @__PURE__ */ e("b", { children: p.meta.model_spans ?? 0 }),
        "model spans · ",
        N(y),
        " (",
        Math.round(100 * y / (h * 1e3)),
        "%)"
      ] }),
      /* @__PURE__ */ r("span", { children: [
        /* @__PURE__ */ e("b", { children: (p.meta.credits ?? 0).toFixed(2) }),
        "credits"
      ] }),
      L > 0 && /* @__PURE__ */ r("span", { style: { color: "var(--danger)" }, children: [
        /* @__PURE__ */ e("b", { style: { color: "var(--danger)" }, children: L }),
        "refused or failed"
      ] }),
      a && /* @__PURE__ */ e("span", { style: { color: "var(--accent)" }, children: "live" })
    ] }),
    /* @__PURE__ */ r("div", { className: "sf-tr-tools", children: [
      /* @__PURE__ */ e("input", { value: f, onChange: (o) => l(o.target.value), placeholder: "Filter spans by name, command or path…", "aria-label": "Filter spans" }),
      /* @__PURE__ */ e("button", { className: "sf-btn", onClick: () => i(/* @__PURE__ */ new Set()), children: "Expand all" }),
      /* @__PURE__ */ e("button", { className: "sf-btn", onClick: () => i(new Set(t.filter((o) => o.kind === "turn").map((o) => o.id))), children: "Turns only" })
    ] }),
    /* @__PURE__ */ r("div", { className: "sf-tr", role: "tree", children: [
      /* @__PURE__ */ r("div", { className: "sf-tr-head", children: [
        /* @__PURE__ */ e("div", { children: "Span" }),
        /* @__PURE__ */ e("div", { className: "sf-tr-axis", children: [0, 0.25, 0.5, 0.75, 1].map((o) => /* @__PURE__ */ e("span", { style: { left: `calc(${o * 100}% - ${o === 1 ? 24 : o === 0 ? -6 : 0}px)` }, children: N(o * h * 1e3) }, o)) })
      ] }),
      I.map(({ sp: o, depth: v, kids: w }) => {
        const E = (o.start - u) / h * 100, z = Math.max(0.3, (o.end - o.start) / h * 100), D = V(o);
        return /* @__PURE__ */ r("div", { className: "sf-tr-row", role: "treeitem", "aria-selected": c === o.id, "data-sel": c === o.id, onClick: () => s(o.id === c ? null : o.id), children: [
          /* @__PURE__ */ r("div", { style: { paddingLeft: 10 + v * 16 }, children: [
            /* @__PURE__ */ e("span", { className: "sf-caret", onClick: (B) => {
              B.stopPropagation(), w && b(o.id);
            }, "aria-hidden": "true", children: w ? n.has(o.id) ? "▸" : "▾" : "" }),
            /* @__PURE__ */ e("span", { className: "sf-dot", style: { background: D, width: 8, height: 8, flex: "none" } }),
            /* @__PURE__ */ e("span", { className: "sf-tr-name", title: W(o), children: W(o) }),
            o.kind === "tool" && o.input && /* @__PURE__ */ e("span", { className: "sf-tr-sub", title: o.input, children: o.input }),
            o.kind === "turn" && o.meta.credits != null && /* @__PURE__ */ r("span", { className: "sf-chip", children: [
              o.meta.credits.toFixed(2),
              " cr"
            ] })
          ] }),
          /* @__PURE__ */ r("div", { children: [
            /* @__PURE__ */ e("div", { className: "sf-tr-track", children: /* @__PURE__ */ e("span", { className: "sf-tr-bar", "data-status": o.status, style: { left: `${E}%`, width: `${z}%`, background: D } }) }),
            /* @__PURE__ */ e("span", { className: "sf-tr-dur", children: N((o.end - o.start) * 1e3) })
          ] })
        ] }, o.id);
      })
    ] }),
    d && /* @__PURE__ */ r("div", { className: "sf-tr-detail", children: [
      /* @__PURE__ */ r("div", { className: "sf-row", style: { marginBottom: 6 }, children: [
        /* @__PURE__ */ e("span", { className: "sf-dot", style: { background: V(d), width: 9, height: 9 } }),
        /* @__PURE__ */ e("b", { style: { color: "var(--text-strong)" }, children: W(d) }),
        /* @__PURE__ */ e(A, { tone: d.status === "ok" ? "var(--ok)" : d.status === "running" ? "var(--accent)" : d.status === "warn" ? "var(--warn)" : "var(--danger)", children: d.status }),
        /* @__PURE__ */ r("span", { style: { color: "var(--muted)", fontSize: 12 }, children: [
          d.kind,
          d.meta.tool ? ` · ${d.meta.tool}` : "",
          d.meta.kind ? ` · ${d.meta.kind}` : ""
        ] })
      ] }),
      /* @__PURE__ */ r("div", { className: "sf-tr-kv", children: [
        /* @__PURE__ */ r("span", { children: [
          "start ",
          /* @__PURE__ */ r("b", { children: [
            "+",
            N((d.start - u) * 1e3)
          ] })
        ] }),
        /* @__PURE__ */ r("span", { children: [
          "duration ",
          /* @__PURE__ */ e("b", { children: N((d.end - d.start) * 1e3) })
        ] }),
        d.meta.approval_ms != null && /* @__PURE__ */ r("span", { children: [
          "approval wait ",
          /* @__PURE__ */ e("b", { children: N(d.meta.approval_ms) })
        ] }),
        d.meta.credits != null && d.kind !== "run" && /* @__PURE__ */ r("span", { children: [
          "credits ",
          /* @__PURE__ */ e("b", { children: d.meta.credits.toFixed(3) })
        ] }),
        d.meta.model_calls != null && /* @__PURE__ */ r("span", { children: [
          "model calls ",
          /* @__PURE__ */ e("b", { children: d.meta.model_calls })
        ] }),
        d.meta.context_pct != null && /* @__PURE__ */ r("span", { children: [
          "context used ",
          /* @__PURE__ */ r("b", { children: [
            d.meta.context_pct.toFixed(1),
            "%"
          ] })
        ] }),
        d.meta.model && /* @__PURE__ */ r("span", { children: [
          "model ",
          /* @__PURE__ */ e("b", { children: d.meta.model })
        ] })
      ] }),
      d.input && /* @__PURE__ */ r(T, { children: [
        /* @__PURE__ */ e("div", { className: "sf-label", children: d.kind === "turn" ? "prompt" : "input" }),
        /* @__PURE__ */ e("pre", { className: "sf-pre", children: d.input })
      ] }),
      d.output && /* @__PURE__ */ r(T, { children: [
        /* @__PURE__ */ e("div", { className: "sf-label", children: d.kind === "turn" ? "stop reason" : "output" }),
        /* @__PURE__ */ e("pre", { className: "sf-pre", children: d.output })
      ] }),
      !d.input && !d.output && /* @__PURE__ */ e("div", { className: "sf-empty", style: { padding: 8 }, children: "No input or output recorded for this span." })
    ] })
  ] });
}
function Ne({ run: t, api: a, onClose: n }) {
  var b;
  const [i, c] = x("steps"), [s, f] = x(null), [l, p] = x(null), [u, h] = x(null);
  q(() => {
    let g = !0;
    const y = async () => {
      try {
        if (i === "steps") {
          const d = await a.get(`${H}/runs/${encodeURIComponent(t.id)}/steps`);
          if (!g) return;
          d.error ? h(d.error) : (f(d.steps), h(null));
        } else {
          const d = await a.get(`${H}/runs/${encodeURIComponent(t.id)}/trace`);
          if (!g) return;
          d.error ? h(d.error) : (p(d.found ? d.spans : []), h(null));
        }
      } catch (d) {
        g && h(String(d));
      }
    };
    y();
    const L = t.live ? window.setInterval(y, 4e3) : null;
    return () => {
      g = !1, L && window.clearInterval(L);
    };
  }, [a, t.id, t.live, i]);
  const m = t.session, I = /* @__PURE__ */ e("div", { className: "sf-views", role: "tablist", "aria-label": "Transcript view", children: ["steps", "trace", "json"].map((g) => /* @__PURE__ */ e("button", { role: "tab", "aria-selected": i === g, "data-on": i === g, onClick: () => c(g), children: g === "steps" ? "Steps" : g === "trace" ? "Trace" : "JSON" }, g)) });
  return /* @__PURE__ */ r(
    ee,
    {
      onClose: n,
      wide: i !== "steps",
      actions: I,
      title: /* @__PURE__ */ r("span", { className: "sf-row", children: [
        /* @__PURE__ */ e(Q, { size: 16, style: { color: F(t.agent) } }),
        j(t.agent),
        " ",
        /* @__PURE__ */ e("span", { style: { color: "var(--muted)", fontWeight: 400 }, children: t.kind }),
        " ",
        /* @__PURE__ */ e(U, { o: t.outcome, live: t.live })
      ] }),
      sub: /* @__PURE__ */ r("span", { children: [
        (m == null ? void 0 : m.title) ?? "",
        " · ",
        (m == null ? void 0 : m.model) ?? "",
        " ",
        m != null && m.effort ? `(${m.effort})` : "",
        " · ",
        R(t.duration_ms),
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
          /* @__PURE__ */ e(J, { size: 13, style: { verticalAlign: -2 } }),
          " ",
          t.detail
        ] }),
        u && /* @__PURE__ */ e("div", { className: "sf-empty", children: u }),
        i !== "steps" && !l && !u && /* @__PURE__ */ e("div", { className: "sf-empty", children: "Building trace…" }),
        i !== "steps" && l && l.length === 0 && /* @__PURE__ */ e("div", { className: "sf-empty", children: "Transcript not available on this gateway (the run happened on another machine)." }),
        i === "trace" && l && l.length > 0 && /* @__PURE__ */ e(ke, { spans: l, live: t.live }),
        i === "json" && l && l.length > 0 && /* @__PURE__ */ e("pre", { className: "sf-pre", style: { maxHeight: "none" }, children: JSON.stringify(l, null, 2) }),
        i === "steps" && !s && !u && /* @__PURE__ */ e("div", { className: "sf-empty", children: "Loading transcript…" }),
        i === "steps" && s && s.length === 0 && /* @__PURE__ */ e("div", { className: "sf-empty", children: "Transcript not available on this gateway (the run happened on another machine)." }),
        i === "steps" && (s == null ? void 0 : s.map((g, y) => g.kind === "tool" ? /* @__PURE__ */ r("div", { className: "sf-step", children: [
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
        ] }, y) : g.kind === "text" ? /* @__PURE__ */ r("div", { className: "sf-step", children: [
          /* @__PURE__ */ e("span", { className: "sf-dot", style: { marginTop: 5, background: F(t.agent) } }),
          /* @__PURE__ */ e("div", { className: "sf-text", style: { flex: 1 }, children: g.text })
        ] }, y) : /* @__PURE__ */ r("div", { className: "sf-step", style: { color: "var(--muted)" }, children: [
          /* @__PURE__ */ e(ie, { size: 14 }),
          " turn ended (",
          g.reason,
          ")"
        ] }, y)))
      ]
    }
  );
}
function _e({ state: t }) {
  const a = Math.max(1, ...t.agents.map((s) => s.avg_duration_ms ?? 0)), n = O(() => {
    var p;
    const s = [], f = /* @__PURE__ */ new Date();
    f.setHours(0, 0, 0, 0);
    for (let u = 13; u >= 0; u--) {
      const h = new Date(f);
      h.setDate(f.getDate() - u), s.push({ day: h.toLocaleDateString([], { weekday: "short" }), completed: 0, failed: 0, credits: 0 });
    }
    const l = f.getTime() / 1e3 - 13 * 86400;
    for (const u of t.runs) {
      if (!u.started_at || u.started_at < l) continue;
      const h = Math.min(13, Math.floor((u.started_at - l) / 86400));
      u.outcome === "completed" ? s[h].completed++ : u.outcome !== "running" && s[h].failed++, s[h].credits += ((p = u.session) == null ? void 0 : p.credits) ?? 0;
    }
    return s;
  }, [t.runs]), i = Math.max(1, ...n.map((s) => s.completed + s.failed)), c = Math.max(1, ...n.map((s) => s.credits));
  return /* @__PURE__ */ r(T, { children: [
    /* @__PURE__ */ e("div", { className: "sf-grid", style: { marginBottom: 16 }, children: t.agents.map((s) => /* @__PURE__ */ r("div", { className: "sf-agent", style: { "--sf-c": F(s.id) }, children: [
      /* @__PURE__ */ r("div", { className: "sf-row", style: { justifyContent: "space-between" }, children: [
        /* @__PURE__ */ r("div", { className: "sf-row", children: [
          /* @__PURE__ */ e(Q, { size: 16, style: { color: F(s.id) } }),
          /* @__PURE__ */ e("strong", { style: { color: "var(--text-strong)" }, children: s.label })
        ] }),
        s.live > 0 ? /* @__PURE__ */ r(A, { tone: "var(--accent)", children: [
          /* @__PURE__ */ e("span", { className: "sf-dot sf-pulse", style: { background: "var(--accent)", width: 7, height: 7 } }),
          "running"
        ] }) : s.installed ? /* @__PURE__ */ e(A, { tone: "var(--ok)", children: "template installed" }) : /* @__PURE__ */ e(A, { tone: "var(--danger)", children: "template missing" })
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
          R(s.avg_duration_ms),
          " / ",
          R(s.p90_duration_ms)
        ] }),
        /* @__PURE__ */ e("dt", { children: "Avg credits" }),
        /* @__PURE__ */ e("dd", { children: s.avg_credits ?? "–" }),
        /* @__PURE__ */ e("dt", { children: "Model" }),
        /* @__PURE__ */ e("dd", { className: "sf-mono", children: s.model ?? "–" }),
        /* @__PURE__ */ e("dt", { children: "Last run" }),
        /* @__PURE__ */ r("dd", { children: [
          _(s.last_run_at),
          " ",
          s.last_outcome && /* @__PURE__ */ r("span", { style: { color: Z(s.last_outcome) }, children: [
            "· ",
            s.last_outcome
          ] })
        ] })
      ] }),
      /* @__PURE__ */ e("div", { className: "sf-bar", title: "Average duration relative to the slowest agent", children: /* @__PURE__ */ e("i", { style: { width: `${Math.round(100 * (s.avg_duration_ms ?? 0) / a)}%` } }) })
    ] }, s.id)) }),
    /* @__PURE__ */ r("div", { className: "sf-grid", children: [
      /* @__PURE__ */ r(M, { children: [
        /* @__PURE__ */ e(C, { children: "Runs per day (14d)" }),
        /* @__PURE__ */ e("div", { className: "sf-spark", style: { "--sf-c": "var(--accent)" }, children: n.map((s, f) => /* @__PURE__ */ e("i", { title: `${s.day}: ${s.completed} ok, ${s.failed} failed`, style: { height: `${Math.round(100 * (s.completed + s.failed) / i)}%`, background: s.failed ? `linear-gradient(to top, var(--danger) ${Math.round(100 * s.failed / Math.max(1, s.completed + s.failed))}%, var(--accent) 0)` : void 0 } }, f)) }),
        /* @__PURE__ */ r("div", { className: "sf-meta", style: { justifyContent: "space-between" }, children: [
          /* @__PURE__ */ e("span", { children: n[0].day }),
          /* @__PURE__ */ e("span", { children: "today" })
        ] })
      ] }),
      /* @__PURE__ */ r(M, { children: [
        /* @__PURE__ */ e(C, { children: "Credits per day (14d)" }),
        /* @__PURE__ */ e("div", { className: "sf-spark", style: { "--sf-c": "var(--warn)" }, children: n.map((s, f) => /* @__PURE__ */ e("i", { title: `${s.day}: ${s.credits.toFixed(1)} credits`, style: { height: `${Math.round(100 * s.credits / c)}%` } }, f)) }),
        /* @__PURE__ */ r("div", { className: "sf-meta", style: { justifyContent: "space-between" }, children: [
          /* @__PURE__ */ e("span", { children: n[0].day }),
          /* @__PURE__ */ e("span", { children: "today" })
        ] })
      ] })
    ] })
  ] });
}
function S({ ok: t, unknown: a }) {
  return /* @__PURE__ */ e("span", { className: "sf-dot", style: { background: a ? "var(--muted)" : t ? "var(--ok)" : "var(--danger)", width: 10, height: 10 } });
}
function ze({ infra: t }) {
  return /* @__PURE__ */ r("div", { className: "sf-grid", children: [
    /* @__PURE__ */ r(M, { children: [
      /* @__PURE__ */ e(C, { children: "Health" }),
      /* @__PURE__ */ r("dl", { className: "sf-kv", style: { gridTemplateColumns: "auto 1fr" }, children: [
        /* @__PURE__ */ e("dt", { children: /* @__PURE__ */ e(S, { ok: t.runner_ok }) }),
        /* @__PURE__ */ r("dd", { children: [
          "Actions runner ",
          t.runner_ok ? "online" : "offline",
          t.runners.map((a) => ` · ${a.name}${a.busy ? " (busy)" : ""}`)
        ] }),
        /* @__PURE__ */ e("dt", { children: /* @__PURE__ */ e(S, { ok: !!t.webhooks_enabled, unknown: t.webhooks_enabled == null }) }),
        /* @__PURE__ */ r("dd", { children: [
          "Inbound webhooks ",
          t.webhooks_enabled == null ? "unknown (switch not readable here)" : t.webhooks_enabled ? "enabled" : "DISABLED"
        ] }),
        /* @__PURE__ */ e("dt", { children: /* @__PURE__ */ e(S, { ok: t.templates_ok }) }),
        /* @__PURE__ */ r("dd", { children: [
          "Agent templates ",
          Object.values(t.templates).filter(Boolean).length,
          "/",
          Object.keys(t.templates).length,
          " installed on this gateway"
        ] }),
        /* @__PURE__ */ e("dt", { children: /* @__PURE__ */ e(S, { ok: t.workflow_failures_recent === 0 }) }),
        /* @__PURE__ */ r("dd", { children: [
          t.workflow_failures_recent,
          " failed workflow runs in the last 30 · last event ",
          _(t.workflow_last_at)
        ] }),
        /* @__PURE__ */ e("dt", { children: /* @__PURE__ */ e(le, { size: 12 }) }),
        /* @__PURE__ */ r("dd", { children: [
          "Gateway host ",
          /* @__PURE__ */ e("span", { className: "sf-mono", children: t.gateway_host })
        ] })
      ] }),
      t.errors.length > 0 && /* @__PURE__ */ e("div", { className: "sf-warnbox", style: { marginTop: 12 }, children: t.errors.map((a, n) => /* @__PURE__ */ e("div", { children: a }, n)) })
    ] }),
    /* @__PURE__ */ r(M, { children: [
      /* @__PURE__ */ e(C, { children: "Webhook sources" }),
      !t.sources_readable && /* @__PURE__ */ e("div", { className: "sf-empty", children: "Source list not readable from the backend on this host. Check Settings → Webhooks." }),
      t.sources.map((a) => /* @__PURE__ */ r("div", { className: "sf-row", style: { padding: "6px 0", borderBottom: "1px solid var(--border)", fontSize: 12.5 }, children: [
        /* @__PURE__ */ e(S, { ok: a.enabled }),
        /* @__PURE__ */ e("span", { style: { flex: 1 }, children: a.label || a.id }),
        /* @__PURE__ */ e("span", { className: "sf-mono", style: { color: "var(--muted)" }, children: a.agent }),
        a.signed && /* @__PURE__ */ e("span", { className: "sf-chip", children: "signed" }),
        /* @__PURE__ */ e("span", { style: { color: "var(--muted)" }, children: _(a.last_used_at) })
      ] }, a.id))
    ] }),
    /* @__PURE__ */ r(M, { children: [
      /* @__PURE__ */ e(C, { children: "Templates" }),
      Object.entries(t.templates).map(([a, n]) => /* @__PURE__ */ r("div", { className: "sf-row", style: { padding: "6px 0", borderBottom: "1px solid var(--border)", fontSize: 12.5 }, children: [
        /* @__PURE__ */ e(S, { ok: n }),
        /* @__PURE__ */ r("span", { className: "sf-mono", children: [
          a,
          ".json"
        ] }),
        /* @__PURE__ */ e("span", { style: { marginLeft: "auto", color: "var(--muted)" }, children: n ? "~/.kiro/agents" : "run scripts/install-agent.sh" })
      ] }, a))
    ] }),
    /* @__PURE__ */ r(M, { children: [
      /* @__PURE__ */ e(C, { children: "Recent workflow runs" }),
      t.workflow_recent.map((a) => /* @__PURE__ */ r("div", { className: "sf-row", style: { padding: "6px 0", borderBottom: "1px solid var(--border)", fontSize: 12.5 }, children: [
        /* @__PURE__ */ e(S, { ok: a.conclusion === "success", unknown: !a.conclusion }),
        /* @__PURE__ */ e("a", { className: "sf-link", href: a.url, target: "_blank", rel: "noreferrer", style: { flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, children: a.title || a.name }),
        /* @__PURE__ */ e("span", { className: "sf-mono", style: { color: "var(--muted)" }, children: a.event }),
        /* @__PURE__ */ e("span", { style: { color: "var(--muted)" }, children: _(a.created_at) })
      ] }, a.id))
    ] })
  ] });
}
function Ae() {
  const { state: t, error: a, loading: n, reload: i, api: c } = ge(), [s, f] = x("board"), [l, p] = x(null), [u, h] = x(null), m = (t == null ? void 0 : t.board.find((b) => b.issue === l)) ?? null, I = u ? (t == null ? void 0 : t.runs.find((b) => b.id === u.id || b.session_key && b.session_key === u.session_key)) ?? u : null;
  return /* @__PURE__ */ r("div", { className: "sf-root", children: [
    /* @__PURE__ */ e("style", { children: ue }),
    /* @__PURE__ */ e(
      ae,
      {
        title: "Software Factory",
        subtitle: t ? `${t.repo} · ${t.stats.live_runs > 0 ? `${t.stats.live_runs} agent${t.stats.live_runs > 1 ? "s" : ""} running` : "idle"} · refreshed ${_(t.generated_at)}` : "Issue to merged PR, observed end to end"
      }
    ),
    /* @__PURE__ */ r("div", { className: "sf-body", children: [
      a && /* @__PURE__ */ r("div", { className: "sf-warnbox", children: [
        /* @__PURE__ */ e(J, { size: 13, style: { verticalAlign: -2 } }),
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
          /* @__PURE__ */ e(k, { label: "Median issue → ready", value: t.stats.median_cycle_s != null ? R(t.stats.median_cycle_s * 1e3) : "–" }),
          /* @__PURE__ */ e(k, { label: "Pass rate", value: t.stats.pass_rate != null ? `${t.stats.pass_rate}%` : "–" }),
          /* @__PURE__ */ e(k, { label: "Agent runs (7d)", value: `${t.stats.runs_week}` }),
          /* @__PURE__ */ e(k, { label: "Credits (7d)", value: t.stats.credits_week.toFixed(1) })
        ] }),
        /* @__PURE__ */ r("div", { className: "sf-row", style: { justifyContent: "space-between", flexWrap: "wrap" }, children: [
          /* @__PURE__ */ e(ve, { value: s, onChange: f, items: [["board", "Board"], ["runs", "Agent runs"], ["agents", "Agents"], ["infra", "Infrastructure"]] }),
          /* @__PURE__ */ r("div", { className: "sf-row", style: { marginBottom: 16 }, children: [
            /* @__PURE__ */ e("span", { className: "sf-row", style: { fontSize: 12, color: "var(--muted)" }, children: t.stats.live_runs > 0 ? /* @__PURE__ */ r(T, { children: [
              /* @__PURE__ */ e(se, { size: 13, className: "sf-pulse", style: { color: "var(--accent)" } }),
              " live"
            ] }) : /* @__PURE__ */ r(T, { children: [
              /* @__PURE__ */ e(ne, { size: 13 }),
              " polling"
            ] }) }),
            /* @__PURE__ */ r("button", { className: "sf-btn", onClick: i, children: [
              /* @__PURE__ */ e(oe, { size: 13 }),
              " Refresh"
            ] })
          ] })
        ] }),
        s === "board" && /* @__PURE__ */ e(be, { state: t, onOpen: (b) => p(b.issue) }),
        s === "runs" && /* @__PURE__ */ e(ye, { runs: t.runs, onWatch: h }),
        s === "agents" && /* @__PURE__ */ e(_e, { state: t }),
        s === "infra" && /* @__PURE__ */ e(ze, { infra: t.infra })
      ] })
    ] }),
    m && !u && /* @__PURE__ */ e(we, { it: m, runs: t.runs, onClose: () => p(null), onWatch: h }),
    I && /* @__PURE__ */ e(Ne, { run: I, api: c, onClose: () => h(null) })
  ] });
}
export {
  Ae as default
};
