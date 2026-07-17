export type ChapterId = string;

export type MaterialKind =
  | 'briefing'
  | 'profile'
  | 'document'
  | 'image'
  | 'camera'
  | 'audio'
  | 'map'
  | 'log'
  | 'message';

export type LocationId = string;

export interface Suspect {
  id: string;
  name: string;
  role: string;
  portrait: string;
  portraitAlt: string;
  summary: string;
  statement: string;
  tags: string[];
}

export interface MaterialSection {
  heading?: string;
  body: string;
}

export interface Material {
  id: string;
  chapterId: ChapterId;
  title: string;
  eyebrow: string;
  kind: MaterialKind;
  summary: string;
  sections: MaterialSection[];
  image?: string;
  imageAlt?: string;
  suspectIds: string[];
  locations: LocationId[];
  timeLabels: string[];
  isRequired?: boolean;
  boardEligible?: boolean;
}

export interface HintSet {
  puzzleId: PuzzleId;
  hints: readonly [string, string, string];
  solutionNudge: string;
}

export type PuzzleId = string;

export interface SequencePuzzleInteraction {
  type: 'sequence';
  items: Array<{
    id: string;
    label: string;
    description: string;
    image?: string;
    imageAlt?: string;
  }>;
  initialOrder?: string[];
  correctOrder: string[];
}

export interface SignalPuzzleInteraction {
  type: 'signal';
  groups: Array<Array<'short' | 'long'>>;
  acceptedAnswers: string[];
  transcript: string;
}

export interface ReconstructionPuzzleInteraction {
  type: 'reconstruction';
  fragments: Array<{
    id: string;
    label: string;
    text: string;
  }>;
  slots: Array<{
    id: string;
    label: string;
  }>;
  correctSlotOrder: string[];
}

export interface PhotoPuzzleInteraction {
  type: 'photo';
  image: string;
  imageAlt: string;
  targetLabel: string;
  targetDescription: string;
  target: { x: number; y: number; width: number; height: number };
  minimumZoom: number;
  minimumContrast: number;
  minimumExposure: number;
}

export interface BoardPuzzleInteraction {
  type: 'board';
  requiredGroups: string[][];
  minimumEvidence: number;
}

export type PuzzleInteraction =
  | SequencePuzzleInteraction
  | SignalPuzzleInteraction
  | ReconstructionPuzzleInteraction
  | PhotoPuzzleInteraction
  | BoardPuzzleInteraction;

export interface PuzzleDefinition {
  id: PuzzleId;
  chapterId: ChapterId;
  title: string;
  description: string;
  successText: string;
  requiredMaterialIds: string[];
  unlockMaterialIds: string[];
  interaction: PuzzleInteraction;
}

export interface Chapter {
  id: ChapterId;
  number: number;
  title: string;
  subtitle: string;
  objective: string;
  estimatedMinutes: string;
  puzzleIds: PuzzleId[];
  materialIds: string[];
}

export interface GameContent {
  title: string;
  subtitle: string;
  caseNumber: string;
  chapters: Chapter[];
  suspects: Suspect[];
  materials: Material[];
  puzzles: PuzzleDefinition[];
  hints: HintSet[];
  requiredForFinale: string[];
  encryptedSolutionBundles: EncryptedSolutionBundle[];
}

export interface AudioSettings {
  enabled: boolean;
  volume: number;
}

export interface AccessibilitySettings {
  reducedMotion: boolean;
  highContrast: boolean;
  largeText: boolean;
}

export interface GameSettings {
  audio: AudioSettings;
  accessibility: AccessibilitySettings;
}

export interface PuzzleProgress {
  solved: boolean;
  hintsRevealed: number;
  solutionShown: boolean;
  value?: unknown;
}

export interface GameState {
  saveVersion: number;
  hasStarted: boolean;
  hasFinished: boolean;
  activeChapterId: ChapterId;
  selectedMaterialId: string | null;
  viewedMaterialIds: string[];
  unlockedChapterIds: ChapterId[];
  unlockedMaterialIds: string[];
  puzzleProgress: Record<PuzzleId, PuzzleProgress>;
  notes: string;
  starredEvidenceIds: string[];
  theoryEvidenceIds: string[];
  elapsedSeconds: number;
  startedAt: number | null;
  finishedAt: number | null;
  settings: GameSettings;
}

export interface EvidenceFilters {
  query: string;
  suspectId: string;
  location: LocationId;
  timeLabel: string;
  starredOnly: boolean;
}

export interface EncryptedSolutionBundle {
  salt: string;
  iv: string;
  ciphertext: string;
  iterations: number;
}

export interface RevealedSolution {
  culpritDisplayName: string;
  title: string;
  paragraphs: string[];
  decisiveEvidence: string[];
  epilogues: Array<{ name: string; text: string }>;
}
