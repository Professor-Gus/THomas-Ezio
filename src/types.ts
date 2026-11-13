export interface Trigger {
  id: string;
  phrase: string;
  videoUrl: string;
  description: string;
  ambientSound?: "rain" | "birds" | "wind" | "cyber" | "none";
}

export interface PresetVideo {
  name: string;
  phrase: string;
  videoUrl: string;
  description: string;
  ambientSound: "rain" | "birds" | "wind" | "cyber" | "none";
}

export interface MessageLog {
  id: string;
  sender: "user" | "guardian";
  text: string;
  timestamp: string;
  matchedTriggerId?: string | null;
}

export type AlertLevel = "NORMAL" | "WARNING" | "CRITICAL";

export interface LogEntry {
  id: string;
  source: 'SYSTEM' | 'TACTICAL' | 'NAVIGATION' | 'COMMS';
  message: string;
  type: 'INFO' | 'WARN' | 'ALERT';
  timestamp: string;
}

export interface PowerGrid {
  shields: number;
  engines: number;
  weapons: number;
  lifeSupport: number;
}
