import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from '../App.jsx';

// Mock the auth API
vi.mock('../api/auth.js', () => ({
  authApi: {
    login: vi.fn(),
    register: vi.fn(),
    refresh: vi.fn().mockRejectedValue(new Error('No session')),
    logout: vi.fn(),
    getMe: vi.fn(),
  },
}));

describe('App', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders without crashing and shows login page for unauthenticated users', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText('Smart Mess Queue')).toBeDefined();
    });
  });
});

