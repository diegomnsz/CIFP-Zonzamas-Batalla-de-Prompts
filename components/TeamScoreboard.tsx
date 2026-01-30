
import React from 'react';
// Fix: Removed TeamId from imports as it is not exported from types.ts
import { Team } from '../types';
import { Trophy, User } from 'lucide-react';

interface TeamScoreboardProps {
  // Fix: Replaced TeamId with string to match the Team interface ID type
  teams: Record<string, Team>;
  onAddPoint: (id: string) => void;
}

const TeamScoreboard: React.FC<TeamScoreboardProps> = ({ teams, onAddPoint }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
      {/* 
        Explicitly casting to Team[] to resolve the 'unknown' type error. 
        Object.values on a Record with enum keys sometimes fails to infer the value type correctly in strict TypeScript configurations.
      */}
      {(Object.values(teams) as Team[]).map((team) => (
        <div 
          key={team.id}
          // Fix: Replaced team.color with a default blue background since color is not defined on Team
          className={`relative border-4 border-black p-4 rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center transition-all bg-blue-600`}
        >
          {/* Fix: Replaced team.avatar with a fallback User icon since avatar is not defined on Team */}
          <div className="w-24 h-24 mb-2 flex items-center justify-center bg-white rounded-full border-2 border-black drop-shadow-lg">
            <User className="w-12 h-12 text-blue-600" />
          </div>
          <h3 className="font-comic text-2xl text-white text-shadow">{team.name}</h3>
          
          <div className="flex items-center gap-4 mt-2 bg-white/30 px-6 py-1 rounded-full border-2 border-black/20">
            {/* Fix: Changed team.score to team.totalWins to match the Team interface definition */}
            <span className="text-4xl font-comic text-white">{team.totalWins}</span>
            <button 
              onClick={() => onAddPoint(team.id)}
              className="bg-white p-2 rounded-full hover:scale-110 transition-transform border border-black"
            >
              <Trophy className="w-6 h-6 text-yellow-600" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TeamScoreboard;
