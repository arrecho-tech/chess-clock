import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import type { Settings } from "@/hooks/useChessClock"

type SetupScreenProps = {
  setup: Settings
  theme: "light" | "dark"
  onSetupChange: React.Dispatch<React.SetStateAction<Settings>>
  onThemeToggle: () => void
  onSave: () => void
}

export function SetupScreen({
  setup,
  theme,
  onSetupChange,
  onThemeToggle,
  onSave,
}: SetupScreenProps) {
  return (
    <div className="h-full w-full bg-background text-foreground">
      <div className="mx-auto flex h-full w-full max-w-2xl items-center justify-center p-4">
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-2xl">Chess Clock Setup</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                Player 1 time
              </p>
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
                      onSetupChange((prev) => ({
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
                      onSetupChange((prev) => ({
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
                <p className="text-sm font-medium text-muted-foreground">
                  Player 2 time
                </p>
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
                        onSetupChange((prev) => ({
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
                        onSetupChange((prev) => ({
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
                <p className="text-xs text-muted-foreground">
                  Toggle if both players share the same clock.
                </p>
              </div>
              <Switch
                checked={setup.sameTime}
                onCheckedChange={(value) =>
                  onSetupChange((prev) => ({ ...prev, sameTime: value }))
                }
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Increment per move (seconds)
              </label>
              <Input
                type="number"
                min={0}
                value={setup.increment}
                onChange={(event) =>
                  onSetupChange((prev) => ({
                    ...prev,
                    increment: Number(event.target.value || 0),
                  }))
                }
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <Button variant="outline" onClick={onThemeToggle}>
                Theme: {theme === "dark" ? "Dark" : "Light"}
              </Button>
              <Button onClick={onSave}>Save &amp; Start</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
