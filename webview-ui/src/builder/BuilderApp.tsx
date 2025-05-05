import React from 'react';
import Sidebar from './components/Sidebar';
import MainPanel from './components/MainPanel';
import './builder.css';

const BuilderApp: React.FC = () => {
  const [activePanel, setActivePanel] = React.useState('framework');

  return (
    <div className="builder-root">
      <Sidebar activePanel={activePanel} setActivePanel={setActivePanel} />
      <MainPanel activePanel={activePanel} />
    </div>
  );
};

export default BuilderApp;
