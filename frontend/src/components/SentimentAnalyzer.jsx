import React, { useState } from 'react';
import { analyzeSentiment } from '../api/sentiment';

const SentimentAnalyzer = () => {
  const [inputText, setInputText] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleAnalyze = async () => {
    try {
      const analysis = await analyzeSentiment(inputText);
      setResult(analysis);
      setError(null);
    } catch (err) {
      setError('Error analyzing sentiment.');
      setResult(null);
    }
  };

  return (
    <div>
      <h2>Sentiment Analyzer</h2>
      <textarea
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        placeholder="Enter text to analyze sentiment..."
        rows="4"
        cols="50"
      />
      <br />
      <button onClick={handleAnalyze}>Analyze</button>
      {result && (
        <div>
          <h3>Result:</h3>
          <p><strong>Label:</strong> {result.label}</p>
          <p><strong>Score:</strong> {result.score.toFixed(4)}</p>
        </div>
      )}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default SentimentAnalyzer;
