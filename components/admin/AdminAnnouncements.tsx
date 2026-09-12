import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { color as C, radius as R, font } from '../../theme/tokens';
import { kk } from '../../i18n/kk';
import { useAdminAnnouncement, useSaveAnnouncement } from '../../lib/admin';
import { Card, SectionLabel, Toggle } from '../ui';
import { CheckIcon, BookmarkIcon } from '../icons';

export function AdminAnnouncements() {
  const { data: announcement, isLoading } = useAdminAnnouncement();
  const saveMutation = useSaveAnnouncement();

  const [text, setText] = useState('');
  const [enabled, setEnabled] = useState(true);
  const [savedNote, setSavedNote] = useState(false);

  useEffect(() => {
    if (announcement) {
      setText(announcement.text);
      setEnabled(announcement.enabled);
    }
  }, [announcement]);

  if (isLoading || !announcement) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={C.accent} />
      </View>
    );
  }

  const handleSave = () => {
    saveMutation.mutate(
      {
        enabled,
        text: text.trim(),
        updatedAt: new Date().toISOString().slice(0, 10),
      },
      {
        onSuccess: () => {
          setSavedNote(true);
          setTimeout(() => setSavedNote(false), 3000);
        },
      }
    );
  };

  return (
    <View style={styles.root}>
      <Card style={styles.card}>
        <SectionLabel style={{ marginBottom: 10 }}>{kk.admin.announceTitle}</SectionLabel>

        <View style={styles.toggleRow}>
          <Text style={styles.toggleText}>
            {enabled ? kk.admin.announceEnabled : kk.admin.announceDisabled}
          </Text>
          <Toggle value={enabled} onChange={setEnabled} />
        </View>

        <TextInput
          value={text}
          onChangeText={setText}
          placeholder={kk.admin.announcePlaceholder}
          placeholderTextColor={C.ink4}
          multiline
          style={styles.input}
        />

        <Pressable
          onPress={handleSave}
          disabled={saveMutation.isPending}
          style={styles.saveBtn}
          accessibilityRole="button"
        >
          <CheckIcon size={15} color="#FFFFFF" strokeWidth={2.4} />
          <Text style={styles.saveBtnText}>
            {saveMutation.isPending ? 'Сақталуда…' : kk.common.save}
          </Text>
        </Pressable>

        {savedNote && (
          <View style={styles.savedBadge}>
            <Text style={styles.savedText}>{kk.admin.announceSaved}</Text>
          </View>
        )}
      </Card>

      {/* Алдын ала көрініс (Preview) */}
      <SectionLabel style={{ marginTop: 8, marginBottom: 10 }}>
        {kk.admin.announcePreview}
      </SectionLabel>

      {enabled && text.trim() ? (
        <View style={styles.previewBanner}>
          <View style={styles.previewIcon}>
            <BookmarkIcon size={15} color={C.accent} />
          </View>
          <Text style={styles.previewText}>{text.trim()}</Text>
        </View>
      ) : (
        <Card style={styles.emptyPreview}>
          <Text style={styles.emptyText}>Баннер өшірулі немесе мәтін бос</Text>
        </Card>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 14 },
  center: { paddingVertical: 40, alignItems: 'center' },
  card: { padding: 18 },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderColor: C.line,
  },
  toggleText: {
    fontFamily: font.bold,
    fontSize: 13,
    color: C.ink,
  },
  input: {
    fontFamily: font.body,
    fontSize: 13.5,
    color: C.ink,
    minHeight: 80,
    padding: 12,
    backgroundColor: C.cardSoft,
    borderRadius: R.input,
    borderWidth: 1,
    borderColor: C.line,
    textAlignVertical: 'top',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: C.accent,
    paddingVertical: 12,
    borderRadius: R.cardXs,
    marginTop: 14,
  },
  saveBtnText: {
    fontFamily: font.bold,
    fontSize: 13,
    color: '#FFFFFF',
  },
  savedBadge: {
    marginTop: 10,
    paddingVertical: 8,
    borderRadius: R.sm,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
  },
  savedText: {
    fontFamily: font.bold,
    fontSize: 12,
    color: '#059669',
  },
  previewBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: C.tintSoft,
    borderColor: C.tintLine,
    borderWidth: 1,
    borderRadius: R.cardSm,
    padding: 14,
  },
  previewIcon: {
    width: 28,
    height: 28,
    borderRadius: R.sm,
    backgroundColor: C.tintRow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewText: {
    flex: 1,
    fontFamily: font.title,
    fontSize: 13,
    color: C.accentDeep,
    lineHeight: 18,
  },
  emptyPreview: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: font.body,
    fontSize: 12.5,
    color: C.ink4,
  },
});
