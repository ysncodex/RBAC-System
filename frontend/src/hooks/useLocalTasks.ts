'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';

export interface LocalTask {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  createdAt: string;
}

function newId() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `t-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function readTasks(storageKey: string | null): LocalTask[] {
  if (!storageKey || typeof window === 'undefined') {
    return [];
  }
  try {
    const raw = localStorage.getItem(storageKey);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed) ? (parsed as LocalTask[]) : [];
  } catch {
    return [];
  }
}

export function useLocalTasks(userId: string | undefined) {
  const storageKey = useMemo(() => (userId ? `rbac-tasks-${userId}` : null), [userId]);
  const [tasks, setTasks] = useState<LocalTask[]>(() => readTasks(storageKey));
  const [loadedKey, setLoadedKey] = useState<string | null | undefined>(undefined);

  if (loadedKey !== storageKey) {
    setLoadedKey(storageKey);
    setTasks(readTasks(storageKey));
  }

  const hydrated = loadedKey !== undefined;

  useEffect(() => {
    if (!storageKey || !hydrated) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(tasks));
    } catch {}
  }, [storageKey, tasks, hydrated]);

  const addTask = useCallback((title: string, description: string, status: TaskStatus) => {
    const row: LocalTask = {
      id: newId(),
      title: title.trim(),
      description: description.trim(),
      status,
      createdAt: new Date().toISOString(),
    };
    setTasks((prev) => [row, ...prev]);
    return row;
  }, []);

  const updateTask = useCallback(
    (id: string, patch: Partial<Omit<LocalTask, 'id' | 'createdAt'>>) => {
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
    },
    [],
  );

  const deleteTask = useCallback((id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const setStatus = useCallback((id: string, status: TaskStatus) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
  }, []);

  return {
    tasks,
    hydrated,
    addTask,
    updateTask,
    deleteTask,
    setStatus,
  };
}
