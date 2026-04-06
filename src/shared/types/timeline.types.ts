export interface TimelineTick {
  value: number;
  isMajor:  boolean;
  isMinor:  boolean;
  isWhole?: boolean;   // integer tick that is not major or minor
  isMicro?: boolean;   // 0.5-step tick between integers
}

export interface TimelineProps {
  min: number;
  max: number;
}

