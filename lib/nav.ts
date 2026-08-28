/**
 * Артқа қайту.
 *
 * ⚠ `router.back()` жалғыз өзі жеткіліксіз: экранға тікелей кірсе
 * (сілтемемен, бетті жаңартқанда, хабарламадан) стекте артқа қайтатын
 * бет болмайды да, навигация «The action 'GO_BACK' was not handled»
 * деп қателеседі, ал түйме жай ғана жұмыс істемей тұрады.
 *
 * Сондықтан әрқашан баратын орын беріледі.
 */
import { router } from 'expo-router';

export function goBack(fallback: string) {
  if (router.canGoBack()) {
    router.back();
    return;
  }
  router.replace(fallback as never);
}
