import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import TaskForm from '../TaskForm';

describe('Componente TaskForm (Modal de Tareas)', () => {
  it('no debe renderizar nada si isOpen es false', () => {
    const { container } = render(
      <TaskForm
        isOpen={false}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('debe renderizar el título "Nueva Tarea" y los campos de entrada si isOpen es true', () => {
    render(
      <TaskForm
        isOpen={true}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />
    );

    expect(screen.getByText('Nueva Tarea')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Ej: Implementar autenticación/i)).toBeInTheDocument();
  });

  it('debe enviar la información correctamente cuando se completa el campo título', () => {
    const onSubmitMock = vi.fn();

    render(
      <TaskForm
        isOpen={true}
        onClose={vi.fn()}
        onSubmit={onSubmitMock}
      />
    );

    const titleInput = screen.getByPlaceholderText(/Ej: Implementar autenticación/i);
    fireEvent.change(titleInput, { target: { value: 'Nueva Tarea de Prueba' } });

    const submitBtn = screen.getByText('Crear Tarea');
    fireEvent.click(submitBtn);

    expect(onSubmitMock).toHaveBeenCalledTimes(1);
    expect(onSubmitMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Nueva Tarea de Prueba'
      })
    );
  });
});
