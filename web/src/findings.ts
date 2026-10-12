// Headline numbers from docs/findings.md (reference run v1 and speed-v1).
// Shown on the page; update together with the findings document.

const REPO = 'https://github.com/YashKamerkar14/mettle'

export const LINKS = {
  repo: REPO,
  findings: `${REPO}/blob/main/docs/findings.md`,
  plan: `${REPO}/blob/main/docs/analysis-plan.md`,
  methodology: `${REPO}/blob/main/docs/methodology-notes.md`,
}

export const FINDINGS = {
  speedRatio: '1.12×',
  speedCi: '95% CI 1.11–1.14',
  speedDevice: 'RTX 4080 Laptop GPU',
  accuracyDiff: '−0.4 pts',
  accuracyCi: '95% CI −5.8 to +5.0',
  formatFull: '48%',
  formatQuant: '9%',
  arithmetic: '−19 pts',
  capitals: '+21 pts',
  questions: 500,
}

// Per-category accuracy (answer correct, run 1) from eval/results/v1/report.md,
// ordered from the largest 4-bit loss to the largest gain.
export const CATEGORY_ROWS = [
  { label: 'Arithmetic', full: 90, quant: 71, note: 'Two-digit addition and subtraction.' },
  { label: 'Number comparison', full: 52, quant: 35, chance: 50, note: '23 of 100 4-bit answers ran away into digit strings.' },
  { label: 'Antonyms', full: 79, quant: 86 },
  { label: 'Sentiment', full: 65, quant: 75, chance: 50 },
  { label: 'Capitals', full: 64, quant: 85, note: '4-bit answers in full sentences, and is right more often.' },
]
