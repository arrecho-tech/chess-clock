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
  fullscreen: boolean
  pseudoFullscreen: boolean
  onMuteToggle: () => void
  onFullscreenToggle: () => void
  onOpenSetup: () => void
  onToggleRunning: () => void
  onReset: () => void
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
  fullscreen,
  pseudoFullscreen,
  onMuteToggle,
  onFullscreenToggle,
  onOpenSetup,
  onToggleRunning,
  onReset,
  onStartFrom,
  onSwitch,
}: ClockScreenProps) {
  const gameOver =
    hasStarted && ((activePlayer === "p1" && times.p1 === 0) || (activePlayer === "p2" && times.p2 === 0))

  return (
    <div
      className={cn(
        "h-full w-full bg-background text-foreground",
        pseudoFullscreen && "fixed inset-0 z-50 h-[100dvh] min-h-[100svh] overflow-hidden",
      )}
    >
      <div
        className={cn(
          "mx-auto flex h-full w-full flex-col overflow-hidden",
          fullscreen
            ? "max-w-[1280px] gap-2 px-2 pb-2 sm:gap-3 sm:px-4 sm:pb-4"
            : "max-w-5xl gap-6 p-4",
        )}
        style={
          fullscreen
            ? {
                paddingTop: "max(0.5rem, env(safe-area-inset-top))",
                paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))",
                paddingLeft: "max(0.5rem, env(safe-area-inset-left))",
                paddingRight: "max(0.5rem, env(safe-area-inset-right))",
              }
            : undefined
        }
      >
        {!fullscreen && (
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
              <details className="group relative mt-1 w-fit">
                <summary className="list-none cursor-pointer select-none text-sm text-muted-foreground underline decoration-dotted underline-offset-4 hover:text-foreground">
                  Instructions
                </summary>
                <div className="absolute left-0 top-full z-20 mt-2 w-[min(28rem,calc(100vw-2rem))] rounded-lg border border-border bg-card p-3 text-sm text-foreground shadow-lg">
                  <div className="font-medium">How to use</div>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
                    <li>Tap either clock to start.</li>
                    <li>Tap the active clock (or press Space) to switch turns.</li>
                    <li>Use Settings to change times/increment.</li>
                  </ul>
                  <div className="mt-2 text-xs text-muted-foreground">Tip: tap outside to close on mobile.</div>
                </div>
              </details>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" onClick={onMuteToggle}>
                {muted ? "Unmute" : "Mute"}
              </Button>
              <Button variant="outline" onClick={onFullscreenToggle}>
                {fullscreen ? "Exit Fullscreen" : "Fullscreen"}
              </Button>
              <Button variant="outline" onClick={onOpenSetup}>
                Settings
              </Button>

              {hasStarted && (
                <Button variant="outline" onClick={onReset}>
                  Reset
                </Button>
              )}

              {hasStarted ? (
                <Button className="w-[170px]" onClick={gameOver ? onReset : onToggleRunning}>
                  {gameOver ? "New Game" : isRunning ? "Pause" : "Resume"}
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
        )}

        {fullscreen && (
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-card/85 px-2 py-2 backdrop-blur supports-[backdrop-filter]:bg-card/70 sm:px-3">
            <details className="group relative">
              <summary className="list-none cursor-pointer select-none text-xs text-muted-foreground underline decoration-dotted underline-offset-4 hover:text-foreground sm:text-sm">
                Instructions
              </summary>
              <div className="absolute left-0 top-full z-20 mt-2 w-[min(28rem,calc(100vw-2rem))] rounded-lg border border-border bg-card p-3 text-sm text-foreground shadow-lg">
                <div className="font-medium">How to use</div>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
                  <li>Tap the active clock (or press Space) to switch turns.</li>
                  <li>Reset starts a new game with current settings.</li>
                  <li>Exit Fullscreen is always available here.</li>
                </ul>
              </div>
            </details>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Button variant="outline" size="sm" onClick={onMuteToggle}>
                {muted ? "Unmute" : "Mute"}
              </Button>
              {hasStarted && (
                <Button variant="outline" size="sm" onClick={onReset}>
                  Reset
                </Button>
              )}
              {hasStarted && (
                <Button size="sm" onClick={gameOver ? onReset : onToggleRunning}>
                  {gameOver ? "New Game" : isRunning ? "Pause" : "Resume"}
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={onFullscreenToggle}>
                Exit Fullscreen
              </Button>
            </div>
          </div>
        )}

        <div className={cn("min-h-0", fullscreen && "flex min-h-0 flex-1 items-center justify-center overflow-hidden")}>
          <div
            className={cn(
              "min-h-0 w-full gap-4",
              fullscreen
                ? "grid h-full flex-1 grid-rows-2 gap-2 overflow-hidden md:h-auto md:max-h-[min(84dvh,860px)] md:grid-cols-2 md:grid-rows-1"
                : "grid md:grid-cols-2",
            )}
          >
            {(
              [
                { key: "p1" as const, label: "Player 1", time: times.p1 },
                { key: "p2" as const, label: "Player 2", time: times.p2 },
              ] as const
            ).map((player) => {
            const isActive = activePlayer === player.key
            const canSwitch = hasStarted && isActive && isRunning
            const canStart = !hasStarted && (times.p1 > 0 || times.p2 > 0)

            const onClick = !hasStarted ? () => onStartFrom(player.key) : canSwitch ? onSwitch : undefined

            const disabled = !hasStarted ? !canStart : !canSwitch

            const status = !hasStarted ? "Ready" : isActive ? (isRunning ? "Running" : "Paused") : "Waiting"

              return (
                <button
                  key={player.key}
                  type="button"
                  onClick={onClick}
                  disabled={disabled}
                  className={cn(
                    "min-h-0 transition",
                    fullscreen && "flex h-full",
                    !hasStarted ? "cursor-pointer" : canSwitch ? "cursor-pointer" : "cursor-not-allowed",
                  )}
                >
                  <Card
                    className={cn(
                      "flex h-full min-h-0 w-full flex-col items-center justify-center gap-3 px-4 text-center transition sm:gap-4 sm:px-6",
                      fullscreen ? "py-4 sm:py-8" : "min-h-[200px] py-10",
                      !hasStarted
                        ? "border-border bg-card text-foreground"
                        : isActive
                          ? "border-primary/60 bg-card text-foreground shadow-lg"
                          : "border-border bg-muted/40 text-muted-foreground",
                    )}
                  >
                    <div className={cn("text-sm uppercase tracking-[0.3em] text-muted-foreground", fullscreen && "text-xs sm:text-sm")}>
                      {player.label}
                    </div>
                    <div
                      className={cn(
                        "font-semibold tabular-nums leading-none",
                        fullscreen ? "text-5xl sm:text-6xl lg:text-7xl xl:text-8xl" : "text-5xl sm:text-6xl md:text-7xl",
                      )}
                    >
                      {formatTime(player.time)}
                    </div>
                    <div className={cn("text-sm text-muted-foreground", fullscreen && "text-xs sm:text-sm")}>{status}</div>
                  </Card>
                </button>
              )
            })}
          </div>
        </div>

        {!fullscreen && (
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
        )}
      </div>
    </div>
  )
}
