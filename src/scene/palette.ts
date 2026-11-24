export type Theme = 'dark' | 'light';

export interface Palette {
  bg: string; night: string;
  cells: [string, string, string, string, string]; dimCell: string;
  city: string; cityEdge: string; win: string; star: string; moon: string; rain: string; cloud: string;
  train: string; trainRoof: string; stripe: string; head: string; bridge: string; pole: string; sil: string;
  shirt: string; skin: string; hair: string; pants: string; cup: string; steam: string;
  signal: string; board: string; screen: string; ground: string; grain: string; note: string;
}

// Exactly the mock's PAL (docs/reference/mock.html). `shirt` is the mock's `hoodie` key.
export const PALETTES: Record<Theme, Palette> = {
  dark: {
    bg: '#1f1e1d', night: '#181715', cells: ['#262624', '#4a2f24', '#7a3f2a', '#b4563a', '#d97757'], dimCell: '#2b2926',
    city: '#2b2926', cityEdge: '#353230', win: '#d4a27f', star: '#c2c0b6', moon: '#f2cf73', rain: '#f0eee6', cloud: '#2b2926',
    train: '#45413b', trainRoof: '#56514a', stripe: '#d97757', head: '#f0eee6', bridge: '#2b2926', pole: '#100f0e', sil: '#3d3935',
    shirt: '#e8dcc4', skin: '#e2bd9a', hair: '#3a3029', pants: '#5c544b', cup: '#252220', steam: '#c2c0b6',
    signal: '#e5534b', board: '#141413', screen: '#cfe8c4', ground: '#353230', grain: '#fffaf0', note: '#d4a27f',
  },
  light: {
    bg: '#faf9f5', night: '#f0eee6', cells: ['#ece9df', '#f2d5c6', '#e8a88e', '#d97757', '#b4532f'], dimCell: '#e8e6dc',
    city: '#e3e0d5', cityEdge: '#d6d2c4', win: '#d97757', star: '#b0aea5', moon: '#e0a93b', rain: '#5a554b', cloud: '#f0eee6',
    train: '#cdc8b8', trainRoof: '#bdb7a5', stripe: '#d97757', head: '#fffdf6', bridge: '#e3e0d5', pole: '#8f8b80', sil: '#8f8b80',
    shirt: '#5f584f', skin: '#d4a684', hair: '#2e2620', pants: '#8f877b', cup: '#3d3929', steam: '#8f8b80',
    signal: '#cf222e', board: '#3d3929', screen: '#e9f5e3', ground: '#d6d2c4', grain: '#3c3228', note: '#c15f3c',
  },
};
