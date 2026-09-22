import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import TaskCard from '../TaskCard';

describe('Componente TaskCard', () => {
  const mockTask = {
    id: 10,
    title: 'Diseñar suite de pruebas React 19',
    description: 'Implementación de pruebas unitarias con Vitest',
    status: 'in_progress',
    priority: 'high',
    category: 'Testing',
    due_date: '2026-10-15',
  };

  it('debe renderizar correctamente el título, descripción, prioridad y categoría', () => {
    render(
      <TaskCard
        task={mockTask}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onStatusChange={vi.fn()}
      />
    );

    expect(screen.getByText('Diseñar suite de pruebas React 19')).toBeInTheDocument();
    expect(screen.getByText('Implementación de pruebas unitarias con Vitest')).toBeInTheDocument();
    expect(screen.getByText(/Testing/i)).toBeInTheDocument();
    expect(screen.getByText(/En Progreso/i)).toBeInTheDocument();
  });

  it('debe disparar la función onEdit al hacer clic en el botón de edición', () => {
    const onEditMock = vi.fn();

    render(
      <TaskCard
        task={mockTask}
        onEdit={onEditMock}
        onDelete={vi.fn()}
        onStatusChange={vi.fn()}
      />
    );

    const editBtn = screen.getByTitle('Editar tarea');
    fireEvent.click(editBtn);

    expect(onEditMock).toHaveBeenCalledTimes(1);
    expect(onEditMock).toHaveBeenCalledWith(mockTask);
  });

  it('debe disparar la función onDelete al hacer clic en el botón de eliminación', () => {
    const onDeleteMock = vi.fn();

    render(
      <TaskCard
        task={mockTask}
        onEdit={vi.fn()}
        onDelete={onDeleteMock}
        onStatusChange={vi.fn()}
      />
    );

    const deleteBtn = screen.getByTitle('Eliminar tarea');
    fireEvent.click(deleteBtn);

    expect(onDeleteMock).toHaveBeenCalledTimes(1);
    expect(onDeleteMock).toHaveBeenCalledWith(10);
  });

  it('debe disparar onStatusChange al hacer clic en el botón Marcar como Completada', () => {
    const onStatusChangeMock = vi.fn();

    render(
      <TaskCard
        task={mockTask}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onStatusChange={onStatusChangeMock}
      />
    );

    const completeBtn = screen.getByTitle('Marcar como Completada');
    fireEvent.click(completeBtn);

    expect(onStatusChangeMock).toHaveBeenCalledWith(10, 'completed');
  });
});
