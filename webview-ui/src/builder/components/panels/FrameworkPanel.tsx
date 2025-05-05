import React from 'react';

const FrameworkPanel = () => (
  <div className="panel-content">
    <h2>JavaScript Frameworks</h2>
    <button>React</button>
    <button>Next.js</button>
    <button>Vue</button>
    <h2>CSS Frameworks</h2>
    <button>Tailwind CSS</button>
    <button>Bootstrap</button>
    <button>Custom CSS</button>
    <div className="preview-area">
      <h3>Preview Area</h3>
      <p>Select options to configure your components.</p>
    </div>
    {/* <button className="generate-btn">Generate Code</button> */}
  </div>
);

export default FrameworkPanel;
