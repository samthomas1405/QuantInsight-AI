import React, { useEffect, useState } from 'react';
import { fetchStockHistory } from '../api/liveMarket';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

const StockChart = ({ symbol }) => {
  const [history, setHistory] = useState([]);
  const [latest, setLatest] = useState(null);

  useEffect(() => {
    fetchStockHistory(symbol)
      .then((data) => {
        const sorted = [...data].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        setHistory(sorted);
        if (sorted.length > 0) {
          const start = sorted[0].price;
          const end = sorted[sorted.length - 1].price;
          setLatest({
            current: end,
            delta: (end - start).toFixed(2),
            percent: (((end - start) / start) * 100).toFixed(2)
          });
        }
      })
      .catch(console.error);
  }, [symbol]);

  return (
    <div className="bg-slate-900 p-4 rounded-lg shadow mb-6 text-white">
      <h2 className="text-2xl font-bold mb-2 text-cyan-400">{symbol}</h2>
      {latest && (
        <div className="text-xl mb-4">
          ${latest.current.toFixed(2)}{' '}
          <span className={latest.delta >= 0 ? 'text-green-500' : 'text-red-500'}>
            {latest.delta >= 0 ? '▲' : '▼'} ${latest.delta} ({latest.percent}%)
          </span>
        </div>
      )}

      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={history}>
          <XAxis dataKey="timestamp" hide />
          <YAxis domain={['auto', 'auto']} hide />
          <Tooltip
            contentStyle={{ backgroundColor: '#1e293b', border: 'none', color: '#e0f2fe' }}
            labelFormatter={(label) =>
              `Time: ${new Date(label).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
            }
            formatter={(value) => [`$${value.toFixed(2)}`, 'Price']}
          />
          <Line
            type="monotone"
            dataKey="price"
            stroke="#06b6d4" // cyan-500
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 6, fill: "#06b6d4", stroke: "#fff", strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default StockChart;
