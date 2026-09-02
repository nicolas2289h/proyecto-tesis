import { create } from 'zustand';

export interface User {
  id: number;
  email: string;
  nombre: string;
  roles?: string[];
}

interface AuthState {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
}

export const isAdmin = (user: User | null | undefined): boolean => {
  if (!user || !user.roles) return false;
  return user.roles.some((r) => {
    const roleUpper = r.toUpperCase();
    return roleUpper === 'ADMIN' || roleUpper === 'ADMINISTRADOR' || roleUpper === 'ROLE_ADMIN' || roleUpper === 'ROLE_ADMINISTRADOR';
  });
};

export const useAuthStore = create<AuthState>((set) => ({
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  token: localStorage.getItem('token'),
  setAuth: (user, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    set({ user, token });
  },
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ user: null, token: null });
  },
}));
