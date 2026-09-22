import React from 'react';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import Navbar from '../Navbar';

describe('Componente Navbar', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('debe renderizar el título de la marca y la insignia de tecnologías', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({
          status: 'ok',
          service: 'backend-taskdb',
          database: { connected: true, mode: 'PostgreSQL 17' },
          system: { memoryRssMB: '40.00' }
        })
      })
    );

    const { unmount } = render(<Navbar />);

    expect(screen.getByText('TaskPulse Pro')).toBeInTheDocument();
    expect(screen.getByText(/React 19 \+ Express 5 \+ PostgreSQL 17/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Systemd & Nginx Ready')).toBeInTheDocument();
    });

    unmount();
  });
});
