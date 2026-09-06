/**
 * Пернетақта ашылғанда мазмұнды көтеретін қабат.
 *
 * ⚠ Неге керек: iPhone-да пернетақта экранның жартысын алады да,
 * төмендегі өріс пен «Сақтау» түймесі көрінбей қалады. Адам не жазып
 * жатқанын көрмейді.
 *
 * ⚠ Платформаға қарай мінезі басқа. iOS-та `padding` керек: пернетақта
 * экранның үстіне шығады. Android-та жүйенің өзі терезені кішірейтеді,
 * сондықтан `height` жеткілікті. Вебте бұл түйін ештеңе істемейді —
 * ол жерде браузердің өзі фокустағы өрісті көрінетін жерге жылжытады.
 */
import React from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';

export function KeyboardFrame({ children }: { children: React.ReactNode }) {
  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      // Вебте KeyboardAvoidingView артық жұмыс істемеуі керек
      enabled={Platform.OS !== 'web'}
    >
      {children}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
