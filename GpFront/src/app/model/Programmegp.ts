import {AgentGp} from './Agentgp';

export interface Programmegp {
  id: number;
  description: string;
  depart: string;
  destination: string;
  prix: string;
  garantie: number;
  dateline: string;
  agentGp: AgentGp;
  isExpanded?: boolean;
}
