import { useEffect, useState } from "react";
import type { RetryButtonProperties } from "../types/RetryButtonProperties";

export function RetryButton({ retryAt, onRetry }: RetryButtonProperties): React.JSX.Element {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    if (!retryAt) return;
    if (retryAt <= Date.now()) {
      if (now < retryAt) setNow(Date.now());
      return;
    }
    const timer = window.setTimeout(() => setNow(Date.now()), Math.min(retryAt - Date.now(), 2_147_483_647));
    return () => window.clearTimeout(timer);
  }, [retryAt, now]);
  return <button type="button" disabled={retryAt !== undefined && now < retryAt} onClick={onRetry}>Retry</button>;
}
