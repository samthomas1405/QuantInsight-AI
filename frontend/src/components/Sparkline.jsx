import React from 'react';

const Sparkline = ({ data = [], color = '#10b981', width = 60, height = 20 }) => {
  if (!data || data.length === 0) {
    return <div className="sparkline bg-gray-100 rounded"></div>;
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="sparkline">
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          points={points}
          className="opacity-80"
        />
      </svg>
    </div>
  );
};

export default Sparkline;