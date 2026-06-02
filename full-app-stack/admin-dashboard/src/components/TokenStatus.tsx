import { useEffect, useState } from 'react';
import keycloak from '../auth/keycloak';
import toast from 'react-hot-toast';

export default function TokenStatus() {
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    const updateTimeLeft = () => {
      if (keycloak.tokenParsed?.exp) {
        const expiresAt = keycloak.tokenParsed.exp * 1000;
        const now = Date.now();
        const left = Math.max(0, Math.floor((expiresAt - now) / 1000));
        setTimeLeft(left);
      }
    };

    updateTimeLeft();
    const interval = setInterval(updateTimeLeft, 1000);

    const onTokenRefresh = () => {
      toast.success('Token refreshed', { duration: 2000 });
      updateTimeLeft();
    };

    keycloak.onTokenExpired = () => {
      keycloak.updateToken(30).catch(() => {
        keycloak.login();
      });
    };

    keycloak.onAuthRefreshSuccess = onTokenRefresh;

    return () => {
      clearInterval(interval);
    };
  }, []);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getColorClass = (): string => {
    if (timeLeft > 120) return 'text-green-600';
    if (timeLeft > 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-gray-600">Token expires in:</span>
      <span className={`font-mono font-semibold ${getColorClass()}`}>
        {formatTime(timeLeft)}
      </span>
    </div>
  );
}
