# Papers — build process

This directory holds the Auths papers as **Markdown + LaTeX** source and builds
them to typeset **PDF** with `pandoc` + `xelatex`. The Markdown stays clean; all
the LaTeX machinery (diagrams, fonts, citations) lives in a shared preamble and
the build script. (The layout mirrors the `recurve` papers directory.)

## Quick start

```bash
./build.sh                                 # builds accountability-without-consensus.md -> .pdf
./build.sh some-other-paper.md             # builds a specific paper
```

The script `cd`s into this directory, so it works from anywhere.

## Requirements

| Tool | Why | Install (macOS) |
|---|---|---|
| **pandoc** ≥ 3 | Markdown → LaTeX, citation processing | `brew install pandoc` |
| **xelatex** | PDF engine (Unicode + TikZ) | `brew install --cask mactex-no-gui` |

Any TeX Live / MacTeX gives `xelatex` plus the packages the preamble loads
(`tikz`, `tcolorbox`, `fontawesome5`, `fancyvrb`, `fontspec`, `amsmath`,
`amsthm`, `booktabs`, `microtype`). A self-contained alternative is `tectonic`;
to use it, change `--pdf-engine=xelatex` to `--pdf-engine=tectonic` in `build.sh`.

## Files

| File | Role |
|---|---|
| `accountability-without-consensus.md` | paper source (Markdown + LaTeX math, TikZ figures, `[@cite]`s) |
| `references.bib` | BibTeX bibliography (verified metadata) |
| `preamble.tex` | shared LaTeX preamble (packages + `\tikzset` + theorem envs) |
| `build.sh` | one-command build |

## Adding a new paper

1. Write `your-paper.md` here. Use `$...$` / `$$...$$` for math, `[@key]` for
   citations (add the entry to `references.bib`), and a raw LaTeX
   `\begin{figure}...\end{figure}` block for a diagram (copyable patterns are in
   `accountability-without-consensus.md`).
2. `./build.sh your-paper.md`.

New packages a paper needs go in `preamble.tex` so every paper shares one setup.

## Notes

- **Raw-LaTeX figures must not contain blank lines** — pandoc would split the
  block. Use `\par\vspace{...}` for vertical breaks inside a figure.
- **Benign warning.** `LaTeX Warning: 'h' float specifier changed to 'ht'` is
  normal float placement, not a failure.
- Menlo is macOS-only; the preamble guards fonts with `\IfFontExistsTF`, so on
  other systems the build silently falls back — no error.
