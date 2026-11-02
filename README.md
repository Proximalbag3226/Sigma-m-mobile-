# Sigma-M Mobile

App móvil (React Native + Expo, TypeScript) para capturar y enviar al servicio **Sigma-M** las tres imágenes de una verificación de retiro de motocicleta: **identificación oficial**, **rostro** y **placa**.

## Ejecutar

```bash
npm install
npx expo start          # Expo Go o emulador
```

En **Ajustes** captura la URL del servicio (`http://192.168.x.x:8000` en red local, HTTPS fuera de ella) y la clave de API.

> `app.json` activa `usesCleartextTraffic` en Android para poder usar HTTP en desarrollo. Quítalo en producción.

## Flujo

1. **Identificación** → `POST /document/extract` (texto) y `POST /face/embed` (rostro de la credencial).
2. **Rostro** → `POST /face/embed`.
3. **Placa** → `POST /plate/plate`.
4. Comparación → `POST /face/compare`, verificada con similitud coseno local.
5. Resultado: coincidencia de rostro, datos leídos y placa (con contraste opcional contra la placa registrada).

## Seguridad

- Clave de API en el llavero seguro (`expo-secure-store`).
- HTTPS obligatorio fuera de red local.
- Las fotos son temporales y se borran al terminar o abandonar el flujo; los vectores faciales viven solo en memoria.
- El historial guarda únicamente fecha, resultado, similitud y placa.
- La galería solo está disponible en desarrollo; en producción solo hay captura en vivo.

## Estructura

```
App.tsx                      navegación y proveedores
src/api/client.ts            cliente HTTP (api-key, timeout, errores)
src/api/verification.ts      orquestación del flujo y veredicto
src/components/              Button, CaptureStep, StepIndicator, SimilarityBar
src/screens/                 Home, Verify, Result, Settings
src/storage.ts, settings.tsx llavero, historial, validación de URL
src/theme.ts                 paleta y tipografía
```
