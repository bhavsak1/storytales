declare function gtag(...args: unknown[]): void
declare interface Window {
  gtag: typeof gtag
}
