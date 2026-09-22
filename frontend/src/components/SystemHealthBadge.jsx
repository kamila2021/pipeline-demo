import React, { useState, useEffect } from 'react';
import { Server, Activity, ShieldCheck, Cpu, HardDrive } from 'lucide-react';
import { API_BASE } from '../config';

export default function SystemHealthBadge() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const checkHealth = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/health`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setHealth(data);
      setError(false);
    } catch (err) {
      console.warn('SystemHealthBadge: No se pudo consultar /health local, intentando /api/health:', err);
      try {
        const resBackup = await fetch(`${API_BASE}/api/health`);
        if (!resBackup.ok) throw new Error(`HTTP ${resBackup.status}`);
        const dataBackup = await resBackup.json();
        setHealth(dataBackup);
        setError(false);
      } catch (errBackup) {
        setError(true);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !health) {
    return (
      <div className="health-badge-container loading">
        <Activity className="animate-spin" size={14} />
        <span>Verificando salud del sistema...</span>
      </div>
    );
  }

  if (error || !health) {
    return (
      <div className="health-badge-container offline">
        <span className="dot offline-dot"></span>
        <span>Backend Desconectado</span>
      </div>
    );
  }

  return (
    <div className="health-badge-container online" title="Infraestructura y Salud del Sistema">
      <div className="health-badge-header">
        <span className="dot online-dot"></span>
        <span className="health-title">Systemd & Nginx Ready</span>
      </div>

      <div className="health-metrics-grid">
        <div className="metric-pill" title="Manejador de Servicio">
          <Server size={12} />
          <span>Systemd: <strong>Active</strong></span>
        </div>

        <div className="metric-pill" title="Modo de Base de Datos">
          <HardDrive size={12} />
          <span>DB: <strong>{health.database?.mode || 'Conectada'}</strong></span>
        </div>

        <div className="metric-pill" title="Uso de Memoria RSS Backend">
          <Cpu size={12} />
          <span>RAM: <strong>{health.system?.memoryRssMB || 'N/A'} MB</strong></span>
        </div>

        <div className="metric-pill" title="Uptime del Proceso">
          <ShieldCheck size={12} />
          <span>Uptime: <strong>{health.uptimeSeconds || 0}s</strong></span>
        </div>
      </div>
    </div>
  );
}
