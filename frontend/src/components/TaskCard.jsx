import React from 'react';
import { Calendar, Tag, Edit3, Trash2, CheckCircle2, Clock } from 'lucide-react';

export default function TaskCard({ task, onEdit, onDelete, onStatusChange }) {
  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return <span className="badge badge-completed"><CheckCircle2 size={12} /> Completada</span>;
      case 'in_progress':
        return <span className="badge badge-in_progress"><Clock size={12} /> En Progreso</span>;
      default:
        return <span className="badge badge-pending">Pendiente</span>;
    }
  };

  const getPriorityBadge = (priority) => {
    return <span className={`badge priority-${priority}`}>Prioridad {priority}</span>;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div className="task-card">
      <div>
        <div className="task-header">
          <h3 className="task-title">{task.title}</h3>
          {getStatusBadge(task.status)}
        </div>

        <p className="task-desc">
          {task.description || 'Sin descripción detallada.'}
        </p>

        <div className="task-meta">
          {getPriorityBadge(task.priority)}
          {task.category && (
            <span className="badge category-tag">
              <Tag size={12} /> {task.category}
            </span>
          )}
        </div>
      </div>

      <div className="task-footer">
        <div className="due-date">
          {task.due_date ? (
            <>
              <Calendar size={14} />
              <span>{formatDate(task.due_date)}</span>
            </>
          ) : (
            <span>Sin fecha límite</span>
          )}
        </div>

        <div className="action-buttons">
          {task.status !== 'completed' && (
            <button
              className="icon-btn"
              title="Marcar como Completada"
              onClick={() => onStatusChange(task.id, 'completed')}
            >
              <CheckCircle2 size={16} />
            </button>
          )}

          <button
            className="icon-btn"
            title="Editar tarea"
            onClick={() => onEdit(task)}
          >
            <Edit3 size={16} />
          </button>

          <button
            className="icon-btn delete"
            title="Eliminar tarea"
            onClick={() => onDelete(task.id)}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
