import { useState, useEffect } from 'react';
import { guestService } from '../services/guestService';

export function useGuestMode() {
  const [isGuest, setIsGuest] = useState<boolean>(guestService.isGuest());
  const [credits, setCredits] = useState<number>(guestService.getCredits());

  useEffect(() => {
    const handleStateChange = () => {
      setIsGuest(guestService.isGuest());
      setCredits(guestService.getCredits());
    };

    const handleCreditsChange = (e: Event) => {
      const customEvent = e as CustomEvent<number>;
      if (customEvent.detail !== undefined) {
        setCredits(customEvent.detail);
      } else {
        setCredits(guestService.getCredits());
      }
    };

    window.addEventListener('flash_guest_state_changed', handleStateChange);
    window.addEventListener('flash_credits_updated', handleCreditsChange as EventListener);

    return () => {
      window.removeEventListener('flash_guest_state_changed', handleStateChange);
      window.removeEventListener('flash_credits_updated', handleCreditsChange as EventListener);
    };
  }, []);

  return {
    isGuest,
    credits,
    enterGuestMode: guestService.enterGuestMode.bind(guestService),
    exitGuestMode: guestService.exitGuestMode.bind(guestService),
    deductCredits: guestService.deductCredits.bind(guestService),
  };
}