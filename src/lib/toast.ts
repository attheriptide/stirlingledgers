type Listener = (msg: string) => void;
let listener: Listener | null = null;

export function registerToastListener(l: Listener | null): void {
  listener = l;
}

export function toast(msg: string): void {
  listener?.(msg);
}
