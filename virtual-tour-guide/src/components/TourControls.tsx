import React from 'react';
import { Play, Pause, SkipForward, SkipBack, RotateCcw } from 'lucide-react';
import { TourProgress } from '../lib/supabase';
import { motion } from 'framer-motion';

interface TourControlsProps {
  tourProgress: TourProgress;
  onStartTour: () => void;
  onNextStop: () => void;
  onPreviousStop: () => void;
  totalStops: number;
}

const TourControls: React.FC<TourControlsProps> = ({
  tourProgress,
  onStartTour,
  onNextStop,
  onPreviousStop,
  totalStops
}) => {
  const progressPercentage = ((tourProgress.currentStop + 1) / totalStops) * 100;

  return (
    <div className="space-y-4">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-gray-600">
          <span>Tour Progress</span>
          <span>{tourProgress.currentStop + 1} of {totalStops}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <motion.div
            className="bg-gradient-to-r from-blue-500 to-orange-500 h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Main Controls */}
      {!tourProgress.isActive ? (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onStartTour}
          className="w-full bg-gradient-to-r from-blue-600 to-orange-600 hover:from-blue-700 hover:to-orange-700 text-white py-3 px-6 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all duration-300"
        >
          <Play className="w-5 h-5" fill="currentColor" />
          Start Virtual Tour
        </motion.button>
      ) : (
        <div className="flex gap-2">
          <button
            onClick={onPreviousStop}
            disabled={tourProgress.currentStop === 0}
            className="flex-1 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 py-2 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <SkipBack className="w-4 h-4" />
            Previous
          </button>
          <button
            onClick={onNextStop}
            disabled={tourProgress.currentStop >= totalStops - 1}
            className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
          >
            Next
            <SkipForward className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Additional Controls */}
      {tourProgress.isActive && (
        <div className="flex gap-2">
          <button
            onClick={onStartTour}
            className="flex-1 bg-blue-100 hover:bg-blue-200 text-blue-700 py-2 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Restart Tour
          </button>
        </div>
      )}

      {/* Stats */}
      {tourProgress.isActive && (
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{tourProgress.visitedStops.length}</p>
            <p className="text-xs text-gray-600">Stops Visited</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-orange-600">
              {Math.round(progressPercentage)}%
            </p>
            <p className="text-xs text-gray-600">Complete</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TourControls;