/* Only the neutral outage bundle aliases next/navigation and next/link here.
 * The normal Next build keeps its original router. No duplicate POS screens. */
import { forwardRef, useSyncExternalStore, type AnchorHTMLAttributes } from "react";

const subscribe = (listener: () => void) => {
  window.addEventListener("popstate", listener);
  return () => window.removeEventListener("popstate", listener);
};
const path = () => window.location.pathname;
const search = () => window.location.search;
export function usePathname() { return useSyncExternalStore(subscribe, path, () => "/"); }
export function useSearchParams() { return new URLSearchParams(useSyncExternalStore(subscribe, search, () => "")); }
function navigate(url: string, replace = false) {
  const target = new URL(url, window.location.origin);
  if (target.origin !== window.location.origin) { window.location.assign(target.href); return; }
  window.history[replace ? "replaceState" : "pushState"]({}, "", target.href);
  window.dispatchEvent(new PopStateEvent("popstate"));
}
const router = {
  push: (url: string) => navigate(url), replace: (url: string) => navigate(url, true),
  refresh: () => window.dispatchEvent(new Event("suntech:reconnect")),
  back: () => window.history.back(), forward: () => window.history.forward(), prefetch: () => Promise.resolve(),
};
export function useRouter() { return router; }
type LinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & { href: string | { pathname?: string }; prefetch?: boolean; replace?: boolean; scroll?: boolean };
const OfflineLink = forwardRef<HTMLAnchorElement, LinkProps>(function OfflineLink({ href, onClick, replace, prefetch: _prefetch, scroll: _scroll, ...props }, ref) {
  void _prefetch; void _scroll;
  const url = typeof href === "string" ? href : href.pathname || "/";
  return <a {...props} href={url} ref={ref} onClick={event => {
    onClick?.(event);
    if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || props.target === "_blank") return;
    event.preventDefault(); navigate(url, replace);
  }} />;
});
export default OfflineLink;
