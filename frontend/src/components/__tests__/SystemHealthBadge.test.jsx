import React from 'react';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import SystemHealthBadge from '../SystemHealthBadge';

describe('Componente SystemHealthBadge (Infraestructura)', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('debe mostrar el estado Online con la información devuelta por /health', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation((url) => {
      if (url === '/health' || url === '/api/health') {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            status: 'ok',
            service: 'backend-taskdb',
            uptimeSeconds: 120,
            database: { connected: true, mode: 'PostgreSQL 17' },
            system: { memoryRssMB: '45.12' }
          })
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    const { unmount } = render(<SystemHealthBadge />);

    await waitFor(() => {
      expect(screen.getByText('Systemd & Nginx Ready')).toBeInTheDocument();
      expect(screen.getByText('PostgreSQL 17')).toBeInTheDocument();
      expect(screen.getByText('45.12 MB')).toBeInTheDocument();
    });

    unmount();
  });

  it('debe mostrar el indicador Offline cuando la solicitud a la API falla', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network Error'));

    const { unmount } = render(<SystemHealthBadge />);

    await waitFor(() => {
      expect(screen.getByText('Backend Desconectado')).toBeInTheDocument();
    });

    unmount();
  });
});
