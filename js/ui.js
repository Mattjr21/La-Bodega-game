import { ZONES, METRICS, CASE_STUDY_URL, HOME_URL } from './content.js'

export function createUI({
  onSelectZone,
  onApplyFix,
  onAdvanceNext,
  onBackOverview,
  onToggleMode,
  onRestart,
  getState,
}) {
  const live = document.getElementById('live')
  const progressFill = document.getElementById('progress-fill')
  const progressLabel = document.getElementById('progress-label')
  const progress = document.getElementById('mission-progress')
  const zoneList = document.getElementById('zone-list')
  const detail = document.getElementById('zone-detail')
  const detailTitle = document.getElementById('detail-title')
  const detailProblem = document.getElementById('detail-problem')
  const detailSolution = document.getElementById('detail-solution')
  const detailMetric = document.getElementById('detail-metric')
  const detailChallenge = document.getElementById('detail-challenge')
  const applyBtn = document.getElementById('btn-apply')
  const backBtn = document.getElementById('btn-back')
  const modeBtn = document.getElementById('btn-mode')
  const mobileModeBtn = document.getElementById('mobile-mode')
  const mobileIssue = document.getElementById('mobile-issue')
  const mobileZone = document.getElementById('mobile-zone')
  const winEl = document.getElementById('win')
  const metricsRoot = document.getElementById('metrics')
  const metricsDisclosure = document.getElementById('metrics-disclosure')
  const restartBtn = document.getElementById('btn-restart')
  const replayBtn = document.getElementById('btn-replay')
  const toastEl = document.getElementById('toast')

  let lastFocus = null
  let toastTimer = null

  metricsDisclosure.open = !window.matchMedia('(max-width: 720px)').matches

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

  function showToast(msg, { announce: alsoAnnounce = true } = {}) {
    if (!toastEl) return
    if (alsoAnnounce) announce(msg)
    toastEl.textContent = msg
    toastEl.hidden = false
    void toastEl.offsetWidth
    toastEl.classList.add('is-on')
    clearTimeout(toastTimer)
    toastTimer = setTimeout(() => {
      toastEl.classList.remove('is-on')
      toastTimer = setTimeout(() => {
        toastEl.hidden = true
      }, 220)
    }, 2200)
  }

  function canApply(zoneId) {
    const { solved, inspected, mode } = getState()
    if (!zoneId || solved.has(zoneId)) return false
    if (mode === 'list') return true
    return inspected.has(zoneId)
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
      btn.id = `zone-${z.id}`
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
    modeBtn.textContent = mode === 'list' ? 'Use 3D view' : 'Use list view'
    modeBtn.setAttribute('aria-pressed', String(mode === 'list'))
    modeBtn.setAttribute(
      'aria-label',
      mode === 'list'
        ? 'Switch to interactive 3D view'
        : 'Switch to accessible list walkthrough',
    )

    const nextOpenIndex = ZONES.findIndex((zone) => !solved.has(zone.id))
    const currentIndex = selected
      ? ZONES.findIndex((zone) => zone.id === selected)
      : nextOpenIndex === -1
        ? ZONES.length - 1
        : nextOpenIndex
    const currentZone = ZONES[Math.max(0, currentIndex)]
    mobileIssue.textContent = `Issue ${currentZone.step} of ${ZONES.length}`
    mobileZone.textContent = currentZone.name
    mobileModeBtn.textContent = mode === 'list' ? '3D' : 'List'
    mobileModeBtn.setAttribute(
      'aria-label',
      mode === 'list' ? 'Switch to 3D view' : 'Switch to list view',
    )
  }

  function showDetail(zoneId, { focus = true } = {}) {
    const z = ZONES.find((x) => x.id === zoneId)
    if (!z) return
    const { solved, mode, inspected } = getState()
    const useShortCopy =
      mode === 'explore' && window.matchMedia('(max-width: 720px)').matches
    detail.hidden = false
    detailTitle.textContent = `${z.icon} ${z.name}`
    detailProblem.textContent = useShortCopy ? z.shortProblem : z.problem
    detailSolution.textContent = useShortCopy ? z.shortSolution : z.solution
    detailMetric.textContent = z.metric
    const done = solved.has(z.id)
    const ready = canApply(z.id)
    const needsChallenge = mode === 'explore' && !done && !inspected.has(z.id)

    if (detailChallenge) {
      if (done) {
        detailChallenge.hidden = true
      } else if (needsChallenge) {
        detailChallenge.hidden = false
        detailChallenge.textContent = `Find it: ${z.challengeHint}`
        detailChallenge.classList.remove('is-done')
      } else if (mode === 'explore') {
        detailChallenge.hidden = false
        detailChallenge.textContent = 'Found. Apply the fix to update the floor.'
        detailChallenge.classList.add('is-done')
      } else {
        detailChallenge.hidden = true
      }
    }

    if (done) {
      const nextZone = ZONES.find((zone) => !solved.has(zone.id))
      if (nextZone) {
        applyBtn.disabled = false
        applyBtn.dataset.action = 'next'
        applyBtn.textContent = `Next: ${nextZone.name} →`
      } else {
        applyBtn.disabled = true
        applyBtn.dataset.action = 'done'
        applyBtn.textContent = 'Mission complete'
      }
      backBtn.textContent = 'Overview'
    } else {
      applyBtn.dataset.action = 'apply'
      applyBtn.disabled = !ready
      applyBtn.textContent = ready ? 'Apply fix' : 'Find the broken object first'
      backBtn.textContent = 'Back to overview'
    }
    document.body.dataset.hasSelection = 'true'
    metricsDisclosure.open = false

    requestAnimationFrame(() => {
      const activeChip = document.getElementById(`zone-${zoneId}`)
      activeChip?.scrollIntoView({ inline: 'start', block: 'nearest', behavior: 'smooth' })
      detail.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      if (focus) {
        if (!applyBtn.disabled) applyBtn.focus({ preventScroll: true })
        else backBtn.focus({ preventScroll: true })
      }
    })
  }

  function hideDetail(focusZoneId) {
    detail.hidden = true
    document.body.dataset.hasSelection = 'false'
    const requested = focusZoneId
      ? document.getElementById(`zone-${focusZoneId}`)
      : null
    if (requested) requested.focus()
    else if (lastFocus && document.contains(lastFocus)) lastFocus.focus()
    else zoneList.querySelector('.zone-btn:not(.is-locked)')?.focus()
  }

  function updateProgress({ justUnlocked } = {}) {
    const { solved } = getState()
    const n = solved.size
    const pct = (n / ZONES.length) * 100
    progressFill.style.width = `${pct}%`
    progressLabel.textContent = `${n} / ${ZONES.length} zones optimized`
    progress.setAttribute('aria-valuenow', String(n))
    progress.setAttribute('aria-valuetext', `${n} of ${ZONES.length} zones optimized`)

    Object.entries(METRICS).forEach(([key, meta]) => {
      const el = document.getElementById(`m-${key}`)
      if (!el) return
      const unlocked = solved.has(meta.unlockZone)
      const was = el.textContent
      el.textContent = unlocked ? meta.after : meta.before
      el.classList.toggle('is-good', unlocked)
      if (justUnlocked === key || (unlocked && was === meta.before)) {
        el.classList.remove('is-tick')
        void el.offsetWidth
        el.classList.add('is-tick')
      }
    })

    if (restartBtn) restartBtn.hidden = n === 0

    if (n === ZONES.length) {
      winEl.hidden = false
      announce('Mission complete. All five zones optimized. Play again to reset.')
      requestAnimationFrame(() => replayBtn?.focus())
    } else {
      winEl.hidden = true
    }
  }

  applyBtn.addEventListener('click', () => {
    if (applyBtn.dataset.action === 'next') {
      onAdvanceNext()
      return
    }
    const { selected } = getState()
    if (selected && canApply(selected)) onApplyFix(selected)
  })
  backBtn.addEventListener('click', () => onBackOverview())
  modeBtn.addEventListener('click', () => onToggleMode())
  mobileModeBtn.addEventListener('click', () => onToggleMode())
  restartBtn?.addEventListener('click', () => onRestart())
  replayBtn?.addEventListener('click', () => onRestart())

  const caseLink = document.getElementById('link-case')
  const homeLink = document.getElementById('link-home')
  const panelCaseLink = document.getElementById('panel-link-case')
  const panelHomeLink = document.getElementById('panel-link-home')
  if (caseLink) caseLink.href = CASE_STUDY_URL
  if (homeLink) homeLink.href = HOME_URL
  if (panelCaseLink) panelCaseLink.href = CASE_STUDY_URL
  if (panelHomeLink) panelHomeLink.href = HOME_URL

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const { selected, mode } = getState()
      if (selected && mode !== 'list') {
        e.preventDefault()
        onBackOverview()
      }
    }

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
    showToast,
    renderZones,
    showDetail,
    hideDetail,
    updateProgress,
  }
}
