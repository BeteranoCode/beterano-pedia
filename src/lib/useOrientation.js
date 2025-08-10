import { useEffect, useState } from 'react';
export default function useOrientation() {
  const get = () => window.matchMedia('(orientation:landscape)').matches ? 'landscape' : 'portrait';
  const [o, setO] = useState(get());
  useEffect(() => {
    const mq = window.matchMedia('(orientation:landscape)');
    const on = () => setO(get());
    mq.addEventListener('change', on);
    window.addEventListener('resize', on);
    return () => { mq.removeEventListener('change', on); window.removeEventListener('resize', on); };
  }, []);
  return o;
}