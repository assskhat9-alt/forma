/**
 * Еске салу — қолданба ЖАБЫҚ тұрғанда да келетін хабарлама.
 *
 * ⚠ Бұл ҰСЫНЫС қана. Хабарлама келгенде таймер өзі қосылмайды, әрекет
 * өзі орындалды болып белгіленбейді — шешім адамдікі (CLAUDE.md §5.2a).
 *
 * ⚠ Уақыты қойылған әрекет қана еске салынады. Уақытсыз әрекет — күн
 * бойы істелетін нәрсе, оны сағатпен мазалаудың мәні жоқ.
 *
 * ⚠ ВЕБТЕ ІСТЕМЕЙДІ. Браузерде бұл модуль үнсіз бос жүреді: нағыз
 * хабарлама үшін нативті құрастыру (EAS build) керек. Сондықтан
 * қолданба ашық тұрғандағы DueBanner ұсынысы бәрібір қалады —
 * хабарлама оны алмастырмайды, толықтырады.
 */
import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

import { useGoals } from './goals';
import { toISODate } from './calendar';
import type { Goal } from './database.types';

/** Хабарлама әрекеттен қанша бұрын келеді */
const LEAD_MINUTES = 5;

/** Алдағы қанша күнге дейін жоспарланады — тізім шексіз өспеуі керек */
const HORIZON_DAYS = 7;

const CHANNEL = 'forma-actions';

export const supported = Platform.OS !== 'web';

if (supported) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

/** Рұқсат сұрау — бас тартса қолданба бәрібір жұмыс істей береді */
export async function askPermission(): Promise<boolean> {
  if (!supported) return false;

  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;

  const asked = await Notifications.requestPermissionsAsync();
  return asked.granted;
}

async function ensureChannel() {
  if (Platform.OS !== 'android') return;

  await Notifications.setNotificationChannelAsync(CHANNEL, {
    name: 'Әрекеттер',
    importance: Notifications.AndroidImportance.DEFAULT,
    sound: null,
  });
}

/**
 * Жоспарды толық қайта құру.
 *
 * ⚠ Алдымен БӘРІ өшіріледі, сосын қайта қойылады. Әйтпесе күні
 * ауысқан не жабылған әрекеттің ескі хабарламасы қалып қояды да,
 * болмаған нәрсеге еске салады.
 */
export async function reschedule(goals: Goal[]): Promise<number> {
  if (!supported) return 0;

  const granted = await askPermission();
  if (!granted) return 0;

  await ensureChannel();
  await Notifications.cancelAllScheduledNotificationsAsync();

  const now = Date.now();
  const limit = now + HORIZON_DAYS * 86_400_000;
  let count = 0;

  for (const g of goals) {
    if (g.level !== 'day' || g.status !== 'active') continue;
    if (!g.scheduled_at) continue;

    const at = new Date(g.scheduled_at).getTime() - LEAD_MINUTES * 60_000;
    if (Number.isNaN(at) || at <= now || at > limit) continue;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: g.title,
        // ⚠ «Қосылды» емес, «уақыты келді»: шешім әлі адамда
        body: 'Уақыты келді. Таймерді қосасыз ба?',
        data: { taskId: g.id },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(at),
        channelId: CHANNEL,
      },
    });
    count += 1;
  }

  return count;
}

/**
 * Әрекеттер өзгерген сайын хабарламаларды қайта жоспарлайды.
 *
 * Вебте ештеңе істемейді — сол платформада хабарлама да жоқ.
 */
export function useReminders() {
  const { data: goals } = useGoals();

  // Тізімнің мазмұны өзгергенде ғана қайта жоспарлаймыз
  const signature = (goals ?? [])
    .filter((g) => g.level === 'day' && g.status === 'active' && g.scheduled_at)
    .map((g) => `${g.id}|${g.scheduled_at}|${toISODate(new Date(g.period_start))}`)
    .join(',');

  useEffect(() => {
    if (!supported || !goals) return;
    reschedule(goals).catch(() => {
      // Рұқсат жоқ не платформа қолдамайды — қолданба бұдан бұзылмайды
    });
  }, [signature]); // eslint-disable-line react-hooks/exhaustive-deps
}
