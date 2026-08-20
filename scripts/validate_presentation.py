#!/usr/bin/env python3
"""Static checks for an interactive HTML presentation."""

from __future__ import annotations

import argparse
import re
from collections import Counter
from dataclasses import dataclass, field
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit


VOID_TAGS = {
    "area", "base", "br", "col", "embed", "hr", "img", "input", "link",
    "meta", "param", "source", "track", "wbr",
}
INTERACTIVE_TAGS = {"button", "a", "input", "select", "textarea", "summary"}
FAKE_CONTROL_CLASS = re.compile(
    r"(?:^|[-_])(button|btn|select|dropdown|toggle|play|pause)(?:$|[-_])",
    re.IGNORECASE,
)


@dataclass
class Element:
    tag: str
    attrs: dict[str, str]
    classes: set[str]
    line: int
    parent: Element | None = None
    slide_index: int | None = None
    text_parts: list[str] = field(default_factory=list)

    @property
    def text(self) -> str:
        return " ".join(" ".join(self.text_parts).split())

    @property
    def identifier(self) -> str:
        return self.attrs.get("id", "")

    def ancestors(self) -> list[Element]:
        result: list[Element] = []
        item = self.parent
        while item is not None:
            result.append(item)
            item = item.parent
        return result


class PresentationParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.elements: list[Element] = []
        self.slides: list[Element] = []
        self.stack: list[Element] = []
        self.has_viewport = False

    def _add(self, tag: str, attrs: list[tuple[str, str | None]], push: bool) -> None:
        values = {key: value or "" for key, value in attrs}
        classes = set(values.get("class", "").split())
        parent = self.stack[-1] if self.stack else None
        slide_index = parent.slide_index if parent else None
        element = Element(tag, values, classes, self.getpos()[0], parent, slide_index)

        if tag == "section" and "slide" in classes:
            element.slide_index = len(self.slides)
            self.slides.append(element)

        self.elements.append(element)
        if tag == "meta" and values.get("name", "").lower() == "viewport":
            self.has_viewport = True
        if push and tag not in VOID_TAGS:
            self.stack.append(element)

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        self._add(tag, attrs, True)

    def handle_startendtag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        self._add(tag, attrs, False)

    def handle_endtag(self, tag: str) -> None:
        for index in range(len(self.stack) - 1, -1, -1):
            if self.stack[index].tag == tag:
                del self.stack[index:]
                return

    def handle_data(self, data: str) -> None:
        if not data.strip():
            return
        for element in self.stack:
            element.text_parts.append(data)


def element_label(element: Element, slides: list[Element]) -> str:
    if element.slide_index is not None and element.slide_index < len(slides):
        slide = slides[element.slide_index]
        name = slide.identifier or f"slide at line {slide.line}"
        return f"{name}, line {element.line}"
    return f"line {element.line}"


def has_accessible_name(element: Element, ids: set[str]) -> bool:
    if element.attrs.get("aria-label", "").strip():
        return True
    labelledby = element.attrs.get("aria-labelledby", "").split()
    if labelledby and all(item in ids for item in labelledby):
        return True
    if element.text.strip():
        return True
    if element.tag == "input" and element.attrs.get("value", "").strip():
        return True
    return False


def is_interactive(element: Element) -> bool:
    return element.tag in INTERACTIVE_TAGS or element.attrs.get("role") == "button"


def local_asset_path(html_path: Path, value: str) -> Path | None:
    """Resolve a local linked asset; return None for remote and data URLs."""
    if not value.strip():
        return None
    parsed = urlsplit(value)
    if parsed.scheme or parsed.netloc or value.startswith("//"):
        return None
    asset = Path(unquote(parsed.path))
    return asset if asset.is_absolute() else (html_path.parent / asset).resolve()


def validate(path: Path, expected_slides: int | None = None) -> tuple[list[str], list[str], int, int]:
    html = path.read_text(encoding="utf-8")
    parser = PresentationParser()
    parser.feed(html)

    errors: list[str] = []
    warnings: list[str] = []
    ids_list = [element.identifier for element in parser.elements if element.identifier]
    ids = set(ids_list)
    duplicate_ids = sorted(item for item, count in Counter(ids_list).items() if count > 1)

    styles = [element.text for element in parser.elements if element.tag == "style"]
    scripts = [
        element.text
        for element in parser.elements
        if element.tag == "script" and not element.attrs.get("src")
    ]
    for element in parser.elements:
        if element.tag == "link" and "stylesheet" in element.attrs.get("rel", "").lower().split():
            asset = local_asset_path(path, element.attrs.get("href", ""))
            if asset is not None:
                if asset.is_file():
                    styles.append(asset.read_text(encoding="utf-8"))
                else:
                    errors.append(f"missing local stylesheet at line {element.line}: {asset}")
        if element.tag == "script" and element.attrs.get("src"):
            asset = local_asset_path(path, element.attrs["src"])
            if asset is not None:
                if asset.is_file():
                    scripts.append(asset.read_text(encoding="utf-8"))
                else:
                    errors.append(f"missing local script at line {element.line}: {asset}")
    css = "\n".join(styles)
    js = "\n".join(scripts)

    if path.suffix.lower() != ".html":
        errors.append("the deliverable must be an HTML file")
    if "<!doctype html" not in html.lower():
        errors.append("missing HTML5 doctype")
    if not parser.has_viewport:
        errors.append("missing viewport meta tag")
    if not any(item.strip() for item in styles):
        errors.append("missing non-empty CSS, either inline or in a local stylesheet")
    if not any(item.strip() for item in scripts):
        errors.append("missing non-empty JavaScript, either inline or in a local script")
    if not parser.slides:
        errors.append('no <section class="slide"> element found')
    if duplicate_ids:
        errors.append("duplicate ids: " + ", ".join(duplicate_ids))
    if expected_slides is not None and len(parser.slides) != expected_slides:
        errors.append(
            f"expected {expected_slides} slides from the editorial contract, found {len(parser.slides)}"
        )

    labels: list[str] = []
    slide_numbers: list[int] = []
    all_numbered = bool(parser.slides)
    for slide in parser.slides:
        where = f"line {slide.line}"
        if not slide.identifier:
            errors.append(f"slide at {where} is missing an id")
            all_numbered = False
        else:
            match = re.fullmatch(r"slide-(\d+)", slide.identifier)
            if match:
                slide_numbers.append(int(match.group(1)))
            else:
                all_numbered = False
        if not slide.attrs.get("data-chapter", "").strip():
            errors.append(f"{slide.identifier or 'slide'} at {where} is missing data-chapter")

        aria_label = slide.attrs.get("aria-label", "").strip()
        labelledby = slide.attrs.get("aria-labelledby", "").split()
        if not aria_label and not labelledby:
            errors.append(f"{slide.identifier or 'slide'} at {where} has no accessible label")
        if labelledby:
            missing = [item for item in labelledby if item not in ids]
            if missing:
                errors.append(
                    f"{slide.identifier or 'slide'} at {where} references missing aria-labelledby ids: "
                    + ", ".join(missing)
                )
        if aria_label:
            labels.append(aria_label)

    if all_numbered and slide_numbers != list(range(1, len(parser.slides) + 1)):
        errors.append(
            "slide ids must form the sequence slide-1..slide-N; found "
            + ", ".join(map(str, slide_numbers))
        )
    duplicate_labels = sorted(item for item, count in Counter(labels).items() if count > 1)
    if duplicate_labels:
        warnings.append("duplicate slide labels: " + ", ".join(duplicate_labels))

    if not re.search(r"(?:addEventListener\s*\(\s*['\"]keydown|onkeydown\s*=)", js):
        errors.append("missing keyboard event handler")
    for key in ("ArrowRight", "ArrowLeft"):
        if key not in js:
            errors.append(f"missing {key} keyboard navigation")
    if "requestFullscreen" not in js:
        errors.append("missing fullscreen API call")
    if "prefers-reduced-motion" not in css and "prefers-reduced-motion" not in js:
        errors.append("missing reduced motion support")

    # Le cadre de maquette : une requête de média qui restructure au-dessus du
    # seuil de repli change la grille alors que le cadre garde sa largeur.
    if "--slide-scale" in css or "--slide-scale" in js:
        for width in re.findall(r"@media[^{]*max-width:\s*(\d+)px", css):
            if 900 < int(width) <= 1400:
                warnings.append(
                    f"media query at max-width {width}px restructures above the 900px fallback "
                    "threshold, while the design frame keeps its width"
                )
        # Une unité de fenêtre dans une taille de police se réfère à la fenêtre
        # réelle, pas au cadre mis à l'échelle : la typographie grandit deux fois.
        for declaration in re.findall(r"font-size:[^;}]*?\d+(?:\.\d+)?v[wh][^;}]*", css):
            warnings.append(f"viewport unit inside a scaled frame: {declaration.strip()}")

    # Une boucle infinie qui ne dépend pas de la slide active a déjà tourné quand
    # on arrive sur la slide.
    for rule in re.findall(r"([^{}]+)\{[^{}]*animation[^{}]*infinite[^{}]*\}", css):
        selector = rule.strip().splitlines()[-1].strip()
        if selector.startswith("@") or "slide.active" in selector or "caret" in selector:
            continue
        warnings.append(f"infinite animation not gated on .slide.active: {selector[:60]}")

    counters = [
        element for element in parser.elements
        if element.identifier == "counter" or "counter" in element.classes
    ]
    if not counters:
        errors.append("missing a structural slide counter element")
    for counter in counters:
        match = re.search(r"/\s*(\d+)", counter.text)
        if match and int(match.group(1)) != len(parser.slides):
            errors.append(
                f"counter at line {counter.line} announces {match.group(1)} slides, found {len(parser.slides)}"
            )

    progress = [
        element for element in parser.elements
        if element.identifier == "progress" or "progress" in element.classes
    ]
    if not progress:
        errors.append("missing a structural progress indicator")
    chapter_nav = [
        element for element in parser.elements
        if element.tag == "nav"
        and ("chapter" in element.identifier.lower() or any("chapter" in cls.lower() for cls in element.classes))
    ]
    if not chapter_nav:
        errors.append("missing a structural chapter navigation element")
    fullscreen_controls = [
        element for element in parser.elements
        if is_interactive(element)
        and (
            "fullscreen" in element.identifier.lower()
            or any("fullscreen" in cls.lower() for cls in element.classes)
        )
    ]
    if not fullscreen_controls:
        errors.append("missing an accessible fullscreen control")

    build_elements = [element for element in parser.elements if "data-build" in element.attrs]
    builds_by_slide: dict[int, list[int]] = {}
    parsed_builds: dict[int, int] = {}
    for element in build_elements:
        raw = element.attrs.get("data-build", "")
        if not re.fullmatch(r"[1-9]\d*", raw):
            errors.append(f"invalid data-build={raw!r} at {element_label(element, parser.slides)}")
            continue
        value = int(raw)
        parsed_builds[id(element)] = value
        if element.slide_index is not None:
            builds_by_slide.setdefault(element.slide_index, []).append(value)
        for ancestor in element.ancestors():
            parent_value = parsed_builds.get(id(ancestor))
            if parent_value is not None and value < parent_value:
                errors.append(
                    f"child build {value} precedes ancestor build {parent_value} at "
                    f"{element_label(element, parser.slides)}"
                )
                break
    for slide_index, values in builds_by_slide.items():
        unique = sorted(set(values))
        expected = list(range(unique[0], unique[-1] + 1))
        if unique != expected:
            slide = parser.slides[slide_index]
            warnings.append(
                f"{slide.identifier or 'slide'} has build gaps: " + ", ".join(map(str, unique))
            )
    if build_elements and "data-build" not in js and "dataset.build" not in js:
        errors.append("data-build elements exist but JavaScript never references them")

    controls = [element for element in parser.elements if is_interactive(element)]
    for control in controls:
        where = element_label(control, parser.slides)
        if control.tag == "a" and not control.attrs.get("href", "").strip():
            errors.append(f"link without href at {where}")
        if not has_accessible_name(control, ids):
            errors.append(f"interactive control without accessible name at {where}")
        if control.tag == "button" and not control.attrs.get("type"):
            warnings.append(f"button without explicit type at {where}")
        if control.tag not in INTERACTIVE_TAGS and control.attrs.get("role") == "button":
            if not control.attrs.get("tabindex"):
                errors.append(f"non-native role=button without tabindex at {where}")
        if any(ancestor.attrs.get("aria-hidden") == "true" for ancestor in control.ancestors()):
            errors.append(f"interactive control is inside aria-hidden content at {where}")

    fa_icons = [
        element for element in parser.elements
        if any(cls == "fa" or cls.startswith("fa-") for cls in element.classes)
    ]
    if fa_icons and not re.search(r"font-awesome/6|fontawesome[^\n]*6|@fortawesome", html, re.I):
        errors.append("Font Awesome classes are used without an identifiable Font Awesome 6 import")
    for icon in fa_icons:
        if not (
            icon.attrs.get("aria-hidden") == "true"
            or icon.attrs.get("aria-label", "").strip()
            or icon.attrs.get("title", "").strip()
        ):
            warnings.append(f"Font Awesome icon is neither hidden nor named at line {icon.line}")
        if {"fa-play", "fa-pause"} & icon.classes:
            if not is_interactive(icon) and not any(is_interactive(item) for item in icon.ancestors()):
                warnings.append(f"possible fake play/pause control at line {icon.line}")

    for element in parser.elements:
        if element.tag in {"div", "span", "i"} and not is_interactive(element):
            if any(FAKE_CONTROL_CLASS.search(cls) for cls in element.classes):
                if not element.attrs.get("onclick") and not element.attrs.get("role"):
                    warnings.append(
                        f"possible non-functional control styling at {element_label(element, parser.slides)}"
                    )
        if element.tag == "img" and not element.attrs.get("alt", "").strip() and element.attrs.get("aria-hidden") != "true":
            errors.append(f"image without alt text at {element_label(element, parser.slides)}")
        for token in ("card", "frame"):
            if token in element.classes and any(token in ancestor.classes for ancestor in element.ancestors()):
                warnings.append(
                    f"nested .{token} surfaces at {element_label(element, parser.slides)}"
                )
                break

    # Intégrité du couple balisage / script. Une substitution de texte sur un
    # fichier entier peut dupliquer un bloc ou en supprimer plusieurs sans que
    # rien ne le signale : node --check passe et des visuels ont disparu.
    hooks = re.findall(r"getElementById\(\s*['\"]([^'\"]+)['\"]\s*\)", js)
    for hook in sorted(set(hooks)):
        if hook not in ids:
            errors.append(
                f"the script reads #{hook} but no element carries that id"
            )

    section_titles = re.findall(r"/\*\s*-{4,}\s*(.+?)\s*-{4,}\s*\*/", js)
    repeated_sections = sorted(
        title for title, count in Counter(section_titles).items() if count > 1
    )
    if repeated_sections:
        warnings.append(
            "duplicated script section header, likely a duplicated block: "
            + ", ".join(repeated_sections)
        )

    parents = {id(element.parent) for element in parser.elements if element.parent is not None}
    for element in parser.elements:
        if not element.identifier or element.tag in VOID_TAGS:
            continue
        if id(element) in parents or element.text.strip():
            continue
        if element.identifier in hooks:
            continue
        warnings.append(
            f"empty container #{element.identifier} at {element_label(element, parser.slides)} "
            "that no script fills"
        )

    if len(parser.slides) < 3:
        warnings.append("fewer than three slides; confirm this is intentional")
    if re.search(r"THREE\s*\.", js) and not re.search(r"three(?:\.min)?\.js|three@", html, re.I):
        errors.append("Three.js API used without an identifiable library import")

    return errors, warnings, len(parser.slides), len({slide.attrs.get("data-chapter", "") for slide in parser.slides})


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("path", type=Path, help="presentation index.html")
    parser.add_argument("--expected-slides", type=int, help="slide count fixed by the editorial contract")
    args = parser.parse_args()

    if not args.path.is_file():
        print(f"FAIL: file not found: {args.path}")
        return 1
    if args.expected_slides is not None and args.expected_slides < 1:
        print("FAIL: --expected-slides must be a positive integer")
        return 2

    errors, warnings, slide_count, chapter_count = validate(args.path, args.expected_slides)
    for item in errors:
        print(f"FAIL: {item}")
    for item in warnings:
        print(f"WARN: {item}")
    if errors:
        print(f"Result: {len(errors)} error(s), {len(warnings)} warning(s)")
        return 1

    print(f"PASS: {slide_count} slides, {chapter_count} chapters")
    if warnings:
        print(f"Result: 0 errors, {len(warnings)} warning(s)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
