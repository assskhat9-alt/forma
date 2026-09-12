import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { color as C, radius as R, font, centered } from '../theme/tokens';
import { kk } from '../i18n/kk';
import { useSession } from '../lib/auth';
import { ChevronLeftIcon, DiamondIcon } from '../components/icons';
import { AdminOverview } from '../components/admin/AdminOverview';
import { AdminUsers } from '../components/admin/AdminUsers';
import { AdminMottos } from '../components/admin/AdminMottos';
import { AdminAnnouncements } from '../components/admin/AdminAnnouncements';

const TABS = [
  kk.admin.tabOverview,
  kk.admin.tabUsers,
  kk.admin.tabMottos,
  kk.admin.tabAnnounce,
] as const;

export default function AdminScreen() {
  const insets = useSafeAreaInsets();
  const { isAdmin, ready } = useSession();
  const [tabIndex, setTabIndex] = useState(0);

  if (!ready) return null;

  if (!isAdmin) {
    return (
      <View style={[styles.screen, styles.center, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.deniedCard}>
          <DiamondIcon size={32} color={C.accent} />
          <Text style={styles.deniedTitle}>{kk.admin.title}</Text>
          <Text style={styles.deniedText}>{kk.admin.adminAccessOnly}</Text>
          <Pressable onPress={() => router.replace('/')} style={styles.backBtn} accessibilityRole="button">
            <Text style={styles.backBtnText}>{kk.admin.goToApp}</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 20 }]}>
      <View style={[styles.content, centered]}>
        {/* Хедер */}
        <View style={styles.header}>
          <View style={styles.headLeft}>
            <Pressable
              onPress={() => router.back()}
              hitSlop={8}
              style={styles.backCircle}
              accessibilityRole="button"
            >
              <ChevronLeftIcon size={16} color={C.ink} />
            </Pressable>
            <View>
              <Text style={styles.title}>{kk.admin.title}</Text>
              <Text style={styles.subtitle}>{kk.admin.subtitle}</Text>
            </View>
          </View>

          <Pressable
            onPress={() => router.replace('/')}
            style={styles.exitBtn}
            accessibilityRole="button"
          >
            <Text style={styles.exitBtnText}>{kk.admin.goToApp}</Text>
          </Pressable>
        </View>

        {/* Қойындылар (Tabs) */}
        <View style={styles.tabsRow}>
          {TABS.map((tab, idx) => {
            const on = idx === tabIndex;
            return (
              <Pressable
                key={tab}
                onPress={() => setTabIndex(idx)}
                style={[styles.tabBtn, on && styles.tabBtnOn]}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
              >
                <Text style={[styles.tabText, on && styles.tabTextOn]}>{tab}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* Негізгі блок */}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {tabIndex === 0 && <AdminOverview />}
          {tabIndex === 1 && <AdminUsers />}
          {tabIndex === 2 && <AdminMottos />}
          {tabIndex === 3 && <AdminAnnouncements />}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: C.bg,
  },
  content: {
    flex: 1,
    paddingHorizontal: 22,
    width: '100%',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backCircle: {
    width: 32,
    height: 32,
    borderRadius: R.pill,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: font.display,
    fontSize: 18,
    color: C.ink,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: font.body,
    fontSize: 12,
    color: C.ink4,
    marginTop: 1,
  },
  exitBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: R.cardXs,
    backgroundColor: C.tintRow,
  },
  exitBtnText: {
    fontFamily: font.bold,
    fontSize: 12,
    color: C.accentDeep,
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 16,
    backgroundColor: C.cardSoft,
    padding: 4,
    borderRadius: R.cardSm,
    borderWidth: 1,
    borderColor: C.line,
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: R.sm,
  },
  tabBtnOn: {
    backgroundColor: C.card,
    shadowColor: '#14142D',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  tabText: {
    fontFamily: font.title,
    fontSize: 12,
    color: C.ink3,
  },
  tabTextOn: {
    color: C.accent,
    fontFamily: font.bold,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  deniedCard: {
    maxWidth: 380,
    width: '100%',
    backgroundColor: C.card,
    borderRadius: R.card,
    padding: 24,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: C.line,
  },
  deniedTitle: {
    fontFamily: font.display,
    fontSize: 18,
    color: C.ink,
  },
  deniedText: {
    fontFamily: font.body,
    fontSize: 13,
    color: C.ink3,
    textAlign: 'center',
    lineHeight: 18,
  },
  backBtn: {
    backgroundColor: C.accent,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: R.cardXs,
    marginTop: 8,
  },
  backBtnText: {
    fontFamily: font.bold,
    fontSize: 13,
    color: '#FFFFFF',
  },
});
