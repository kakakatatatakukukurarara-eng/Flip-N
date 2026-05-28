// src/app/sw.js/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  const swCode = `
    self.addEventListener('install', (event) => {
      console.log('Service Worker installed.');
      self.skipWaiting();
    });

    self.addEventListener('activate', (event) => {
      console.log('Service Worker activated.');
    });

    self.addEventListener('push', (event) => {
      const data = event.data ? event.data.json() : {};
      const title = data.title || 'FLIP-N PRO';
      const options = {
        body: data.body || '復習の時間です！',
        icon: '/icon-192.png',
        badge: '/icon-192.png',
      };
      event.waitUntil(self.registration.showNotification(title, options));
    });

    self.addEventListener('notificationclick', (event) => {
      event.notification.close();
      event.waitUntil(clients.openWindow('/'));
    });
  `;

  return new NextResponse(swCode, {
    headers: {
      'Content-Type': 'application/javascript',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    },
  });
}