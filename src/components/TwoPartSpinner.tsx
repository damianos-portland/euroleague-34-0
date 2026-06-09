"use client";

import { useEffect, useState } from "react";
import Reel from "./Reel";
import { Btn } from "./ui";

export default function TwoPartSpinner({
  clubName,
  clubCrest,
  eraLabel,
  clubItems,
  eraItems,
  teamReelKey,
  eraReelKey,
  teamRespinsLeft,
  eraRespinsLeft,
  onReSpinTeam,
  onReSpinEra,
  onReady,
}: {
  clubName: string | null;
  clubCrest: string | null;
  eraLabel: string | null;
  clubItems: string[];
  eraItems: string[];
  teamReelKey: number; // changes on new round or club re-spin
  eraReelKey: number; // changes on new round or era re-spin (NOT club re-spin)
  teamRespinsLeft: number;
  eraRespinsLeft: number;
  onReSpinTeam: () => void;
  onReSpinEra: () => void;
  onReady: () => void;
}) {
  const [teamDone, setTeamDone] = useState(false);
  const [eraDone, setEraDone] = useState(false);

  useEffect(() => setTeamDone(false), [teamReelKey]);
  useEffect(() => setEraDone(false), [eraReelKey]);
  useEffect(() => {
    if (teamDone && eraDone) onReady();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamDone, eraDone]);

  return (
    <div className="rounded-2xl border border-line bg-gradient-to-b from-surface2 to-surface p-4">
      <div className="space-y-2">
        <Reel
          label="Club"
          items={clubItems}
          landed={clubName}
          spinKey={teamReelKey}
          accent
          landedIconSrc={clubCrest}
          onDone={() => setTeamDone(true)}
        />
        <Reel
          label="Era"
          items={eraItems}
          landed={eraLabel}
          spinKey={eraReelKey}
          startDelay={120}
          onDone={() => setEraDone(true)}
        />
      </div>
      <div className="mt-3 flex justify-between gap-2">
        <Btn
          variant="outline"
          onClick={onReSpinTeam}
          disabled={teamRespinsLeft <= 0}
          className="!px-3 !py-1.5 text-xs"
        >
          🎲 Re-spin club ({teamRespinsLeft})
        </Btn>
        <Btn
          variant="outline"
          onClick={onReSpinEra}
          disabled={eraRespinsLeft <= 0}
          className="!px-3 !py-1.5 text-xs"
        >
          🎲 Re-spin era ({eraRespinsLeft})
        </Btn>
      </div>
    </div>
  );
}
