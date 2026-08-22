#!/usr/bin/env python3
"""Enregistre une présentation HTML animée et produit une vidéo MP4.

La page est réellement exécutée dans Chromium. Les animations CSS, SVG et
JavaScript restent donc en mouvement ; le script n'assemble pas des captures
statiques. Les apparitions sont déclenchées au clavier selon le minutage porté
par chaque slide.

Usage :
    python3 scripts/export_video.py presentation/index.html -o presentation.mp4
    python3 scripts/export_video.py presentation/index.html --plan

Dépendances : playwright (Python), Chromium pour Playwright et ffmpeg.
"""

from __future__ import annotations

import argparse
import shutil
import subprocess
import sys
import tempfile
import time
from dataclasses import dataclass
from html.parser import HTMLParser
from pathlib import Path


VOID = {
    "area", "base", "br", "col", "embed", "hr", "img", "input", "link",
    "meta", "param", "source", "track", "wbr",
}


@dataclass
class RawSlide:
    identifier: str
    attrs: dict[str, str]
    max_build: int = 1


@dataclass
class SlidePlan:
    index: int
    identifier: str
    max_build: int
    duration: float
    build_times: list[float]


class DeckParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.slides: list[RawSlide] = []
        self.current: RawSlide | None = None
        self.depth = 0

    def handle_starttag(self, tag: str, attrs) -> None:
        values = {key: value or "" for key, value in attrs}
        classes = values.get("class", "").split()
        if self.current is None and tag == "section" and "slide" in classes:
            self.current = RawSlide(values.get("id", f"slide-{len(self.slides) + 1}"), values)
            self.depth = 1
        elif self.current is not None and tag not in VOID:
            self.depth += 1

        if self.current is not None:
            build = values.get("data-build", "")
            if build.isdigit():
                self.current.max_build = max(self.current.max_build, int(build))

    def handle_startendtag(self, tag: str, attrs) -> None:
        self.handle_starttag(tag, attrs)
        if tag not in VOID:
            self.handle_endtag(tag)

    def handle_endtag(self, tag: str) -> None:
        if self.current is None or tag in VOID:
            return
        self.depth -= 1
        if self.depth == 0:
            self.slides.append(self.current)
            self.current = None


def positive_float(value: str, label: str) -> float:
    try:
        number = float(value)
    except ValueError as exc:
        raise ValueError(f"{label} doit être un nombre, reçu : {value!r}") from exc
    if number <= 0:
        raise ValueError(f"{label} doit être strictement positif")
    return number


def parse_deck(source: Path) -> list[RawSlide]:
    parser = DeckParser()
    parser.feed(source.read_text(encoding="utf-8"))
    if not parser.slides:
        raise ValueError("aucune section .slide trouvée")
    return parser.slides


def make_plan(
    slides: list[RawSlide], default_duration: float, build_delay: float, final_hold: float
) -> list[SlidePlan]:
    plan: list[SlidePlan] = []
    for index, slide in enumerate(slides, 1):
        reveal_count = max(0, slide.max_build - 1)
        raw_times = slide.attrs.get("data-video-build-times", "").strip()
        if raw_times:
            build_times = [positive_float(item.strip(), "data-video-build-times") for item in raw_times.split(",")]
            if len(build_times) != reveal_count:
                raise ValueError(
                    f"{slide.identifier} : {len(build_times)} temps vidéo pour "
                    f"{reveal_count} apparition(s) attendue(s)"
                )
            if build_times != sorted(build_times) or len(set(build_times)) != len(build_times):
                raise ValueError(f"{slide.identifier} : les temps d’apparition doivent être croissants")
        else:
            build_times = [build_delay * step for step in range(1, reveal_count + 1)]

        raw_duration = slide.attrs.get("data-video-duration", "").strip()
        duration = positive_float(raw_duration, "data-video-duration") if raw_duration else default_duration
        minimum = (build_times[-1] + final_hold) if build_times else final_hold
        if raw_duration and duration < minimum:
            raise ValueError(
                f"{slide.identifier} : durée {duration:g}s trop courte ; "
                f"minimum {minimum:g}s après la dernière apparition"
            )
        duration = max(duration, minimum)
        plan.append(SlidePlan(index, slide.identifier, slide.max_build, duration, build_times))
    return plan


def print_plan(plan: list[SlidePlan]) -> None:
    print("Plan vidéo")
    for slide in plan:
        builds = ", ".join(f"{value:g}s" for value in slide.build_times) or "aucune"
        print(
            f"  {slide.index:02d}  {slide.identifier:<18} "
            f"durée {slide.duration:g}s  apparitions : {builds}"
        )
    print(f"Durée totale : {sum(slide.duration for slide in plan):g}s")


EXPORT_CSS = """
.controls, .overlay-panel { display: none !important; }
.stage { inset: 0 !important; }
html, body { width: 100%; height: 100%; overflow: hidden !important; }
:root { --swash-w: 100vh; }
"""


INIT_SCRIPT = r"""
window.__presentationVideoExport = true;
document.addEventListener('DOMContentLoaded', () => {
  document.documentElement.classList.add('presentation-fullscreen', 'presentation-video-export');
  const cover = document.createElement('div');
  cover.id = 'presentation-video-cover';
  Object.assign(cover.style, {
    position: 'fixed', inset: '0', zIndex: '2147483647',
    background: getComputedStyle(document.body).backgroundColor || '#000'
  });
  document.body.append(cover);
}, { once: true });
"""


RESET_FIRST_SLIDE = r"""
() => {
  const slide = document.querySelector('.slide.active');
  if (!slide) throw new Error('Aucune slide active');
  const builds = [...slide.querySelectorAll('[data-build]')];
  const lastBuild = Math.max(1, ...builds.map(item => Number(item.dataset.build) || 1));
  slide.classList.remove('active');
  document.dispatchEvent(new CustomEvent('presentation:build', {
    detail: { slide: null, slideIndex: -1, build: 0, lastBuild: 0 }
  }));
  void slide.offsetWidth;
  builds.forEach(item => {
    const visible = Number(item.dataset.build) <= 1;
    item.classList.toggle('is-visible', visible);
    item.setAttribute('aria-hidden', String(!visible));
  });
  slide.classList.add('active');
  document.getElementById('presentation-video-cover')?.remove();
  document.dispatchEvent(new CustomEvent('presentation:build', {
    detail: { slide, slideIndex: 0, build: 1, lastBuild }
  }));
  document.dispatchEvent(new CustomEvent('presentation:video-slide', {
    detail: { slide, slideIndex: 0, duration: Number(slide.dataset.videoDuration) || null }
  }));
}
"""


def wait_until(deadline: float) -> None:
    remaining = deadline - time.monotonic()
    if remaining > 0:
        time.sleep(remaining)


def probe_duration(ffprobe: Path | str | None, media: Path) -> float | None:
    if not ffprobe:
        return None
    result = subprocess.run(
        [
            str(ffprobe), "-v", "error", "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1", str(media),
        ],
        capture_output=True,
        text=True,
    )
    try:
        return float(result.stdout.strip()) if result.returncode == 0 else None
    except ValueError:
        return None


def export_video(args, plan: list[SlidePlan]) -> None:
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        sys.exit(
            "Playwright est requis : pip install playwright puis playwright install chromium"
        )

    ffmpeg = args.ffmpeg or shutil.which("ffmpeg")
    if not ffmpeg:
        sys.exit("FFmpeg est introuvable. Installer ffmpeg ou fournir --ffmpeg.")
    sibling_ffprobe = Path(ffmpeg).with_name("ffprobe")
    ffprobe = sibling_ffprobe if sibling_ffprobe.is_file() else shutil.which("ffprobe")

    source = args.source.resolve()
    output = args.output.resolve()
    output.parent.mkdir(parents=True, exist_ok=True)
    total_duration = sum(slide.duration for slide in plan)

    with tempfile.TemporaryDirectory(prefix="presentation-video-") as temp_name:
        temp = Path(temp_name)
        with sync_playwright() as playwright:
            launch = {"headless": True}
            if args.browser_path:
                launch["executable_path"] = str(args.browser_path)
            browser = playwright.chromium.launch(**launch)
            context = browser.new_context(
                viewport={"width": args.width, "height": args.height},
                record_video_dir=str(temp),
                record_video_size={"width": args.width, "height": args.height},
                reduced_motion="no-preference",
                device_scale_factor=1,
            )
            context.add_init_script(INIT_SCRIPT)
            capture_origin = time.monotonic()
            page = context.new_page()
            video = page.video
            page.goto(source.as_uri() + "#slide-1", wait_until="networkidle")
            page.add_style_tag(content=EXPORT_CSS)
            page.evaluate("() => document.fonts?.ready")
            page.keyboard.press("Home")
            page.evaluate(RESET_FIRST_SLIDE)
            timeline_origin = time.monotonic()

            for offset, slide in enumerate(plan):
                entered = time.monotonic()
                for build_number, reveal_at in enumerate(slide.build_times, start=2):
                    wait_until(entered + reveal_at)
                    page.keyboard.press("ArrowRight")
                    page.evaluate(
                        """detail => document.dispatchEvent(new CustomEvent(
                          'presentation:video-build', { detail }
                        ))""",
                        {"slideIndex": offset, "build": build_number},
                    )
                wait_until(entered + slide.duration)
                if offset < len(plan) - 1:
                    page.keyboard.press("ArrowRight")
                    page.evaluate(
                        """detail => {
                          const slide = document.querySelector('.slide.active');
                          document.dispatchEvent(new CustomEvent('presentation:video-slide', {
                            detail: { ...detail, slide }
                          }));
                        }""",
                        {"slideIndex": offset + 1, "duration": plan[offset + 1].duration},
                    )

            page.evaluate(
                "() => document.dispatchEvent(new CustomEvent('presentation:video-end'))"
            )
            context.close()
            raw_video = Path(video.path())
            browser.close()

        raw_duration = probe_duration(ffprobe, raw_video)
        if raw_duration is not None:
            # Le flux contient la préparation masquée par le cache, puis la timeline.
            # Une petite marge conserve la première image animée malgré l'arrondi vidéo.
            setup_duration = max(0.0, raw_duration - total_duration - 0.08)
        else:
            setup_duration = max(0.0, timeline_origin - capture_origin - 0.75)
        command = [
            str(ffmpeg), "-y", "-i", str(raw_video), "-ss", f"{setup_duration:.3f}",
            "-t", f"{total_duration:.3f}", "-an",
            "-vf", "tpad=stop_mode=clone:stop_duration=1",
            "-c:v", "libx264", "-preset", args.preset, "-crf", str(args.crf),
            "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(output),
        ]
        result = subprocess.run(command, capture_output=True, text=True)
        if result.returncode:
            sys.exit("Encodage FFmpeg échoué :\n" + result.stderr[-4000:])

    print(f"Vidéo créée : {output}")
    print(f"Durée : {total_duration:g}s · {args.width}×{args.height}")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Enregistre les animations réelles d’une présentation HTML en MP4."
    )
    parser.add_argument("source", type=Path, help="fichier index.html de la présentation")
    parser.add_argument("-o", "--output", type=Path, default=Path("presentation.mp4"))
    parser.add_argument("--width", type=int, default=1920)
    parser.add_argument("--height", type=int, default=1080)
    parser.add_argument("--slide-duration", type=float, default=5.0, help="durée par défaut en secondes")
    parser.add_argument("--build-delay", type=float, default=1.5, help="intervalle par défaut entre apparitions")
    parser.add_argument("--final-hold", type=float, default=1.5, help="pause minimale après la dernière apparition")
    parser.add_argument("--crf", type=int, default=18, help="qualité H.264, 0 à 51 ; plus bas = meilleure qualité")
    parser.add_argument("--preset", default="medium", help="preset libx264")
    parser.add_argument("--browser-path", type=Path, help="exécutable Chromium facultatif")
    parser.add_argument("--ffmpeg", type=Path, help="exécutable FFmpeg facultatif")
    parser.add_argument("--plan", action="store_true", help="affiche le minutage sans lancer l’export")
    args = parser.parse_args()

    if not args.source.is_file():
        parser.error(f"fichier introuvable : {args.source}")
    if args.width <= 0 or args.height <= 0:
        parser.error("la largeur et la hauteur doivent être positives")
    if not 0 <= args.crf <= 51:
        parser.error("--crf doit être compris entre 0 et 51")
    try:
        default_duration = positive_float(str(args.slide_duration), "--slide-duration")
        build_delay = positive_float(str(args.build_delay), "--build-delay")
        final_hold = positive_float(str(args.final_hold), "--final-hold")
        plan = make_plan(parse_deck(args.source), default_duration, build_delay, final_hold)
    except ValueError as exc:
        parser.error(str(exc))

    print_plan(plan)
    if args.plan:
        return
    export_video(args, plan)


if __name__ == "__main__":
    main()
