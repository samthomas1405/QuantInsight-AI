import React, { useState } from 'react';
import { Building2 } from 'lucide-react';

const CompanyLogo = ({ symbol, size = 'md', className = '' }) => {
  const [imageError, setImageError] = useState(false);
  const [loading, setLoading] = useState(true);

  // Size configurations
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
    xl: 'w-12 h-12'
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
    xl: 'w-6 h-6'
  };

  // Multiple logo sources as fallbacks
  const logoSources = [
    // Financial Modeling Prep (free tier available)
    `https://financialmodelingprep.com/image-stock/${symbol}.png`,
    // Logo.dev API (reliable but may have limits)
    `https://img.logo.dev/${symbol.toLowerCase()}.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ`,
    // Yahoo Finance logos
    `https://logo.yahoo.com/${symbol}_BIG.png`,
    // Clearbit logos (fallback)
    `https://logo.clearbit.com/${symbol.toLowerCase()}.com`
  ];

  const [currentSourceIndex, setCurrentSourceIndex] = useState(0);

  const handleImageError = () => {
    if (currentSourceIndex < logoSources.length - 1) {
      setCurrentSourceIndex(currentSourceIndex + 1);
    } else {
      setImageError(true);
      setLoading(false);
    }
  };

  const handleImageLoad = () => {
    setLoading(false);
    setImageError(false);
  };

  if (imageError || !symbol) {
    return (
      <div className={`${sizeClasses[size]} ${className} bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center`}>
        <Building2 className={`${iconSizes[size]} text-gray-400 dark:text-gray-500`} />
      </div>
    );
  }

  return (
    <div className={`${sizeClasses[size]} ${className} relative`}>
      {loading && (
        <div className={`${sizeClasses[size]} bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse absolute inset-0`} />
      )}
      <img
        src={logoSources[currentSourceIndex]}
        alt={`${symbol} logo`}
        className={`${sizeClasses[size]} rounded-lg object-cover ${loading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-200 bg-white dark:bg-gray-800 p-0.5`}
        onError={handleImageError}
        onLoad={handleImageLoad}
        loading="lazy"
      />
    </div>
  );
};

export default CompanyLogo;