import React, { useEffect, useState } from 'react';
import { fetchMarketData } from '../api/marketData';

const MarketDataTable = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetchMarketData().then(setData);
  }, []);

  return (
    <div>
      <h2>Market Data</h2>
      <table>
        <thead>
          <tr><th>Symbol</th><th>Price</th><th>Timestamp</th></tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr key={item.id}>
              <td>{item.symbol}</td>
              <td>{item.price}</td>
              <td>{new Date(item.timestamp).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MarketDataTable;
