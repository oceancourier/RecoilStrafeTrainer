/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MainPanel } from "./components/MainPanel";
import { OverlayWindow } from "./components/OverlayWindow";
import { WeaponList } from "./components/WeaponList";
import { AppProvider } from "./store";

export default function App() {
  const searchParams = new URLSearchParams(window.location.search);
  const isOverlayWindow = searchParams.get("overlay") === "1";

  if (isOverlayWindow) {
    return <OverlayWindow />;
  }

  return (
    <AppProvider>
      <main className="min-h-screen bg-[#131823] py-8 px-4 text-white font-sans">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-6">
            <aside className="order-2 md:order-1 self-start">
              <WeaponList />
            </aside>
            <div className="order-1 md:order-2 self-start flex flex-col">
              <MainPanel />
            </div>
          </div>
        </div>
      </main>
    </AppProvider>
  );
}
