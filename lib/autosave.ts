/**
 * Автосақтау — телефондағы «Заметкидегідей».
 *
 * ⚠ «Сақтау» түймесі болмағандықтан, сақталмай қалатын БІР де сәт
 * болмауы керек. Сондықтан үш жерде жіберіледі:
 *   1) жазуды тоқтатқанда (`delay` мс),
 *   2) өрістен шыққанда — `flush()`,
 *   3) экраннан кеткенде — ілінген тазалау.
 *
 * ⚠ Барлық ағымдағы мән ref-те тұрады, state-те емес. Себебі жіберу
 * таймердің ішінен болады: state сол сәттегі ЕСКІ мәнмен қатып қалар
 * еді де, соңғы жазғаныңыз жоғалатын.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

/** Жазуды тоқтатқаннан кейін неше миллисекундтан соң сақталады */
export const SAVE_DELAY = 800;

export type SaveState = 'idle' | 'typing' | 'saving' | 'saved';

type Options<T> = {
  /** Мәнді базаға жазады. Қате лақтырса, күй `idle`-ге қайтады. */
  onSave: (value: T) => Promise<void>;
  onError?: (e: unknown) => void;
  delay?: number;
};

export function useAutosave<T>({ onSave, onError, delay = SAVE_DELAY }: Options<T>) {
  const [state, setState] = useState<SaveState>('idle');

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queued = useRef<{ value: T } | null>(null);
  const busy = useRef(false);

  // Функциялар әр рендерде жаңарады — ref арқылы соңғысын ұстаймыз
  const saveRef = useRef(onSave);
  saveRef.current = onSave;
  const errRef = useRef(onError);
  errRef.current = onError;

  const run = useCallback(async (value: T) => {
    busy.current = true;
    setState('saving');
    try {
      await saveRef.current(value);
      // Жіберіп жатқанда тағы жазса — соңғысын дереу қуып жетеміз
      if (queued.current) {
        const next = queued.current.value;
        queued.current = null;
        busy.current = false;
        void run(next);
        return;
      }
      setState('saved');
    } catch (e) {
      setState('idle');
      errRef.current?.(e);
    } finally {
      busy.current = false;
    }
  }, []);

  /** Кезекте тұрғанды КҮТПЕЙ-АҚ жіберу */
  const flush = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    if (!queued.current || busy.current) return;
    const value = queued.current.value;
    queued.current = null;
    void run(value);
  }, [run]);

  /** Әр өзгерістен кейін шақырылады — таймер қайта құрылады */
  const push = useCallback(
    (value: T) => {
      queued.current = { value };
      setState('typing');
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        timer.current = null;
        flush();
      }, delay);
    },
    [flush, delay],
  );

  /** Басқа жазбаға ауысқанда — кезекті тазалап, күйді нөлдейді */
  const reset = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    queued.current = null;
    setState('idle');
  }, []);

  // ⚠ Экраннан кеткенде жазылмай қалғанын жіберіп үлгереміз
  const flushRef = useRef(flush);
  flushRef.current = flush;
  useEffect(() => () => flushRef.current(), []);

  // ⚠ Нәтиже memo-ланады: онсыз әр рендерде жаңа объект шығып,
  // оны тәуелдікке қосқан useEffect-тер бос орынға қайта жүгіретін
  return useMemo(() => ({ state, push, flush, reset }), [state, push, flush, reset]);
}
