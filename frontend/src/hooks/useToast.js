import { useCallback, useEffect, useRef, useState } from 'react';

export default function useToast() {
  const [toast, setToast] = useState(null);
  const timer = useRef();

  const show = useCallback((text, type = 'info') => {
    setToast({ text, type, id: Date.now() });
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), 4500);
  }, []);

  useEffect(() => () => clearTimeout(timer.current), []);

  return [toast, show];
}
