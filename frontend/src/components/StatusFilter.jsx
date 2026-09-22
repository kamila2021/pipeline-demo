import React from 'react';

export default function StatusFilter({ currentFilter, onFilterChange }) {
  const filters = [
    { id: 'all', label: 'Todas' },
    { id: 'pending', label: 'Pendientes' },
    { id: 'in_progress', label: 'En Progreso' },
    { id: 'completed', label: 'Completadas' },
  ];

  return (
    <div className="filter-group">
      {filters.map((f) => (
        <button
          key={f.id}
          className={`filter-btn ${currentFilter === f.id ? 'active' : ''}`}
          onClick={() => onFilterChange(f.id)}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}
