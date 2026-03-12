import { SelectedWeapons } from "./SelectedWeapons";
import { StrafePattern } from "./StrafePattern";
import { CountdownPattern } from "./CountdownPattern";
import { Controls } from "./Controls";

export function MainPanel() {
  return (
    <section className="relative rounded-xl border border-white/5 bg-[#1e222b] p-6 text-white shadow-2xl flex flex-col gap-6">
      <SelectedWeapons />
      <StrafePattern />
      <CountdownPattern />
      <Controls />
    </section>
  );
}
