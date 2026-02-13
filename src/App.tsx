import { useChessClock } from "@/hooks/useChessClock"
import { SetupScreen } from "@/components/SetupScreen"
import { ClockScreen } from "@/components/ClockScreen"

function App() {
  const clock = useChessClock()

  if (clock.showSetup) {
    return (
      <SetupScreen
        setup={clock.setup}
        theme={clock.setup.theme}
        onSetupChange={clock.setSetup}
        onThemeToggle={() =>
          clock.setTheme((prev) => (prev === "dark" ? "light" : "dark"))
        }
        onSave={clock.handleSaveSetup}
      />
    )
  }

  return (
    <ClockScreen
      settings={clock.settings}
      activePlayer={clock.activePlayer}
      hasStarted={clock.hasStarted}
      isRunning={clock.isRunning}
      times={clock.times}
      muted={clock.muted}
      fullscreen={clock.fullscreen}
      onMuteToggle={() => clock.setMuted((prev) => !prev)}
      onFullscreenToggle={() => clock.setFullscreen((prev) => !prev)}
      onOpenSetup={clock.openSetup}
      onToggleRunning={clock.toggleRunning}
      onReset={clock.resetClock}
      onStartFrom={clock.startFrom}
      onSwitch={clock.handleSwitch}
    />
  )
}

export default App
