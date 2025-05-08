export interface NotificationDTO {
  id?: number;
  message: string;
  agence: string;
  agentId: number;
  date?: string; // ou Date si c'est converti
  lu?: boolean;
}
