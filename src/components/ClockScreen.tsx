import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { PlayerKey, Settings } from "@/hooks/useChessClock"
import { formatTime, toSeconds } from "@/hooks/useChessClock"

type ClockScreenProps = {
  settings: Settings
  activePlayer: PlayerKey | null
  hasStarted: boolean
  isRunning: boolean
  times: { p1: number; p2: number }
  muted: boolean
  vibrationEnabled: boolean
  vibrationSupported: boolean
  theme: "light" | "dark"
  onMuteToggle: () => void
  onVibrationToggle: () => void
  onThemeToggle: () => void
  onOpenSetup: () => void
  onToggleRunning: () => void
  onStartFrom: (player: PlayerKey) => void
  onSwitch: () => void
}

export function ClockScreen({
  settings,
  activePlayer,
  hasStarted,
  isRunning,
  times,
  muted,
  vibrationEnabled,
  vibrationSupported,
  theme,
  onMuteToggle,
  onVibrationToggle,
  onThemeToggle,
  onOpenSetup,
  onToggleRunning,
  onStartFrom,
  onSwitch,
}: ClockScreenProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 p-4">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="flex items-center gap-2 text-xl font-semibold">
              <svg aria-hidden="true" viewBox="0 0 512 512" className="h-5 w-5">
                <path
                  fill="currentColor"
                  transform="translate(96 0)"
                  d="M264 136c0 37.1-19.4 69.6-48.6 88H224c17.7 0 32 14.3 32 32s-14.3 32-32 32c0 96 24 128 24 128H72s24-32 24-128c-17.7 0-32-14.3-32-32s14.3-32 32-32h8.5C75.4 205.6 56 173.1 56 136C56 78.6 102.6 32 160 32s104 46.6 104 104zM32 448H288c17.7 0 32 14.3 32 32s-14.3 32-32 32H32c-17.7 0-32-14.3-32-32s14.3-32 32-32z"
                />
              </svg>
              Chess Clock
            </h1>
            <p className="text-sm text-muted-foreground">
              Tap either timer to start, then tap the active timer (or press
              Space) to switch.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={onMuteToggle}>
              {muted ? "Unmute" : "Mute"}
            </Button>
            {vibrationSupported && (
              <Button variant="outline" onClick={onVibrationToggle}>
                {vibrationEnabled ? "Vibration On" : "Vibration Off"}
              </Button>
            )}
            <Button variant="outline" onClick={onThemeToggle}>
              Theme: {theme === "dark" ? "Dark" : "Light"}
            </Button>
            <Button variant="outline" onClick={onOpenSetup}>
              Settings
            </Button>

            {hasStarted ? (
              <Button className="w-[170px]" onClick={onToggleRunning}>
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
            ] as const
          ).map((player) => {
            const isActive = activePlayer === player.key
            const canSwitch = hasStarted && isActive && isRunning
            const canStart = !hasStarted && (times.p1 > 0 || times.p2 > 0)

            const onClick = !hasStarted
              ? () => onStartFrom(player.key)
              : canSwitch
                ? onSwitch
                : undefined

            const disabled = !hasStarted ? !canStart : !canSwitch

            const status = !hasStarted
              ? "Ready"
              : isActive
                ? isRunning
                  ? "Running"
                  : "Paused"
                : "Waiting"

            return (
              <button
                key={player.key}
                type="button"
                onClick={onClick}
                disabled={disabled}
                className={cn(
                  "transition",
                  !hasStarted
                    ? "cursor-pointer"
                    : canSwitch
                      ? "cursor-pointer"
                      : "cursor-not-allowed",
                )}
              >
                <Card
                  className={cn(
                    "flex h-full min-h-[200px] flex-col items-center justify-center gap-4 px-6 py-10 text-center transition",
                    !hasStarted
                      ? "border-border bg-card text-foreground"
                      : isActive
                        ? "border-primary/60 bg-card text-foreground shadow-lg"
                        : "border-border bg-muted/40 text-muted-foreground",
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
                  toSeconds(settings.p2Minutes, settings.p2Seconds),
                )}`}
          </div>
        </footer>
      </div>
    </div>
  )
}
