import { Buffer } from 'buffer';  // Importer directement 'buffer'

(window as any).global = window;
(window as any).process = { env: { DEBUG: undefined } };
(window as any).Buffer = Buffer;  // Utiliser 'Buffer' après l'importation
