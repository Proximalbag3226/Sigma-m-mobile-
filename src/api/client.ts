import { DocumentDto, FaceCompareDto, FaceDto, PlateDto } from '../types';
import { Settings } from '../storage';

export class ApiError extends Error {
  constructor(public status: number | null, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

const TIMEOUT_MS = 60_000;

function describe(status: number, detail: string): string {
  switch (status) {
    case 401:
      return 'Clave de API inválida.';
    case 400:
      return detail || 'La imagen no es válida.';
    case 413:
      return 'La imagen es demasiado grande.';
    case 415:
      return 'El servicio rechazó el formato de la imagen.';
    case 422:
      return 'Solicitud incompleta.';
    default:
      return status >= 500 ? 'El servicio falló al procesar la imagen.' : detail || `Error ${status}.`;
  }
}

async function request<T>(cfg: Settings, path: string, init: RequestInit = {}): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${cfg.baseUrl}${path}`, {
      ...init,
      headers: {
        Accept: 'application/json',
        'api-key': cfg.apiKey,
        ...(init.headers as Record<string, string> | undefined),
      },
      signal: controller.signal,
    });
    if (!res.ok) {
      let detail = '';
      try {
        const body = (await res.json()) as { detail?: unknown };
        if (typeof body.detail === 'string') detail = body.detail;
      } catch {

      }
      throw new ApiError(res.status, describe(res.status, detail));
    }
    return (await res.json()) as T;
  } catch (e) {
    if (e instanceof ApiError) throw e;
    if (e instanceof Error && e.name === 'AbortError') {
      throw new ApiError(null, 'El servicio tardó demasiado en responder.');
    }
    throw new ApiError(null, 'No se pudo conectar con el servicio.');
  } finally {
    clearTimeout(timer);
  }
}

function imageForm(field: string, uri: string): FormData {
  const form = new FormData();
  form.append(field, { uri, name: 'captura.jpg', type: 'image/jpeg' } as unknown as Blob);
  return form;
}

export const api = {
  health: (cfg: Settings) => request<{ status: string }>(cfg, '/health'),

  async checkKey(cfg: Settings): Promise<boolean> {
    try {
      await request<unknown>(cfg, '/face/embed', { method: 'POST' });
      return true;
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) return false;
      if (e instanceof ApiError && e.status === 422) return true;
      throw e;
    }
  },

  extractDocument: (cfg: Settings, uri: string) =>
    request<DocumentDto>(cfg, '/document/extract', { method: 'POST', body: imageForm('document', uri) }),

  embedFace: (cfg: Settings, uri: string) =>
    request<FaceDto>(cfg, '/face/embed', { method: 'POST', body: imageForm('file', uri) }),

  compareFaces: (cfg: Settings, face1: number[], face2: number[]) =>
    request<FaceCompareDto>(cfg, '/face/compare', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ face1, face2 }),
    }),

  readPlate: (cfg: Settings, uri: string) =>
    request<PlateDto>(cfg, '/plate/plate', { method: 'POST', body: imageForm('file', uri) }),
};
