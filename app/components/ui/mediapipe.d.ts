// Ambient type declaration for @mediapipe/tasks-vision
// The package ships vision.d.ts but tsc may not resolve it via exports field.
// Types are re-declared minimally here so the build passes cleanly.
declare module "@mediapipe/tasks-vision" {
  export interface FilesetResolverOptions {
    wasmLoaderPath?: string;
    wasmBinaryPath?: string;
  }

  export interface WasmFileset {
    wasmLoaderPath: string;
    wasmBinaryPath: string;
  }

  export class FilesetResolver {
    static forVisionTasks(wasmPath: string): Promise<WasmFileset>;
  }

  export interface HandLandmarkerOptions {
    baseOptions?: {
      modelAssetPath?: string;
      delegate?: "GPU" | "CPU";
    };
    runningMode?: "IMAGE" | "VIDEO";
    numHands?: number;
    minHandDetectionConfidence?: number;
    minHandPresenceConfidence?: number;
    minTrackingConfidence?: number;
  }

  export interface NormalizedLandmark {
    x: number;
    y: number;
    z: number;
  }

  export interface HandLandmarkerResult {
    landmarks: NormalizedLandmark[][];
    worldLandmarks: NormalizedLandmark[][];
    handedness: { categoryName: string; score: number }[][];
  }

  export class HandLandmarker {
    static createFromOptions(
      wasmFileset: WasmFileset,
      options: HandLandmarkerOptions
    ): Promise<HandLandmarker>;
    detectForVideo(
      video: HTMLVideoElement,
      timestamp: number
    ): HandLandmarkerResult;
    close(): void;
  }
}
