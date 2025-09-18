import logoImage from '../assets/logo.png';

const SIZE_PRESETS = {
  small: { width: 240, height: 60 },
  default: { width: 320, height: 80 },
  large: { width: 400, height: 100 },
};

export default function QuantInsightLogo({
  className = '',
  size = 'default',
  variant = 'full', // 'full' | 'icon'
  lightMode = false,
}) {
  const dims = typeof size === 'string' ? SIZE_PRESETS[size] : size;
  const { width = 320, height = 80 } = dims || {};

  if (variant === 'icon') {
    return (
      <div className={`relative inline-block ${className}`}>
        <img 
          src={logoImage}
          alt="QuantInsight AI"
          width={height}
          height={height}
          className={lightMode ? 'brightness-0 invert' : ''}
          style={{ objectFit: 'contain' }}
        />
      </div>
    );
  }

  return (
    <div 
      className={`flex items-center ${className}`}
      style={{ width, height }}
    >
      <img 
        src={logoImage}
        alt="QuantInsight AI"
        width={height}
        height={height}
        className={lightMode ? 'brightness-0 invert' : ''}
        style={{ objectFit: 'contain' }}
      />
      <div className="ml-3">
        <span 
          className="font-bold"
          style={{ 
            fontSize: height * 0.45,
            color: lightMode ? '#ffffff' : '#1a1a1a',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            textShadow: lightMode ? '0 2px 4px rgba(0,0,0,0.2)' : 'none'
          }}
        >
          QuantInsight
        </span>
        <span 
          className="font-bold ml-1"
          style={{ 
            fontSize: height * 0.45,
            color: lightMode ? '#ffffff' : '',
            background: lightMode ? 'none' : 'linear-gradient(90deg, #6B46C1 0%, #EC4899 100%)',
            WebkitBackgroundClip: lightMode ? 'unset' : 'text',
            WebkitTextFillColor: lightMode ? 'unset' : 'transparent',
            backgroundClip: lightMode ? 'unset' : 'text',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            textShadow: lightMode ? '0 2px 4px rgba(0,0,0,0.2)' : 'none'
          }}
        >
          AI
        </span>
      </div>
    </div>
  );
}

export function QuantInsightLogoMark({ size = 60, className = '' }) {
  return (
    <QuantInsightLogo
      variant="icon"
      size={{ width: size, height: size }}
      className={className}
    />
  );
}