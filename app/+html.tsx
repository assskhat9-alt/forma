/**
 * Веб нұсқасының HTML қабығы.
 *
 * ⚠ Бұл файл ТЕК вебте қолданылады. Телефондағы нативті құрастыруда
 * ол мүлде оқылмайды.
 *
 * Мұндағы баптаулар iPhone мен iPad-та «Үй экранына қосу» арқылы
 * орнатылған кезде маңызды: онсыз бет браузердің әдепкі мінезімен
 * жүреді де, қосымшаға ұқсамай қалады.
 */
import React from 'react';
import { ScrollViewStyleReset } from 'expo-router/html';

import { color as C } from '../theme/tokens';

export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="kk">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />

        {/*
          ⚠ maximum-scale=1 — өрісті басқанда iOS Safari бетті ӨЗІ
          үлкейтіп жіберуіне жол бермейді. Біздің өрістердің шрифті
          16px-тен кіші (дизайн солай), ал Safari ондай өрісті басқанда
          масштабты автоматты өзгертеді де, экран секіріп кетеді.

          viewport-fit=cover — «құлағы» бар iPhone-да мазмұн бүкіл
          экранды алады, ал қауіпсіз аймақты safe-area-context есептейді.
        */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover"
        />

        {/*
          ⚠ Тақырып бос қалса, iPhone «Үй экранына қосу» кезінде беттің
          мекенжайын жазып қояды. Сондықтан атын осы жерде бекітеміз.
        */}
        <title>Forma</title>

        {/*
          Үй экранына қосқандағы белгіше. iOS манифестті толық оқымайды,
          сондықтан apple-touch-icon бөлек керек — public/ қалтасынан
          құрастыру кезінде түбірге көшіріледі.
        */}
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />

        {/* Үй экранынан ашқанда браузер жолағынсыз, толық экранда жүреді */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Forma" />
        <meta name="theme-color" content={C.bg} />

        {/* Expo-ның өз стилі: body сырғымайды, тек ScrollView сырғиды */}
        <ScrollViewStyleReset />

        <style dangerouslySetInnerHTML={{ __html: CSS }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

const CSS = `
  html, body {
    background-color: ${C.bg};
    /* Шеттен тартқанда бет «серпілмейді» әрі жаңармайды —
       қосымшада ондай мінез болмауы керек */
    overscroll-behavior: none;
  }

  /* Басқан кезде iOS көрсететін сұр жарқыл — қосымшада артық */
  * {
    -webkit-tap-highlight-color: transparent;
  }

  /* Мәтінді кездейсоқ бөлектеп алу — түймені басқанда мазалайды.
     Өрістердің өзінде ол қалады. */
  body {
    -webkit-user-select: none;
    user-select: none;
  }
  input, textarea, [contenteditable] {
    -webkit-user-select: text;
    user-select: text;
  }
`;
