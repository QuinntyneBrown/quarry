export interface RaffleResult {
  id: string;
  label: string;
  winnerName?: string;
  winnerDetail?: string;
  candidates: string[];
  start: number;
  reveal: number;
}
