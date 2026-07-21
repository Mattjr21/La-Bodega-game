import { ZONES, METRICS, CASE_STUDY_URL, HOME_URL } from './content.js'

export function createUI({
  onSelectZone,
  onApplyFix,
  onBackOverview,
  onToggleMode,
  getState,
}) {
  const live = document.getElementById('live')
  const progressFill = document.getElementById('progress-fill')
  const progressLabel = document.getElementById('progress-label')
  const zoneList = document.getElementById('zone-list')
  const detail = document.getElementById('zone-detail')
  const detailTitle = document.getElementById('detail-title')
  const detailProblem = document.getElementById('detail-problem')
  const detailSolution = document.getElementById('detail-solution')
  const detailMetric = document.getElementById('detail-metric')
  const applyBtn = document.getElementById('btn-apply')
  const backBtn = document.getElementById('btn-back')
  const modeBtn = document.getElementById('btn-mode')
  const winEl = document.getElementById('win')
  const metricsRoot = document.getElementById('metrics')

  let lastFocus = null

  // Build metric cards once
  metricsRoot.innerHTML = ''
  Object.entries(METRICS).forEach(([key, meta]) => {
    const card = document.createElement('div')
    card.className = 'metric'
    card.innerHTML = `
      <div class="metric__label">${meta.label}</div>
      <div class="metric__value" id="m-${key}" data-metric="${key}">${meta.before}</div>
    `
    metricsRoot.appendChild(card)
  })

  function announce(msg) {
    live.textContent = ''
    void live.offsetWidth
    live.textContent = msg
  }

  function renderZones() {
    const { solved, selected, mode } = getState()
    zoneList.innerHTML = ''
    ZONES.forEach((z, i) => {
      const done = solved.has(z.id)
      const locked = i > 0 && !solved.has(ZONES[i - 1].id)
      const btn = document.createElement('button')
      btn.type = 'button'
      btn.className = 'zone-btn'
      btn.dataset.zone = z.id
      btn.setAttribute('aria-pressed', String(selected === z.id))
      if (done) btn.classList.add('is-done')
      if (locked) {
        btn.classList.add('is-locked')
        btn.setAttribute('aria-disabled', 'true')
      }
      if (selected === z.id) btn.classList.add('is-active')
      btn.innerHTML = `
        <span class="zone-btn__idx">${String(i + 1).padStart(2, '0')}</span>
        <span class="zone-btn__body">
          <span class="zone-btn__name">${z.icon} ${z.name}</span>
          <span class="zone-btn__status">${done ? 'Fixed' : locked ? 'Locked' : 'Open'}</span>
        </span>
        <span class="zone-btn__swatch" style="--swatch:${z.color}" aria-hidden="true"></span>
      `
      btn.addEventListener('click', () => {
        if (locked) {
          announce(`${z.name} is locked. Complete the previous zone first.`)
          return
        }
        lastFocus = btn
        onSelectZone(z.id)
      })
      zoneList.appendChild(btn)
    })

    document.body.dataset.viewMode = mode
    modeBtn.textContent = mode === 'list' ? '3D Explore' : 'List Walkthrough'
    modeBtn.setAttribute('aria-pressed', String(mode === 'list'))
  }

  function showDetail(zoneId) {
    const z = ZONES.find((x) => x.id === zoneId)
    if (!z) return
    const { solved } = getState()
    detail.hidden = false
    detailTitle.textContent = `${z.icon} ${z.name}`
    detailProblem.textContent = z.problem
    detailSolution.textContent = z.solution
    detailMetric.textContent = z.metric
    const done = solved.has(z.id)
    applyBtn.disabled = done
    applyBtn.textContent = done ? 'Already applied' : 'Apply fix'
    requestAnimationFrame(() => applyBtn.focus())
  }

  function hideDetail() {
    detail.hidden = true
    if (lastFocus && document.contains(lastFocus)) lastFocus.focus()
    else zoneList.querySelector('.zone-btn:not(.is-locked)')?.focus()
  }

  function updateProgress() {
    const { solved } = getState()
    const n = solved.size
    const pct = (n / ZONES.length) * 100
    progressFill.style.width = `${pct}%`
    progressLabel.textContent = `${n} / ${ZONES.length} zones optimized`
    Object.entries(METRICS).forEach(([key, meta]) => {
      const el = document.getElementById(`m-${key}`)
      if (!el) return
      el.textContent = n === ZONES.length ? meta.after : meta.before
      el.classList.toggle('is-good', n === ZONES.length)
    })
    if (n === ZONES.length) {
      winEl.hidden = false
      announce('Mission complete. All five zones optimized.')
    } else {
      winEl.hidden = true
    }
  }

  applyBtn.addEventListener('click', () => {
    const { selected } = getState()
    if (selected) onApplyFix(selected)
  })
  backBtn.addEventListener('click', () => onBackOverview())
  modeBtn.addEventListener('click', () => onToggleMode())

  const caseLink = document.getElementById('link-case')
  const homeLink = document.getElementById('link-home')
  if (caseLink) caseLink.href = CASE_STUDY_URL
  if (homeLink) homeLink.href = HOME_URL

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const { selected, mode } = getState()
      if (selected && mode !== 'list') {
        e.preventDefault()
        onBackOverview()
      }
    }

    // Arrow navigation across zone buttons when focus is in the list
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      const buttons = [...zoneList.querySelectorAll('.zone-btn:not(.is-locked)')]
      const idx = buttons.indexOf(document.activeElement)
      if (idx === -1) return
      e.preventDefault()
      const next =
        e.key === 'ArrowDown'
          ? buttons[Math.min(buttons.length - 1, idx + 1)]
          : buttons[Math.max(0, idx - 1)]
      next?.focus()
    }
  })

  return {
    announce,
    renderZones,
    showDetail,
    hideDetail,
    updateProgress,
  }
}
