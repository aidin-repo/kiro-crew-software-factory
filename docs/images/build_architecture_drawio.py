"""Generate docs/images/architecture.drawio (the README diagram) in the AWS reference-architecture style.

Run: python3 docs/images/build_architecture_drawio.py
Then: drawio -x -f png -b 10 -s 2 -o docs/images/architecture.png docs/images/architecture.drawio
"""

from pathlib import Path
from xml.sax.saxutils import escape as _escape


def escape(value):
    return _escape(value, {'"': "&quot;"})

HELV = "fontFamily=Helvetica;"
POINTS = (
    "points=[[0,0,0],[0.25,0,0],[0.5,0,0],[0.75,0,0],[1,0,0],[0,1,0],[0.25,1,0],[0.5,1,0],"
    "[0.75,1,0],[1,1,0],[0,0.25,0],[0,0.5,0],[0,0.75,0],[1,0.25,0],[1,0.5,0],[1,0.75,0]];"
)

# Category tints (fill, stroke)
NET = ("#EDE7F6", "#8C4FFF")
COMPUTE = ("#FFF2E8", "#ED7100")
APPINT = ("#FCE4EC", "#E7157B")
AIML = ("#E0F2F1", "#01A88D")
SECURITY = ("#FFEBEE", "#DD344C")

cells = []


def cell(xml):
    cells.append(xml)


def title():
    cell(f'<mxCell id="title-group" connectable="0" style="group;{HELV}" value="" vertex="1" parent="1">'
         f'<mxGeometry height="83" width="1720" x="50" y="30" as="geometry"/></mxCell>')
    cell(f'<mxCell id="title-text" style="text;html=1;resizable=1;points=[];autosize=1;align=left;verticalAlign=top;'
         f'spacingTop=-4;fontSize=30;fontStyle=1;{HELV}" value="Kiro Crew Software Factory" vertex="1" parent="title-group">'
         f'<mxGeometry height="42" width="900" as="geometry"/></mxCell>')
    cell(f'<mxCell id="subtitle-text" style="text;html=1;resizable=0;points=[];autosize=1;align=left;verticalAlign=top;'
         f'spacingTop=-4;fontSize=16;{HELV}" value="{escape("From a GitHub issue to a specified, implemented, reviewed, gate-checked and approved pull request. Six agents, one label at a time, on a machine you control.")}" vertex="1" parent="title-group">'
         f'<mxGeometry height="25" width="1400" x="5" y="40" as="geometry"/></mxCell>')
    cell(f'<mxCell id="title-separator" style="line;strokeWidth=2;html=1;fontSize=14;strokeColor=#FF9900;{HELV}" value="" vertex="1" parent="title-group">'
         f'<mxGeometry height="10" width="1710" x="5" y="70" as="geometry"/></mxCell>')


def users(cid, label, x, y):
    cell(f'<mxCell id="{cid}" style="fillColor=#f5f5f5;strokeColor=light-dark(#666666,#D4D4D4);rounded=1;whiteSpace=wrap;html=1;'
         f'verticalAlign=top;fontStyle=1;fontSize=12;fontColor=#333333;{HELV}container=1;collapsible=0;shadow=1;strokeWidth=1;perimeterSpacing=0;"'
         f' value="{escape(label)}" vertex="1" parent="1"><mxGeometry x="{x}" y="{y}" height="98" width="130" as="geometry"/></mxCell>')
    cell(f'<mxCell id="{cid}-icon" style="sketch=0;{POINTS}outlineConnect=0;fontColor=#232F3E;fillColor=#232F3D;strokeColor=#ffffff;dashed=0;'
         f'verticalLabelPosition=bottom;verticalAlign=top;align=center;html=1;fontSize=12;fontStyle=0;aspect=fixed;'
         f'shape=mxgraph.aws4.resourceIcon;resIcon=mxgraph.aws4.users;{HELV}" value="" vertex="1" parent="{cid}">'
         f'<mxGeometry x="41" y="34" width="48" height="48" as="geometry"/></mxCell>')


def service(cid, category, name, sub, x, y, tint, icon):
    fill, stroke = tint
    cell(f'<mxCell id="{cid}" style="fillColor={fill};strokeColor={stroke};rounded=1;whiteSpace=wrap;html=1;verticalAlign=top;'
         f'fontStyle=1;fontSize=12;fontColor={stroke};{HELV}container=1;collapsible=0;shadow=1;strokeWidth=1.5;"'
         f' value="{escape(category)}" vertex="1" parent="1"><mxGeometry x="{x}" y="{y}" width="120" height="120" as="geometry"/></mxCell>')
    label = f"{name}<div><i>{sub}</i></div>"
    cell(f'<mxCell id="{cid}-icon" style="sketch=0;{POINTS}outlineConnect=0;fontColor=#232F3E;fillColor={stroke};strokeColor=#ffffff;dashed=0;'
         f'verticalLabelPosition=bottom;verticalAlign=top;align=center;html=1;fontSize=10;fontStyle=0;aspect=fixed;'
         f'shape=mxgraph.aws4.resourceIcon;resIcon=mxgraph.aws4.{icon};{HELV}shadow=1;" value="{escape(label)}" vertex="1" parent="{cid}">'
         f'<mxGeometry x="36" y="30" width="48" height="48" as="geometry"/></mxCell>')


def boundary(cid, label, x, y, w, h, stroke):
    cell(f'<mxCell id="{cid}" style="rounded=1;whiteSpace=wrap;html=1;fillColor=light-dark({stroke}0D,{stroke}0D);fillStyle=auto;'
         f'strokeColor={stroke};strokeWidth=1.5;dashed=1;verticalAlign=top;align=left;spacingLeft=14;spacingTop=4;fontStyle=1;fontSize=14;'
         f'fontColor={stroke};{HELV}container=0;pointerEvents=0;collapsible=0;" value="{escape(label)}" vertex="1" parent="1">'
         f'<mxGeometry x="{x}" y="{y}" width="{w}" height="{h}" as="geometry"/></mxCell>')


def text(cid, value, x, y, w, size=12, color="#232F3E", style=2):
    cell(f'<mxCell id="{cid}" style="text;html=1;align=left;verticalAlign=top;fontSize={size};fontStyle={style};fontColor={color};{HELV}"'
         f' value="{escape(value)}" vertex="1" parent="1"><mxGeometry x="{x}" y="{y}" width="{w}" height="20" as="geometry"/></mxCell>')


def edge(cid, src, dst, label, exit_=None, entry=None, points=(), dashed=False, label_x=0, label_y=0, color="#545B64"):
    style = f"edgeStyle=orthogonalEdgeStyle;html=1;endArrow=block;endFill=1;startArrow=none;strokeColor={color};strokeWidth=2;rounded=1;{HELV}"
    if exit_:
        style += f"exitX={exit_[0]};exitY={exit_[1]};exitDx=0;exitDy=0;"
    if entry:
        style += f"entryX={entry[0]};entryY={entry[1]};entryDx=0;entryDy=0;"
    if dashed:
        style += "dashed=1;"
    pts = ""
    if points:
        pts = "<Array as=\"points\">" + "".join(f'<mxPoint x="{px}" y="{py}"/>' for px, py in points) + "</Array>"
    cell(f'<mxCell id="{cid}" style="{style}" edge="1" parent="1" source="{src}" target="{dst}">'
         f'<mxGeometry relative="1" as="geometry">{pts}</mxGeometry></mxCell>')
    if label:
        cell(f'<mxCell id="{cid}-label" value="{escape(label)}" style="edgeLabel;html=1;align=center;verticalAlign=middle;resizable=0;'
             f'points=[];fontSize=11;fontColor=#232F3E;labelBackgroundColor=#FFFFFF;{HELV}" connectable="0" vertex="1" parent="{cid}">'
             f'<mxGeometry relative="1" x="{label_x}" as="geometry"><mxPoint y="{label_y}" as="offset"/></mxGeometry></mxCell>')


def badge(n, x, y):
    cell(f'<mxCell id="step-{n}" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#007CBD;strokeColor=default;fontColor=#FFFFFF;fontStyle=1;'
         f'fontSize=16;{HELV}shadow=1;glass=0;strokeWidth=2;align=center;verticalAlign=middle;labelBackgroundColor=none;" value="{n}" vertex="1" parent="1">'
         f'<mxGeometry x="{x}" y="{y}" width="28" height="28" as="geometry"/></mxCell>')


def legend(x, y, h, steps):
    cell(f'<mxCell id="legend-bg" style="verticalLabelPosition=bottom;verticalAlign=top;html=1;shape=mxgraph.basic.rect;fillColor2=none;'
         f'strokeWidth=1;size=20;indent=5;fillColor=light-dark(#EDF3FF,#305363);strokeColor=#6c8ebf;{HELV}" value="" vertex="1" parent="1">'
         f'<mxGeometry height="{h}" width="560" x="{x}" y="{y}" as="geometry"/></mxCell>')
    cell(f'<mxCell id="legend-container" connectable="0" style="group;{HELV}" value="" vertex="1" parent="1">'
         f'<mxGeometry height="{h - 40}" width="520" x="{x + 20}" y="{y + 20}" as="geometry"/></mxCell>')
    cell(f'<mxCell id="legend-title" style="text;html=1;align=left;verticalAlign=top;fontSize=16;fontStyle=1;{HELV}"'
         f' value="How a label becomes a pull request" vertex="1" parent="legend-container">'
         f'<mxGeometry x="0" y="0" width="500" height="24" as="geometry"/></mxCell>')
    off = 50
    for n, (title_, desc, height) in enumerate(steps, start=1):
        cell(f'<mxCell id="step-{n}-legend" connectable="0" style="group;{HELV}" value="" vertex="1" parent="legend-container">'
             f'<mxGeometry height="{height}" width="520" x="0" y="{off}" as="geometry"/></mxCell>')
        cell(f'<mxCell id="step-{n}-badge-legend" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#007CBD;strokeColor=default;fontColor=#FFFFFF;'
             f'fontStyle=1;fontSize=22;labelBackgroundColor=none;{HELV}shadow=1;glass=0;strokeWidth=2;" value="{n}" vertex="1" parent="step-{n}-legend">'
             f'<mxGeometry height="38" width="40" y="2" as="geometry"/></mxCell>')
        html = (f'<div><b>{title_}</b></div><div><span style="color: light-dark(rgb(0,0,0), rgb(255,255,255));">{desc}</span></div>')
        cell(f'<mxCell id="step-{n}-desc-legend" style="text;html=1;align=left;verticalAlign=top;spacingTop=-4;fontSize=13;labelBackgroundColor=none;'
             f'whiteSpace=wrap;{HELV}" value="{escape(html)}" vertex="1" parent="step-{n}-legend">'
             f'<mxGeometry height="{height}" width="468" x="52" as="geometry"/></mxCell>')
        off += height + 10


# ---------------------------------------------------------------------------
title()

# Actors and GitHub
users("you", "Repository owner (you)", 40, 250)
service("github", "Source of truth", "GitHub", "issues, labels, branches, PRs", 280, 240, NET, "internet")

# Your machine
boundary("machine", "Your machine: laptop, EC2 instance or container. Nothing runs in the cloud.", 520, 160, 1230, 500, "#232F3E")
service("runner", "Event relay", "Actions runner", "self-hosted, label kirocrew", 600, 240, COMPUTE, "traditional_server")
service("gateway", "Agent host", "Kiro Crew gateway", "signed webhooks, templates, guardrails", 880, 240, APPINT, "generic_application")

# Lifecycle lane
text("lane-label", "Delivery lifecycle: one agent per label, each run in its own fresh session. Labels are the queue, the state machine and the audit trail.", 600, 416, 1100, 12, "#232F3E", 2)
Y = 450
service("planner", "Specify", "delivery-planner", "Opus · AIDLC spec comment", 600, Y, AIML, "generic_application")
service("implementer", "Implement", "delivery-implementer", "Opus · worktree, opens the PR", 790, Y, AIML, "generic_application")
service("reviewer", "Review", "delivery-reviewer", "Sonnet · VERDICT review", 980, Y, AIML, "generic_application")
service("gate", "Gate", "kiro_gate.py", "no model · SHA, CI, scope, hash", 1170, Y, SECURITY, "generic_firewall")
service("approver", "Approve", "delivery-approver", "Opus · DECISION comment", 1360, Y, AIML, "generic_application")
service("scribe", "Document", "delivery-scribe", "Sonnet · docs PR after merge", 1550, Y, AIML, "generic_application")

# Edges: entry flow
edge("e1", "you", "github", "add kiro-deliver", exit_=(1, 0.5), entry=(0, 0.5), label_y=16)
edge("e2", "github", "runner", "issues: labeled → Actions job", exit_=(1, 0.5), entry=(0, 0.5), label_y=16)
edge("e3", "runner", "gateway", "owner checks, HMAC, POST to 127.0.0.1", exit_=(1, 0.5), entry=(0, 0.5), label_y=16)
edge("e4", "gateway", "planner", "starts the agent that owns the label", exit_=(0.5, 1), entry=(0.5, 0), points=((940, 400), (660, 400)), label_x=-0.1, label_y=-16)

# Edges: the label chain
edge("e5", "planner", "implementer", "kiro-approved", exit_=(1, 0.5), entry=(0, 0.5), label_y=16)
edge("e6", "implementer", "reviewer", "PR · kiro-review", exit_=(1, 0.5), entry=(0, 0.5), label_y=16)
edge("e7", "reviewer", "implementer", "kiro-changes-requested, at most 3 rounds", exit_=(0.5, 1), entry=(0.5, 0.999),
     points=((1040, 600), (850, 600)), dashed=True, color="#ED7100", label_y=16)
edge("e8", "reviewer", "gate", "kiro-ready", exit_=(1, 0.5), entry=(0, 0.5), label_y=16)
edge("e9", "gate", "approver", "kiro-ready-to-merge", exit_=(1, 0.5), entry=(0, 0.5), label_y=16)
edge("e10", "approver", "scribe", "after you merge (pr-merged)", exit_=(1, 0.5), entry=(0, 0.5), dashed=True, label_y=16)

# Edge: everything is written back to GitHub as you
edge("e11", "approver", "github", "kiro-approved-to-merge · you read the DECISION and merge", exit_=(0.5, 1), entry=(0.5, 1),
     points=((1420, 640), (340, 640)), color="#1A9C37", label_x=0.3, label_y=-16)
text("escalations", "Escalations to you, by label: kiro-needs-owner (planner, approver), kiro-parked (gate). Nothing merges on its own unless you enable KIRO_APPROVER_MERGE.",
     560, 672, 1200, 11, "#DD344C", 2)

# Step badges near arrow sources
badge(1, 210, 258)
badge(2, 440, 258)
badge(3, 740, 258)
badge(4, 952, 372)
badge(5, 745, 468)
badge(6, 1315, 468)
badge(7, 1505, 468)

legend(1790, 30, 720, [
    ("Write an issue, add one label",
     "Only a label applied by the repository owner, on an issue the owner wrote, starts anything. Collaborators' labels are ignored. Private repositories only.", 70),
    ("Every label is a GitHub Actions event",
     "The workflow job runs on your self-hosted runner. It checks out the default branch only, never pull-request code.", 60),
    ("The dispatcher re-validates and signs",
     "dispatch_kiro_event.py re-checks owner, branch and PR state, strips hidden text, base64-wraps the issue as untrusted data, HMAC-signs the body and POSTs it to the loopback gateway. Non-loopback URLs are refused.", 90),
    ("The gateway starts the agent for that label",
     "Each role is its own webhook source bound to its own template, so a stage cannot borrow another's permissions. Runs are unattended: only tool calls matching your auto-approve rules execute.", 80),
    ("Planner → implementer → reviewer",
     "The planner (Opus) posts an AIDLC spec with a files block. The implementer (Opus) builds in a fresh worktree and opens the PR with the spec URL and SHA-256. The reviewer (Sonnet) posts a VERDICT; fixes loop at most 3 times.", 90),
    ("Gate, then approver",
     "kiro_gate.py has no model: head SHA reviewed, CI green, changed files inside the spec block, spec hash matches. On PASS the same job dispatches the approver (Opus), which reads spec, review, gate comment and diff through gh and posts a DECISION.", 90),
    ("You merge, the scribe documents",
     "kiro-approved-to-merge is the pipeline's last word; you merge. The scribe (Sonnet) then opens a docs-only PR. kiro-needs-owner and kiro-parked hand the decision back to you.", 80),
])

xml = ('<mxfile host="app.diagrams.net" modified="2026-11-20T00:00:00.000Z" agent="kiro-crew-software-factory" version="24.0.0" type="device">'
       '<diagram id="software-factory" name="Software Factory">'
       '<mxGraphModel dx="1400" dy="900" grid="0" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" '
       'pageScale="1" pageWidth="2400" pageHeight="800" math="0" shadow="0">'
       '<root><mxCell id="0"/><mxCell id="1" parent="0"/>' + "".join(cells) + '</root></mxGraphModel></diagram></mxfile>')

out = Path(__file__).with_name("architecture.drawio")
out.write_text(xml, encoding="utf-8")
print("wrote", out)
