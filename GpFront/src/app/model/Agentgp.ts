import { Role } from './Role';

export interface AgentGp {
  id?: number;
  username: string;
  password: string;
  email: string;
  roles?: Role[];
  photo?: string; // Base64 ou URL de la photo
  carteIdentite?: string; // Base64 ou URL de la carte d'identité
  enabled?: boolean;
  nomagence: string;
  adresse: string;
  telephone: string;
  destinations: string[];
}