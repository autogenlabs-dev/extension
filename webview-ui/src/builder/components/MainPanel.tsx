import React from 'react';
import FrameworkPanel from './panels/FrameworkPanel';
import LayoutPanel from './panels/LayoutPanel';
import ComponentsPanel from './panels/ComponentsPanel';
import DesignPanel from './panels/DesignPanel';
import ContentPanel from './panels/ContentPanel';
import ChatPanel from './panels/ChatPanel';
import SearchPanel from './panels/SearchPanel';
import SettingsPanel from './panels/SettingsPanel';


const MainPanel = ({ activePanel }: { activePanel: string }) => {
  switch (activePanel) {
    case 'framework':
      return <FrameworkPanel />;
    case 'layout':
      return <LayoutPanel />;
    case 'components':
      return <ComponentsPanel />;
    case 'design':
      return <DesignPanel />;
    case 'content':
      return <ContentPanel />;
    case 'chat':
      return <ChatPanel />;
    case 'search':
      return <SearchPanel />;
    case 'settings':
      return <SettingsPanel />;
    default:
      return <FrameworkPanel />;
  }
};

export default MainPanel;
