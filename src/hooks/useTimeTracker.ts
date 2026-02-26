import { useState, useEffect, useCallback, useRef } from 'react';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { TrackerState, SessionEntry } from '../types';
import { getNextMonthlyResetDate } from '../utils/timeUtils';
import { ComplianceEngine, ComplianceInfo } from '../compliance/complianceEngine';

const COLLECTION = 'users';
const DOC_KEY = 'state';

function buildInitialState(): TrackerState {
  return {
    status: 'OUT',
    currentSessionStart: null,
    accumulatedMilliseconds: 0,
    weeklyAccumulatedMilliseconds: 0,
    complianceStatus: 'normal',
    nextResetDate: getNextMonthlyResetDate().toISOString(),
    history: [],
  };
}

export function useTimeTracker(uid: string | null) {
  const [state, setState] = useState<TrackerState | null>(null);
  const [loading, setLoading] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const [complianceInfo, setComplianceInfo] = useState<ComplianceInfo | null>(null);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // -------------------------------------------------------------------------
  // Persistance Firestore
  // -------------------------------------------------------------------------
  const persist = useCallback(async (newState: TrackerState) => {
    if (!uid) return;
    try {
      await setDoc(doc(db, COLLECTION, uid, DOC_KEY, 'tracker'), newState);
    } catch (err) {
      console.error('[Pointeuse] Erreur écriture Firestore :', err);
    }
  }, [uid]);

  // -------------------------------------------------------------------------
  // Chargement initial + sync temps réel via onSnapshot
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!uid) {
      setState(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const ref = doc(db, COLLECTION, uid, DOC_KEY, 'tracker');

    const unsubscribe = onSnapshot(ref, (snap) => {
      let loaded: TrackerState = snap.exists()
        ? (snap.data() as TrackerState)
        : buildInitialState();

      // Reset mensuel automatique
      if (Date.now() >= new Date(loaded.nextResetDate).getTime()) {
        loaded = {
          ...loaded,
          accumulatedMilliseconds: 0,
          weeklyAccumulatedMilliseconds: 0,
          history: [],
          nextResetDate: getNextMonthlyResetDate().toISOString(),
        };
        void setDoc(ref, loaded);
      }

      const info = ComplianceEngine.checkCompliance(loaded.history, loaded.currentSessionStart);
      loaded.complianceStatus = info.status;
      loaded.weeklyAccumulatedMilliseconds = info.weeklyTotalMs;

      setState(loaded);
      setComplianceInfo(info);
      setLoading(false);
    }, (err) => {
      console.error('[Pointeuse] Erreur lecture Firestore :', err);
      setState(buildInitialState());
      setLoading(false);
    });

    return unsubscribe;
  }, [uid]);

  // -------------------------------------------------------------------------
  // Minuterie temps réel
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (state?.status !== 'IN' || !state.currentSessionStart) {
      setElapsed(0);
      if (state) {
        const info = ComplianceEngine.checkCompliance(state.history, null);
        setComplianceInfo(info);
      }
      return;
    }

    const startMs = new Date(state.currentSessionStart).getTime();

    const tick = () => {
      const now = new Date();
      setElapsed(now.getTime() - startMs);
      if (state) {
        const info = ComplianceEngine.checkCompliance(state.history, state.currentSessionStart, now);
        setComplianceInfo(info);
        if (info.status !== state.complianceStatus) {
          setState(s => s ? { ...s, complianceStatus: info.status } : null);
        }
      }
    };

    tick();
    intervalRef.current = setInterval(tick, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [state?.status, state?.currentSessionStart, state?.complianceStatus]);

  // -------------------------------------------------------------------------
  // Clock IN
  // -------------------------------------------------------------------------
  const clockIn = useCallback(async () => {
    if (!state || state.status === 'IN') return;

    const start = new Date().toISOString();
    const info = ComplianceEngine.checkCompliance(state.history, start);

    const newState: TrackerState = {
      ...state,
      status: 'IN',
      currentSessionStart: start,
      complianceStatus: info.status,
    };

    setState(newState);
    setComplianceInfo(info);
    await persist(newState);
  }, [state, persist]);

  // -------------------------------------------------------------------------
  // Clock OUT
  // -------------------------------------------------------------------------
  const clockOut = useCallback(async () => {
    if (!state || state.status === 'OUT' || !state.currentSessionStart) return;

    const now = new Date();
    const sessionStart = new Date(state.currentSessionStart);
    const rawDurationMs = now.getTime() - sessionStart.getTime();

    const today = now.toISOString().split('T')[0];
    const todayHistory = state.history.filter((h) => h.date === today);

    const { deductionMs } = ComplianceEngine.getMandatoryDeductions(todayHistory, sessionStart, now);
    const effectiveDurationMs = deductionMs > 0
      ? Math.max(0, rawDurationMs - deductionMs)
      : rawDurationMs;

    const newEntry: SessionEntry = {
      start: sessionStart.toISOString(),
      end: now.toISOString(),
      rawDuration: rawDurationMs,
      duration: effectiveDurationMs,
      date: today,
      lunchDeducted: deductionMs > 0,
    };

    const newHistory = [...state.history, newEntry];
    const info = ComplianceEngine.checkCompliance(newHistory, null, now);

    const newState: TrackerState = {
      ...state,
      status: 'OUT',
      currentSessionStart: null,
      accumulatedMilliseconds: state.accumulatedMilliseconds + effectiveDurationMs,
      weeklyAccumulatedMilliseconds: info.weeklyTotalMs,
      complianceStatus: info.status,
      history: newHistory,
    };

    setState(newState);
    setComplianceInfo(info);
    await persist(newState);
  }, [state, persist]);

  // -------------------------------------------------------------------------
  // updateEntry
  // -------------------------------------------------------------------------
  const updateEntry = useCallback(async (index: number, start: string, end: string) => {
    if (!state) return;

    const startDate = new Date(start);
    const endDate = new Date(end);
    const rawDurationMs = endDate.getTime() - startDate.getTime();
    const dateStr = start.split('T')[0];
    const otherHistory = state.history.filter((_, i) => i !== index);
    const todayOtherHistory = otherHistory.filter((h) => h.date === dateStr);

    const { deductionMs } = ComplianceEngine.getMandatoryDeductions(
      todayOtherHistory as SessionEntry[],
      startDate,
      endDate
    );
    const effectiveDurationMs = deductionMs > 0 ? Math.max(0, rawDurationMs - deductionMs) : rawDurationMs;

    const updatedEntry: SessionEntry = {
      start,
      end,
      rawDuration: rawDurationMs,
      duration: effectiveDurationMs,
      date: dateStr,
      lunchDeducted: deductionMs > 0,
    };

    const newHistory = [...state.history];
    newHistory[index] = updatedEntry;
    const accumulated = newHistory.reduce((sum, e) => sum + e.duration, 0);
    const info = ComplianceEngine.checkCompliance(newHistory, state.currentSessionStart);

    const newState: TrackerState = {
      ...state,
      history: newHistory,
      accumulatedMilliseconds: accumulated,
      weeklyAccumulatedMilliseconds: info.weeklyTotalMs,
      complianceStatus: info.status,
    };

    setState(newState);
    setComplianceInfo(info);
    await persist(newState);
  }, [state, persist]);

  // -------------------------------------------------------------------------
  // addEntry
  // -------------------------------------------------------------------------
  const addEntry = useCallback(async (date: string, start: string, end: string) => {
    if (!state) return;

    const startDate = new Date(start);
    const endDate = new Date(end);
    const rawDurationMs = endDate.getTime() - startDate.getTime();
    const todayHistory = state.history.filter((h) => h.date === date);

    const { deductionMs } = ComplianceEngine.getMandatoryDeductions(
      todayHistory,
      startDate,
      endDate
    );
    const effectiveDurationMs = deductionMs > 0 ? Math.max(0, rawDurationMs - deductionMs) : rawDurationMs;

    const newEntry: SessionEntry = {
      start,
      end,
      rawDuration: rawDurationMs,
      duration: effectiveDurationMs,
      date,
      lunchDeducted: deductionMs > 0,
    };

    const newHistory = [...state.history, newEntry].sort(
      (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
    );
    const accumulated = newHistory.reduce((sum, e) => sum + e.duration, 0);
    const info = ComplianceEngine.checkCompliance(newHistory, state.currentSessionStart);

    const newState: TrackerState = {
      ...state,
      history: newHistory,
      accumulatedMilliseconds: accumulated,
      weeklyAccumulatedMilliseconds: info.weeklyTotalMs,
      complianceStatus: info.status,
    };

    setState(newState);
    setComplianceInfo(info);
    await persist(newState);
  }, [state, persist]);

  // -------------------------------------------------------------------------
  // deleteEntry
  // -------------------------------------------------------------------------
  const deleteEntry = useCallback(async (index: number) => {
    if (!state) return;

    const newHistory = state.history.filter((_, i) => i !== index);
    const accumulated = newHistory.reduce((sum, e) => sum + e.duration, 0);
    const info = ComplianceEngine.checkCompliance(newHistory, state.currentSessionStart);

    const newState: TrackerState = {
      ...state,
      history: newHistory,
      accumulatedMilliseconds: accumulated,
      weeklyAccumulatedMilliseconds: info.weeklyTotalMs,
      complianceStatus: info.status,
    };

    setState(newState);
    setComplianceInfo(info);
    await persist(newState);
  }, [state, persist]);

  // -------------------------------------------------------------------------
  // Valeurs exposées
  // -------------------------------------------------------------------------
  const totalMilliseconds = (state?.accumulatedMilliseconds ?? 0) + elapsed;
  const weeklyMilliseconds = complianceInfo?.weeklyTotalMs ?? 0;

  return {
    loading,
    status: state?.status ?? 'OUT',
    totalMilliseconds,
    weeklyMilliseconds,
    complianceStatus: complianceInfo?.status ?? 'normal',
    complianceMessages: complianceInfo?.messages ?? [],
    currentSessionStart: state?.currentSessionStart ?? null,
    history: state?.history ?? [],
    nextResetDate: state?.nextResetDate ?? null,
    clockIn,
    clockOut,
    updateEntry,
    deleteEntry,
    addEntry,
  };
}
