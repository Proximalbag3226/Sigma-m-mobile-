import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { runVerification } from '../api/verification';
import { Button } from '../components/Button';
import { CaptureStep, Guide } from '../components/CaptureStep';
import { StepIndicator } from '../components/StepIndicator';
import { discardFile } from '../files';
import { useSettings } from '../settings';
import { colors, space, type } from '../theme';
import { CapturedSet, RootStackParamList, StepKey } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Verify'>;

interface StepDef {
  key: StepKey;
  label: string;
  title: string;
  hint: string;
  facing: 'front' | 'back';
  guide: Guide;
  quality: number;
}

const STEPS: readonly StepDef[] = [
  {
    key: 'ine',
    label: 'Identificación',
    title: 'Identificación oficial',
    hint: 'Centra la credencial en el marco, sin reflejos ni sombras.',
    facing: 'back',
    guide: 'card',
    quality: 0.9,
  },
  {
    key: 'face',
    label: 'Rostro',
    title: 'Rostro de quien retira',
    hint: 'La persona debe mirar de frente, con buena luz y sin gorra ni lentes oscuros.',
    facing: 'front',
    guide: 'face',
    quality: 0.8,
  },
  {
    key: 'plate',
    label: 'Placa',
    title: 'Placa de la motocicleta',
    hint: 'Encuadra la placa completa, legible y de frente.',
    facing: 'back',
    guide: 'plate',
    quality: 0.9,
  },
];

type Phase = 'capture' | 'processing' | 'error';

export function VerifyScreen({ navigation }: Props) {
  const { settings } = useSettings();
  const [step, setStep] = useState(0);
  const [phase, setPhase] = useState<Phase>('capture');
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');
  const photos = useRef<Partial<CapturedSet>>({});
  const completed = useRef(false);

  useEffect(
    () => () => {
      if (!completed.current) Object.values(photos.current).forEach(discardFile);
    },
    [],
  );

  const analyze = useCallback(async () => {
    const set = photos.current as CapturedSet;
    setPhase('processing');
    setProgress('Enviando imágenes');
    try {
      const result = await runVerification(settings, set, setProgress);
      completed.current = true;
      navigation.replace('Result', { result, uris: set });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo completar la verificación.');
      setPhase('error');
    }
  }, [navigation, settings]);

  const accept = (uri: string) => {
    photos.current[STEPS[step].key] = uri;
    if (step < STEPS.length - 1) setStep(step + 1);
    else analyze();
  };

  const current = STEPS[step];

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.content}>
        <StepIndicator labels={STEPS.map((s) => s.label)} current={step} />

        {phase === 'capture' ? (
          <>
            <View style={styles.copy}>
              <Text style={type.heading}>{current.title}</Text>
              <Text style={type.small}>{current.hint}</Text>
            </View>
            <CaptureStep
              key={current.key}
              facing={current.facing}
              guide={current.guide}
              quality={current.quality}
              acceptLabel={step === STEPS.length - 1 ? 'Analizar' : 'Continuar'}
              onAccept={accept}
            />
          </>
        ) : null}

        {phase === 'processing' ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.ink} />
            <Text style={type.heading}>Analizando</Text>
            <Text style={type.small}>{progress}…</Text>
          </View>
        ) : null}

        {phase === 'error' ? (
          <View style={styles.center}>
            <Text style={type.heading}>No se pudo completar</Text>
            <Text style={[type.body, { textAlign: 'center', color: colors.muted }]}>{error}</Text>
            <View style={styles.errorActions}>
              <Button label="Cancelar" variant="secondary" onPress={() => navigation.goBack()} flex />
              <Button label="Reintentar" onPress={analyze} flex />
            </View>
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { flex: 1, paddingHorizontal: space.xl, paddingTop: space.sm, paddingBottom: space.lg, gap: space.lg },
  copy: { gap: space.xs },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.md, paddingHorizontal: space.lg },
  errorActions: { flexDirection: 'row', gap: space.md, marginTop: space.lg, alignSelf: 'stretch' },
});
