import React, { useState } from 'react';
import { transcribeAudio } from '../api/audio';

const AudioUploader = () => {
  const [file, setFile] = useState(null);
  const [transcription, setTranscription] = useState('');
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setTranscription('');
    setError(null);
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select an audio file first.');
      return;
    }

    try {
      const result = await transcribeAudio(file);
      setTranscription(result.text);
      setError(null);
    } catch (err) {
      setError('Error transcribing audio.');
      setTranscription('');
    }
  };

  return (
    <div>
      <h2>Audio Transcription</h2>
      <input type="file" accept="audio/*" onChange={handleFileChange} />
      <button onClick={handleUpload}>Upload and Transcribe</button>
      {transcription && (
        <div>
          <h3>Transcription:</h3>
          <p>{transcription}</p>
        </div>
      )}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default AudioUploader;
