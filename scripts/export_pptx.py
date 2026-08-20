#!/usr/bin/env python3
"""Exporte une présentation HTML de cette skill vers un PowerPoint natif éditable.

Le mode par défaut de la skill reste la page web. Cet export est une option,
à n'utiliser que sur demande explicite.

Le .pptx produit contient de vraies formes PowerPoint — titres, surtitres,
cartes, listes, notes — modifiables par le destinataire. La contrepartie est
assumée : ce qui relève du rendu web (SVG, trames, calendrier interactif,
animations, icônes de police) ne peut pas être reproduit nativement. Ces
éléments sont signalés dans le rapport d'export, jamais supprimés en silence.

Une slide est émise par étape d'apparition, afin de préserver le déroulé.

Usage :
    python3 scripts/export_pptx.py chemin/vers/index.html -o sortie.pptx

Dépendance : python-pptx  (pip install --user python-pptx)
"""

import argparse
import html
import re
import sys
from html.parser import HTMLParser
from pathlib import Path

try:
    from pptx import Presentation
    from pptx.dml.color import RGBColor
    from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
    from pptx.util import Emu, Inches, Pt
except ImportError:
    sys.exit("python-pptx est requis :  pip install --user python-pptx")


# ---------------------------------------------------------------- petit DOM

class Node:
    __slots__ = ("tag", "attrs", "children", "text", "parent")

    def __init__(self, tag, attrs=None, parent=None):
        self.tag = tag
        self.attrs = attrs or {}
        self.children = []
        self.text = ""
        self.parent = parent

    @property
    def classes(self):
        return self.attrs.get("class", "").split()

    def has(self, name):
        return name in self.classes

    def find_all(self, pred):
        out = []
        for c in self.children:
            if pred(c):
                out.append(c)
            out.extend(c.find_all(pred))
        return out

    def first(self, pred):
        for c in self.children:
            if pred(c):
                return c
            got = c.first(pred)
            if got is not None:
                return got
        return None

    def inner_text(self):
        parts = [self.text]
        for c in self.children:
            parts.append(c.inner_text())
        joined = " ".join(p for p in parts if p)
        return re.sub(r"\s+", " ", joined).strip()


VOID = {"area", "base", "br", "col", "embed", "hr", "img", "input",
        "link", "meta", "param", "source", "track", "wbr"}


class DOM(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.root = Node("#root")
        self.cur = self.root

    def handle_starttag(self, tag, attrs):
        node = Node(tag, {k: (v or "") for k, v in attrs}, self.cur)
        self.cur.children.append(node)
        if tag not in VOID:
            self.cur = node

    def handle_startendtag(self, tag, attrs):
        self.cur.children.append(Node(tag, {k: (v or "") for k, v in attrs}, self.cur))

    def handle_endtag(self, tag):
        node = self.cur
        while node is not self.root and node.tag != tag:
            node = node.parent
        if node is not self.root:
            self.cur = node.parent

    def handle_data(self, data):
        if data.strip():
            holder = Node("#text", parent=self.cur)
            holder.text = data
            self.cur.children.append(holder)


# ------------------------------------------------------------- palette CSS

DEFAULTS = {
    "bg": "FFFFFF", "surface": "FFFFFF", "ink": "0F172A",
    "muted": "64748B", "subtle": "94A3B8", "line": "E2E8F0", "accent": "2563EB",
}


def read_palette(css):
    """Lit les tokens du :root pour suivre automatiquement le modèle employé."""
    root = re.search(r":root\s*\{(.*?)\}", css, re.S)
    tokens = {}
    if root:
        for name, value in re.findall(r"--([a-z0-9-]+)\s*:\s*([^;]+);", root.group(1)):
            tokens[name] = value.strip()

    def hexa(*names):
        for n in names:
            v = tokens.get(n, "")
            m = re.fullmatch(r"#([0-9a-fA-F]{6})", v)
            if m:
                return m.group(1).upper()
        return None

    pal = dict(DEFAULTS)
    for key, names in {
        "bg": ("bg",), "surface": ("surface",), "ink": ("ink",),
        "muted": ("muted",), "subtle": ("subtle",), "line": ("line",),
        "accent": ("blue-dark", "brand-deep", "blue-strong", "blue"),
    }.items():
        got = hexa(*names)
        if got:
            pal[key] = got
    return pal


# ---------------------------------------------------------------- extraction

def build_of(node):
    v = node.attrs.get("data-build")
    if v and v.isdigit():
        return int(v)
    return None


CARDISH = ("card", "objective-card", "session-row", "rule-row",
           "precaution-item", "tool-card", "question-card", "dual-card",
           "review-card", "event-item", "share-benefit", "bilan-source-kpi")

CONTAINERISH = ("grid", "stack", "list", "row", "layout", "examples",
                "questions", "stats", "cards", "panel", "body")


def looks_container(node):
    if node.tag not in ("div", "section", "ul", "ol"):
        return False
    if any(c in CARDISH for c in node.classes):
        return False
    return any(any(k in c for k in CONTAINERISH) for c in node.classes) or node.tag in ("ul", "ol")


def unit_from(node, inherited):
    """Décrit une unité de contenu : titre, corps, repère, ou visuel non converti."""
    order = build_of(node) or inherited or 1
    number = node.first(lambda n: n.has("number") or n.has("session-date")
                        or n.has("cal-count") or n.tag == "span" and n.has("evolution-label"))
    title = node.first(lambda n: n.tag in ("h3", "h4", "strong"))
    bodies = [n.inner_text() for n in node.children if n.tag == "p" and n.inner_text()]
    if not bodies:
        bodies = [n.inner_text() for n in node.find_all(lambda n: n.tag == "p") if n.inner_text()]
    has_visual = bool(node.find_all(lambda n: n.tag in ("svg", "canvas", "img")))
    text = node.inner_text()
    return {
        "order": order,
        "number": number.inner_text() if number else "",
        "title": title.inner_text() if title else "",
        "body": " · ".join(bodies),
        "visual": has_visual,
        "text": text,
    }


def collect_units(inner, skipped):
    """Aplati le contenu d'une slide en unités, en descendant dans les conteneurs."""
    units = []

    def walk(node, inherited):
        for child in node.children:
            if child.tag in ("#text", "header", "script", "style"):
                continue
            order = build_of(child) or inherited
            if looks_container(child):
                walk(child, order)
                continue
            if child.tag in ("svg", "canvas", "img"):
                skipped.append(child.tag)
                continue
            u = unit_from(child, order)
            if u["visual"] and not (u["title"] or u["body"]):
                skipped.append("visuel " + (child.classes[0] if child.classes else child.tag))
                continue
            if u["visual"]:
                skipped.append("visuel dans " + (child.classes[0] if child.classes else child.tag))
            if not u["text"]:
                continue
            # une unité peut avaler du contenu qui n'entre ni dans son titre ni
            # dans son corps : trame de points, frise, grille de calendrier.
            # Le mesurer plutôt que de le perdre en silence.
            reste = len(u["text"]) - len(u["title"]) - len(u["body"])
            if (u["title"] or u["body"]) and reste > 80:
                skipped.append("détail non converti dans "
                               + (child.classes[0] if child.classes else child.tag))
            if not u["title"] and not u["body"]:
                # ni titre ni paragraphe : soit une phrase courte récupérable,
                # soit un visuel de données dont le texte aplati ne veut rien
                # dire (grille de calendrier, trame de points). Ne jamais le
                # laisser tomber en silence.
                nom = child.classes[0] if child.classes else child.tag
                if len(u["text"]) <= 240:
                    u["body"] = u["text"]
                else:
                    skipped.append("contenu non textuel dans " + nom)
                    continue
            units.append(u)

    walk(inner, None)
    return units


def parse_deck(path):
    raw = path.read_text(encoding="utf8")
    # CSS en ligne, plus les feuilles liées locales : les gabarits séparent le
    # styles.css, la palette s'y trouve donc et non dans le HTML
    css = "\n".join(re.findall(r"<style[^>]*>(.*?)</style>", raw, re.S))
    for href in re.findall(r"<link[^>]+rel=[\"\']stylesheet[\"\'][^>]*>", raw):
        m = re.search(r"href=[\"\']([^\"\']+)[\"\']", href)
        if not m or m.group(1).startswith(("http://", "https://", "//")):
            continue
        feuille = (path.parent / m.group(1)).resolve()
        if feuille.is_file():
            css = feuille.read_text(encoding="utf8") + "\n" + css
    dom = DOM()
    dom.feed(raw)
    # libellés de chapitres, si le deck en définit une table dans son JS
    labels = {}
    m = re.search(r"chapterLabels\s*=\s*\{([^}]*)\}", raw)
    if m:
        labels = dict(re.findall(r"(\w+)\s*:\s*'([^']*)'", m.group(1)))
    slides = []
    for sec in dom.root.find_all(lambda n: n.tag == "section" and n.has("slide")):
        inner = sec.first(lambda n: n.has("slide-inner")) or sec
        head = inner.first(lambda n: n.has("slide-head"))
        eyebrow = inner.first(lambda n: n.has("eyebrow"))
        heading = inner.first(lambda n: n.tag in ("h1", "h2"))
        skipped = []
        scope = Node("#scope")
        scope.children = [c for c in inner.children if c is not head]
        units = collect_units(scope, skipped)
        slides.append({
            "id": sec.attrs.get("id", ""),
            "cover": sec.has("cover-slide"),
            "thanks": sec.has("thanks-slide"),
            "chapter": labels.get(sec.attrs.get("data-chapter", ""),
                                  sec.attrs.get("data-chapter-label", sec.attrs.get("data-chapter", ""))),
            "eyebrow": eyebrow.inner_text() if eyebrow else "",
            "heading": heading.inner_text() if heading else "",
            "notes": html.unescape(sec.attrs.get("data-notes", "")),
            "units": units,
            "skipped": skipped,
        })
    return slides, read_palette(css)


# ------------------------------------------------------------------- rendu

W, H = Inches(13.333), Inches(7.5)
MARGIN = Inches(0.95)
COLW = W - 2 * MARGIN


def box(slide, left, top, width, height, text, size, color, bold=False,
        align=PP_ALIGN.LEFT, anchor=MSO_ANCHOR.TOP, spacing=1.0):
    tb = slide.shapes.add_textbox(left, top, width, height)
    tf = tb.text_frame
    tf.word_wrap = True
    tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
    tf.vertical_anchor = anchor
    p = tf.paragraphs[0]
    p.alignment = align
    p.line_spacing = spacing
    r = p.add_run()
    r.text = text
    r.font.size = Pt(size)
    r.font.bold = bold
    r.font.name = "Arial"
    r.font.color.rgb = RGBColor.from_string(color)
    return tb


def paint_bg(slide, pal):
    fill = slide.background.fill
    fill.solid()
    fill.fore_color.rgb = RGBColor.from_string(pal["bg"])


def card(slide, left, top, width, height, unit, pal):
    from pptx.enum.shapes import MSO_SHAPE
    sh = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
    sh.adjustments[0] = 0.06
    sh.fill.solid()
    sh.fill.fore_color.rgb = RGBColor.from_string(pal["surface"])
    sh.line.color.rgb = RGBColor.from_string(pal["line"])
    sh.line.width = Pt(0.75)
    sh.shadow.inherit = False
    sh.text_frame.text = ""
    pad = Inches(0.28)
    y = top + pad
    if unit["number"]:
        box(slide, left + pad, y, width - 2 * pad, Inches(0.24),
            unit["number"], 11, pal["accent"], bold=True)
        y += Inches(0.42)
    if unit["title"]:
        box(slide, left + pad, y, width - 2 * pad, Inches(0.6),
            unit["title"], 17, pal["ink"], bold=True, spacing=1.05)
        y += Inches(0.72)
    if unit["body"]:
        box(slide, left + pad, y, width - 2 * pad, height - (y - top) - pad,
            unit["body"], 12, pal["muted"], spacing=1.25)


def render(slides, pal, out, expand_builds=True, report=None):
    report = report if report is not None else []
    prs = Presentation()
    prs.slide_width, prs.slide_height = W, H
    blank = prs.slide_layouts[6]
    made = 0

    for s in slides:
        orders = sorted({u["order"] for u in s["units"]}) or [1]
        steps = orders if expand_builds else [orders[-1]]
        for step in steps:
            sl = prs.slides.add_slide(blank)
            paint_bg(sl, pal)
            visible = [u for u in s["units"] if u["order"] <= step]

            if s["cover"]:
                y = Inches(2.3)
                if s["eyebrow"]:
                    box(sl, MARGIN, y, COLW, Inches(0.3), s["eyebrow"].upper(), 13,
                        pal["accent"], bold=True)
                    y += Inches(0.5)
                box(sl, MARGIN, y, COLW, Inches(2.4), s["heading"], 48,
                    pal["ink"], bold=True, spacing=0.95)
                # le surtitre et le titre sont déjà posés : ne pas les répéter
                deja = {s["heading"], s["eyebrow"]}
                rest = " · ".join(u["text"] for u in visible if u["text"] not in deja)
                if rest:
                    box(sl, MARGIN, y + Inches(2.5), COLW, Inches(0.4), rest, 13, pal["muted"])
            elif s["thanks"]:
                box(sl, MARGIN, Inches(2.7), COLW, Inches(2.0), s["heading"] or "Merci",
                    64, pal["ink"], bold=True, align=PP_ALIGN.CENTER)
            else:
                y = Inches(0.72)
                if s["eyebrow"]:
                    box(sl, MARGIN, y, COLW, Inches(0.28), s["eyebrow"].upper(), 12,
                        pal["accent"], bold=True)
                    y += Inches(0.42)
                box(sl, MARGIN, y, COLW, Inches(1.0), s["heading"], 32,
                    pal["ink"], bold=True, spacing=1.0)
                y += Inches(1.25)

                cards = [u for u in visible if u["title"]]
                plain = [u for u in visible if not u["title"] and u["body"]]
                gap = Inches(0.24)
                dispo = H - y - MARGIN

                # réserver la place du texte simple avant de poser les cartes,
                # afin que ni l'un ni l'autre ne soit abandonné
                texte = "\n".join(u["body"] for u in plain)
                h_texte = Inches(0.34) * max(1, min(6, texte.count("\n") + 1)) if texte else 0
                if cards and h_texte:
                    h_texte = min(h_texte, int(dispo * 0.34))

                if cards:
                    n = min(len(cards), 3)
                    cw = int((COLW - gap * (n - 1)) / n)
                    rows = [cards[i:i + n] for i in range(0, len(cards), n)]
                    place = dispo - h_texte - (gap if h_texte else 0)
                    ch = min(Inches(2.5), int((place - gap * (len(rows) - 1)) / len(rows)))
                    if ch < Inches(0.9):
                        report.append((s["id"], f"{len(cards)} cartes trop serrées, mise en page à revoir"))
                        ch = Inches(0.9)
                    for ri, row in enumerate(rows):
                        for ci, u in enumerate(row):
                            card(sl, MARGIN + ci * (cw + gap), y + ri * (ch + gap),
                                 cw, ch, u, pal)
                    y += len(rows) * (ch + gap)

                if texte:
                    reste = H - y - MARGIN
                    if reste < Inches(0.4):
                        report.append((s["id"], "texte simple non placé, faute de hauteur"))
                    else:
                        box(sl, MARGIN, y, COLW, reste, texte,
                            13 if cards else 16, pal["muted"] if cards else pal["ink"],
                            spacing=1.3)

            if s["notes"]:
                sl.notes_slide.notes_text_frame.text = s["notes"]
            made += 1

    prs.save(str(out))
    return made, report



# ------------------------------------------------------- export par captures

CHROME_CANDIDATS = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    "google-chrome", "chromium", "chromium-browser",
]

CROCHET = """
<style id="export-hook">
  .controls, .notes, .keyboard-shortcuts { display: none !important; }
  .stage { inset: 0 !important; }
  :root { --swash-w: calc(100vh * 830 / 3508) !important; }
  .slide, .build-step { transition: none !important; }
</style>
<script>
  addEventListener('load', () => {
    const p = new URLSearchParams(location.search);
    const s = Number(p.get('s') || 1), b = Number(p.get('b') || 1);
    const slides = [...document.querySelectorAll('.slide')];
    slides.forEach(x => x.classList.remove('active'));
    const cur = slides[s - 1];
    if (!cur) return;
    cur.classList.add('active');
    cur.querySelectorAll('[data-build]').forEach(el => {
      el.classList.toggle('is-visible', Number(el.dataset.build) <= b);
    });
  });
</script>
"""


def trouver_chrome():
    import shutil
    for c in CHROME_CANDIDATS:
        if c.startswith("/"):
            if Path(c).is_file():
                return c
        else:
            found = shutil.which(c)
            if found:
                return found
    return None


def etats(slides, raw, expand):
    """Liste (index de slide, étape) à capturer, dans l'ordre de la présentation."""
    out = []
    for i, s in enumerate(slides, 1):
        ordres = sorted({u["order"] for u in s["units"]})
        etapes = [1] + [o for o in ordres if o > 1] if expand else [max(ordres or [1])]
        for e in dict.fromkeys(etapes):
            out.append((i, e))
    return out


def render_images(source, slides, out, expand=True, largeur=1600, echelle=2, garder=False):
    import subprocess
    import tempfile
    chrome = trouver_chrome()
    if not chrome:
        sys.exit("Chrome introuvable : le mode images en a besoin pour capturer les slides.")

    raw = source.read_text(encoding="utf8")
    source = source.resolve()   # as_uri() exige un chemin absolu
    tmp_html = source.parent / ".export-capture.html"
    tmp_html.write_text(raw.replace("</body>", CROCHET + "</body>"), encoding="utf8")
    dossier = Path(tempfile.mkdtemp(prefix="export-slides-"))

    plan = etats(slides, raw, expand)
    hauteur = round(largeur * 9 / 16)
    try:
        prs = Presentation()
        prs.slide_width, prs.slide_height = W, H
        blank = prs.slide_layouts[6]
        for n, (idx, etape) in enumerate(plan, 1):
            png = dossier / f"{n:03d}.png"
            subprocess.run([chrome, "--headless", "--disable-gpu", "--hide-scrollbars",
                            f"--force-device-scale-factor={echelle}",
                            f"--window-size={largeur},{hauteur}",
                            "--virtual-time-budget=3000", f"--screenshot={png}",
                            f"{tmp_html.as_uri()}?s={idx}&b={etape}"],
                           capture_output=True)
            if not png.is_file():
                sys.exit(f"capture échouée pour la slide {idx}, étape {etape}")
            sl = prs.slides.add_slide(blank)
            sl.shapes.add_picture(str(png), 0, 0, width=W, height=H)
            notes = slides[idx - 1]["notes"]
            if notes:
                sl.notes_slide.notes_text_frame.text = notes
            print(f"  {n:3d}/{len(plan)}  slide {idx}, étape {etape}", end="\r", flush=True)
        prs.save(str(out))
        print(" " * 40, end="\r")
    finally:
        if not garder:
            tmp_html.unlink(missing_ok=True)
            for f in dossier.glob("*.png"):
                f.unlink()
            dossier.rmdir()
    return len(plan)


# -------------------------------------------------------------------- main

def main():
    ap = argparse.ArgumentParser(description="Exporte une présentation HTML vers un .pptx natif éditable.")
    ap.add_argument("source", type=Path)
    ap.add_argument("-o", "--output", type=Path)
    ap.add_argument("--final-only", action="store_true",
                    help="une slide par slide web, apparitions aplaties")
    ap.add_argument("--mode", choices=("images", "natif"), default="images",
                    help="images : capture fidèle de chaque état (défaut). "
                         "natif : formes PowerPoint éditables, mais les visuels "
                         "construits en CSS ou SVG sont perdus.")
    ap.add_argument("--largeur", type=int, default=1600, help="largeur de capture, mode images")
    ap.add_argument("--echelle", type=int, default=2, help="facteur de densité, mode images")
    args = ap.parse_args()

    if not args.source.is_file():
        sys.exit(f"introuvable : {args.source}")
    out = args.output or args.source.with_suffix(".pptx")

    slides, pal = parse_deck(args.source)
    if not slides:
        sys.exit("aucune slide trouvée : ce fichier vient-il de cette skill ?")

    if args.mode == "images":
        made = render_images(args.source, slides, out, expand=not args.final_only,
                             largeur=args.largeur, echelle=args.echelle)
        print(f"{out}")
        print(f"  {len(slides)} slides web  ->  {made} slides PowerPoint, une image par état")
        print(f"  capture {args.largeur}x{round(args.largeur * 9 / 16)} au facteur {args.echelle}")
        print("  rendu fidèle ; les textes ne sont pas éditables dans PowerPoint")
        return

    made, report = render(slides, pal, out, expand_builds=not args.final_only)

    print(f"{out}")
    print(f"  {len(slides)} slides web  ->  {made} slides PowerPoint")
    print(f"  palette lue : fond #{pal['bg']}, encre #{pal['ink']}, accent #{pal['accent']}")
    perdus = {}
    for s in slides:
        for k in s["skipped"]:
            perdus[k] = perdus.get(k, 0) + 1
    if perdus:
        print("  non converti, à refaire à la main dans PowerPoint :")
        for k, v in sorted(perdus.items(), key=lambda x: -x[1]):
            print(f"    {v:3d} x {k}")
    sans = [s["id"] for s in slides if not s["units"] and not s["cover"] and not s["thanks"]]
    if sans:
        print("  slides sans contenu textuel converti : " + ", ".join(sans))
    denses = [(s["id"], sum(len(u["body"]) + len(u["title"]) for u in s["units"]))
              for s in slides]
    denses = [(i, n) for i, n in denses if n > 700]
    if denses:
        print("  texte trop dense pour une slide, à répartir à la main :")
        for i, n in denses:
            print(f"    {i} : {n} caractères")
    if report:
        print("  avertissements de mise en page :")
        for i, msg in dict.fromkeys(report):
            print(f"    {i} : {msg}")


if __name__ == "__main__":
    main()
