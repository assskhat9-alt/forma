/**
 * Кіру экраны — design/Kiru.dc.html.
 *
 * Екі күйі бар: бастапқы (каскад белгісі + екі түйме) және email формасы.
 * Форма ашылғанда каскад белгісі кішірейеді, бірақ жоғалмайды.
 *
 * ⚠ Apple ID нативті жинақты талап етеді (expo-apple-authentication +
 * Apple Developer баптауы). Веб пен Expo Go-да жұмыс істемейді, сондықтан
 * түйме жалған үміт бермей, түсіндірме көрсетеді.
 */
import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { color as C, radius as R, font, centered } from '../../theme/tokens';
import { kk } from '../../i18n/kk';
import { supabase, signInWithApple } from '../../lib/supabase';
import { useSession } from '../../lib/auth';
import { Atmosphere } from '../../components/auth/Atmosphere';
import {
  CascadeMark,
  AppleIcon,
  MailIcon,
  PhoneIcon,
  ChevronLeftIcon,
  DiamondIcon,
} from '../../components/icons';
import { KeyboardFrame } from '../../components/layout/KeyboardFrame';

/** Каскад жолағы — жүйенің мәнін бір қарағанда түсіндіреді */
const CHAIN = [
  { n: kk.period.year, pct: 42 },
  { n: kk.period.month, pct: 55 },
  { n: kk.period.week, pct: 62 },
  { n: kk.period.day, pct: 40 },
];

type Mode = 'hero' | 'email';

export default function SignIn() {
  const insets = useSafeAreaInsets();
  const { enterDemoMode } = useSession();
  const [mode, setMode] = useState<Mode>('hero');
  const [register, setRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Поштадан кейін «Келесі» басқанда құпиясөзге өзі көшеді
  const passwordRef = useRef<TextInput>(null);

  const handleDemoSignIn = async () => {
    setError(null);
    setNote(null);
    setBusy(true);
    try {
      await enterDemoMode();
    } catch (e) {
      setError(readableError(e));
    } finally {
      setBusy(false);
    }
  };

  const submit = async () => {
    setError(null);
    setNote(null);

    const mail = email.trim();
    if (!mail || !password) return setError(kk.signIn.errors.empty);
    if (password.length < 6) return setError(kk.signIn.errors.short);

    setBusy(true);
    try {
      if (register) {
        const { data, error: e } = await supabase.auth.signUp({
          email: mail,
          password,
        });
        if (e) throw e;
        // Пошта растауы қосулы болса сессия бірден берілмейді
        if (!data.session) setNote(kk.signIn.checkEmail);
      } else {
        const { error: e } = await supabase.auth.signInWithPassword({
          email: mail,
          password,
        });
        if (e) throw e;
      }
      // Сәтті болса useProtectedRoute өзі ішке кіргізеді
    } catch (e) {
      setError(readableError(e));
    } finally {
      setBusy(false);
    }
  };

  const handleAppleSignIn = async () => {
    setError(null);
    setNote(null);
    setBusy(true);
    try {
      await signInWithApple();
    } catch (e) {
      setError(readableError(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.root}>
      <Atmosphere />

      <KeyboardFrame>
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: insets.top + (mode === 'hero' ? 24 : 12), paddingBottom: insets.bottom + 30 },
          ]}
          keyboardShouldPersistTaps="handled"
          // ⚠ Сан пернетақтасында «Дайын» түймесі жоқ — тізімді сүйреп жабады
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          {/* каскад белгісі */}
          <View style={styles.hero}>
            <CascadeMark size={mode === 'hero' ? 240 : 120} />
          </View>

          <Text style={styles.wordmark}>{kk.app.name}</Text>
          <Text style={styles.tagline}>{kk.app.tagline}</Text>

          {mode === 'hero' ? (
            <>
              <Text style={styles.headline}>{kk.signIn.headline}</Text>

              <View style={styles.chain}>
                {CHAIN.map((c, i) => {
                  const last = i === CHAIN.length - 1;
                  return (
                    <View key={c.n} style={styles.chainItem}>
                      <View style={styles.chainCol}>
                        <View style={[styles.chainBox, last && styles.chainBoxOn]}>
                          <Text style={[styles.chainPct, last && { color: '#FFFFFF' }]}>{c.pct}</Text>
                        </View>
                        <Text style={styles.chainName}>{c.n}</Text>
                      </View>
                      {!last && <View style={styles.chainLine} />}
                    </View>
                  );
                })}
              </View>

              <View style={styles.actions}>
                <Pressable
                  style={[styles.btn, styles.btnHeroAccent, busy && { opacity: 0.7 }]}
                  onPress={handleDemoSignIn}
                  disabled={busy}
                  accessibilityRole="button"
                >
                  {busy ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <>
                      <DiamondIcon size={17} color="#FFFFFF" />
                      <Text style={styles.btnDarkText}>{kk.signIn.demo}</Text>
                    </>
                  )}
                </Pressable>

                <Pressable
                  style={[styles.btn, styles.btnLight]}
                  onPress={() => { setMode('email'); setNote(null); }}
                  accessibilityRole="button"
                >
                  <MailIcon size={17} color={C.ink} />
                  <Text style={styles.btnLightText}>{kk.signIn.email}</Text>
                </Pressable>

                <Pressable
                  style={[styles.btn, styles.btnDark, busy && { opacity: 0.7 }]}
                  onPress={handleAppleSignIn}
                  disabled={busy}
                  accessibilityRole="button"
                >
                  {busy ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <>
                      <AppleIcon size={17} color="#FFFFFF" />
                      <Text style={styles.btnDarkText}>{kk.signIn.apple}</Text>
                    </>
                  )}
                </Pressable>

                <View style={styles.sync}>
                  <PhoneIcon size={13} color={C.inkFaint} />
                  <Text style={styles.syncText}>{kk.signIn.sync}</Text>
                </View>
              </View>
            </>
          ) : (
            <View style={styles.form}>
              <Pressable
                onPress={() => { setMode('hero'); setError(null); setNote(null); }}
                style={styles.back}
                accessibilityRole="button"
              >
                <ChevronLeftIcon size={15} color={C.inkMuted} />
                <Text style={styles.backText}>{kk.signIn.back}</Text>
              </Pressable>

              <Text style={styles.label}>{kk.signIn.emailLabel}</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder={kk.signIn.emailPlaceholder}
                placeholderTextColor={C.ink4}
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                inputMode="email"
                style={styles.input}
                returnKeyType="next"
                submitBehavior="submit"
                onSubmitEditing={() => passwordRef.current?.focus()}
              />

              <Text style={[styles.label, { marginTop: 14 }]}>{kk.signIn.passwordLabel}</Text>
              <TextInput
                ref={passwordRef}
                value={password}
                onChangeText={setPassword}
                placeholder={kk.signIn.passwordPlaceholder}
                placeholderTextColor={C.ink4}
                autoCapitalize="none"
                autoComplete={register ? 'new-password' : 'current-password'}
                secureTextEntry
                onSubmitEditing={submit}
                returnKeyType="go"
                style={styles.input}
              />

              {error && (
                <View>
                  <Text style={styles.error}>{error}</Text>
                  <Pressable
                    style={styles.demoFallback}
                    onPress={handleDemoSignIn}
                    accessibilityRole="button"
                  >
                    <DiamondIcon size={14} color={C.accentDeep} />
                    <Text style={styles.demoFallbackText}>{kk.signIn.demo}</Text>
                  </Pressable>
                </View>
              )}
              {note && <Text style={styles.note}>{note}</Text>}

              <Pressable
                style={[styles.btn, styles.btnAccent, busy && { opacity: 0.6 }]}
                onPress={submit}
                disabled={busy}
                accessibilityRole="button"
              >
                {busy ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.btnDarkText}>
                    {register ? kk.signIn.register : kk.signIn.enter}
                  </Text>
                )}
              </Pressable>

              <Pressable
                onPress={() => { setRegister((v) => !v); setError(null); setNote(null); }}
                style={styles.switch}
                accessibilityRole="button"
              >
                <Text style={styles.switchText}>
                  {register ? kk.signIn.toSignIn : kk.signIn.toRegister}
                </Text>
              </Pressable>
            </View>
          )}
        </ScrollView>
      </KeyboardFrame>
    </View>
  );
}

/** Supabase қатесін адам түсінетін тілге аударады */
function readableError(e: unknown): string {
  const msg = e instanceof Error ? e.message.toLowerCase() : '';
  if (msg.includes('already registered') || msg.includes('already been registered')) {
    return kk.signIn.errors.exists;
  }
  if (msg.includes('invalid login') || msg.includes('invalid credentials')) {
    return kk.signIn.errors.invalid;
  }
  if (msg.includes('password') && msg.includes('6')) return kk.signIn.errors.short;
  if (msg.includes('network') || msg.includes('fetch')) return kk.signIn.errors.network;
  if (msg.includes('rate limit') || msg.includes('over_email_send_rate_limit')) {
    return kk.signIn.rateLimitHelp;
  }
  if (msg.includes('email not confirmed')) {
    return 'Пошта әлі расталмаған. Поштаңызға келген хатты ашыңыз немесе Supabase-те «Confirm email» баптауын өшіріңіз.';
  }
  if (msg.includes('provider is not enabled') || msg.includes('unsupported provider')) {
    return 'Supabase-те Apple арқылы кіру әлі қосылмаған. Supabase Authentication → Providers → Apple бөлімін қосыңыз.';
  }
  return e instanceof Error ? e.message : kk.common.loadError;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  scroll: { ...centered, paddingHorizontal: 26, minHeight: '100%' },

  hero: { alignItems: 'center', justifyContent: 'center', paddingVertical: 12 },
  wordmark: {
    fontFamily: font.display,
    fontSize: 30,
    letterSpacing: 6.6,
    textAlign: 'center',
    color: C.ink,
  },
  tagline: {
    fontFamily: font.bold,
    fontSize: 10,
    letterSpacing: 3,
    textAlign: 'center',
    color: C.ink3,
    marginTop: 9,
  },
  headline: {
    fontFamily: font.bold,
    fontSize: 21,
    lineHeight: 28,
    letterSpacing: -0.5,
    textAlign: 'center',
    color: C.ink,
    marginTop: 22,
  },

  chain: { flexDirection: 'row', alignItems: 'center', marginTop: 24 },
  chainItem: { flexDirection: 'row', alignItems: 'center', flexGrow: 1 },
  chainCol: { alignItems: 'center', gap: 6, width: 60, flexShrink: 0 },
  chainBox: {
    width: 38,
    height: 38,
    borderRadius: R.chipSm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.card,
    borderWidth: 1.5,
    borderColor: C.accentLine3,
  },
  chainBoxOn: { backgroundColor: C.accent, borderColor: C.accent },
  chainPct: { fontFamily: font.bold, fontSize: 11, color: C.accentDeep },
  chainName: { fontFamily: font.bold, fontSize: 9.5, letterSpacing: 0.48, color: C.inkMuted },
  chainLine: { flexGrow: 1, height: 1.5, backgroundColor: C.accentLine, marginBottom: 17 },

  actions: { gap: 10, marginTop: 32 },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    paddingVertical: 16,
    borderRadius: R.cardXs,
  },
  btnDark: { backgroundColor: C.ink },
  btnHeroAccent: {
    backgroundColor: C.accent,
    shadowColor: C.accent,
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  btnAccent: {
    backgroundColor: C.accent,
    marginTop: 18,
    shadowColor: C.accent,
    shadowOpacity: 0.3,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  btnLight: { backgroundColor: C.card, borderWidth: 1.5, borderColor: C.lineField },
  btnDarkText: { fontFamily: font.bold, fontSize: 14, color: '#FFFFFF' },
  btnLightText: { fontFamily: font.bold, fontSize: 14, color: C.ink },

  demoFallback: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 11,
    marginTop: 10,
    backgroundColor: C.card,
    borderWidth: 1.5,
    borderColor: C.accent,
    borderRadius: R.sm,
  },
  demoFallbackText: {
    fontFamily: font.bold,
    fontSize: 13,
    color: C.accentDeep,
  },

  sync: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, marginTop: 6 },
  syncText: { fontFamily: font.title, fontSize: 11, color: C.inkFaint },

  form: { marginTop: 26 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 18 },
  backText: { fontFamily: font.title, fontSize: 12.5, color: C.inkMuted },
  label: {
    fontFamily: font.bold,
    fontSize: 10,
    letterSpacing: 1.3,
    textTransform: 'uppercase',
    color: C.ink3,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1.5,
    borderColor: C.line,
    borderRadius: R.input,
    backgroundColor: C.card,
    paddingHorizontal: 15,
    paddingVertical: 14,
    fontFamily: font.body,
    fontSize: 14,
    color: C.ink,
  },
  error: {
    fontFamily: font.title,
    fontSize: 12.5,
    lineHeight: 18,
    color: C.ink,
    backgroundColor: C.trackChip,
    borderRadius: R.sm,
    paddingHorizontal: 13,
    paddingVertical: 11,
    marginTop: 14,
  },
  note: {
    fontFamily: font.prose,
    fontSize: 12.5,
    lineHeight: 18,
    color: C.inkProse,
    backgroundColor: C.tintSoft,
    borderWidth: 1,
    borderColor: C.tintLine,
    borderRadius: R.sm,
    paddingHorizontal: 13,
    paddingVertical: 11,
    marginTop: 14,
  },
  switch: { alignItems: 'center', paddingVertical: 14 },
  switchText: { fontFamily: font.bold, fontSize: 12.5, color: C.accentDeep },
});
