import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api, ApiError } from '../api/client';
import { Button } from '../components/Button';
import { useSettings } from '../settings';
import { clearHistory, validateBaseUrl } from '../storage';
import { colors, radius, space, type } from '../theme';
import { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;
type Feedback = { tone: 'ok' | 'bad'; text: string } | null;

export function SettingsScreen({ navigation }: Props) {
  const { settings, save } = useSettings();
  const [baseUrl, setBaseUrl] = useState(settings.baseUrl);
  const [apiKey, setApiKey] = useState(settings.apiKey);
  const [testing, setTesting] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

  const urlError = baseUrl.trim() ? validateBaseUrl(baseUrl) : null;
  const ready = !!baseUrl.trim() && !!apiKey.trim() && !urlError;
  const candidate = { baseUrl: baseUrl.trim().replace(/\/+$/, ''), apiKey: apiKey.trim() };

  const test = async () => {
    setTesting(true);
    setFeedback(null);
    try {
      await api.health(candidate);
      const keyOk = await api.checkKey(candidate);
      setFeedback(
        keyOk
          ? { tone: 'ok', text: 'Conexión correcta y clave válida.' }
          : { tone: 'bad', text: 'El servicio responde, pero la clave de API es inválida.' },
      );
    } catch (e) {
      setFeedback({ tone: 'bad', text: e instanceof ApiError ? e.message : 'No se pudo conectar.' });
    } finally {
      setTesting(false);
    }
  };

  const onSave = async () => {
    await save(candidate);
    navigation.goBack();
  };

  const onClear = () =>
    Alert.alert('Borrar historial', 'Se eliminarán los registros de verificaciones de este dispositivo.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Borrar', style: 'destructive', onPress: () => clearHistory() },
    ]);

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={type.title}>Ajustes</Text>

          <View style={styles.field}>
            <Text style={type.label}>URL del servicio</Text>
            <TextInput
              value={baseUrl}
              onChangeText={setBaseUrl}
              placeholder="https://servicio.ejemplo.mx"
              placeholderTextColor={colors.faint}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              style={styles.input}
            />
            {urlError ? <Text style={[type.small, { color: colors.bad }]}>{urlError}</Text> : null}
          </View>

          <View style={styles.field}>
            <Text style={type.label}>Clave de API</Text>
            <TextInput
              value={apiKey}
              onChangeText={setApiKey}
              placeholder="Clave del servicio"
              placeholderTextColor={colors.faint}
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry
              style={styles.input}
            />
            <Text style={type.small}>Se guarda cifrada en el llavero seguro del dispositivo.</Text>
          </View>

          {feedback ? (
            <Text style={[type.small, { color: feedback.tone === 'ok' ? colors.ok : colors.bad }]}>{feedback.text}</Text>
          ) : null}

          <View style={styles.actions}>
            <Button label="Probar conexión" variant="secondary" onPress={test} disabled={!ready} loading={testing} flex />
            <Button label="Guardar" onPress={onSave} disabled={!ready} flex />
          </View>

          <View style={styles.divider} />

          <View style={styles.field}>
            <Text style={type.label}>Privacidad</Text>
            <Text style={type.small}>
              La app no conserva fotos, nombres, CURP ni vectores faciales. El historial solo guarda fecha, resultado,
              similitud y placa leída.
            </Text>
            <Button label="Borrar historial" variant="ghost" onPress={onClear} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space.xl, gap: space.xl },
  field: { gap: space.sm },
  input: {
    height: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    paddingHorizontal: space.lg,
    fontSize: 15,
    color: colors.ink,
  },
  actions: { flexDirection: 'row', gap: space.md },
  divider: { height: 1, backgroundColor: colors.line },
});
