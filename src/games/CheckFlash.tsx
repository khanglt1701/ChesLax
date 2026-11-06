import { useEffect, useState } from 'react';

const FLASH_MS = 1700;

export function CheckFlash({ pulse }: { pulse: number }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    setVisible(true);
    const timer = window.setTimeout(() => setVisible(false), FLASH_MS);
    return () => window.clearTimeout(timer);
  }, [pulse]);

  if (!visible) return null;

  return (
    <div className="check-flash" role="status" aria-live="assertive" data-testid="check-flash">
      <span key={pulse}>Chiếu tướng</span>
    </div>
  );
}
