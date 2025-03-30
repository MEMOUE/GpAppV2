import {Role} from './Role';

export interface Utilisateur {
  id: number;
  username: string;
  password: string;
  email: string;
  roles: Role[];
}
