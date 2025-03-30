import {Utilisateur} from './Utilisateur';

export interface Besoin {
  id: number;
  telephone: string;
  description: string;
  dateline: string;
  utilisateur: Utilisateur;
}
