import { useAppStore } from "../store";

export function WeaponList() {
  const { patterns, selectedWeapon, setSelectedWeapon } = useAppStore();

  return (
    <div className="bg-[#1e222b] rounded-xl border border-white/5 p-4 shadow-2xl h-[calc(100vh-4rem)] overflow-y-auto sticky top-8 custom-scroll">
      <h2 className="text-lg font-bold mb-4 text-white/90 px-2">武器列表</h2>
      <div className="space-y-1">
        {patterns.map((w) => (
          <button
            key={w.id}
            onClick={() => setSelectedWeapon(w)}
            className={`w-full text-left px-3 py-2.5 rounded-md transition-colors text-sm font-medium ${
              w.id === selectedWeapon.id
                ? "bg-[#3b82f6] text-white"
                : "text-white/70 hover:bg-white/5 hover:text-white"
            }`}
          >
            {w.name}
          </button>
        ))}
      </div>
    </div>
  );
}
