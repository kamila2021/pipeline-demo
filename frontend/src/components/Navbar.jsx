import React from 'react';
import { Layers, Database, Server, Code2 } from 'lucide-react';

export default function Navbar({ onOpenNewTask }) {
  return (
    <header className="navbar">
      <div className="brand">
        <div className="brand-icon">
          <Layers size={24} />
        </div>
        <div>
          <h1 className="brand-title">TaskPulse Pro</h1>
          <div className="brand-badge">
            <span className="status-dot"></span>
            <span>React 19 + Express 5 + PostgreSQL 17</span>
          </div>
        </div>
      </div>
    </header>
  );
}
