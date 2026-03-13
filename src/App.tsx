import { Crosshair, Monitor, MoonStar, Sparkles, SunMedium } from "lucide-react";
import { MainPanel } from "./components/MainPanel";
import { OverlayWindow } from "./components/OverlayWindow";
import { WeaponList } from "./components/WeaponList";
import { isElectronDesktop } from "./desktop";
import { AppProvider } from "./store";
import { ThemeProvider, useTheme } from "./theme";

function DesktopDashboard() {
  const { theme, setTheme } = useTheme();
  const isDesktop = isElectronDesktop();

  return (
    <AppProvider>
      <main className="app-shell">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-20 top-0 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(245,158,11,0.22),transparent_65%)] blur-3xl" />
          <div className="absolute right-[-4rem] top-16 h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(59,130,246,0.18),transparent_70%)] blur-3xl" />
          <div className="absolute bottom-[-6rem] left-1/3 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(14,165,233,0.14),transparent_65%)] blur-3xl" />
        </div>

        <div className="relative mx-auto flex h-screen w-full max-w-[1700px] flex-col overflow-hidden px-2.5 py-2.5 md:px-3 md:py-3">
          <header className="panel-surface mb-2 overflow-hidden px-3.5 py-2.5 md:px-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2.5">
                <div className="inline-flex items-center gap-2 rounded-full border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.32em] text-[color:var(--app-text-muted)]">
                  <Sparkles className="h-3.5 w-3.5" />
                  RecoilStrafeTrainer
                </div>

                <div className="hidden flex-wrap gap-1.5 lg:flex">
                  <div className="info-chip">
                    <Crosshair className="h-4 w-4" />
                    方向提示
                  </div>
                  <div className="info-chip">
                    <Monitor className="h-4 w-4" />
                    {isDesktop ? "全局监听" : "页面监听"}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="theme-switcher">
                  <button
                    type="button"
                    onClick={() => setTheme("light")}
                    className={theme === "light" ? "theme-option theme-option-active" : "theme-option"}
                  >
                    <SunMedium className="h-4 w-4" />
                    Light
                  </button>
                  <button
                    type="button"
                    onClick={() => setTheme("dark")}
                    className={theme === "dark" ? "theme-option theme-option-active" : "theme-option"}
                  >
                    <MoonStar className="h-4 w-4" />
                    Dark
                  </button>
                </div>
              </div>
            </div>
          </header>

          <div className="grid min-h-0 flex-1 grid-cols-[258px_minmax(0,1fr)] gap-3">
            <aside className="min-h-0">
              <WeaponList />
            </aside>

            <section className="min-h-0 min-w-0">
              <MainPanel />
            </section>
          </div>
        </div>
      </main>
    </AppProvider>
  );
}

export default function App() {
  const searchParams = new URLSearchParams(window.location.search);
  const isOverlayWindow = searchParams.get("overlay") === "1";

  return <ThemeProvider>{isOverlayWindow ? <OverlayWindow /> : <DesktopDashboard />}</ThemeProvider>;
}
