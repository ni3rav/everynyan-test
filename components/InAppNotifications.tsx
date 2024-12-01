'use client'

import { useWebSocket } from '@/hooks/useWebsocket';

export function InAppNotifications() {
  const url = `${process.env.NEXT_PUBLIC_NOTIFICATIONS_SERVER_ADDRESS}/subscribe`
  const { isConnected } = useWebSocket(url);

  return (
    <div className='hidden'>
      {isConnected ? 'Connected to notifications' : 'Connecting...'}
    </div>
  );
}

