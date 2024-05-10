export default function debounce<Args extends unknown[]>(
  callback: (...args: Args) => void,
  timeout: number,
): (...args: Args) => void {
  let id: any;

  return () => {
    clearTimeout(id);
    id = setTimeout(callback, timeout);
  };
}
