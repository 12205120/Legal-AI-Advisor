"use client";
import { useEffect, useRef, useCallback } from "react";
import { useGesture, GestureType } from "./GestureContext";

// ─── Landmark indices ───────────────────────────────────────────────────────
const WRIST = 0;
const THUMB_TIP = 4;
const INDEX_TIP = 8;
const INDEX_MCP = 5;
const MIDDLE_TIP = 12;
const MIDDLE_MCP = 9;
const RING_TIP = 16;
const RING_MCP = 13;
const PINKY_TIP = 20;
const PINKY_MCP = 17;

interface Landmark { x: number; y: number; z: number; }

function dist(a: Landmark, b: Landmark) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function isFingerExtended(tip: Landmark, mcp: Landmark, wrist: Landmark) {
  return dist(tip, wrist) > dist(mcp, wrist) * 1.1;
}

function detectGesture(lm: Landmark[]): GestureType {
  const wrist = lm[WRIST];
  const thumbTip = lm[THUMB_TIP];
  const indexTip = lm[INDEX_TIP];
  const middleTip = lm[MIDDLE_TIP];
  const ringTip = lm[RING_TIP];
  const pinkyTip = lm[PINKY_TIP];

  const indexExt = isFingerExtended(indexTip, lm[INDEX_MCP], wrist);
  const middleExt = isFingerExtended(middleTip, lm[MIDDLE_MCP], wrist);
  const ringExt = isFingerExtended(ringTip, lm[RING_MCP], wrist);
  const pinkyExt = isFingerExtended(pinkyTip, lm[PINKY_MCP], wrist);

  if (dist(thumbTip, indexTip) < 0.07) return "PINCH";
  if (indexExt && middleExt && ringExt && pinkyExt) return "PALM";
  if (indexExt && !middleExt && !ringExt && !pinkyExt) return "POINT";
  if (!indexExt && !middleExt && !ringExt && !pinkyExt) return "FIST";
  return "NONE";
}

// ── Load MediaPipe via ES module script injected into <head> ─────────────────
// This bypasses webpack entirely and loads directly from CDN at runtime.
const MEDIAPIPE_VERSION = "0.10.14";
const MEDIAPIPE_CDN = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MEDIAPIPE_VERSION}`;
const MEDIAPIPE_WASM = `${MEDIAPIPE_CDN}/wasm`;
const MEDIAPIPE_MODEL = "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";

function injectMediaPipeScript(): Promise<{ HandLandmarker: any; FilesetResolver: any }> {
  return new Promise((resolve, reject) => {
    // Already fully loaded
    if ((window as any).__mpHandLandmarker && (window as any).__mpFilesetResolver) {
      resolve({ HandLandmarker: (window as any).__mpHandLandmarker, FilesetResolver: (window as any).__mpFilesetResolver });
      return;
    }

    // Currently loading – attach to the ready event
    if ((window as any).__mpLoading) {
      const onReady = () => {
        if ((window as any).__mpHandLandmarker) {
          resolve({ HandLandmarker: (window as any).__mpHandLandmarker, FilesetResolver: (window as any).__mpFilesetResolver });
        } else {
          reject(new Error("MediaPipe script loaded but classes not found on window"));
        }
      };
      window.addEventListener("__mpReady", onReady, { once: true });
      return;
    }

    (window as any).__mpLoading = true;
    console.log("[GestureController] Injecting MediaPipe ES module from CDN…");

    const s = document.createElement("script");
    s.type = "module";
    // Import from CDN and expose on window, then signal ready
    s.textContent = [
      `import { HandLandmarker, FilesetResolver } from "${MEDIAPIPE_CDN}/vision_bundle.mjs";`,
      `window.__mpHandLandmarker = HandLandmarker;`,
      `window.__mpFilesetResolver = FilesetResolver;`,
      `console.log("[MediaPipe] Classes loaded from CDN ✓");`,
      `window.dispatchEvent(new Event("__mpReady"));`,
    ].join("\n");

    s.onerror = (e) => {
      console.error("[GestureController] Script injection failed:", e);
      (window as any).__mpLoading = false;
      reject(new Error("Failed to inject MediaPipe ES module from CDN"));
    };

    document.head.appendChild(s);

    window.addEventListener("__mpReady", () => {
      if ((window as any).__mpHandLandmarker) {
        resolve({ HandLandmarker: (window as any).__mpHandLandmarker, FilesetResolver: (window as any).__mpFilesetResolver });
      } else {
        reject(new Error("MediaPipe script ran but HandLandmarker missing"));
      }
    }, { once: true });

    // 45s timeout (model download can be slow)
    setTimeout(() => reject(new Error("MediaPipe load timeout after 45s")), 45000);
  });
}


// ─── Main Component ─────────────────────────────────────────────────────────
export default function GestureController() {
  const { isActive, updateGestureState, pipStream } = useGesture();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const landmarkerRef = useRef<any>(null);
  const lastClickRef = useRef<number>(0);
  const pinchStartRef = useRef<number>(0);
  const smooth = useRef({ x: 400, y: 300 });

  // ── Draw hand skeleton on PiP canvas ───────────────────────────────────
  const drawSkeleton = useCallback((landmarks: Landmark[]) => {
    const canvas = document.getElementById("gesture-pip-canvas") as HTMLCanvasElement | null;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const connections: number[][] = [
      [0,1],[1,2],[2,3],[3,4],
      [0,5],[5,6],[6,7],[7,8],
      [0,9],[9,10],[10,11],[11,12],
      [0,13],[13,14],[14,15],[15,16],
      [0,17],[17,18],[18,19],[19,20],
      [5,9],[9,13],[13,17],
    ];

    const tx = (lm: Landmark) => (1 - lm.x) * canvas.width;
    const ty = (lm: Landmark) => lm.y * canvas.height;

    ctx.strokeStyle = "rgba(0,255,255,0.85)";
    ctx.lineWidth = 2;
    for (const [a, b] of connections) {
      ctx.beginPath();
      ctx.moveTo(tx(landmarks[a]), ty(landmarks[a]));
      ctx.lineTo(tx(landmarks[b]), ty(landmarks[b]));
      ctx.stroke();
    }
    for (const lm of landmarks) {
      ctx.beginPath();
      ctx.arc(tx(lm), ty(lm), 4, 0, Math.PI * 2);
      ctx.fillStyle = "#ffff00";
      ctx.fill();
    }
  }, []);

  // ── Pinch → synthetic click ─────────────────────────────────────────────
  const handlePinch = useCallback((x: number, y: number) => {
    const now = Date.now();
    if (now - lastClickRef.current < 900) return;
    lastClickRef.current = now;

    const el = document.elementFromPoint(x, y) as HTMLElement | null;
    if (!el) return;
    const clickable = el.closest(
      "button, a, [data-gesture-id], input, select, textarea, [role=button]"
    ) as HTMLElement | null;

    if (clickable) {
      clickable.click();
      const prev = clickable.style.boxShadow;
      clickable.style.transition = "box-shadow 0.15s";
      clickable.style.boxShadow = "0 0 35px 8px rgba(0,255,255,1)";
      setTimeout(() => { if (clickable) clickable.style.boxShadow = prev; }, 350);
    }
  }, []);

  // ── Inference loop ──────────────────────────────────────────────────────
  const startLoop = useCallback((landmarker: any) => {
    const loop = () => {
      if (!videoRef.current) return;
      try {
        if (videoRef.current.readyState >= 2) {
          const results = landmarker.detectForVideo(videoRef.current, performance.now());
          if (results?.landmarks?.length > 0) {
            const lm: Landmark[] = results.landmarks[0];
            const rawX = (1 - lm[INDEX_TIP].x) * window.innerWidth;
            const rawY = lm[INDEX_TIP].y * window.innerHeight;

            smooth.current.x += (rawX - smooth.current.x) * 0.25;
            smooth.current.y += (rawY - smooth.current.y) * 0.25;

            const gesture = detectGesture(lm);
            const isPinching = gesture === "PINCH";

            if (isPinching) {
              if (pinchStartRef.current === 0) pinchStartRef.current = Date.now();
              else if (Date.now() - pinchStartRef.current > 600) {
                handlePinch(smooth.current.x, smooth.current.y);
                pinchStartRef.current = Date.now();
              }
            } else {
              pinchStartRef.current = 0;
            }

            drawSkeleton(lm);
            updateGestureState({
              cursorX: smooth.current.x,
              cursorY: smooth.current.y,
              gesture, isPinching, confidence: 1,
            });
          } else {
            updateGestureState({ gesture: "NONE", isPinching: false, confidence: 0 });
          }
        }
      } catch (_) { /* silent */ }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
  }, [drawSkeleton, handlePinch, updateGestureState]);

  // ── Start camera + MediaPipe ────────────────────────────────────────────
  const startCamera = useCallback(async () => {
    try {
      // Load MediaPipe classes from CDN (bypasses webpack entirely)
      const { HandLandmarker, FilesetResolver } = await injectMediaPipeScript();

      const vision = await FilesetResolver.forVisionTasks(MEDIAPIPE_WASM);
      const handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: MEDIAPIPE_MODEL,
          delegate: "GPU",
        },
        runningMode: "VIDEO",
        numHands: 1,
      });

      landmarkerRef.current = handLandmarker;

      // Camera stream
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" },
      });
      streamRef.current = stream;
      pipStream.current = stream; // share with GestureCursor PiP

      // Hidden video for inference
      let video = videoRef.current;
      if (!video) {
        video = document.createElement("video");
        video.style.position = "fixed";
        video.style.opacity = "0";
        video.style.pointerEvents = "none";
        video.style.top = "-9999px";
        video.autoplay = true;
        video.playsInline = true;
        video.muted = true;
        document.body.appendChild(video);
        videoRef.current = video;
      }
      video.srcObject = stream;
      await new Promise<void>((res) => { video!.onloadeddata = () => res(); });

      startLoop(handLandmarker);
    } catch (err: any) {
      console.error("GestureController:", err?.message || err);
      updateGestureState({ isActive: false });
    }
  }, [startLoop, updateGestureState, pipStream]);

  // ── Stop ────────────────────────────────────────────────────────────────
  const stopCamera = useCallback(() => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    pipStream.current = null;
    if (videoRef.current) { videoRef.current.srcObject = null; videoRef.current.remove(); videoRef.current = null; }
    if (landmarkerRef.current) { try { landmarkerRef.current.close?.(); } catch (_) {} landmarkerRef.current = null; }
    updateGestureState({ cursorX: -200, cursorY: -200, gesture: "NONE", isPinching: false, confidence: 0 });
  }, [updateGestureState, pipStream]);

  useEffect(() => {
    if (isActive) startCamera();
    else stopCamera();
    return () => { stopCamera(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive]);

  return null;
}
