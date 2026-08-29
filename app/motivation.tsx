/**
 * МОТИВАЦИЯ (design/Motivatsiya.dc.html).
 *
 * ⚠ Жүйе дайын дәйексөз ұсынбайды. Бұл — адамның ӨЗ сөзі: біреудің
 * афоризмі емес, өзіне айтқан уәдесі. Тізім бос болса, бос тұрады.
 *
 * Жоғарыда — басты бетте қалай көрінетінінің тірі көрінісі: сөзді
 * таңдағанда бірден сол жерде өзгереді.
 */
import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, StyleSheet, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { color as C, radius as R, font, gutter, centered } from '../theme/tokens';
import { kk } from '../i18n/kk';
import { goBack } from '../lib/nav';
import { errorText } from '../lib/errors';
import { useBreakpoint } from '../lib/breakpoints';
import {
  useMottos, useMottoRotate, useActiveMotto,
  useCreateMotto, useSetActiveMotto, useDeleteMotto, useToggleRotate,
} from '../lib/mottos';
import { Card, DarkCard, SectionLabel, Toggle, AddButton } from '../components/ui';
import { ChevronLeftIcon, QuoteIcon, CloseIcon } from '../components/icons';

export default function MotivationScreen() {
  const insets = useSafeAreaInsets();
  const wide = useBreakpoint() !== 'phone';

  const { data: mottos, isLoading, isError, error } = useMottos();
  const { data: rotate } = useMottoRotate();
  const active = useActiveMotto();

  const create = useCreateMotto();
  const setActive = useSetActiveMotto();
  const remove = useDeleteMotto();
  const toggleRotate = useToggleRotate();

  const [adding, setAdding] = useState(false);
  const [text, setText] = useState('');
  const [note, setNote] = useState<string | null>(null);

  const list = mottos ?? [];

  const submit = () => {
    const t = text.trim();
    if (!t) return;
    setNote(null);

    create.mutate(t, {
      onSuccess: () => {
        setText('');
        setAdding(false);
      },
      onError: (e) => setNote(errorText(e)),
    });
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{
        ...centered,
        paddingTop: insets.top + (wide ? 18 : 12),
        paddingBottom: insets.bottom + 28,
      }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Pressable onPress={() => goBack('/')} hitSlop={10} accessibilityRole="button">
          <ChevronLeftIcon size={20} color={C.ink} strokeWidth={2.2} />
        </Pressable>
        <Text style={styles.headerTitle}>{kk.motto.title}</Text>
        <View style={{ width: 20 }} />
      </View>

      <View style={styles.body}>
        {/* ── Басты беттегі көрінісі ── */}
        <SectionLabel style={{ paddingLeft: 4 }}>{kk.motto.preview}</SectionLabel>

        <DarkCard style={styles.preview}>
          <QuoteIcon size={20} color={C.accent2} />
          <Text style={styles.previewText}>
            {active ? active.text : kk.motto.previewEmpty}
          </Text>
          <View style={styles.previewFoot}>
            <View style={styles.dot} />
            <Text style={styles.previewLabel}>
              {rotate ? kk.motto.rotating : kk.motto.everyOpen}
            </Text>
          </View>
        </DarkCard>

        {/* ── Кезекпен ауысу ── */}
        <Card style={styles.rotate}>
          <View style={{ flexGrow: 1, flexShrink: 1, minWidth: 0 }}>
            <Text style={styles.rotateTitle}>{kk.motto.rotate}</Text>
            <Text style={styles.rotateHint}>{kk.motto.rotateHint}</Text>
          </View>
          <Toggle value={!!rotate} onChange={(v) => toggleRotate.mutate(v)} />
        </Card>

        <SectionLabel style={{ paddingLeft: 4 }}>{kk.motto.mine}</SectionLabel>

        {isError ? (
          <Card style={styles.pad}>
            <Text style={styles.error}>{errorText(error)}</Text>
          </Card>
        ) : isLoading ? (
          <Card style={styles.pad}>
            <View style={styles.center}>
              <ActivityIndicator color={C.accent} />
            </View>
          </Card>
        ) : list.length === 0 ? (
          <Card style={styles.pad}>
            <Text style={styles.emptyTitle}>{kk.motto.emptyTitle}</Text>
            <Text style={styles.emptyText}>{kk.motto.emptyText}</Text>
          </Card>
        ) : (
          list.map((m) => {
            // Кезекпен ауысу қосулы кезде қолмен таңдау мағынасын жоғалтады
            const on = rotate ? active?.id === m.id : m.is_active;

            return (
              <Pressable
                key={m.id}
                onPress={rotate ? undefined : () => setActive.mutate(m.id)}
                accessibilityRole={rotate ? undefined : 'button'}
                accessibilityState={{ selected: !!on }}
              >
                <Card
                  level="cardSm"
                  radius={R.cardSm}
                  style={[styles.item, on && styles.itemOn]}
                >
                  <View style={[styles.radio, on && styles.radioOn]}>
                    {on && <View style={styles.radioDot} />}
                  </View>

                  <View style={{ flexGrow: 1, flexShrink: 1, minWidth: 0 }}>
                    <Text style={styles.itemText}>{m.text}</Text>
                    {on && (
                      <View style={styles.onChip}>
                        <Text style={styles.onChipText}>{kk.motto.onHome}</Text>
                      </View>
                    )}
                  </View>

                  <Pressable
                    onPress={() => remove.mutate(m.id)}
                    hitSlop={10}
                    accessibilityRole="button"
                    accessibilityLabel={kk.common.delete}
                  >
                    <CloseIcon size={12} color={C.ink4} />
                  </Pressable>
                </Card>
              </Pressable>
            );
          })
        )}

        {/* ── Қосу ── */}
        {adding && (
          <Card style={styles.pad}>
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder={kk.motto.placeholder}
              placeholderTextColor={C.ink4}
              multiline
              textAlignVertical="top"
              style={styles.input}
              autoFocus
            />

            <Pressable
              onPress={submit}
              disabled={!text.trim() || create.isPending}
              style={[styles.save, (!text.trim() || create.isPending) && { opacity: 0.45 }]}
              accessibilityRole="button"
            >
              {create.isPending ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.saveText}>{kk.common.add}</Text>
              )}
            </Pressable>

            {note && <Text style={styles.error}>{note}</Text>}
          </Card>
        )}

        <AddButton
          label={adding ? kk.common.cancel : kk.motto.add}
          active={adding}
          onPress={() => setAdding((v) => !v)}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: gutter, paddingBottom: 10,
  },
  headerTitle: {
    fontFamily: font.display, fontSize: 13, letterSpacing: 2.08, color: C.ink,
  },

  body: { paddingHorizontal: gutter, gap: 10 },
  pad: { padding: 17 },
  center: { paddingVertical: 26, alignItems: 'center' },
  error: { fontFamily: font.prose, fontSize: 12.5, color: C.inkProse, marginTop: 10 },

  preview: { padding: 20 },
  previewText: {
    fontFamily: font.bold, fontSize: 16.5, lineHeight: 24,
    color: '#FFFFFF', marginTop: 10,
  },
  previewFoot: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 14 },
  dot: { width: 5, height: 5, borderRadius: 999, backgroundColor: C.accent2 },
  previewLabel: {
    fontFamily: font.bold, fontSize: 9.5, letterSpacing: 1, color: C.darkInk3,
  },

  rotate: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  rotateTitle: { fontFamily: font.bold, fontSize: 13, color: C.ink },
  rotateHint: { fontFamily: font.prose, fontSize: 10.5, color: C.inkMuted, marginTop: 3 },

  item: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    paddingHorizontal: 15, paddingVertical: 14,
    borderWidth: 1.5, borderColor: 'transparent',
  },
  itemOn: { borderColor: C.tintLine },
  radio: {
    width: 20, height: 20, borderRadius: 999, flexShrink: 0, marginTop: 1,
    borderWidth: 2, borderColor: C.line,
    alignItems: 'center', justifyContent: 'center',
  },
  radioOn: { borderColor: C.accent, backgroundColor: C.accent },
  radioDot: { width: 7, height: 7, borderRadius: 999, backgroundColor: '#FFFFFF' },
  itemText: { fontFamily: font.title, fontSize: 12.5, lineHeight: 18, color: C.ink },
  onChip: {
    alignSelf: 'flex-start', backgroundColor: C.tint, borderRadius: R.pill,
    paddingHorizontal: 8, paddingVertical: 3, marginTop: 7,
  },
  onChipText: {
    fontFamily: font.bold, fontSize: 9, letterSpacing: 0.72, color: C.accentDeep,
  },

  emptyTitle: { fontFamily: font.bold, fontSize: 15, color: C.ink },
  emptyText: {
    fontFamily: font.prose, fontSize: 12.5, lineHeight: 19,
    color: C.inkProse, marginTop: 8,
  },

  input: {
    minHeight: 76,
    borderWidth: 1.5, borderColor: C.lineField, borderRadius: R.cardXs,
    paddingHorizontal: 13, paddingVertical: 12,
    fontFamily: font.title, fontSize: 13, lineHeight: 19, color: C.ink,
    outlineStyle: 'none' as never,
  },
  save: {
    marginTop: 12, height: 46, borderRadius: R.sm, backgroundColor: C.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  saveText: { fontFamily: font.bold, fontSize: 13.5, color: '#FFFFFF' },
});
