declare module 'soundtouchjs' {
  export interface SoundTouchPlayEventDetail {
    timePlayed: number;
    formattedTimePlayed: string;
    percentagePlayed: number;
  }

  export class PitchShifter {
    constructor(
      context: AudioContext | BaseAudioContext,
      buffer: AudioBuffer,
      bufferSize: number,
      onEnd?: () => void
    );
    duration: number;
    sampleRate: number;
    timePlayed: number;
    sourcePosition: number;
    formattedDuration: string;
    formattedTimePlayed: string;
    percentagePlayed: number;
    pitch: number;
    pitchSemitones: number;
    rate: number;
    tempo: number;
    node: AudioNode;
    connect(toNode: AudioNode): void;
    disconnect(): void;
    on(eventName: string, cb: (detail: SoundTouchPlayEventDetail) => void): void;
    off(eventName?: string | null): void;
  }

  export class SoundTouch {
    pitch: number;
    pitchSemitones: number;
    rate: number;
    tempo: number;
  }

  export class SimpleFilter {
    sourcePosition: number;
    constructor(source: any, pipe: any, onEnd?: () => void);
  }

  export class WebAudioBufferSource {
    constructor(buffer: AudioBuffer);
  }

  export function getWebAudioNode(
    context: any,
    filter: any,
    sourcePositionCallback: (sourcePosition: number) => void,
    bufferSize: number
  ): AudioNode;
}
