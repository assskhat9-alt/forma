/**
 * Форма — Орысша күнтізбе атаулары мен көмекшілері.
 */

export const monthsRu = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
] as const;

export const monthsUpperRu = [
  'ЯНВАРЬ', 'ФЕВРАЛЬ', 'МАРТ', 'АПРЕЛЬ', 'МАЙ', 'ИЮНЬ',
  'ИЮЛЬ', 'АВГУСТ', 'СЕНТЯБРЬ', 'ОКТЯБРЬ', 'НОЯБРЬ', 'ДЕКАБРЬ',
] as const;

export const monthsShortRu = [
  'Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн',
  'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек',
] as const;

export const monthsLetterRu = [
  'Я', 'Ф', 'М', 'А', 'М', 'И', 'И', 'А', 'С', 'О', 'Н', 'Д',
] as const;

export const weekdaysShortRu = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'] as const;

export const weekdaysLongRu = [
  'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота', 'воскресенье',
] as const;

export const weekdaysFullRu = [
  'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье',
] as const;

export function formatDayMonthRu(d: Date): string {
  return `${d.getDate()} ${monthsRu[d.getMonth()]}`;
}

export function formatDayMonthWeekdayRu(d: Date): string {
  const day = d.getDay();
  const ruIndex = day === 0 ? 6 : day - 1;
  return `${d.getDate()} ${monthsRu[d.getMonth()]}, ${weekdaysLongRu[ruIndex]}`;
}
