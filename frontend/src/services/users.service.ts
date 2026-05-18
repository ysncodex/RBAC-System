import { api } from './api';

export async function getUsers() {
  const response = await api.get('/users');

  return response.data;
}

export async function createUser(data: Record<string, unknown>) {
  const response = await api.post('/users', data);

  return response.data;
}

export async function updateUser(id: string, data: Record<string, unknown>) {
  const response = await api.patch(`/users/${id}`, data);

  return response.data;
}

export async function deleteUser(id: string) {
  const response = await api.delete(`/users/${id}`);

  return response.data;
}

export async function suspendUser(id: string) {
  const response = await api.post(`/users/${id}/suspend`);

  return response.data;
}

export async function banUser(id: string) {
  const response = await api.post(`/users/${id}/ban`);

  return response.data;
}

export async function reactivateUser(id: string) {
  const response = await api.post(`/users/${id}/reactivate`);

  return response.data;
}
