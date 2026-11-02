import React, { useEffect, useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../components/Button';
import { SimilarityBar } from '../components/SimilarityBar';
import { discardFile } from '../files';
import { addHistory } from '../storage';
import { colors, radius, space, type } from '../theme';
import { RootStackParamList } from '../types';
import { VERDICT_COLOR, VERDICT_LABEL } from './HomeScreen';

type Props = NativeStackScreenProps<RootStackParamList, 'Result'>;

const normalize = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, '');
const VERDICT_BG = { match: colors.okBg, no_match: colors.badBg, inconclusive: colors.warnBg } as const;

function Row({ label, value }: { label: string; value: string | null }) {
  return (
    <View style={styles.row}>
      <Text style={type.small}>{label}</Text>
      <Text style={[styles.rowValue, !value && { color: colors.faint }]}>{value ?? 'No disponible'}</Text>
    </View>
  );
}

export function ResultScreen({ navigation, route }: Props) {
  const { result, uris } = route.params;
  const [expected, setExpected] = useState('');

  useEffect(() => {
    addHistory({
      id: result.id,
      createdAt: result.createdAt,
      verdict: result.verdict,
      similarity: result.face.similarity,
      plate: result.plate.text,
    });
  }, [result]);

  useEffect(
    () => () => {
      Object.values(uris).forEach(discardFile);
    },
    [uris],
  );

  const color = VERDICT_COLOR[result.verdict];
  const { face, plate, document } = result;
  const plateMatch =
    expected && plate.text ? normalize(expected) === normalize(plate.text) : null;

  const reason =
    result.verdict === 'inconclusive'
      ? !face.inePhotoDetected && !face.selfieDetected
        ? 'No se detectó rostro en ninguna de las dos fotos.'
        : !face.inePhotoDetected
          ? 'No se detectó el rostro en la identificación.'
          : 'No se detectó el rostro de la persona.'
      : null;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={[styles.verdict, { backgroundColor: VERDICT_BG[result.verdict], borderColor: color }]}>
            <Text style={[type.label, { color }]}>Rostro</Text>
            <Text style={[styles.verdictText, { color }]}>{VERDICT_LABEL[result.verdict]}</Text>
            {face.similarity !== null ? (
              <>
                <Text style={[type.body, { color }]}>{`Similitud ${face.similarity.toFixed(2)}`}</Text>
                <SimilarityBar value={face.similarity} threshold={face.threshold} color={color} />
              </>
            ) : (
              <Text style={[type.body, { color }]}>{reason}</Text>
            )}
          </View>

          {face.serverMismatch ? (
            <Text style={[type.small, styles.notice]}>
              El servicio devolvió una similitud distinta a la calculada en el dispositivo. Se muestra la calculada
              localmente; conviene revisar el servicio.
            </Text>
          ) : null}

          <View style={styles.block}>
            <Text style={type.label}>Identificación</Text>
            <View style={styles.card}>
              <Row label="Nombre" value={document.fullName} />
              <View style={styles.sep} />
              <Row label="CURP" value={document.idNumber} />
              <Row label="Nacimiento" value={document.birthDate} />
            </View>
            {!document.available ? (
              <Text style={type.small}>La lectura del texto no estuvo disponible: {document.error}</Text>
            ) : null}
          </View>

          <View style={styles.block}>
            <Text style={type.label}>Placa</Text>
            <View style={styles.card}>
              <Row label="Lectura automática" value={plate.detected ? plate.text : null} />
              <View style={styles.sep} />
              <View style={styles.row}>
                <Text style={type.small}>Placa registrada</Text>
                <TextInput
                  value={expected}
                  onChangeText={setExpected}
                  placeholder="Opcional"
                  placeholderTextColor={colors.faint}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  style={[styles.input, type.mono]}
                />
              </View>
            </View>
            {plateMatch !== null ? (
              <Text style={[type.small, { color: plateMatch ? colors.ok : colors.bad }]}>
                {plateMatch ? 'La lectura coincide con la placa registrada.' : 'La lectura no coincide con la placa registrada.'}
              </Text>
            ) : (
              <Text style={type.small}>
                La lectura de placas es aproximada: confírmala a simple vista.
                {!plate.available ? ` (${plate.error})` : ''}
              </Text>
            )}
          </View>

          <View style={styles.thumbs}>
            {(['ine', 'face', 'plate'] as const).map((k) => (
              <Image key={k} source={{ uri: uris[k] }} style={styles.thumb} />
            ))}
          </View>

          <Text style={type.small}>
            Este resultado apoya la decisión del operador y no la sustituye. Las fotos se eliminan del dispositivo al
            finalizar.
          </Text>
        </ScrollView>

        <View style={styles.footer}>
          <Button label="Finalizar" onPress={() => navigation.popToTop()} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space.xl, gap: space.xl },
  verdict: { borderWidth: 1, borderRadius: radius.md, padding: space.xl, gap: space.sm },
  verdictText: { fontSize: 32, fontWeight: '600', letterSpacing: -0.6, marginBottom: space.xs },
  notice: { backgroundColor: colors.warnBg, color: colors.warn, padding: space.md, borderRadius: radius.sm },
  block: { gap: space.sm },
  card: { backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: space.lg, gap: space.lg, minHeight: 52 },
  rowValue: { fontSize: 15, fontWeight: '500', color: colors.ink, flexShrink: 1, textAlign: 'right' },
  sep: { height: 1, backgroundColor: colors.line, marginLeft: space.lg },
  input: { flex: 1, textAlign: 'right', fontSize: 15, fontWeight: '500', color: colors.ink, padding: 0 },
  thumbs: { flexDirection: 'row', gap: space.sm },
  thumb: { flex: 1, height: 72, borderRadius: radius.sm, backgroundColor: colors.line },
  footer: { padding: space.xl, paddingTop: space.sm },
});
