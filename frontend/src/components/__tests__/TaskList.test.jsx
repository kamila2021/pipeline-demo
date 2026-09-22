import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import TaskList from '../TaskList';

describe('Componente TaskList', () => {
  it('debe mostrar el estado vacío (empty state) si la lista de tareas está vacía o es nula', () => {
    render(
      <TaskList
        tasks={[]}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onStatusChange={vi.fn()}
      />
    );

    expect(screen.getByText('No hay tareas encontradas')).toBeInTheDocument();
    expect(screen.getByText(/Prueba ajustando los filtros/i)).toBeInTheDocument();
  });

  it('debe renderizar múltiples tarjetas cuando se provee una lista de tareas', () => {
    const mockTasks = [
      { id: 1, title: 'Tarea Uno', status: 'pending', priority: 'high' },
      { id: 2, title: 'Tarea Dos', status: 'completed', priority: 'low' },
    ];

    render(
      <TaskList
        tasks={mockTasks}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onStatusChange={vi.fn()}
      />
    );

    expect(screen.getByText('Tarea Uno')).toBeInTheDocument();
    expect(screen.getByText('Tarea Dos')).toBeInTheDocument();
  });
});
