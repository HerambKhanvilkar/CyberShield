import { useState, useEffect } from "react";
import axios from "axios";
import { Plus, Pencil, Trash2, Check, X, Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

const Achievements = ({ achievements = [], user }) => {
  const [achievementList, setAchievementList] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [deleteMode, setDeleteMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [newAchievement, setNewAchievement] = useState("");

  useEffect(() => {
    if (achievements && Array.isArray(achievements)) {
      const formatted = achievements.map((ach) =>
        typeof ach === "string" ? { name: ach } : ach
      );
      setAchievementList(formatted);
    }
    setModalOpen(false);
    setNewAchievement("");
    setEditMode(false);
    setDeleteMode(false);
  }, [user]);

  const handleDelete = async (index) => {
    const token = localStorage.getItem("token");
    try {
      await axios.delete(
        `${process.env.SERVER_URL}/users/achievements/${index}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          data: {
            email: user.email,
          },
        }
      );
      const updated = [...achievementList];
      updated.splice(index, 1);
      setAchievementList(updated);
    } catch (error) {
      console.error("Error deleting achievement:", error);
    }
  };

  const handleChange = (index, newValue) => {
    const updated = [...achievementList];
    updated[index].name = newValue;
    setAchievementList(updated);
  };

  const handleSaveChanges = async () => {
    setLoading(true);
    const token = localStorage.getItem("token");

    try {
      await Promise.all(
        achievementList.map((achievement, index) =>
          axios.put(
            `${process.env.SERVER_URL}/users/achievements/${index}`,
            {
              email: user.email,
              achievement: achievement.name,
            },
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          )
        )
      );
      setEditMode(false);
    } catch (error) {
      console.error("Error saving achievements:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAchievement = async () => {
    if (!newAchievement.trim()) return;
    setLoading(true);
    const token = localStorage.getItem("token");

    try {
      await axios.post(
        `${process.env.SERVER_URL}/users/achievements`,
        {
          email: user.email,
          achievement: newAchievement,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      setAchievementList([...achievementList, { name: newAchievement }]);
      setNewAchievement("");
      setModalOpen(false);
    } catch (error) {
      console.error("Error adding achievement:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-gray backdrop-blur-md border border-white/10 rounded-lg p-2 md:p-4 text-white">
      <h2 className="text-xl font-bold mb-2 border-b border-blue-500">Achievements</h2>

      <div className="max-h-[200px] overflow-y-auto bg-white/5 border border-white/10 rounded-md p-3 space-y-2">
        {achievementList.length > 0 ? (
          achievementList.map((achievement, index) => (
            <div
              key={index}
              className="flex justify-between items-center bg-white/10 hover:bg-white/20 transition-colors px-4 py-2 rounded-lg"
            >
              {editMode ? (
                <input
                  type="text"
                  value={achievement.name}
                  onChange={(e) => handleChange(index, e.target.value)}
                  className="w-full bg-transparent text-white border border-white/20 rounded px-2 py-1 focus:outline-none"
                />
              ) : (
                <span>{achievement.name}</span>
              )}

              <div className="flex items-center gap-2 ml-4">
                {deleteMode && (
                  <Trash2
                    className="w-4 h-4 text-red-400 hover:text-red-300 cursor-pointer"
                    onClick={() => handleDelete(index)}
                  />
                )}
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-400 italic">No achievements earned yet.</p>
        )}
      </div>

      <div className="mt-4 flex flex-wrap justify-end gap-3">
        {/* Add button opens modal */}
        <button
          onClick={() => setModalOpen(true)}
          className="bg-green-600/80 hover:bg-green-500 px-4 py-2 rounded text-sm flex items-center justify-center"
        >
        <Plus className="block md:hidden w-5 h-5 text-white" />
        <span className="hidden md:block">Add</span>
        </button>

        {editMode ? (
          <>
            <button
              onClick={handleSaveChanges}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-sm flex items-center justify-center"
              disabled={loading}
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5 mr-1" />}
              {loading ? "" : "Save Changes"}
            </button>
            <button
              onClick={() => setEditMode(false)}
              className="bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded text-sm flex items-center justify-center"
            >
            <X className="block md:hidden w-5 h-5 text-white" />
            <span className="hidden md:block">Cancel</span>
            </button>
          </>
        ) : (
          <button
            onClick={() => {
              setEditMode(true);
              setDeleteMode(false);
            }}
            className="bg-yellow-600 hover:bg-yellow-500 px-4 py-2 rounded text-sm flex items-center justify-center"
          >
          <Pencil className="block md:hidden w-5 h-5 text-white" />
          <span className="hidden md:block">Edit</span>
          </button>
        )}

        <button
          onClick={() => {
            setDeleteMode(!deleteMode);
            setEditMode(false);
          }}
          className={`px-4 py-2 rounded text-sm flex items-center justify-center ${
            deleteMode ? "bg-red-700" : "bg-red-600/80 hover:bg-red-500"
          }`}
        >
        <Trash2 className="block md:hidden w-5 h-5" />
        <span className="hidden md:block">
          {deleteMode ? "Done" : "Delete"}
        </span>
        </button>
      </div>

      {/* Add Achievement Modal */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 p-6 rounded-xl w-full max-w-md relative border border-white/10 shadow-2xl"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
            >
              <button
                className="absolute top-3 right-3 text-gray-400 hover:text-white"
                onClick={() => setModalOpen(false)}
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-white text-lg font-semibold mb-4">
                Add New Achievement
              </h3>
              <input
                type="text"
                value={newAchievement}
                onChange={(e) => setNewAchievement(e.target.value)}
                className="w-full p-2 mb-4 rounded bg-white/10 text-white border border-white/20 focus:outline-none focus:ring focus:ring-blue-500"
                placeholder="Enter achievement..."
              />
              <button
                onClick={handleAddAchievement}
                disabled={loading}
                className="w-full px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 flex justify-center items-center"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  "Add"
                )}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Achievements;
