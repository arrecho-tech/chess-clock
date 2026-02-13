import { useCallback, useEffect, useRef, useState } from "react"

const safeParseJson = <T,>(value: string | null): T | null => {
  if (!value) return null
  try {
    return JSON.parse(value) as T
  } catch {
    return null
  }
}

const normalizeSettings = (value: Partial<Settings> | null): Settings => {
  const legacyTheme = localStorage.getItem(THEME_KEY)
  const theme: Theme =
    value?.theme === "dark" || value?.theme === "light"
      ? value.theme
      : legacyTheme === "dark" || legacyTheme === "light"
        ? legacyTheme
        : defaultSettings.theme

  return {
    ...defaultSettings,
    ...value,
    theme,
  }
}

export type Theme = "light" | "dark"

export type Settings = {
  p1Minutes: number
  p1Seconds: number
  p2Minutes: number
  p2Seconds: number
  increment: number
  sameTime: boolean
  theme: Theme
}

export type PlayerKey = "p1" | "p2"

type BeepState = {
  p1: { thirty: boolean; ten: boolean }
  p2: { thirty: boolean; ten: boolean }
}

const SETTINGS_KEY = "chessClockSettings"
const THEME_KEY = "chessClockTheme" // legacy key: kept for migration
const MUTE_KEY = "chessClockMuted"
const FULLSCREEN_KEY = "chessClockFullscreen"

export const defaultSettings: Settings = {
  p1Minutes: 10,
  p1Seconds: 0,
  p2Minutes: 10,
  p2Seconds: 0,
  increment: 5,
  sameTime: true,
  theme: "light",
}

const emptyBeepState: BeepState = {
  p1: { thirty: false, ten: false },
  p2: { thirty: false, ten: false },
}

export const toSeconds = (minutes: number, seconds: number) =>
  minutes * 60 + seconds

export const clampNumber = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value))

export const formatTime = (totalSeconds: number) => {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
}

const setScrollLock = (locked: boolean) => {
  const html = document.documentElement
  const body = document.body

  if (locked) {
    html.style.overscrollBehavior = "none"
    body.style.overflow = "hidden"
    body.style.touchAction = "none"
    body.style.overscrollBehavior = "none"
    return
  }

  html.style.overscrollBehavior = ""
  body.style.overflow = ""
  body.style.touchAction = ""
  body.style.overscrollBehavior = ""
}

const isIOSBrowser = () => {
  if (typeof navigator === "undefined") return false
  const ua = navigator.userAgent.toLowerCase()
  const platform = navigator.platform?.toLowerCase() ?? ""
  const touchMac = platform.includes("mac") && navigator.maxTouchPoints > 1
  return /iphone|ipad|ipod/.test(ua) || touchMac
}

export function useChessClock() {
  const [settings, setSettings] = useState<Settings>(() => {
    const parsed = safeParseJson<Partial<Settings>>(localStorage.getItem(SETTINGS_KEY))
    return normalizeSettings(parsed)
  })

  const [setup, setSetup] = useState<Settings>(() => {
    const parsed = safeParseJson<Partial<Settings>>(localStorage.getItem(SETTINGS_KEY))
    return normalizeSettings(parsed)
  })

  const [showSetup, setShowSetup] = useState(() => {
    const parsed = safeParseJson<Partial<Settings>>(localStorage.getItem(SETTINGS_KEY))
    return parsed ? false : true
  })

  const [activePlayer, setActivePlayer] = useState<PlayerKey | null>(null)
  const [hasStarted, setHasStarted] = useState(false)
  const [isRunning, setIsRunning] = useState(false)
  const [times, setTimes] = useState(() => {
    const parsed = safeParseJson<Partial<Settings>>(localStorage.getItem(SETTINGS_KEY))
    const initial = normalizeSettings(parsed)
    return {
      p1: toSeconds(initial.p1Minutes, initial.p1Seconds),
      p2: toSeconds(initial.p2Minutes, initial.p2Seconds),
    }
  })

  const [, setBeeped] = useState<BeepState>(emptyBeepState)
  const beepedRef = useRef<BeepState>(emptyBeepState)

  const [muted, setMuted] = useState(() => localStorage.getItem(MUTE_KEY) === "true")
  const [fullscreen, setFullscreen] = useState(
    () => localStorage.getItem(FULLSCREEN_KEY) === "true",
  )
  const [pseudoFullscreen, setPseudoFullscreen] = useState(false)
  // theme is stored inside settings

  const audioRef = useRef<AudioContext | null>(null)
  const fullscreenRef = useRef(fullscreen)
  const pseudoFullscreenRef = useRef(pseudoFullscreen)
  const iosRef = useRef(isIOSBrowser())

  useEffect(() => {
    document.documentElement.classList.toggle("dark", settings.theme === "dark")
  }, [settings.theme])

  useEffect(() => {
    localStorage.setItem(MUTE_KEY, String(muted))
  }, [muted])

  useEffect(() => {
    fullscreenRef.current = fullscreen
    localStorage.setItem(FULLSCREEN_KEY, String(fullscreen))
  }, [fullscreen])

  useEffect(() => {
    pseudoFullscreenRef.current = pseudoFullscreen
  }, [pseudoFullscreen])

  useEffect(() => {
    const onFullscreenChange = () => {
      const isNativeFullscreen = Boolean(document.fullscreenElement)

      if (isNativeFullscreen) {
        setPseudoFullscreen(false)
        setScrollLock(true)
        return
      }

      if (fullscreenRef.current && !pseudoFullscreenRef.current && !iosRef.current) {
        setFullscreen(false)
      }

      setScrollLock(pseudoFullscreenRef.current)
    }

    document.addEventListener("fullscreenchange", onFullscreenChange)

    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange)
      setScrollLock(false)
    }
  }, [])

  useEffect(() => {
    const root = document.documentElement
    const deferPseudo = (enabled: boolean) => {
      queueMicrotask(() => setPseudoFullscreen(enabled))
    }

    if (fullscreen) {
      if (iosRef.current) {
        deferPseudo(true)
        setScrollLock(true)
        return
      }

      if (!document.fullscreenElement) {
        root.requestFullscreen().catch(() => {
          setPseudoFullscreen(true)
          setScrollLock(true)
        })
      } else {
        deferPseudo(false)
        setScrollLock(true)
      }
      return
    }

    deferPseudo(false)
    setScrollLock(false)

    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {
        // ignore failed exits
      })
    }
  }, [fullscreen])

  const playBeep = useCallback(
    (frequency = 520, duration = 0.08) => {
      if (muted) return
      try {
        const ctx = audioRef.current ?? new AudioContext()
        audioRef.current = ctx
        if (ctx.state === "suspended") {
          ctx.resume()
        }
        const oscillator = ctx.createOscillator()
        const gain = ctx.createGain()
        oscillator.type = "sine"
        oscillator.frequency.value = frequency
        gain.gain.value = 0.5
        oscillator.connect(gain)
        gain.connect(ctx.destination)
        oscillator.start()
        oscillator.stop(ctx.currentTime + duration)
      } catch {
        // ignore audio errors
      }
    },
    [muted],
  )

  const resetBeeps = useCallback(() => {
    beepedRef.current = emptyBeepState
    setBeeped(emptyBeepState)
  }, [])

  useEffect(() => {
    if (!isRunning) return
    if (!activePlayer) return

    const maybeBeepAt = (player: PlayerKey, nextTime: number) => {
      if (nextTime <= 0) return

      const playerState = beepedRef.current[player]

      if (nextTime === 30 && !playerState.thirty) {
        playBeep(460, 0.09)
        const next: BeepState = {
          ...beepedRef.current,
          [player]: { ...playerState, thirty: true },
        }
        beepedRef.current = next
        setBeeped(next)
      }

      if (nextTime === 10 && !playerState.ten) {
        playBeep(620, 0.1)
        const next: BeepState = {
          ...beepedRef.current,
          [player]: { ...playerState, ten: true },
        }
        beepedRef.current = next
        setBeeped(next)
      }
    }

    const interval = window.setInterval(() => {
      setTimes((prev) => {
        const current = activePlayer === "p1" ? prev.p1 : prev.p2
        const nextTime = Math.max(0, current - 1)

        maybeBeepAt(activePlayer, nextTime)

        if (nextTime === 0) {
          setIsRunning(false)
        }

        if (activePlayer === "p1") {
          return { ...prev, p1: nextTime }
        }
        return { ...prev, p2: nextTime }
      })
    }, 1000)

    return () => window.clearInterval(interval)
  }, [activePlayer, isRunning, playBeep])

  const handleSwitch = useCallback(() => {
    if (!isRunning) return
    if (!hasStarted) return
    if (!activePlayer) return
    if (
      (activePlayer === "p1" && times.p1 === 0) ||
      (activePlayer === "p2" && times.p2 === 0)
    ) {
      return
    }
    setTimes((prev) => {
      if (activePlayer === "p1") {
        return { ...prev, p1: prev.p1 + settings.increment }
      }
      return { ...prev, p2: prev.p2 + settings.increment }
    })
    setActivePlayer((prev) => (prev === "p1" ? "p2" : "p1"))
    playBeep()
  }, [
    activePlayer,
    hasStarted,
    isRunning,
    playBeep,
    settings.increment,
    times.p1,
    times.p2,
  ])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code === "Space") {
        event.preventDefault()
        handleSwitch()
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [handleSwitch])


  const handleSaveSetup = useCallback(() => {
    const normalized: Settings = {
      ...setup,
      p1Minutes: clampNumber(setup.p1Minutes, 0, 999),
      p1Seconds: clampNumber(setup.p1Seconds, 0, 59),
      p2Minutes: clampNumber(setup.p2Minutes, 0, 999),
      p2Seconds: clampNumber(setup.p2Seconds, 0, 59),
      increment: clampNumber(setup.increment, 0, 999),
      sameTime: setup.sameTime,
    }

    if (normalized.sameTime) {
      normalized.p2Minutes = normalized.p1Minutes
      normalized.p2Seconds = normalized.p1Seconds
    }

    setSettings(normalized)
    setSetup(normalized)
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(normalized))

    setTimes({
      p1: toSeconds(normalized.p1Minutes, normalized.p1Seconds),
      p2: toSeconds(normalized.p2Minutes, normalized.p2Seconds),
    })
    setActivePlayer(null)
    setHasStarted(false)
    setIsRunning(false)
    resetBeeps()

    setShowSetup(false)
  }, [resetBeeps, setup])

  const openSetup = useCallback(() => {
    setIsRunning(false)
    setSetup(settings)
    setShowSetup(true)
  }, [settings])

  const startFrom = useCallback(
    (player: PlayerKey) => {
      if (times.p1 === 0 && times.p2 === 0) return
      setActivePlayer(player)
      setHasStarted(true)
      setIsRunning(true)
    },
    [times.p1, times.p2],
  )

  const resetClock = useCallback(() => {
    setTimes({
      p1: toSeconds(settings.p1Minutes, settings.p1Seconds),
      p2: toSeconds(settings.p2Minutes, settings.p2Seconds),
    })
    setActivePlayer(null)
    setHasStarted(false)
    setIsRunning(false)
    resetBeeps()
  }, [resetBeeps, settings])

  const toggleRunning = useCallback(() => {
    if (!hasStarted) return
    if (!activePlayer) return
    if (
      (activePlayer === "p1" && times.p1 === 0) ||
      (activePlayer === "p2" && times.p2 === 0)
    ) {
      return
    }
    setIsRunning((prev) => !prev)
  }, [activePlayer, hasStarted, times.p1, times.p2])

  const setTheme = useCallback(
    (next: Theme | ((prev: Theme) => Theme)) => {
      setSettings((prev) => {
        const resolved = typeof next === "function" ? next(prev.theme) : next
        const updated = { ...prev, theme: resolved }
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated))
        return updated
      })

      setSetup((prev) => {
        const resolved = typeof next === "function" ? next(prev.theme) : next
        return { ...prev, theme: resolved }
      })
    },
    [],
  )

  return {
    // State
    settings,
    setup,
    showSetup,
    activePlayer,
    hasStarted,
    isRunning,
    times,
    muted,
    fullscreen,
    pseudoFullscreen,
    theme: settings.theme,
    // Setters
    setSetup,
    setMuted,
    setFullscreen,
    setTheme,
    // Actions
    resetClock,
    handleSwitch,
    handleSaveSetup,
    openSetup,
    startFrom,
    toggleRunning,
  }
}
