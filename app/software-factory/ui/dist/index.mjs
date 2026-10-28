import { jsxs as s, jsx as e, Fragment as z } from "react/jsx-runtime";
import { useAppApi as B } from "@kirocrew/app-sdk";
import { PageHeader as F, StatCard as u, CardTitle as y, Card as w } from "@kirocrew/app-sdk/ui";
import { AlertTriangle as M, Activity as P, CircleDot as O, RefreshCw as H, Zap as R, Eye as D, ExternalLink as S, CheckCircle2 as G, Bot as I, Server as K, Clock as U, GitPullRequest as q, X as V } from "lucide-react";
import { useState as g, useRef as X, useCallback as Y, useEffect as A, useMemo as Z } from "react";
const E = "/apps/software-factory/api", k = (t) => {
  if (t == null) return "–";
  const r = Math.round(t / 1e3);
  if (r < 60) return `${r}s`;
  const n = Math.floor(r / 60);
  return n < 60 ? `${n}m ${r % 60}s` : `${Math.floor(n / 60)}h ${n % 60}m`;
}, v = (t) => {
  if (!t) return "–";
  const r = Math.max(0, Date.now() / 1e3 - t);
  return r < 60 ? `${Math.round(r)}s ago` : r < 3600 ? `${Math.round(r / 60)}m ago` : r < 86400 ? `${Math.round(r / 3600)}h ago` : `${Math.round(r / 86400)}d ago`;
}, C = (t) => t ? new Date(t * 1e3).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "–", $ = (t) => t.replace("delivery-", "").replace("github-", ""), J = {
  "delivery-planner": "var(--info)",
  "delivery-implementer": "var(--accent)",
  "delivery-reviewer": "var(--warn)",
  "delivery-scribe": "var(--ok)",
  "github-worker": "var(--muted-strong)",
  "pr-gate": "var(--text)"
}, N = (t) => J[t] ?? "var(--muted)", W = {
  planning: "var(--info)",
  "needs-owner": "var(--warn)",
  implementing: "var(--accent)",
  review: "var(--warn)",
  fixing: "var(--warn)",
  gate: "var(--muted-strong)",
  ready: "var(--ok)",
  parked: "var(--danger)",
  shipped: "var(--ok)"
}, j = (t) => t === "completed" ? "var(--ok)" : t === "running" ? "var(--accent)" : "var(--danger)", Q = `
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
`;
function ee() {
  const t = B(), [r, n] = g(null), [d, i] = g(null), [a, h] = g(!0), l = X(null), c = Y(async (o = !1) => {
    try {
      const p = await t.get(`${E}/state${o ? "?refresh=1" : ""}`);
      n(p), i(null);
    } catch (p) {
      i(p instanceof Error ? p.message : String(p));
    } finally {
      h(!1);
    }
  }, [t]);
  return A(() => {
    c();
    const o = () => {
      const p = ((r == null ? void 0 : r.stats.live_runs) ?? 0) > 0;
      l.current = window.setTimeout(async () => {
        await c(), o();
      }, p ? 5e3 : 15e3);
    };
    return o(), () => {
      l.current && window.clearTimeout(l.current);
    };
  }, [c]), { state: r, error: d, loading: a, reload: () => c(!0), api: t };
}
function _({ tone: t, children: r }) {
  return /* @__PURE__ */ e("span", { className: "sf-pill", style: { background: `color-mix(in srgb, ${t} 16%, transparent)`, color: t }, children: r });
}
function T({ o: t, live: r }) {
  const n = j(t);
  return /* @__PURE__ */ s(_, { tone: n, children: [
    /* @__PURE__ */ e("span", { className: `sf-dot ${r ? "sf-pulse" : ""}`, style: { background: n, width: 7, height: 7 } }),
    t
  ] });
}
function te({ value: t, onChange: r, items: n }) {
  return /* @__PURE__ */ e("div", { className: "sf-tabs", role: "tablist", children: n.map(([d, i]) => /* @__PURE__ */ e("button", { role: "tab", "aria-selected": t === d, "data-on": t === d, className: "sf-tab", onClick: () => r(d), children: i }, d)) });
}
function L({ title: t, sub: r, onClose: n, children: d }) {
  return A(() => {
    const i = (a) => {
      a.key === "Escape" && n();
    };
    return window.addEventListener("keydown", i), () => window.removeEventListener("keydown", i);
  }, [n]), /* @__PURE__ */ s(z, { children: [
    /* @__PURE__ */ e("div", { className: "sf-scrim", onClick: n }),
    /* @__PURE__ */ s("aside", { className: "sf-drawer", role: "dialog", "aria-modal": "true", children: [
      /* @__PURE__ */ s("div", { className: "sf-dhead", children: [
        /* @__PURE__ */ s("div", { style: { minWidth: 0 }, children: [
          /* @__PURE__ */ e("div", { style: { fontWeight: 600, fontSize: 15, color: "var(--text-strong)" }, children: t }),
          r && /* @__PURE__ */ e("div", { style: { fontSize: 12, color: "var(--muted)", marginTop: 3 }, children: r })
        ] }),
        /* @__PURE__ */ e("button", { className: "sf-x", onClick: n, "aria-label": "Close", children: /* @__PURE__ */ e(V, { size: 16 }) })
      ] }),
      /* @__PURE__ */ e("div", { className: "sf-dbody", children: d })
    ] })
  ] });
}
function se({ it: t, onOpen: r }) {
  var d;
  const n = !!t.live_agent;
  return /* @__PURE__ */ s("div", { className: "sf-card", "data-live": n, onClick: r, role: "button", tabIndex: 0, onKeyDown: (i) => i.key === "Enter" && r(), children: [
    /* @__PURE__ */ s("div", { className: "sf-row", style: { justifyContent: "space-between", marginBottom: 4 }, children: [
      /* @__PURE__ */ s("span", { className: "sf-mono", style: { color: "var(--muted)" }, children: [
        "#",
        t.issue
      ] }),
      n && /* @__PURE__ */ s(_, { tone: "var(--accent)", children: [
        /* @__PURE__ */ e("span", { className: "sf-dot sf-pulse", style: { background: "var(--accent)", width: 7, height: 7 } }),
        $(t.live_agent)
      ] }),
      !n && ((d = t.pr) == null ? void 0 : d.checks) && /* @__PURE__ */ e("span", { className: "sf-dot", title: `CI ${t.pr.checks}`, style: { background: t.pr.checks === "passing" ? "var(--ok)" : t.pr.checks === "failing" ? "var(--danger)" : "var(--warn)" } })
    ] }),
    /* @__PURE__ */ e("div", { className: "sf-cardtitle", children: t.title }),
    /* @__PURE__ */ s("div", { className: "sf-meta", children: [
      /* @__PURE__ */ s("span", { title: "Time in stage", children: [
        /* @__PURE__ */ e(U, { size: 11, style: { verticalAlign: -1 } }),
        " ",
        v(t.stage_since)
      ] }),
      t.pr && /* @__PURE__ */ s("span", { children: [
        /* @__PURE__ */ e(q, { size: 11, style: { verticalAlign: -1 } }),
        " PR ",
        t.pr.number
      ] }),
      t.rounds > 1 && /* @__PURE__ */ s("span", { children: [
        t.rounds,
        " rounds"
      ] }),
      t.credits > 0 && /* @__PURE__ */ s("span", { children: [
        /* @__PURE__ */ e(R, { size: 11, style: { verticalAlign: -1 } }),
        " ",
        t.credits.toFixed(1)
      ] })
    ] }),
    t.hops.length > 0 && /* @__PURE__ */ e("div", { className: "sf-hops", title: t.hops.map((i) => `${$(i.agent)} ${i.outcome} ${k(i.duration_ms)}`).join(`
`), children: t.hops.map((i) => /* @__PURE__ */ e("span", { className: `sf-hop ${i.live ? "sf-pulse" : ""}`, style: { background: N(i.agent), opacity: i.outcome === "completed" || i.live ? 0.9 : 0.35 } }, i.id)) })
  ] });
}
function re({ state: t, onOpen: r }) {
  const n = t.stages.filter((d) => d.id !== "shipped" || t.stats.by_stage.shipped > 0);
  return /* @__PURE__ */ e("div", { className: "sf-board", children: n.map((d) => {
    const i = t.board.filter((h) => h.stage === d.id), a = d.id === "shipped" ? i.slice(0, 6) : i;
    return /* @__PURE__ */ s("div", { className: "sf-col", children: [
      /* @__PURE__ */ s("div", { className: "sf-colhead", children: [
        /* @__PURE__ */ s("span", { className: "sf-row", children: [
          /* @__PURE__ */ e("span", { className: "sf-dot", style: { background: W[d.id] } }),
          d.label
        ] }),
        /* @__PURE__ */ e("span", { className: "sf-count", children: i.length })
      ] }),
      a.map((h) => /* @__PURE__ */ e(se, { it: h, onOpen: () => r(h) }, h.issue)),
      i.length === 0 && /* @__PURE__ */ e("div", { className: "sf-empty", style: { padding: 10 }, children: "empty" }),
      a.length < i.length && /* @__PURE__ */ s("div", { className: "sf-empty", style: { padding: 6 }, children: [
        "+",
        i.length - a.length,
        " more"
      ] })
    ] }, d.id);
  }) });
}
function ae({ it: t, runs: r, onClose: n, onWatch: d }) {
  var a, h;
  const i = t.hops.map((l) => ({ hop: l, run: r.find((c) => c.id === l.id) }));
  return /* @__PURE__ */ s(L, { onClose: n, title: /* @__PURE__ */ s("span", { children: [
    "#",
    t.issue,
    " ",
    t.title
  ] }), sub: /* @__PURE__ */ s("span", { className: "sf-row", children: [
    /* @__PURE__ */ e(_, { tone: W[t.stage], children: t.stage }),
    /* @__PURE__ */ s("a", { className: "sf-link", href: t.url, target: "_blank", rel: "noreferrer", children: [
      "issue ",
      /* @__PURE__ */ e(S, { size: 11 })
    ] }),
    t.pr && /* @__PURE__ */ s("a", { className: "sf-link", href: t.pr.url, target: "_blank", rel: "noreferrer", children: [
      "PR ",
      t.pr.number,
      " ",
      /* @__PURE__ */ e(S, { size: 11 })
    ] }),
    t.docs_pr && /* @__PURE__ */ s("a", { className: "sf-link", href: t.docs_pr.url, target: "_blank", rel: "noreferrer", children: [
      "docs PR ",
      t.docs_pr.number,
      " ",
      /* @__PURE__ */ e(S, { size: 11 })
    ] })
  ] }), children: [
    /* @__PURE__ */ s("dl", { className: "sf-kv", style: { marginTop: 0, marginBottom: 16 }, children: [
      /* @__PURE__ */ e("dt", { children: "Opened" }),
      /* @__PURE__ */ e("dd", { children: C(t.created_at) }),
      /* @__PURE__ */ e("dt", { children: "In stage since" }),
      /* @__PURE__ */ e("dd", { children: v(t.stage_since) }),
      /* @__PURE__ */ e("dt", { children: "Review rounds" }),
      /* @__PURE__ */ e("dd", { children: t.rounds }),
      /* @__PURE__ */ e("dt", { children: "Credits" }),
      /* @__PURE__ */ e("dd", { children: t.credits.toFixed(2) }),
      /* @__PURE__ */ e("dt", { children: "CI" }),
      /* @__PURE__ */ e("dd", { children: ((a = t.pr) == null ? void 0 : a.checks) ?? "–" }),
      /* @__PURE__ */ e("dt", { children: "Labels" }),
      /* @__PURE__ */ e("dd", { style: { display: "flex", flexWrap: "wrap", gap: 4 }, children: [...t.labels, ...((h = t.pr) == null ? void 0 : h.labels) ?? []].filter((l) => l.startsWith("kiro-")).map((l) => /* @__PURE__ */ e("span", { className: "sf-chip", children: l }, l)) })
    ] }),
    /* @__PURE__ */ e(y, { children: "Hops" }),
    i.length === 0 && /* @__PURE__ */ e("div", { className: "sf-empty", children: "No agent run is linked to this issue on this gateway yet." }),
    /* @__PURE__ */ e("div", { className: "sf-tl", children: i.map(({ hop: l, run: c }) => {
      var o, p, f;
      return /* @__PURE__ */ s("div", { className: "sf-tli", children: [
        /* @__PURE__ */ e("span", { className: `sf-dot ${l.live ? "sf-pulse" : ""}`, style: { background: N(l.agent) } }),
        /* @__PURE__ */ s("div", { className: "sf-row", style: { justifyContent: "space-between" }, children: [
          /* @__PURE__ */ s("div", { children: [
            /* @__PURE__ */ e("strong", { style: { color: "var(--text-strong)", fontSize: 13 }, children: $(l.agent) }),
            /* @__PURE__ */ e("span", { style: { color: "var(--muted)", fontSize: 12, marginLeft: 8 }, children: l.kind })
          ] }),
          /* @__PURE__ */ e(T, { o: l.outcome, live: l.live })
        ] }),
        /* @__PURE__ */ s("div", { className: "sf-meta", children: [
          /* @__PURE__ */ e("span", { children: C(l.started_at) }),
          /* @__PURE__ */ e("span", { children: k(l.duration_ms) }),
          l.credits != null && /* @__PURE__ */ s("span", { children: [
            /* @__PURE__ */ e(R, { size: 11, style: { verticalAlign: -1 } }),
            " ",
            l.credits.toFixed(2)
          ] }),
          ((o = c == null ? void 0 : c.session) == null ? void 0 : o.model) && /* @__PURE__ */ e("span", { children: c.session.model }),
          ((p = c == null ? void 0 : c.session) == null ? void 0 : p.tool_calls) != null && /* @__PURE__ */ s("span", { children: [
            c.session.tool_calls,
            " tool calls"
          ] }),
          (c == null ? void 0 : c.session_key) && /* @__PURE__ */ s("button", { className: "sf-btn", style: { padding: "2px 8px" }, onClick: () => d(c), children: [
            /* @__PURE__ */ e(D, { size: 12 }),
            " ",
            l.live ? "watch live" : "steps"
          ] })
        ] }),
        ((f = c == null ? void 0 : c.session) == null ? void 0 : f.last_text) && /* @__PURE__ */ e("div", { className: "sf-text", style: { marginTop: 8, maxHeight: 90, overflow: "hidden" }, children: c.session.last_text })
      ] }, l.id);
    }) })
  ] });
}
function ne({ runs: t, onWatch: r }) {
  return /* @__PURE__ */ s(w, { children: [
    /* @__PURE__ */ s("table", { className: "sf-table", children: [
      /* @__PURE__ */ e("thead", { children: /* @__PURE__ */ s("tr", { children: [
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
        var d, i, a, h, l, c;
        return /* @__PURE__ */ s("tr", { children: [
          /* @__PURE__ */ e("td", { title: C(n.started_at), children: v(n.started_at) }),
          /* @__PURE__ */ e("td", { children: /* @__PURE__ */ s("span", { className: "sf-row", children: [
            /* @__PURE__ */ e("span", { className: "sf-dot", style: { background: N(n.agent) } }),
            $(n.agent)
          ] }) }),
          /* @__PURE__ */ e("td", { className: "sf-mono", children: n.kind }),
          /* @__PURE__ */ s("td", { children: [
            (d = n.session) != null && d.issue ? `#${n.session.issue}` : "",
            (i = n.session) != null && i.pr ? ` PR ${n.session.pr}` : ""
          ] }),
          /* @__PURE__ */ e("td", { children: /* @__PURE__ */ e(T, { o: n.outcome, live: n.live }) }),
          /* @__PURE__ */ e("td", { children: k(n.duration_ms) }),
          /* @__PURE__ */ e("td", { className: "sf-mono", children: ((a = n.session) == null ? void 0 : a.model) ?? "–" }),
          /* @__PURE__ */ e("td", { children: ((h = n.session) == null ? void 0 : h.tool_calls) ?? "–" }),
          /* @__PURE__ */ e("td", { children: (l = n.session) != null && l.credits ? n.session.credits.toFixed(2) : "–" }),
          /* @__PURE__ */ e("td", { children: n.session_key && ((c = n.session) == null ? void 0 : c.found) && /* @__PURE__ */ s("button", { className: "sf-btn", onClick: () => r(n), children: [
            /* @__PURE__ */ e(D, { size: 12 }),
            " ",
            n.live ? "watch" : "steps"
          ] }) })
        ] }, n.id);
      }) })
    ] }),
    t.length === 0 && /* @__PURE__ */ e("div", { className: "sf-empty", children: "No webhook runs recorded for this repository on this gateway." })
  ] });
}
function le({ run: t, api: r, onClose: n }) {
  var c;
  const [d, i] = g(null), [a, h] = g(null);
  A(() => {
    let o = !0;
    const p = async () => {
      try {
        const m = await r.get(`${E}/runs/${encodeURIComponent(t.id)}/steps`);
        if (!o) return;
        m.error ? h(m.error) : i(m.steps);
      } catch (m) {
        o && h(String(m));
      }
    };
    p();
    const f = t.live ? window.setInterval(p, 4e3) : null;
    return () => {
      o = !1, f && window.clearInterval(f);
    };
  }, [r, t.id, t.live]);
  const l = t.session;
  return /* @__PURE__ */ s(
    L,
    {
      onClose: n,
      title: /* @__PURE__ */ s("span", { className: "sf-row", children: [
        /* @__PURE__ */ e(I, { size: 16, style: { color: N(t.agent) } }),
        $(t.agent),
        " ",
        /* @__PURE__ */ e("span", { style: { color: "var(--muted)", fontWeight: 400 }, children: t.kind }),
        " ",
        /* @__PURE__ */ e(T, { o: t.outcome, live: t.live })
      ] }),
      sub: /* @__PURE__ */ s("span", { children: [
        (l == null ? void 0 : l.title) ?? "",
        " · ",
        (l == null ? void 0 : l.model) ?? "",
        " ",
        l != null && l.effort ? `(${l.effort})` : "",
        " · ",
        k(t.duration_ms),
        " · ",
        (l == null ? void 0 : l.tool_calls) ?? 0,
        " tool calls · ",
        ((c = l == null ? void 0 : l.credits) == null ? void 0 : c.toFixed(2)) ?? "0",
        " credits",
        l != null && l.issue ? ` · #${l.issue}` : "",
        l != null && l.pr ? ` · PR ${l.pr}` : ""
      ] }),
      children: [
        t.detail && /* @__PURE__ */ s("div", { className: "sf-warnbox", children: [
          /* @__PURE__ */ e(M, { size: 13, style: { verticalAlign: -2 } }),
          " ",
          t.detail
        ] }),
        a && /* @__PURE__ */ e("div", { className: "sf-empty", children: a }),
        !d && !a && /* @__PURE__ */ e("div", { className: "sf-empty", children: "Loading transcript…" }),
        d && d.length === 0 && /* @__PURE__ */ e("div", { className: "sf-empty", children: "Transcript not available on this gateway (the run happened on another machine)." }),
        d == null ? void 0 : d.map((o, p) => o.kind === "tool" ? /* @__PURE__ */ s("div", { className: "sf-step", children: [
          /* @__PURE__ */ e("span", { className: "sf-dot", style: { marginTop: 5, background: o.ok === !1 ? "var(--danger)" : o.ok ? "var(--ok)" : "var(--muted)" } }),
          /* @__PURE__ */ s("div", { style: { minWidth: 0, flex: 1 }, children: [
            /* @__PURE__ */ s("div", { style: { color: "var(--text-strong)" }, children: [
              o.title,
              " ",
              /* @__PURE__ */ e("span", { style: { color: "var(--muted)", fontSize: 11 }, children: o.tool })
            ] }),
            o.detail && /* @__PURE__ */ e("div", { className: "sf-mono", children: o.detail })
          ] }),
          /* @__PURE__ */ e("span", { style: { color: "var(--muted)", fontSize: 11, whiteSpace: "nowrap" }, children: o.t ? new Date(o.t).toLocaleTimeString() : "" })
        ] }, p) : o.kind === "text" ? /* @__PURE__ */ s("div", { className: "sf-step", children: [
          /* @__PURE__ */ e("span", { className: "sf-dot", style: { marginTop: 5, background: N(t.agent) } }),
          /* @__PURE__ */ e("div", { className: "sf-text", style: { flex: 1 }, children: o.text })
        ] }, p) : /* @__PURE__ */ s("div", { className: "sf-step", style: { color: "var(--muted)" }, children: [
          /* @__PURE__ */ e(G, { size: 14 }),
          " turn ended (",
          o.reason,
          ")"
        ] }, p))
      ]
    }
  );
}
function oe({ state: t }) {
  const r = Math.max(1, ...t.agents.map((a) => a.avg_duration_ms ?? 0)), n = Z(() => {
    var c;
    const a = [], h = /* @__PURE__ */ new Date();
    h.setHours(0, 0, 0, 0);
    for (let o = 13; o >= 0; o--) {
      const p = new Date(h);
      p.setDate(h.getDate() - o), a.push({ day: p.toLocaleDateString([], { weekday: "short" }), completed: 0, failed: 0, credits: 0 });
    }
    const l = h.getTime() / 1e3 - 13 * 86400;
    for (const o of t.runs) {
      if (!o.started_at || o.started_at < l) continue;
      const p = Math.min(13, Math.floor((o.started_at - l) / 86400));
      o.outcome === "completed" ? a[p].completed++ : o.outcome !== "running" && a[p].failed++, a[p].credits += ((c = o.session) == null ? void 0 : c.credits) ?? 0;
    }
    return a;
  }, [t.runs]), d = Math.max(1, ...n.map((a) => a.completed + a.failed)), i = Math.max(1, ...n.map((a) => a.credits));
  return /* @__PURE__ */ s(z, { children: [
    /* @__PURE__ */ e("div", { className: "sf-grid", style: { marginBottom: 16 }, children: t.agents.map((a) => /* @__PURE__ */ s("div", { className: "sf-agent", style: { "--sf-c": N(a.id) }, children: [
      /* @__PURE__ */ s("div", { className: "sf-row", style: { justifyContent: "space-between" }, children: [
        /* @__PURE__ */ s("div", { className: "sf-row", children: [
          /* @__PURE__ */ e(I, { size: 16, style: { color: N(a.id) } }),
          /* @__PURE__ */ e("strong", { style: { color: "var(--text-strong)" }, children: a.label })
        ] }),
        a.live > 0 ? /* @__PURE__ */ s(_, { tone: "var(--accent)", children: [
          /* @__PURE__ */ e("span", { className: "sf-dot sf-pulse", style: { background: "var(--accent)", width: 7, height: 7 } }),
          "running"
        ] }) : a.installed ? /* @__PURE__ */ e(_, { tone: "var(--ok)", children: "template installed" }) : /* @__PURE__ */ e(_, { tone: "var(--danger)", children: "template missing" })
      ] }),
      /* @__PURE__ */ e("div", { style: { fontSize: 12, color: "var(--muted)", marginTop: 4 }, children: a.role }),
      /* @__PURE__ */ s("dl", { className: "sf-kv", children: [
        /* @__PURE__ */ e("dt", { children: "Runs" }),
        /* @__PURE__ */ s("dd", { children: [
          a.runs,
          " ",
          /* @__PURE__ */ s("span", { style: { color: "var(--muted)", fontWeight: 400 }, children: [
            "(",
            a.completed,
            " ok, ",
            a.failed,
            " failed)"
          ] })
        ] }),
        /* @__PURE__ */ e("dt", { children: "Avg / p90" }),
        /* @__PURE__ */ s("dd", { children: [
          k(a.avg_duration_ms),
          " / ",
          k(a.p90_duration_ms)
        ] }),
        /* @__PURE__ */ e("dt", { children: "Avg credits" }),
        /* @__PURE__ */ e("dd", { children: a.avg_credits ?? "–" }),
        /* @__PURE__ */ e("dt", { children: "Model" }),
        /* @__PURE__ */ e("dd", { className: "sf-mono", children: a.model ?? "–" }),
        /* @__PURE__ */ e("dt", { children: "Last run" }),
        /* @__PURE__ */ s("dd", { children: [
          v(a.last_run_at),
          " ",
          a.last_outcome && /* @__PURE__ */ s("span", { style: { color: j(a.last_outcome) }, children: [
            "· ",
            a.last_outcome
          ] })
        ] })
      ] }),
      /* @__PURE__ */ e("div", { className: "sf-bar", title: "Average duration relative to the slowest agent", children: /* @__PURE__ */ e("i", { style: { width: `${Math.round(100 * (a.avg_duration_ms ?? 0) / r)}%` } }) })
    ] }, a.id)) }),
    /* @__PURE__ */ s("div", { className: "sf-grid", children: [
      /* @__PURE__ */ s(w, { children: [
        /* @__PURE__ */ e(y, { children: "Runs per day (14d)" }),
        /* @__PURE__ */ e("div", { className: "sf-spark", style: { "--sf-c": "var(--accent)" }, children: n.map((a, h) => /* @__PURE__ */ e("i", { title: `${a.day}: ${a.completed} ok, ${a.failed} failed`, style: { height: `${Math.round(100 * (a.completed + a.failed) / d)}%`, background: a.failed ? `linear-gradient(to top, var(--danger) ${Math.round(100 * a.failed / Math.max(1, a.completed + a.failed))}%, var(--accent) 0)` : void 0 } }, h)) }),
        /* @__PURE__ */ s("div", { className: "sf-meta", style: { justifyContent: "space-between" }, children: [
          /* @__PURE__ */ e("span", { children: n[0].day }),
          /* @__PURE__ */ e("span", { children: "today" })
        ] })
      ] }),
      /* @__PURE__ */ s(w, { children: [
        /* @__PURE__ */ e(y, { children: "Credits per day (14d)" }),
        /* @__PURE__ */ e("div", { className: "sf-spark", style: { "--sf-c": "var(--warn)" }, children: n.map((a, h) => /* @__PURE__ */ e("i", { title: `${a.day}: ${a.credits.toFixed(1)} credits`, style: { height: `${Math.round(100 * a.credits / i)}%` } }, h)) }),
        /* @__PURE__ */ s("div", { className: "sf-meta", style: { justifyContent: "space-between" }, children: [
          /* @__PURE__ */ e("span", { children: n[0].day }),
          /* @__PURE__ */ e("span", { children: "today" })
        ] })
      ] })
    ] })
  ] });
}
function x({ ok: t, unknown: r }) {
  return /* @__PURE__ */ e("span", { className: "sf-dot", style: { background: r ? "var(--muted)" : t ? "var(--ok)" : "var(--danger)", width: 10, height: 10 } });
}
function ie({ infra: t }) {
  return /* @__PURE__ */ s("div", { className: "sf-grid", children: [
    /* @__PURE__ */ s(w, { children: [
      /* @__PURE__ */ e(y, { children: "Health" }),
      /* @__PURE__ */ s("dl", { className: "sf-kv", style: { gridTemplateColumns: "auto 1fr" }, children: [
        /* @__PURE__ */ e("dt", { children: /* @__PURE__ */ e(x, { ok: t.runner_ok }) }),
        /* @__PURE__ */ s("dd", { children: [
          "Actions runner ",
          t.runner_ok ? "online" : "offline",
          t.runners.map((r) => ` · ${r.name}${r.busy ? " (busy)" : ""}`)
        ] }),
        /* @__PURE__ */ e("dt", { children: /* @__PURE__ */ e(x, { ok: !!t.webhooks_enabled, unknown: t.webhooks_enabled == null }) }),
        /* @__PURE__ */ s("dd", { children: [
          "Inbound webhooks ",
          t.webhooks_enabled == null ? "unknown (switch not readable here)" : t.webhooks_enabled ? "enabled" : "DISABLED"
        ] }),
        /* @__PURE__ */ e("dt", { children: /* @__PURE__ */ e(x, { ok: t.templates_ok }) }),
        /* @__PURE__ */ s("dd", { children: [
          "Agent templates ",
          Object.values(t.templates).filter(Boolean).length,
          "/",
          Object.keys(t.templates).length,
          " installed on this gateway"
        ] }),
        /* @__PURE__ */ e("dt", { children: /* @__PURE__ */ e(x, { ok: t.workflow_failures_recent === 0 }) }),
        /* @__PURE__ */ s("dd", { children: [
          t.workflow_failures_recent,
          " failed workflow runs in the last 30 · last event ",
          v(t.workflow_last_at)
        ] }),
        /* @__PURE__ */ e("dt", { children: /* @__PURE__ */ e(K, { size: 12 }) }),
        /* @__PURE__ */ s("dd", { children: [
          "Gateway host ",
          /* @__PURE__ */ e("span", { className: "sf-mono", children: t.gateway_host })
        ] })
      ] }),
      t.errors.length > 0 && /* @__PURE__ */ e("div", { className: "sf-warnbox", style: { marginTop: 12 }, children: t.errors.map((r, n) => /* @__PURE__ */ e("div", { children: r }, n)) })
    ] }),
    /* @__PURE__ */ s(w, { children: [
      /* @__PURE__ */ e(y, { children: "Webhook sources" }),
      !t.sources_readable && /* @__PURE__ */ e("div", { className: "sf-empty", children: "Source list not readable from the backend on this host. Check Settings → Webhooks." }),
      t.sources.map((r) => /* @__PURE__ */ s("div", { className: "sf-row", style: { padding: "6px 0", borderBottom: "1px solid var(--border)", fontSize: 12.5 }, children: [
        /* @__PURE__ */ e(x, { ok: r.enabled }),
        /* @__PURE__ */ e("span", { style: { flex: 1 }, children: r.label || r.id }),
        /* @__PURE__ */ e("span", { className: "sf-mono", style: { color: "var(--muted)" }, children: r.agent }),
        r.signed && /* @__PURE__ */ e("span", { className: "sf-chip", children: "signed" }),
        /* @__PURE__ */ e("span", { style: { color: "var(--muted)" }, children: v(r.last_used_at) })
      ] }, r.id))
    ] }),
    /* @__PURE__ */ s(w, { children: [
      /* @__PURE__ */ e(y, { children: "Templates" }),
      Object.entries(t.templates).map(([r, n]) => /* @__PURE__ */ s("div", { className: "sf-row", style: { padding: "6px 0", borderBottom: "1px solid var(--border)", fontSize: 12.5 }, children: [
        /* @__PURE__ */ e(x, { ok: n }),
        /* @__PURE__ */ s("span", { className: "sf-mono", children: [
          r,
          ".json"
        ] }),
        /* @__PURE__ */ e("span", { style: { marginLeft: "auto", color: "var(--muted)" }, children: n ? "~/.kiro/agents" : "run scripts/install-agent.sh" })
      ] }, r))
    ] }),
    /* @__PURE__ */ s(w, { children: [
      /* @__PURE__ */ e(y, { children: "Recent workflow runs" }),
      t.workflow_recent.map((r) => /* @__PURE__ */ s("div", { className: "sf-row", style: { padding: "6px 0", borderBottom: "1px solid var(--border)", fontSize: 12.5 }, children: [
        /* @__PURE__ */ e(x, { ok: r.conclusion === "success", unknown: !r.conclusion }),
        /* @__PURE__ */ e("a", { className: "sf-link", href: r.url, target: "_blank", rel: "noreferrer", style: { flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, children: r.title || r.name }),
        /* @__PURE__ */ e("span", { className: "sf-mono", style: { color: "var(--muted)" }, children: r.event }),
        /* @__PURE__ */ e("span", { style: { color: "var(--muted)" }, children: v(r.created_at) })
      ] }, r.id))
    ] })
  ] });
}
function me() {
  const { state: t, error: r, loading: n, reload: d, api: i } = ee(), [a, h] = g("board"), [l, c] = g(null), [o, p] = g(null), f = (t == null ? void 0 : t.board.find((b) => b.issue === l)) ?? null, m = o ? (t == null ? void 0 : t.runs.find((b) => b.id === o.id || b.session_key && b.session_key === o.session_key)) ?? o : null;
  return /* @__PURE__ */ s("div", { className: "sf-root", children: [
    /* @__PURE__ */ e("style", { children: Q }),
    /* @__PURE__ */ e(
      F,
      {
        title: "Software Factory",
        subtitle: t ? `${t.repo} · ${t.stats.live_runs > 0 ? `${t.stats.live_runs} agent${t.stats.live_runs > 1 ? "s" : ""} running` : "idle"} · refreshed ${v(t.generated_at)}` : "Issue to merged PR, observed end to end"
      }
    ),
    /* @__PURE__ */ s("div", { className: "sf-body", children: [
      r && /* @__PURE__ */ s("div", { className: "sf-warnbox", children: [
        /* @__PURE__ */ e(M, { size: 13, style: { verticalAlign: -2 } }),
        " ",
        r
      ] }),
      n && !t && /* @__PURE__ */ e("div", { className: "sf-empty", children: "Reading GitHub and the gateway…" }),
      t && /* @__PURE__ */ s(z, { children: [
        /* @__PURE__ */ s("div", { className: "sf-stats", children: [
          /* @__PURE__ */ e(u, { label: "In flight", value: String(t.stats.in_flight), accent: !0 }),
          /* @__PURE__ */ e(u, { label: "Ready to merge", value: String(t.stats.ready) }),
          /* @__PURE__ */ e(u, { label: "Parked", value: String(t.stats.parked) }),
          /* @__PURE__ */ e(u, { label: "Shipped", value: String(t.stats.shipped) }),
          /* @__PURE__ */ e(u, { label: "Median issue → ready", value: t.stats.median_cycle_s != null ? k(t.stats.median_cycle_s * 1e3) : "–" }),
          /* @__PURE__ */ e(u, { label: "Pass rate", value: t.stats.pass_rate != null ? `${t.stats.pass_rate}%` : "–" }),
          /* @__PURE__ */ e(u, { label: "Agent runs (7d)", value: `${t.stats.runs_week}` }),
          /* @__PURE__ */ e(u, { label: "Credits (7d)", value: t.stats.credits_week.toFixed(1) })
        ] }),
        /* @__PURE__ */ s("div", { className: "sf-row", style: { justifyContent: "space-between", flexWrap: "wrap" }, children: [
          /* @__PURE__ */ e(te, { value: a, onChange: h, items: [["board", "Board"], ["runs", "Agent runs"], ["agents", "Agents"], ["infra", "Infrastructure"]] }),
          /* @__PURE__ */ s("div", { className: "sf-row", style: { marginBottom: 16 }, children: [
            /* @__PURE__ */ e("span", { className: "sf-row", style: { fontSize: 12, color: "var(--muted)" }, children: t.stats.live_runs > 0 ? /* @__PURE__ */ s(z, { children: [
              /* @__PURE__ */ e(P, { size: 13, className: "sf-pulse", style: { color: "var(--accent)" } }),
              " live"
            ] }) : /* @__PURE__ */ s(z, { children: [
              /* @__PURE__ */ e(O, { size: 13 }),
              " polling"
            ] }) }),
            /* @__PURE__ */ s("button", { className: "sf-btn", onClick: d, children: [
              /* @__PURE__ */ e(H, { size: 13 }),
              " Refresh"
            ] })
          ] })
        ] }),
        a === "board" && /* @__PURE__ */ e(re, { state: t, onOpen: (b) => c(b.issue) }),
        a === "runs" && /* @__PURE__ */ e(ne, { runs: t.runs, onWatch: p }),
        a === "agents" && /* @__PURE__ */ e(oe, { state: t }),
        a === "infra" && /* @__PURE__ */ e(ie, { infra: t.infra })
      ] })
    ] }),
    f && !o && /* @__PURE__ */ e(ae, { it: f, runs: t.runs, onClose: () => c(null), onWatch: p }),
    m && /* @__PURE__ */ e(le, { run: m, api: i, onClose: () => p(null) })
  ] });
}
export {
  me as default
};
