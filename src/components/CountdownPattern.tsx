import { OverlayDisplay } from "./OverlayDisplay";
import { useAppStore } from "../store";
import { buildOverlayState } from "../overlay";

export function CountdownPattern() {
  const { selectedWeapon, playbackState, totalDuration, statusText, timeline, waitTime, triggerBinding } = useAppStore();

  const overlayState = buildOverlayState({
    selectedWeapon,
    playbackState,
    timeline,
    waitTime,
    totalDuration,
    statusText,
    triggerBinding,
    overlayScale: 1,
    overlayOpacity: 1,
  });

  return (
    <div className="pt-2">
      <OverlayDisplay state={overlayState} />
    </div>
  );
}
