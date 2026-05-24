declare global {
  interface Window {
    dataLayer: any[];
  }
}

window.dataLayer = window.dataLayer || [];

export function gtmEvent(eventName: string, params?: Record<string, any>) {
  window.dataLayer.push({ event: eventName, ...params });
}