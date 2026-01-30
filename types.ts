
export enum RoundType {
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video'
}

export type CollectiveType = 'Ciclo Formativo' | 'Cuerpo Docente' | 'PAS (Administración/Servicios)';

export interface Team {
  id: string;
  name: string;
  collective: CollectiveType;
  departmentOrCycle: string;
  captainEmail: string;
  members: string[];
  totalWins: number;
  registeredAt: string;
}

export interface Voter {
  id: string;
  name: string;
  email: string;
  role: CollectiveType | 'Votante Externo';
  votes: {
    [challengeId: string]: {
      [key in RoundType]?: string; // ID de la entrega votada
    }
  };
}

export interface Submission {
  id: string;
  teamId: string;
  teamName: string;
  collective: CollectiveType;
  challengeId: string;
  challengeNumber: number;
  type: RoundType;
  productUrl: string;
  methodology: {
    aiUsed: string;
    prompts: string;
    structure: string;
  };
  votes: number;
  timestamp: string;
}

export interface ChallengeOption {
  type: RoundType;
  title: string;
  description: string;
  requirements: string[];
}

export interface Scenario {
  id: string;
  week: number;
  number: number;
  mainTopic: string;
  subTopic: string;
  educationalCycle: string;
  challenges: {
    text: ChallengeOption;
    image: ChallengeOption;
    video: ChallengeOption;
  };
  createdAt: string;
}

export type View = 'login' | 'register-team' | 'dashboard' | 'submit' | 'gallery' | 'ranking' | 'admin' | 'admin-login' | 'voter-register';

export interface GameState {
  currentVoter: Voter | null;
  currentTeam: Team | null;
  currentScenario: Scenario | null;
  historyScenarios: Scenario[];
  teams: Team[];
  voters: Voter[];
  submissions: Submission[];
  view: View;
  isAdminAuthenticated: boolean;
  baseChallengeNumber: number;
}
