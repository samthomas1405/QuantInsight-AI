import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react';

const tourSteps = [
  {
    target: '[data-tour="portfolio-overview"]',
    title: 'Welcome to QuantInsight AI! 🎉',
    content: 'This is your Portfolio Overview where you can track all your stocks in real-time with live market data.',
    position: 'bottom'
  },
  {
    target: '[data-tour="multi-agent-predictor"]',
    title: 'AI-Powered Predictions 🤖',
    content: 'Our Multi-Agent Predictor uses 5 specialized AI agents to analyze stocks and provide BUY/HOLD/SELL recommendations.',
    position: 'right'
  },
  {
    target: '[data-tour="ai-assistant"]',
    title: 'Your Personal AI Assistant 💬',
    content: 'Ask any financial question and get instant, intelligent answers powered by advanced AI.',
    position: 'right'
  },
  {
    target: '[data-tour="sentiment-analyzer"]',
    title: 'Sentiment Analysis 📊',
    content: 'Analyze the sentiment of any text or news article to understand market sentiment.',
    position: 'right'
  },
  {
    target: '[data-tour="add-stocks"]',
    title: 'Track Your Stocks 📈',
    content: 'Click here to add stocks to your portfolio and start tracking them.',
    position: 'left'
  },
  {
    target: '[data-tour="user-menu"]',
    title: 'Account Settings ⚙️',
    content: 'Access your profile settings and manage your session from here.',
    position: 'left'
  }
];

const WelcomeTour = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const updatePosition = () => {
      const step = tourSteps[currentStep];
      const element = document.querySelector(step.target);
      
      if (element) {
        const rect = element.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
        
        let top = rect.top + scrollTop;
        let left = rect.left + scrollLeft;
        
        // Adjust position based on step position
        switch (step.position) {
          case 'bottom':
            top += rect.height + 10;
            left += rect.width / 2;
            break;
          case 'right':
            top += rect.height / 2;
            left += rect.width + 10;
            break;
          case 'left':
            top += rect.height / 2;
            left -= 320; // Tooltip width + margin
            break;
          case 'top':
            top -= 10;
            left += rect.width / 2;
            break;
        }
        
        setPosition({ top, left });
        setIsVisible(true);
        
        // Highlight the target element
        element.classList.add('tour-highlight');
        
        // Scroll element into view
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    };
    
    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition);
    
    return () => {
      // Clean up highlight
      const step = tourSteps[currentStep];
      const element = document.querySelector(step.target);
      if (element) {
        element.classList.remove('tour-highlight');
      }
      
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
    };
  }, [currentStep]);

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setIsVisible(false);
      setTimeout(() => {
        setCurrentStep(currentStep + 1);
      }, 200);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setIsVisible(false);
      setTimeout(() => {
        setCurrentStep(currentStep - 1);
      }, 200);
    }
  };

  const handleComplete = () => {
    localStorage.setItem('tourCompleted', 'true');
    onComplete();
  };

  const step = tourSteps[currentStep];

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-[9998]" onClick={handleComplete} />
      
      {/* Tooltip */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed z-[9999] w-80"
            style={{
              top: `${position.top}px`,
              left: `${position.left}px`,
              transform: step.position === 'bottom' || step.position === 'top' ? 'translateX(-50%)' : 
                        step.position === 'left' ? 'translateX(0)' : 'translateX(0)',
              transformOrigin: step.position === 'bottom' ? 'top center' :
                              step.position === 'top' ? 'bottom center' :
                              step.position === 'left' ? 'center right' : 'center left'
            }}
          >
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-4 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    <h3 className="font-semibold text-lg">{step.title}</h3>
                  </div>
                  <button
                    onClick={handleComplete}
                    className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              {/* Content */}
              <div className="p-4">
                <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                  {step.content}
                </p>
              </div>
              
              {/* Footer */}
              <div className="px-4 pb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {tourSteps.map((_, index) => (
                    <div
                      key={index}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        index === currentStep
                          ? 'bg-indigo-600'
                          : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    />
                  ))}
                </div>
                
                <div className="flex items-center gap-2">
                  {currentStep > 0 && (
                    <button
                      onClick={handlePrev}
                      className="px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4 inline mr-1" />
                      Back
                    </button>
                  )}
                  <button
                    onClick={handleNext}
                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-1"
                  >
                    {currentStep === tourSteps.length - 1 ? 'Finish' : 'Next'}
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
            
            {/* Arrow pointer */}
            <div
              className={`absolute w-4 h-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 transform rotate-45 ${
                step.position === 'bottom' ? '-top-2 left-1/2 -translate-x-1/2 border-r-0 border-b-0' :
                step.position === 'top' ? '-bottom-2 left-1/2 -translate-x-1/2 border-l-0 border-t-0' :
                step.position === 'left' ? '-right-2 top-1/2 -translate-y-1/2 border-l-0 border-b-0' :
                '-left-2 top-1/2 -translate-y-1/2 border-r-0 border-t-0'
              }`}
            />
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Add tour highlight styles */}
      <style jsx global>{`
        .tour-highlight {
          position: relative;
          z-index: 9997;
          box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.3);
          border-radius: 8px;
          transition: all 0.3s ease;
        }
      `}</style>
    </>
  );
};

export default WelcomeTour;