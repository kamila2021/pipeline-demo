import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import StatusFilter from '../StatusFilter';

describe('Componente StatusFilter', () => {
  it('debe renderizar todos los botones de filtro', () => {
    render(<StatusFilter currentFilter="all" onFilterChange={vi.fn()} />);

    expect(screen.getByText('Todas')).toBeInTheDocument();
    expect(screen.getByText('Pendientes')).toBeInTheDocument();
    expect(screen.getByText('En Progreso')).toBeInTheDocument();
    expect(screen.getByText('Completadas')).toBeInTheDocument();
  });

  it('debe marcar como activo el botón del filtro seleccionado', () => {
    render(<StatusFilter currentFilter="pending" onFilterChange={vi.fn()} />);

    const pendingBtn = screen.getByText('Pendientes');
    expect(pendingBtn).toHaveClass('active');

    const allBtn = screen.getByText('Todas');
    expect(allBtn).not.toHaveClass('active');
  });

  it('debe invocar onFilterChange al hacer clic en un filtro', () => {
    const onFilterChangeMock = vi.fn();
    render(<StatusFilter currentFilter="all" onFilterChange={onFilterChangeMock} />);

    const completedBtn = screen.getByText('Completadas');
    fireEvent.click(completedBtn);

    expect(onFilterChangeMock).toHaveBeenCalledWith('completed');
  });
});
