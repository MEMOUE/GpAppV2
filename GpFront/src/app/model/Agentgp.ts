import {Role} from './Role';

export interface AgentGp {
  id: number;
  username: string;
  password: string;
  email: string;
  roles: Role[];
  nomagence: string;
  adresse: string;
  telephone: string;
  destinations: string[];
}
