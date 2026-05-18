'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

export type LeadStage = 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'WON';

export interface LocalLead {
  id: string;
  company: string;
  contactName: string;
  email: string;
  value: number;
  stage: LeadStage;
  notes: string;
  updatedAt: string;
}

function newId() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `l-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function readLeads(storageKey: string | null): LocalLead[] {
  if (!storageKey || typeof window === 'undefined') {
    return [];
  }
  try {
    const raw = localStorage.getItem(storageKey);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed) ? (parsed as LocalLead[]) : [];
  } catch {
    return [];
  }
}

export function useLocalLeads(userId: string | undefined) {
  const storageKey = useMemo(() => (userId ? `rbac-leads-${userId}` : null), [userId]);
  const [leads, setLeads] = useState<LocalLead[]>(() => readLeads(storageKey));
  const [loadedKey, setLoadedKey] = useState<string | null | undefined>(undefined);

  if (loadedKey !== storageKey) {
    setLoadedKey(storageKey);
    setLeads(readLeads(storageKey));
  }

  const hydrated = loadedKey !== undefined;

  useEffect(() => {
    if (!storageKey || !hydrated) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(leads));
    } catch {}
  }, [storageKey, leads, hydrated]);

  const addLead = useCallback(
    (payload: Omit<LocalLead, 'id' | 'stage' | 'updatedAt'> & { stage?: LeadStage }) => {
      const row: LocalLead = {
        id: newId(),
        company: payload.company.trim(),
        contactName: payload.contactName.trim(),
        email: payload.email.trim(),
        value: payload.value,
        notes: payload.notes.trim(),
        stage: payload.stage ?? 'NEW',
        updatedAt: new Date().toISOString(),
      };
      setLeads((prev) => [row, ...prev]);
      return row;
    },
    [],
  );

  const updateLead = useCallback((id: string, patch: Partial<Omit<LocalLead, 'id'>>) => {
    setLeads((prev) =>
      prev.map((l) => (l.id === id ? { ...l, ...patch, updatedAt: new Date().toISOString() } : l)),
    );
  }, []);

  const deleteLead = useCallback((id: string) => {
    setLeads((prev) => prev.filter((l) => l.id !== id));
  }, []);

  const setStage = useCallback((id: string, stage: LeadStage) => {
    setLeads((prev) =>
      prev.map((l) => (l.id === id ? { ...l, stage, updatedAt: new Date().toISOString() } : l)),
    );
  }, []);

  return { leads, hydrated, addLead, updateLead, deleteLead, setStage };
}
