import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { color as C, radius as R, font } from '../../theme/tokens';
import { useI18n, type Language } from '../../i18n/context';

type Props = {
  compact?: boolean;
};

export function LangSwitcher({ compact = false }: Props) {
  const { lang, setLang } = useI18n();

  const handleSelect = (next: Language) => {
    if (next !== lang) {
      void setLang(next);
    }
  };

  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      <Pressable
        onPress={() => handleSelect('kk')}
        style={[styles.btn, lang === 'kk' && styles.btnActive]}
        accessibilityRole="button"
        accessibilityLabel="Қазақ тілі"
      >
        <Text style={[styles.text, lang === 'kk' && styles.textActive]}>ҚАЗ</Text>
      </Pressable>

      <Pressable
        onPress={() => handleSelect('ru')}
        style={[styles.btn, lang === 'ru' && styles.btnActive]}
        accessibilityRole="button"
        accessibilityLabel="Русский язык"
      >
        <Text style={[styles.text, lang === 'ru' && styles.textActive]}>РУС</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.card,
    borderRadius: R.pill,
    padding: 3,
    borderWidth: 1,
    borderColor: C.lineField,
  },
  containerCompact: {
    padding: 2,
  },
  btn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: R.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnActive: {
    backgroundColor: C.accent,
  },
  text: {
    fontFamily: font.bold,
    fontSize: 11,
    letterSpacing: 0.5,
    color: C.ink3,
  },
  textActive: {
    color: '#FFFFFF',
  },
});
