import React, { useRef, useState } from 'react';
import { ActivityIndicator, Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Button } from './Button';
import { discardFile } from '../files';
import { colors, radius, type } from '../theme';

export type Guide = 'card' | 'face' | 'plate';

type Props = {
  facing: 'front' | 'back';
  guide: Guide;
  quality: number;
  acceptLabel: string;
  onAccept: (uri: string) => void;
};

const GUIDE_STYLE = {
  card: { width: '88%', aspectRatio: 1.586, borderRadius: 14 },
  face: { width: '64%', aspectRatio: 0.78, borderRadius: 999 },
  plate: { width: '78%', aspectRatio: 2.4, borderRadius: 8 },
} as const;

export function CaptureStep({ facing, guide, quality, acceptLabel, onAccept }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const camera = useRef<CameraView>(null);
  const [ready, setReady] = useState(false);
  const [shooting, setShooting] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  const shoot = async () => {
    if (!camera.current || !ready || shooting) return;
    setShooting(true);
    setFailed(false);
    try {
      const picture = await camera.current.takePictureAsync({ quality, exif: false });
      setPreview(picture.uri);
    } catch {
      setFailed(true);
    } finally {
      setShooting(false);
    }
  };

  const pickFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.85 });
    if (!result.canceled && result.assets[0]) setPreview(result.assets[0].uri);
  };

  const retake = () => {
    discardFile(preview);
    setPreview(null);
  };

  if (!permission) {
    return (
      <View style={[styles.frame, styles.center]}>
        <ActivityIndicator color="#FFFFFF" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.permission}>
        <Feather name="camera-off" size={22} color={colors.muted} />
        <Text style={[type.body, { textAlign: 'center' }]}>
          Se necesita acceso a la cámara para fotografiar la identificación, el rostro y la placa.
        </Text>
        {permission.canAskAgain ? (
          <Button label="Permitir cámara" onPress={requestPermission} />
        ) : (
          <Button label="Abrir ajustes" variant="secondary" onPress={() => Linking.openSettings()} />
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.frame}>
        {preview ? (
          <Image source={{ uri: preview }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : (
          <>
            <CameraView
              ref={camera}
              style={StyleSheet.absoluteFill}
              facing={facing}
              onCameraReady={() => setReady(true)}
            />
            <View style={styles.overlay} pointerEvents="none">
              <View style={[styles.guide, GUIDE_STYLE[guide]]} />
            </View>
          </>
        )}
      </View>

      {failed ? <Text style={[type.small, { color: colors.bad }]}>No se pudo tomar la foto. Intenta de nuevo.</Text> : null}

      {preview ? (
        <View style={styles.actions}>
          <Button label="Repetir" variant="secondary" onPress={retake} flex />
          <Button label={acceptLabel} onPress={() => onAccept(preview)} flex />
        </View>
      ) : (
        <View style={styles.shutterRow}>
          <View style={styles.side}>
            {__DEV__ ? (
              <Pressable onPress={pickFromGallery} hitSlop={12} accessibilityLabel="Elegir de la galería">
                <Feather name="image" size={22} color={colors.muted} />
              </Pressable>
            ) : null}
          </View>
          <Pressable
            onPress={shoot}
            disabled={!ready || shooting}
            accessibilityRole="button"
            accessibilityLabel="Tomar foto"
            style={[styles.shutterOuter, (!ready || shooting) && { opacity: 0.4 }]}
          >
            <View style={styles.shutterInner} />
          </Pressable>
          <View style={styles.side} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, gap: 16 },
  frame: { flex: 1, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: '#0B0B0B' },
  center: { alignItems: 'center', justifyContent: 'center' },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  guide: { borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.85)' },
  actions: { flexDirection: 'row', gap: 12 },
  shutterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 72 },
  side: { width: 48, alignItems: 'center' },
  shutterOuter: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInner: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.ink },
  permission: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, paddingHorizontal: 24 },
});
