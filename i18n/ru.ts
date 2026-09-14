/**
 * Forma — Орысша сөздікті жинақтау.
 */
import { coreRu } from './ru/core';
import { toolsRu } from './ru/tools';
import { systemRu } from './ru/system';

export * from './ru/calendar';

export const ru = {
  ...coreRu,
  ...toolsRu,
  ...systemRu,
} as const;
