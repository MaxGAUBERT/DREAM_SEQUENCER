import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import * as Tone from "tone";
import Play from "./TransportManager/Play";
import Pause from "./TransportManager/Pause";
import Record from "./TransportManager/Record";
import ClearRec from "./TransportManager/ClearRec";
import ReplayRec from "./TransportManager/ReplayRec";

export default function Transport() {





  return (
    <div className="absolute top-1 left-1/4 flex flex-row gap-1 z-[1550]">
      <Play />
      <Pause />
      <div className="flex flex-row ml-3 gap-1">
        <Record />
        <ClearRec />
        <ReplayRec />
      </div>
    </div>
  )
}