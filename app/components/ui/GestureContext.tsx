"use client";
import React, { createContext, useContext, useState, useCallback, useRef } from "react";

export type GestureType = "POINT" | "PINCH" | "PALM" | "FIST" | "NONE";

export interface GestureState {
  cursorX: number;
  cursorY: number;
  gesture: GestureType;
  isActive: boolean;
  isPinching: boolean;
  confidence: number;
}

interface GestureContextValue extends GestureState {
  setGestureActive: (active: boolean) => void;
  updateGestureState: (state: Partial<GestureState>) => void;
  activeTabSetter: React.MutableRefObject<((tab: string) => void) | null>;
  trainerTabSetter: React.MutableRefObject<((tab: string) => void) | null>;
  /** Shared camera stream — written by GestureController, read by GestureCursor PiP */
  pipStream: React.MutableRefObject<MediaStream | null>;
}

const defaultState: GestureState = {
  cursorX: -200,
  cursorY: -200,
  gesture: "NONE",
  isActive: false,
  isPinching: false,
  confidence: 0,
};

const GestureContext = createContext<GestureContextValue>({
  ...defaultState,
  setGestureActive: () => {},
  updateGestureState: () => {},
  activeTabSetter: { current: null },
  trainerTabSetter: { current: null },
  pipStream: { current: null },
});

export function GestureProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GestureState>(defaultState);
  const activeTabSetter = useRef<((tab: string) => void) | null>(null);
  const trainerTabSetter = useRef<((tab: string) => void) | null>(null);
  const pipStream = useRef<MediaStream | null>(null);

  const setGestureActive = useCallback((active: boolean) => {
    setState((prev) => ({ ...prev, isActive: active }));
  }, []);

  const updateGestureState = useCallback((partial: Partial<GestureState>) => {
    setState((prev) => ({ ...prev, ...partial }));
  }, []);

  return (
    <GestureContext.Provider
      value={{
        ...state,
        setGestureActive,
        updateGestureState,
        activeTabSetter,
        trainerTabSetter,
        pipStream,
      }}
    >
      {children}
    </GestureContext.Provider>
  );
}

export function useGesture() {
  return useContext(GestureContext);
}
