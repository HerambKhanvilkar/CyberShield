import { useState } from 'react';
import { Plus } from 'lucide-react';

const CompletedAchievementsSection = ({ achievements = [] }) => {
  const [newAchievementModalOpen, setNewAchievementModalOpen] = useState(false);

  // Filter completed achievements; adjust logic if "completed" is stored differently
  const completedAchievements = achievements.filter(ach => ach.completed);

  const handleAddAchievement = () => {
    setNewAchievementModalOpen(true);
  };

  return (
    <div className="w-full bg-blue-950/30 backdrop-blur-md rounded-md shadow-lg text-white p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Achievements</h2>
        <button
          onClick={handleAddAchievement}
          className="p-2 rounded-full hover:bg-blue-600 transition-colors"
          aria-label="Add new achievement"
        >
          <Plus className="w-5 h-5 text-blue-400" />
        </button>
      </div>

      {completedAchievements.length > 0 ? (
        <ul className="space-y-2">
          {completedAchievements.map((achievement, index) => (
            <li key={index} className="bg-gray-700 p-3 rounded-lg">
              {achievement.name}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-400 italic">No achievements earned yet.</p>
      )}

      {/* Modal for adding new achievement */}
      {newAchievementModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-6 rounded-xl max-w-md w-full">
            <h3 className="text-white text-lg font-semibold mb-4">Add New Achievement</h3>
            {/* Replace below with actual modal/form */}
            <button
              onClick={() => setNewAchievementModalOpen(false)}
              className="mt-4 px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompletedAchievementsSection;
