import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"

type Settings = {
  p1Minutes: number
  p1Seconds: number
  p2Minutes: number
  p2Seconds: number
  increment: number
  sameTime: boolean
}

type PlayerKey = "p1" | "p2"

type BeepState = {
  p1: { thirty: boolean; ten: boolean }
  p2: { thirty: boolean; ten: boolean }
}

const SETTINGS_KEY = "chessClockSettings"
const THEME_KEY = "chessClockTheme"
const MUTE_KEY = "chessClockMuted"
const VIBRATE_KEY = "chessClockVibrate"

const defaultSettings: Settings = {
  p1Minutes: 10,
  p1Seconds: 0,
  p2Minutes: 10,
  p2Seconds: 0,
  increment: 5,
  sameTime: true,
}

const emptyBeepState: BeepState = {
  p1: { thirty: false, ten: false },
  p2: { thirty: false, ten: false },
}

const toSeconds = (minutes: number, seconds: number) => minutes * 60 + seconds

const clampNumber = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value))

const formatTime = (totalSeconds: number) => {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
}

function App() {
  const [settings, setSettings] = useState<Settings>(defaultSettings)
  const [setup, setSetup] = useState<Settings>(defaultSettings)
  const [showSetup, setShowSetup] = useState(true)

  const [activePlayer, setActivePlayer] = useState<PlayerKey | null>(null)
  const [hasStarted, setHasStarted] = useState(false)
  const [isRunning, setIsRunning] = useState(false)
  const [times, setTimes] = useState({
    p1: toSeconds(defaultSettings.p1Minutes, defaultSettings.p1Seconds),
    p2: toSeconds(defaultSettings.p2Minutes, defaultSettings.p2Seconds),
  })

  const [beeped, setBeeped] = useState<BeepState>(emptyBeepState)
  const [muted, setMuted] = useState(false)
  const [vibrationEnabled, setVibrationEnabled] = useState(false)
  const [theme, setTheme] = useState<"light" | "dark">("light")

  const audioRef = useRef<AudioContext | null>(null)
  const vibrationSupported = useMemo(
    () => typeof navigator !== "undefined" && "vibrate" in navigator,
    []
  )

  useEffect(() => {
    const stored = localStorage.getItem(SETTINGS_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Settings
        setSettings(parsed)
        setSetup(parsed)
        setShowSetup(false)
      } catch {
        setSettings(defaultSettings)
        setSetup(defaultSettings)
        setShowSetup(true)
      }
    } else {
      setShowSetup(true)
    }

    const storedTheme = localStorage.getItem(THEME_KEY)
    if (storedTheme === "dark" || storedTheme === "light") {
      setTheme(storedTheme)
    }

    const storedMute = localStorage.getItem(MUTE_KEY)
    if (storedMute === "true") {
      setMuted(true)
    }

    const storedVibrate = localStorage.getItem(VIBRATE_KEY)
    if (storedVibrate === "true") {
      setVibrationEnabled(true)
    }
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark")
    localStorage.setItem(THEME_KEY, theme)
  }, [theme])

  useEffect(() => {
    localStorage.setItem(MUTE_KEY, String(muted))
  }, [muted])

  useEffect(() => {
    localStorage.setItem(VIBRATE_KEY, String(vibrationEnabled))
  }, [vibrationEnabled])

  useEffect(() => {
    setTimes({
      p1: toSeconds(settings.p1Minutes, settings.p1Seconds),
      p2: toSeconds(settings.p2Minutes, settings.p2Seconds),
    })
    setActivePlayer(null)
    setHasStarted(false)
    setIsRunning(false)
    setBeeped(emptyBeepState)
  }, [settings])

  useEffect(() => {
    if (!isRunning) return
    if (!activePlayer) return
    const interval = window.setInterval(() => {
      setTimes((prev) => {
        if (activePlayer === "p1") {
          return { ...prev, p1: Math.max(0, prev.p1 - 1) }
        }
        return { ...prev, p2: Math.max(0, prev.p2 - 1) }
      })
    }, 1000)

    return () => window.clearInterval(interval)
  }, [activePlayer, isRunning])

  useEffect(() => {
    if (!isRunning) return
    if (!activePlayer) return
    if (activePlayer === "p1" && times.p1 === 0) {
      setIsRunning(false)
    }
    if (activePlayer === "p2" && times.p2 === 0) {
      setIsRunning(false)
    }
  }, [activePlayer, isRunning, times.p1, times.p2])

  const playBeep = useCallback((frequency = 520, duration = 0.08) => {
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
      gain.gain.value = 0.04
      oscillator.connect(gain)
      gain.connect(ctx.destination)
      oscillator.start()
      oscillator.stop(ctx.currentTime + duration)
    } catch {
      // ignore audio errors
    }
  }, [muted])

  const triggerVibration = useCallback(() => {
    if (!vibrationSupported || !vibrationEnabled) return
    navigator.vibrate?.(30)
  }, [vibrationEnabled, vibrationSupported])

  const handleSwitch = useCallback(() => {
    if (!isRunning) return
    if (!hasStarted) return
    if (!activePlayer) return
    if ((activePlayer === "p1" && times.p1 === 0) || (activePlayer === "p2" && times.p2 === 0)) {
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
    triggerVibration()
  }, [activePlayer, hasStarted, isRunning, playBeep, settings.increment, times.p1, times.p2, triggerVibration])

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

  const handleThreshold = useCallback(
    (player: PlayerKey, timeLeft: number) => {
      if (timeLeft <= 0) return
      if (timeLeft === 30 && !beeped[player].thirty) {
        playBeep(460, 0.09)
        setBeeped((prev) => ({
          ...prev,
          [player]: { ...prev[player], thirty: true },
        }))
      }
      if (timeLeft === 10 && !beeped[player].ten) {
        playBeep(620, 0.1)
        setBeeped((prev) => ({
          ...prev,
          [player]: { ...prev[player], ten: true },
        }))
      }
    },
    [beeped, playBeep]
  )

  useEffect(() => {
    handleThreshold("p1", times.p1)
  }, [handleThreshold, times.p1])

  useEffect(() => {
    handleThreshold("p2", times.p2)
  }, [handleThreshold, times.p2])

  const handleSaveSetup = () => {
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
    setShowSetup(false)
  }

  const openSetup = () => {
    setIsRunning(false)
    setSetup(settings)
    setShowSetup(true)
  }

  const startFrom = (player: PlayerKey) => {
    if (times.p1 === 0 && times.p2 === 0) return
    setActivePlayer(player)
    setHasStarted(true)
    setIsRunning(true)
  }

  const toggleRunning = () => {
    if (!hasStarted) return
    if (!activePlayer) return
    if ((activePlayer === "p1" && times.p1 === 0) || (activePlayer === "p2" && times.p2 === 0)) {
      return
    }
    setIsRunning((prev) => !prev)
  }

  if (showSetup) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="mx-auto flex min-h-screen w-full max-w-2xl items-center justify-center p-4">
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="text-2xl">Chess Clock Setup</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Player 1 time</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs uppercase tracking-wide text-muted-foreground">
                      Minutes
                    </label>
                    <Input
                      type="number"
                      min={0}
                      value={setup.p1Minutes}
                      onChange={(event) =>
                        setSetup((prev) => ({
                          ...prev,
                          p1Minutes: Number(event.target.value || 0),
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs uppercase tracking-wide text-muted-foreground">
                      Seconds
                    </label>
                    <Input
                      type="number"
                      min={0}
                      max={59}
                      value={setup.p1Seconds}
                      onChange={(event) =>
                        setSetup((prev) => ({
                          ...prev,
                          p1Seconds: Number(event.target.value || 0),
                        }))
                      }
                    />
                  </div>
                </div>
              </div>

              {!setup.sameTime && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Player 2 time</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs uppercase tracking-wide text-muted-foreground">
                        Minutes
                      </label>
                      <Input
                        type="number"
                        min={0}
                        value={setup.p2Minutes}
                        onChange={(event) =>
                          setSetup((prev) => ({
                            ...prev,
                            p2Minutes: Number(event.target.value || 0),
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs uppercase tracking-wide text-muted-foreground">
                        Seconds
                      </label>
                      <Input
                        type="number"
                        min={0}
                        max={59}
                        value={setup.p2Seconds}
                        onChange={(event) =>
                          setSetup((prev) => ({
                            ...prev,
                            p2Seconds: Number(event.target.value || 0),
                          }))
                        }
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <p className="text-sm font-medium">Same time for Player 2</p>
                  <p className="text-xs text-muted-foreground">Toggle if both players share the same clock.</p>
                </div>
                <Switch
                  checked={setup.sameTime}
                  onCheckedChange={(value) =>
                    setSetup((prev) => ({ ...prev, sameTime: value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Increment per move (seconds)</label>
                <Input
                  type="number"
                  min={0}
                  value={setup.increment}
                  onChange={(event) =>
                    setSetup((prev) => ({
                      ...prev,
                      increment: Number(event.target.value || 0),
                    }))
                  }
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <Button variant="outline" onClick={() => setTheme((prev) => (prev === "dark" ? "light" : "dark"))}>
                  Theme: {theme === "dark" ? "Dark" : "Light"}
                </Button>
                <Button onClick={handleSaveSetup}>Save & Start</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 p-4">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="flex items-center gap-2 text-xl font-semibold">
              <svg
                aria-hidden="true"
                viewBox="0 0 512 512"
                className="h-5 w-5"
              >
                <path
                  fill="currentColor"
                  transform="translate(96 0)"
                  d="M264 136c0 37.1-19.4 69.6-48.6 88H224c17.7 0 32 14.3 32 32s-14.3 32-32 32c0 96 24 128 24 128H72s24-32 24-128c-17.7 0-32-14.3-32-32s14.3-32 32-32h8.5C75.4 205.6 56 173.1 56 136C56 78.6 102.6 32 160 32s104 46.6 104 104zM32 448H288c17.7 0 32 14.3 32 32s-14.3 32-32 32H32c-17.7 0-32-14.3-32-32s14.3-32 32-32z"
                />
              </svg>
              Chess Clock
            </h1>
            <p className="text-sm text-muted-foreground">
              Tap either timer to start, then tap the active timer (or press Space) to switch.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={() => setMuted((prev) => !prev)}>
              {muted ? "Unmute" : "Mute"}
            </Button>
            {vibrationSupported && (
              <Button
                variant="outline"
                onClick={() => setVibrationEnabled((prev) => !prev)}
              >
                {vibrationEnabled ? "Vibration On" : "Vibration Off"}
              </Button>
            )}
            <Button variant="outline" onClick={() => setTheme((prev) => (prev === "dark" ? "light" : "dark"))}>
              Theme: {theme === "dark" ? "Dark" : "Light"}
            </Button>
            <Button variant="outline" onClick={openSetup}>
              Settings
            </Button>

            {hasStarted ? (
              <Button className="w-[170px]" onClick={toggleRunning}>
                {isRunning ? "Pause" : "Resume"}
              </Button>
            ) : (
              <div
                className="inline-flex h-10 w-[170px] items-center justify-center rounded-md border border-border bg-muted px-4 text-sm font-medium text-muted-foreground"
                aria-live="polite"
              >
                Tap a clock to start
              </div>
            )}
          </div>
        </header>

        <div className="grid gap-4 md:grid-cols-2">
          {(
            [
              { key: "p1" as const, label: "Player 1", time: times.p1 },
              { key: "p2" as const, label: "Player 2", time: times.p2 },
            ]
          ).map((player) => {
            const isActive = activePlayer === player.key
            const canSwitch = hasStarted && isActive && isRunning
            const canStart = !hasStarted && (times.p1 > 0 || times.p2 > 0)

            const onClick = !hasStarted
              ? () => startFrom(player.key)
              : canSwitch
                ? handleSwitch
                : undefined

            const disabled = !hasStarted ? !canStart : !canSwitch

            const status = !hasStarted
              ? "Ready"
              : isActive
                ? (isRunning ? "Running" : "Paused")
                : "Waiting"

            return (
              <button
                key={player.key}
                type="button"
                onClick={onClick}
                disabled={disabled}
                className={cn(
                  "transition",
                  !hasStarted ? "cursor-pointer" : canSwitch ? "cursor-pointer" : "cursor-not-allowed"
                )}
              >
                <Card
                  className={cn(
                    "flex h-full min-h-[200px] flex-col items-center justify-center gap-4 px-6 py-10 text-center transition",
                    !hasStarted
                      ? "border-border bg-card text-foreground"
                      : isActive
                        ? "border-primary/60 bg-card text-foreground shadow-lg"
                        : "border-border bg-muted/40 text-muted-foreground"
                  )}
                >
                  <div className="text-sm uppercase tracking-[0.3em] text-muted-foreground">
                    {player.label}
                  </div>
                  <div className="text-5xl font-semibold tabular-nums sm:text-6xl md:text-7xl">
                    {formatTime(player.time)}
                  </div>
                  <div className="text-sm text-muted-foreground">{status}</div>
                </Card>
              </button>
            )
          })}
        </div>

        <footer className="mt-auto flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card/80 p-4 text-sm text-muted-foreground">
          <div>Increment: +{settings.increment}s</div>
          <div>
            {settings.sameTime
              ? `Both: ${formatTime(toSeconds(settings.p1Minutes, settings.p1Seconds))}`
              : `P1 ${formatTime(toSeconds(settings.p1Minutes, settings.p1Seconds))} · P2 ${formatTime(
                  toSeconds(settings.p2Minutes, settings.p2Seconds)
                )}`}
          </div>
        </footer>
      </div>
    </div>
  )
}

export default App
