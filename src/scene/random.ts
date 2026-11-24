/** The mock's hash: a fixed pseudo-random value in [0, 1) for a seed. Same seed, same value, always. */
export function rand(seed: number): number {
  const x = Math.sin(seed * 127.1) * 43758.5453;
  return x - Math.floor(x);
}
