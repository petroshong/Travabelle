import React, { useState, useEffect } from 'react';
import { Book, X, Sparkles } from 'lucide-react';
import { getLandmarkFacts, LandmarkFactData } from '../lib/landmarkFacts';

interface LandmarkFactsPanelProps {
  landmarks: any[];
  isSimulating: boolean;
  currentProgress: number;
  onClose: () => void;
}

interface LandmarkFact extends LandmarkFactData {
  isLoading: boolean;
}

const LandmarkFactsPanel: React.FC<LandmarkFactsPanelProps> = ({
  landmarks,
  isSimulating,
  currentProgress,
  onClose
}) => {
  const [landmarkFacts, setLandmarkFacts] = useState<LandmarkFact[]>([]);
  const [currentFactIndex, setCurrentFactIndex] = useState(0);

  // Generate AI-powered facts for landmarks using the facts service
  const generateLandmarkFacts = async (landmarkName: string): Promise<LandmarkFact> => {
    try {
      const factData = await getLandmarkFacts(landmarkName);
      return {
        ...factData,
        isLoading: false
      };
    } catch (error) {
      console.error('Error loading landmark facts:', error);
      return {
        name: landmarkName,
        facts: ['Unable to load facts for this landmark'],
        historicalSignificance: 'Facts temporarily unavailable',
        funFact: 'Try again later for interesting facts!',
        isLoading: false
      };
    }
  };

  // Load facts for all landmarks
  useEffect(() => {
    const loadFacts = async () => {
      const facts = await Promise.all(
        landmarks.slice(0, 5).map(async (landmark) => {
          setLandmarkFacts(prev => [...prev, {
            name: landmark.name,
            facts: [],
            historicalSignificance: '',
            funFact: '',
            isLoading: true
          }]);
          
          return await generateLandmarkFacts(landmark.name);
        })
      );
      
      setLandmarkFacts(facts);
    };

    if (landmarks.length > 0) {
      loadFacts();
    }
  }, [landmarks]);

  // Update current fact based on journey progress
  useEffect(() => {
    if (isSimulating && landmarkFacts.length > 0) {
      const factIndex = Math.floor((currentProgress / 100) * landmarkFacts.length);
      setCurrentFactIndex(Math.min(factIndex, landmarkFacts.length - 1));
    }
  }, [currentProgress, isSimulating, landmarkFacts.length]);

  if (!isSimulating || landmarkFacts.length === 0) {
    return null;
  }

  const currentFact = landmarkFacts[currentFactIndex];

  return (
    <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border max-w-sm z-30">
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <h3 className="font-semibold text-gray-900 text-sm">Landmark Facts</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {currentFact.isLoading ? (
          <div className="flex items-center gap-2 text-gray-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
            <span className="text-sm">Loading facts...</span>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <h4 className="font-medium text-gray-900 mb-1">{currentFact.name}</h4>
              <div className="text-xs text-gray-500 mb-2">
                Landmark {currentFactIndex + 1} of {landmarkFacts.length}
              </div>
            </div>

            <div className="space-y-2">
              <div>
                <div className="flex items-center gap-1 mb-1">
                  <Book className="w-3 h-3 text-blue-600" />
                  <span className="text-xs font-medium text-gray-700">Quick Facts</span>
                </div>
                <ul className="text-xs text-gray-600 space-y-1">
                  {currentFact.facts.map((fact, index) => (
                    <li key={index} className="flex items-start gap-1">
                      <span className="text-blue-600 mt-1">•</span>
                      <span>{fact}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <div className="text-xs font-medium text-gray-700 mb-1">Historical Significance</div>
                <p className="text-xs text-gray-600">{currentFact.historicalSignificance}</p>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded p-2">
                <div className="text-xs font-medium text-amber-800 mb-1">💡 Fun Fact</div>
                <p className="text-xs text-amber-700">{currentFact.funFact}</p>
              </div>
            </div>

            {/* Progress indicator */}
            <div className="flex gap-1">
              {landmarkFacts.map((_, index) => (
                <div
                  key={index}
                  className={`h-1 rounded-full flex-1 transition-colors ${
                    index === currentFactIndex 
                    ? 'bg-purple-600' 
                    : index < currentFactIndex 
                    ? 'bg-purple-300' 
                    : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LandmarkFactsPanel;
