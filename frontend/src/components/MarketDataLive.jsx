// import React, { useEffect, useState } from 'react';

// const MarketDataLive = () => {
//   const [marketData, setMarketData] = useState([]);

//   useEffect(() => {
//     const ws = new WebSocket("ws://localhost:8000/ws/market-data");

//     ws.onmessage = (event) => {
//       try {
//         const data = JSON.parse(event.data);
//         const dataArray = Array.isArray(data) ? data : [data];  // Ensure it's an array
//         setMarketData(dataArray);
//       } catch (error) {
//         console.error('Error parsing WebSocket message', error);
//       }
//     };

//     ws.onclose = () => {
//       console.log("WebSocket connection closed");
//     };

//     return () => {
//       ws.close();
//     };
//   }, []);

//   return (
//     <div>
//       <h3>📈 Live Market Data</h3>
//       {Array.isArray(marketData) && marketData.length > 0 ? (
//         <ul>
//           {marketData.map((item, index) => (
//             <li key={index}>
//               {item.symbol}: ${item.price.toFixed(2)} (Updated: {new Date(item.timestamp).toLocaleString()})
//             </li>
//           ))}
//         </ul>
//       ) : (
//         <p>No market data available.</p>
//       )}
//     </div>
//   );
// };

// export default MarketDataLive;
