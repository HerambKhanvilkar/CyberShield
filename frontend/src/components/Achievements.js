import { useState, useEffect } from "react";
import axios from "axios";
import { Plus, Check, Pencil, Trash2, X, Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

const Achievements = ({ achievements = [], user }) => {
  const [achievementList, setAchievementList] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [deleteMode, setDeleteMode] = useState(false);
  const [currentText, setCurrentText] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (achievements && Array.isArray(achievements)) {
      const formatted = achievements.map((ach) =>
        typeof ach === "string" ? { name: ach } : ach
      );
      setAchievementList(formatted);
    }
  }, [achievements]);

  const openAddModal = () => {
    setCurrentText("");
    setIsEditing(false);
    setModalOpen(true);
  };

  const handleEditEntry = (index) => {
    setCurrentText(achievementList[index]?.name);
    setEditingIndex(index);
    setIsEditing(true);
    setModalOpen(true);
  };

  const handleDeleteEntry = async (index) => {
    const token = localStorage.getItem("token");
    try {
      await axios.delete(`${process.env.SERVER_URL}/users/achievements/${index}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        data: {
          email: user.email,
        },
      });

      const updated = [...achievementList];
      updated.splice(index, 1);
      setAchievementList(updated);
    } catch (err) {
      console.error("Error deleting achievement:", err);
    }
  };

  const handleModalSubmit = async () => {
    if (!currentText.trim()) return;
    setLoading(true);
    const token = localStorage.getItem("token");

    try {
      if (isEditing) {
        await axios.put(
          `${process.env.SERVER_URL}/users/achievements/${editingIndex}`,
          {
            email: user.email,
            achievement: currentText,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        const updated = [...achievementList];
        updated[editingIndex].name = currentText;
        setAchievementList(updated);
      } else {
        await axios.post(
          `${process.env.SERVER_URL}/users/achievements`,
          {
            email: user.email,
            achievement: currentText,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        setAchievementList([...achievementList, { name: currentText }]);
      }

      setModalOpen(false);
    } catch (err) {
      console.error("Error submitting achievement:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-gray backdrop-blur-md border border-white/10 rounded-lg p-2 md:p-4 text-white">
      <h2 className="text-xl font-bold mb-2 text-white border-b border-blue-500">Achievements</h2>

      <div className="h-auto overflow-y-auto bg-white/5 border border-white/10 rounded-md p-3 space-y-2">
        {achievementList.length > 0 ? (
          achievementList.map((achievement, index) => (
            <div
              key={index}
              className="flex justify-between items-center bg-white/10 hover:bg-white/20 transition-colors px-4 py-2 rounded-lg"
            >
              <span>{achievement?.name}</span>
              <div className="flex items-center gap-2">
                {editMode && (
                  <Pencil
                    className="w-4 h-4 text-yellow-400 hover:text-yellow-300 cursor-pointer"
                    onClick={() => handleEditEntry(index)}
                  />
                )}
                {deleteMode && (
                  <Trash2
                    className="w-4 h-4 text-red-400 hover:text-red-300 cursor-pointer"
                    onClick={() => handleDeleteEntry(index)}
                  />
                )}
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-400 italic">No achievements earned yet.</p>
        )}
      </div>

      <div className="mt-4 flex justify-end gap-3">
        <button
          onClick={openAddModal}
          className="bg-green-600/80 hover:bg-green-500 px-4 py-2 rounded text-sm flex items-center justify-center"
        >
          <span className="hidden md:inline">Add</span>
          <Plus className="w-5 h-5 text-white md:hidden" />
        </button>

        <button
          onClick={() => {
            setEditMode(!editMode);
            setDeleteMode(false);
          }}
          className={`px-4 py-2 rounded text-sm flex items-center justify-center ${
            editMode ? "bg-yellow-700" : "bg-yellow-600/80 hover:bg-yellow-500"
          }`}
        >
          <span className="hidden md:inline">{editMode ? "Done" : "Edit"}</span>
          {editMode ? (
            <Check className="w-5 h-5 text-white md:hidden" />
          ) : (
            <Pencil className="w-5 h-5 text-white md:hidden" />
          )}
        </button>

        <button
          onClick={() => {
            setDeleteMode(!deleteMode);
            setEditMode(false);
          }}
          className={`px-4 py-2 rounded text-sm flex items-center justify-center ${
            deleteMode ? "bg-red-700" : "bg-red-600/80 hover:bg-red-500"
          }`}
        >
          <span className="hidden md:inline">{deleteMode ? "Done" : "Delete"}</span>
          {deleteMode ? (
            <Check className="w-5 h-5 text-white md:hidden" />
          ) : (
            <Trash2 className="w-5 h-5 text-white md:hidden" />
          )}
        </button>
      </div>

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
                {isEditing ? "Edit Achievement" : "Add New Achievement"}
              </h3>
              <input
                type="text"
                value={currentText}
                onChange={(e) => setCurrentText(e.target.value)}
                className="w-full p-2 mb-4 rounded bg-white/10 text-white border border-white/20 focus:outline-none focus:ring focus:ring-blue-500"
                placeholder="Enter achievement..."
              />
              <button
                onClick={handleModalSubmit}
                disabled={loading}
                className="w-full px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 flex justify-center items-center"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : isEditing ? (
                  "Update"
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
