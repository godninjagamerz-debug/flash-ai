import { useEffect, useState } from 'react';
import { Zap, Sparkles } from 'lucide-react';

interface SplashScreenProps {
  onComplete: () => void;
  aiModel?: 'flash' | 'accure';
}

const loadingMessages = [
  'Initializing AI systems...',
  'Loading neural networks...',
  'Calibrating language models...',
  'Establishing secure connection...',
  'Optimizing response algorithms...',
  'Preparing conversation engine...',
  'Loading knowledge base...',
  'Configuring user preferences...',
  'Activating intelligence modules...',
  'Synchronizing data streams...',
  'Warming up processors...',
  'Checking system integrity...',
  'Loading conversation history...',
  'Initializing chat interface...',
  'Preparing AI assistant...',
  'Almost ready...',
  'Finalizing setup...',
  'Getting everything ready...',
];

export function SplashScreen({ onComplete, aiModel = 'flash' }: SplashScreenProps) {
  const [progress, setProgress] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);
  const [isExiting, setIsExiting] = useState(false);

  const isAccure = aiModel === 'accure';

  useEffect(() => {
    // Progress animation (0 to 100 in 2 seconds)
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 1;
      });
    }, 20); // 20ms * 100 = 2 seconds

    // Message rotation (change every 0.2 seconds)
    const messageInterval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 200);

    // Complete loading after 2 seconds
    const completeTimeout = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => {
        onComplete();
      }, 500); // Wait for exit animation
    }, 2000);

    return () => {
      clearInterval(progressInterval);
      clearInterval(messageInterval);
      clearTimeout(completeTimeout);
    };
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center transition-opacity duration-700 ${
        isExiting ? 'opacity-0' : 'opacity-100'
      } ${
        isAccure
          ? 'bg-gradient-to-br from-yellow-50 via-yellow-100 to-amber-100 dark:from-yellow-950 dark:via-yellow-900 dark:to-amber-900'
          : 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950'
      }`}
    >
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden">
        <div className={`absolute top-1/4 left-1/4 w-64 h-64 rounded-full blur-3xl animate-pulse ${
          isAccure ? 'bg-yellow-400/20' : 'bg-primary/20'
        }`} />
        <div className={`absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl animate-pulse delay-1000 ${
          isAccure ? 'bg-yellow-400/10' : 'bg-primary/10'
        }`} />
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center gap-8">
        {/* Logo with animations */}
        <div
          className={`relative transition-all duration-1000 ${
            isExiting ? 'scale-50 -translate-y-32' : 'scale-100'
          }`}
        >
          {/* Glow effect */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className={`w-48 h-48 rounded-full blur-3xl animate-pulse ${
              isAccure ? 'bg-yellow-400/30' : 'bg-primary/30'
            }`} />
          </div>

          {/* Logo container */}
          <div className="relative w-40 h-40 flex items-center justify-center">
            <div className={`absolute inset-0 rounded-3xl animate-float shadow-2xl ${
              isAccure
                ? 'bg-gradient-to-br from-yellow-400/20 via-yellow-400/10 to-transparent shadow-yellow-500/50'
                : 'bg-gradient-to-br from-primary/20 via-primary/10 to-transparent shadow-primary/50'
            }`} />
            <div className={`relative w-32 h-32 rounded-3xl flex items-center justify-center shadow-2xl animate-float ${
              isAccure
                ? 'bg-gradient-to-br from-yellow-400 via-amber-400 to-yellow-500 shadow-yellow-500/50'
                : 'bg-gradient-to-br from-primary via-primary to-primary/80 shadow-primary/50'
            }`}>
              {isAccure ? (
                <Sparkles className="w-16 h-16 text-white" />
              ) : (
                <Zap className="w-16 h-16 text-primary-foreground" />
              )}
            </div>
          </div>
        </div>

        {/* App name */}
        <div
          className={`text-center transition-all duration-1000 ${
            isExiting ? 'opacity-0 translate-y-8' : 'opacity-100'
          }`}
        >
          <h1 className={`text-5xl font-bold mb-2 animate-fade-in ${
            isAccure
              ? 'bg-gradient-to-r from-yellow-600 via-amber-600 to-yellow-700 dark:from-yellow-400 dark:via-amber-400 dark:to-yellow-500 bg-clip-text text-transparent'
              : 'gradient-text'
          }`}>
            {isAccure ? 'Accure' : 'Flash AI'}
          </h1>
          <p className={`text-lg font-medium animate-fade-in-delay ${
            isAccure ? 'text-yellow-800 dark:text-yellow-200' : 'text-muted-foreground'
          }`}>
            {isAccure ? 'Precision AI Assistant' : 'Your Intelligent Assistant'}
          </p>
        </div>

        {/* Progress bar */}
        <div
          className={`w-80 max-w-[90vw] transition-all duration-1000 ${
            isExiting ? 'opacity-0 translate-y-8' : 'opacity-100'
          }`}
        >
          <div className={`relative h-2 rounded-full overflow-hidden backdrop-blur-sm ${
            isAccure ? 'bg-yellow-200/30 dark:bg-yellow-800/30' : 'bg-muted/30'
          }`}>
            <div
              className={`absolute inset-y-0 left-0 rounded-full transition-all duration-300 ease-out shadow-lg ${
                isAccure
                  ? 'bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 shadow-yellow-500/50'
                  : 'bg-gradient-to-r from-primary via-primary to-primary/80 shadow-primary/50'
              }`}
              style={{ width: `${progress}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
            </div>
          </div>

          {/* Progress percentage */}
          <div className="flex items-center justify-between mt-3">
            <span className={`text-sm font-mono ${
              isAccure ? 'text-yellow-700 dark:text-yellow-300' : 'text-muted-foreground'
            }`}>
              {progress}%
            </span>
            <span className={`text-sm font-semibold ${
              isAccure ? 'text-yellow-600 dark:text-yellow-400' : 'text-primary'
            }`}>
              {progress === 100 ? 'Complete!' : 'Loading...'}
            </span>
          </div>
        </div>

        {/* Loading messages */}
        <div
          className={`h-8 transition-all duration-1000 ${
            isExiting ? 'opacity-0 translate-y-8' : 'opacity-100'
          }`}
        >
          <p className={`text-sm font-medium animate-fade-in-out text-center px-4 ${
            isAccure ? 'text-yellow-700 dark:text-yellow-300' : 'text-muted-foreground'
          }`}>
            {loadingMessages[messageIndex]}
          </p>
        </div>

        {/* Decorative elements */}
        <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 flex gap-2">
          <div className={`w-2 h-2 rounded-full animate-bounce ${
            isAccure ? 'bg-yellow-500/50' : 'bg-primary/50'
          }`} />
          <div className={`w-2 h-2 rounded-full animate-bounce delay-100 ${
            isAccure ? 'bg-yellow-500/50' : 'bg-primary/50'
          }`} />
          <div className={`w-2 h-2 rounded-full animate-bounce delay-200 ${
            isAccure ? 'bg-yellow-500/50' : 'bg-primary/50'
          }`} />
        </div>
      </div>
    </div>
  );
}
