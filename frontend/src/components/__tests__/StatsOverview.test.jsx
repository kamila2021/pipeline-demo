import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import StatsOverview from '../StatsOverview';

describe('Componente StatsOverview', () => {
  it('debe renderizar los contadores de las tarjetas de métricas correctamente', () => {
    const mockStats = {
      total: 15,
      pending: 5,
      in_progress: 4,
      completed: 6,
    };

    render(<StatsOverview stats={mockStats} />);

    expect(screen.getByText('Total Tareas')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();

    expect(screen.getByText('Pendientes')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();

    expect(screen.getByText('En Progreso')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();

    expect(screen.getByText('Completadas')).toBeInTheDocument();
    expect(screen.getByText('6')).toBeInTheDocument();
  });

  it('debe mostrar valor 0 por defecto cuando stats viene vacío o no definido', () => {
    render(<StatsOverview stats={{}} />);

    const zeroElements = screen.getAllByText('0');
    expect(zeroElements.length).toBe(4);
  });
});
