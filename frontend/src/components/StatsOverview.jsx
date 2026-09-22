import React from 'react';
import { CheckCircle2, Clock, AlertCircle, ListTodo } from 'lucide-react';

export default function StatsOverview({ stats }) {
  const cards = [
    {
      title: 'Total Tareas',
      value: stats.total || 0,
      icon: ListTodo,
      color: '#6366f1',
    },
    {
      title: 'Pendientes',
      value: stats.pending || 0,
      icon: AlertCircle,
      color: '#f59e0b',
    },
    {
      title: 'En Progreso',
      value: stats.in_progress || 0,
      icon: Clock,
      color: '#3b82f6',
    },
    {
      title: 'Completadas',
      value: stats.completed || 0,
      icon: CheckCircle2,
      color: '#10b981',
    },
  ];

  return (
    <div className="stats-grid">
      {cards.map((card, idx) => {
        const IconComponent = card.icon;
        return (
          <div key={idx} className="stat-card" style={{ '--card-color': card.color }}>
            <div className="stat-info">
              <h4>{card.title}</h4>
              <div className="stat-value">{card.value}</div>
            </div>
            <div className="stat-icon-wrapper">
              <IconComponent size={24} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
