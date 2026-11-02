import { api, ApiError } from './client';
import { fileSize } from '../files';
import { Settings } from '../storage';
import { CapturedSet, Verdict, VerificationResult } from '../types';

const MAX_BYTES = 8 * 1024 * 1024;
const DEFAULT_THRESHOLD = 0.48;

type Settled<T> = { ok: true; value: T } | { ok: false; error: ApiError };

async function settle<T>(promise: Promise<T>): Promise<Settled<T>> {
  try {
    return { ok: true, value: await promise };
  } catch (e) {
    const error = e instanceof ApiError ? e : new ApiError(null, 'Error inesperado.');
    if (error.status === 401) throw error;
    return { ok: false, error };
  }
}

export function cosine(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom === 0 ? 0 : dot / denom;
}

function assertSizes(set: CapturedSet): void {
  for (const uri of Object.values(set)) {
    if (fileSize(uri) > MAX_BYTES) {
      throw new ApiError(413, 'Una imagen supera 8 MB. Repite la captura.');
    }
  }
}

export async function runVerification(
  cfg: Settings,
  set: CapturedSet,
  onProgress: (label: string) => void,
): Promise<VerificationResult> {
  assertSizes(set);

  onProgress('Leyendo identificación');
  const doc = await settle(api.extractDocument(cfg, set.ine));

  onProgress('Analizando rostros');
  const ineFace = await api.embedFace(cfg, set.ine);
  const selfie = await api.embedFace(cfg, set.face);

  onProgress('Leyendo placa');
  const plate = await settle(api.readPlate(cfg, set.plate));

  let similarity: number | null = null;
  let threshold = DEFAULT_THRESHOLD;
  let serverMismatch = false;

  if (ineFace.Face_detected && selfie.Face_detected && ineFace.embedding && selfie.embedding) {
    onProgress('Comparando rostros');
    similarity = cosine(ineFace.embedding, selfie.embedding);
    const remote = await settle(api.compareFaces(cfg, ineFace.embedding, selfie.embedding));
    if (remote.ok) {
      threshold = remote.value.threshold_used;
      serverMismatch = Math.abs(remote.value.similarity - similarity) > 0.01;
    }
  }

  const verdict: Verdict =
    similarity === null ? 'inconclusive' : similarity >= threshold ? 'match' : 'no_match';

  return {
    id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    createdAt: new Date().toISOString(),
    verdict,
    document: doc.ok
      ? {
          available: true,
          type: doc.value.document_type,
          fullName: doc.value.full_name,
          idNumber: doc.value.id_number,
          birthDate: doc.value.birth_date,
        }:
        { available: false, type: null, fullName: null, idNumber: null, birthDate: null, error: doc.error.message },
    face: {
      inePhotoDetected: ineFace.Face_detected,
      selfieDetected: selfie.Face_detected,
      similarity,
      threshold,
      serverMismatch,
    },
    plate: plate.ok
      ? { available: true, detected: plate.value.plate_detected, text: plate.value.plate_text }
      : { available: false, detected: false, text: null, error: plate.error.message },
  };
}
