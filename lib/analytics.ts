export const trackEvent = (
  eventName: string,
  params?: Record<string, string | number>
) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, params)
  }
}
