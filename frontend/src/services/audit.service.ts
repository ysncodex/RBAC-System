import { api } from './api';

export interface AuditLogActor {
  id: string;
  name: string;
  email: string;
}

export interface AuditLogEntry {
  id: string;
  actorId: string;
  action: string;
  targetType: string;
  targetId: string | null;
  metadata: unknown;
  ipAddress: string | null;
  createdAt: string;
  actor: AuditLogActor;
}

export async function getAuditLogs(): Promise<AuditLogEntry[]> {
  const response = await api.get('/audit');

  return response.data;
}
