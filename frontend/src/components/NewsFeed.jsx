import React, { useEffect, useState } from 'react';
import { fetchNews } from '../api/news';

const NewsFeed = () => {
  const [articles, setArticles] = useState([]);

  useEffect(() => {
    fetchNews().then(setArticles).catch((err) => console.error(err));
  }, []);

  return (
    <div>
      <h2>Financial News</h2>
      {articles.length === 0 ? (
        <p>Loading news...</p>
      ) : (
        <ul>
          {articles.map((article, index) => (
            <li key={index} style={{ marginBottom: '20px' }}>
              <h3>{article.title}</h3>
              <p><strong>Source:</strong> {article.source}</p>
              <p><strong>Published:</strong> {new Date(article.published_at).toLocaleString()}</p>
              <p><strong>Summary:</strong> {article.summary || 'No summary available.'}</p>
              <a href={article.url} target="_blank" rel="noopener noreferrer">Read Full Article</a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default NewsFeed;
