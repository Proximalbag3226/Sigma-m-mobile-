import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../api/client';
import { Button } from '../components/Button';
import { useSettings } from '../settings';
import { getHistory } from '../storage';
import { colors, radius, space, type } from '../theme';
import { HistoryEntry, RootStackParamList, Verdict } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;
type Status = 'unconfigured' | 'checking' | 'online' | 'offline';

export const VERDICT_LABEL: Record<Verdict, string> = {
  match: 'Coincide',
  no_match: 'No coincide',
  inconclusive: 'No concluyente',
};
export const VERDICT_COLOR: Record<Verdict, string> = {
  match: colors.ok,
  no_match: colors.bad,
  inconclusive: colors.warn,
};

const STATUS_LABEL: Record<Status, string> = {
  unconfigured: 'Servicio sin configurar',
  checking: 'Comprobando servicio…',
  online: 'Servicio disponible',
  offline: 'Servicio sin conexión',
};
const STATUS_COLOR: Record<Status, string> = {
  unconfigured: colors.faint,
  checking: colors.faint,
  online: colors.ok,
  offline: colors.bad,
};

export function HomeScreen({ navigation }: Props) {
  const { settings, configured, loaded } = useSettings();
  const [status, setStatus] = useState<Status>('checking');
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      getHistory().then((h) => active && setHistory(h.slice(0, 6)));
      if (!loaded) return () => { active = false; };
      if (!configured) {
        setStatus('unconfigured');
      } else {
        setStatus('checking');
        api
          .health(settings)
          .then(() => active && setStatus('online'))
          .catch(() => active && setStatus('offline'));
      }
      return () => {
        active = false;
      };
    }, [loaded, configured, settings]),
  );

  const start = () => navigation.navigate(configured ? 'Verify' : 'Settings');

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.top}>
          <Text style={type.label}>Sigma-M</Text>
          <Pressable onPress={() => navigation.navigate('Settings')} hitSlop={12} accessibilityLabel="Ajustes">
            <Feather name="sliders" size={20} color={colors.ink} />
          </Pressable>
        </View>

        <View style={styles.hero}>
          <Text style={type.title}>Verificación{'\n'}de retiro</Text>
          <Text style={[type.body, { color: colors.muted }]}>
            Confirma que quien retira la motocicleta es su dueño: identificación, rostro y placa.
          </Text>
        </View>

        <View style={styles.statusRow}>
          <View style={[styles.dot, { backgroundColor: STATUS_COLOR[status] }]} />
          <Text style={type.small}>{STATUS_LABEL[status]}</Text>
        </View>

        <Button
          label={configured ? 'Nueva verificación' : 'Configurar servicio'}
          icon={configured ? 'arrow-right' : 'settings'}
          onPress={start}
        />

        <View style={styles.section}>
          <Text style={type.label}>Recientes</Text>
          {history.length === 0 ? (
            <Text style={[type.small, { marginTop: space.sm }]}>Aún no hay verificaciones.</Text>
          ) : (
            <View style={styles.list}>
              {history.map((h, i) => (
                <View key={h.id} style={[styles.item, i > 0 && styles.itemBorder]}>
                  <View style={[styles.dot, { backgroundColor: VERDICT_COLOR[h.verdict] }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemTitle}>{VERDICT_LABEL[h.verdict]}</Text>
                    <Text style={type.small}>
                      {new Date(h.createdAt).toLocaleString('es-MX', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    {h.plate ? <Text style={[styles.itemTitle, type.mono]}>{h.plate}</Text> : null}
                    {h.similarity !== null ? <Text style={type.small}>{`${Math.round(h.similarity * 100)}%`}</Text> : null}
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space.xl, gap: space.xl, flexGrow: 1 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  hero: { gap: space.md, marginTop: space.xl },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  dot: { width: 8, height: 8, borderRadius: 4 },
  section: { marginTop: space.lg },
  list: {
    marginTop: space.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
  },
  item: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.lg },
  itemBorder: { borderTopWidth: 1, borderTopColor: colors.line },
  itemTitle: { fontSize: 15, fontWeight: '500', color: colors.ink },
});
