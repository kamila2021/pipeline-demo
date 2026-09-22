import React from 'react';
import TaskCard from './TaskCard';
import { ClipboardX } from 'lucide-react';

export default function TaskList({ tasks, onEdit, onDelete, onStatusChange }) {
  if (!tasks || tasks.length === 0) {
    return (
      <div className="empty-state">
        <ClipboardX className="empty-icon" />
        <h3>No hay tareas encontradas</h3>
        <p>Prueba ajustando los filtros o crea tu primera tarea para comenzar.</p>
      </div>
    );
  }

  return (
    <div className="tasks-grid">
      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          onEdit={onEdit}
          onDelete={onDelete}
          onStatusChange={onStatusChange}
        />
      ))}
    </div>
  );
}
