import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import StatsOverview from './components/StatsOverview';
import StatusFilter from './components/StatusFilter';
import TaskList from './components/TaskList';
import TaskForm from './components/TaskForm';
import { Plus, Search } from 'lucide-react';
import { API_BASE } from './config';

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, in_progress: 0, completed: 0 });
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch Stats
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/tasks/stats`);
      const data = await res.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (err) {
      console.error('Error cargando estadísticas:', err);
    }
  }, []);

  // Fetch Tasks list
  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (filter !== 'all') queryParams.append('status', filter);
      if (search) queryParams.append('search', search);

      const res = await fetch(`${API_BASE}/api/tasks?${queryParams.toString()}`);
      const data = await res.json();
      if (data.success) {
        setTasks(data.data);
      }
    } catch (err) {
      console.error('Error cargando tareas:', err);
    } finally {
      setLoading(false);
    }
  }, [filter, search]);

  useEffect(() => {
    fetchStats();
    fetchTasks();
  }, [fetchStats, fetchTasks]);

  const handleOpenCreateModal = () => {
    setEditingTask(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTask(null);
  };

  const handleSubmitTask = async (formData) => {
    try {
      const isEditing = Boolean(editingTask);
      const url = isEditing ? `${API_BASE}/api/tasks/${editingTask.id}` : `${API_BASE}/api/tasks`;
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (data.success) {
        handleCloseModal();
        fetchTasks();
        fetchStats();
      }
    } catch (err) {
      console.error('Error guardando tarea:', err);
    }
  };

  const handleDeleteTask = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar esta tarea?')) return;
    try {
      const res = await fetch(`${API_BASE}/api/tasks/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchTasks();
        fetchStats();
      }
    } catch (err) {
      console.error('Error eliminando tarea:', err);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      const res = await fetch(`${API_BASE}/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        fetchTasks();
        fetchStats();
      }
    } catch (err) {
      console.error('Error cambiando estado de tarea:', err);
    }
  };

  return (
    <div className="app-container">
      <Navbar />

      <main>
        <StatsOverview stats={stats} />

        <div className="controls-toolbar">
          <div className="search-box">
            <Search className="search-icon" size={18} />
            <input
              type="text"
              placeholder="Buscar tareas por título, categoría..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <StatusFilter currentFilter={filter} onFilterChange={setFilter} />

          <button className="btn-primary" onClick={handleOpenCreateModal}>
            <Plus size={18} />
            <span>Nueva Tarea</span>
          </button>
        </div>

        {loading ? (
          <div className="empty-state">
            <p>Cargando información...</p>
          </div>
        ) : (
          <TaskList
            tasks={tasks}
            onEdit={handleOpenEditModal}
            onDelete={handleDeleteTask}
            onStatusChange={handleStatusChange}
          />
        )}
      </main>

      <TaskForm
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmitTask}
        initialData={editingTask}
      />

      <footer className="footer">
        <p>⚡ Proyecto Fullstack con React 19, Vite, Express 5, PostgreSQL 17, Systemd y Nginx</p>
        <div className="tech-pills">
          <span className="pill">React 19.0</span>
          <span className="pill">Vite 6/7</span>
          <span className="pill">Node.js 20+</span>
          <span className="pill">Express 5.0</span>
          <span className="pill">PostgreSQL 17</span>
          <span className="pill">Systemd Managed</span>
          <span className="pill">Nginx Proxy</span>
        </div>
      </footer>
    </div>
  );
}
