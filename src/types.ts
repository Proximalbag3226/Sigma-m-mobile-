export interface BoxDto {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface FaceDto {
  Face_detected: boolean;
  detection_confidence: number | null;
  bounding_box: BoxDto | null;
  embedding: number[] | null;
}

export interface FaceCompareDto {
  similarity: number;
  is_match: boolean;
  threshold_used: number;
}

export interface DocumentDto {
  document_type: string;
  full_name: string | null;
  id_number: string | null;
  birth_date: string | null;
  raw_text: number | null;
  photo_detected: boolean;
  photo_face_embedding: number[] | null;
  photo_box: BoxDto | null;
}

export interface PlateDto {
  plate_detected: boolean;
  plate_text: string | null;
}

export type StepKey = 'ine' | 'face' | 'plate';
export type CapturedSet = Record<StepKey, string>;
export type Verdict = 'match' | 'no_match' | 'inconclusive';

export interface VerificationResult {
  id: string;
  createdAt: string;
  verdict: Verdict;
  document: {
    idNumber: string | null;
    available: boolean;
    type: string | null;
    fullName: string | null;
    birthDate: string | null;
    error?: string;
  };
  face: {
    inePhotoDetected: boolean;
    selfieDetected: boolean;
    similarity: number | null;
    threshold: number;
    serverMismatch: boolean;
  };
  plate: {
    available: boolean;
    detected: boolean;
    text: string | null;
    error?: string;
  };
}

export interface HistoryEntry {
  id: string;
  createdAt: string;
  verdict: Verdict;
  similarity: number | null;
  plate: string | null;
}

export type RootStackParamList = {
  Home: undefined;
  Verify: undefined;
  Result: { result: VerificationResult; uris: CapturedSet };
  Settings: undefined;
};
