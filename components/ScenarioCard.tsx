
import React from 'react';
import { Scenario } from '../types';
import { MapPin, Info, Lightbulb, MessageSquare, Image as ImageIcon, Video } from 'lucide-react';

interface ScenarioCardProps {
  scenario: Scenario;
}

const ScenarioCard: React.FC<ScenarioCardProps> = ({ scenario }) => {
  const getIcon = () => {
    switch (scenario.roundType) {
      case 'image': return <ImageIcon className="w-6 h-6" />;
      case 'video': return <Video className="w-6 h-6" />;
      default: return <MessageSquare className="w-6 h-6" />;
    }
  };

  const getLabel = () => {
    switch (scenario.roundType) {
      case 'image': return 'Generación de Imagen';
      case 'video': return 'Producción Audiovisual';
      default: return 'Comunicado de Texto';
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom duration-500">
      <div className="relative bg-white border-4 border-black p-8 rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] halftone-pattern">
        <div className="absolute -top-6 -right-6 bg-blue-600 text-white p-4 border-4 border-black rounded-xl rotate-6 flex items-center gap-2 font-comic shadow-lg">
          {getIcon()}
          <span>{getLabel()}</span>
        </div>

        <h2 className="text-4xl font-comic mb-2 text-black">{scenario.title}</h2>
        
        <div className="flex items-center gap-4 text-gray-700 mb-6 font-bold">
          <div className="flex items-center gap-1">
            <MapPin className="w-5 h-5 text-red-600" />
            {scenario.location}
          </div>
          <div className="flex items-center gap-1">
            <Info className="w-5 h-5 text-blue-600" />
            {scenario.time}
          </div>
        </div>

        <p className="text-xl leading-relaxed text-gray-800 border-l-8 border-yellow-400 pl-4 mb-8 italic">
          "{scenario.description}"
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-blue-50 p-6 rounded-xl border-2 border-black">
            <h3 className="flex items-center gap-2 text-xl font-comic text-blue-800 mb-4">
              <MessageSquare className="w-6 h-6" /> ¿QUÉ DEBEMOS GENERAR?
            </h3>
            <ul className="space-y-2">
              {scenario.requirements.map((req, idx) => (
                <li key={idx} className="flex gap-2 font-semibold text-gray-700">
                  <span className="text-blue-600">•</span> {req}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-yellow-50 p-6 rounded-xl border-2 border-black">
            <h3 className="flex items-center gap-2 text-xl font-comic text-yellow-800 mb-4">
              <Lightbulb className="w-6 h-6" /> PISTAS TÉCNICAS
            </h3>
            <ul className="space-y-2">
              {scenario.tips.map((tip, idx) => (
                <li key={idx} className="flex gap-2 font-semibold text-gray-700">
                  <span className="text-yellow-600">★</span> {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-gray-100 border-4 border-dashed border-black p-6 rounded-2xl opacity-75">
        <h3 className="font-comic text-gray-600 mb-2">EJEMPLO DE PROMPT DE REFERENCIA</h3>
        <p className="text-gray-500 font-mono text-sm leading-relaxed">{scenario.example}</p>
      </div>
    </div>
  );
};

export default ScenarioCard;
