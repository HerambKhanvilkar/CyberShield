import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react'; // Optional: Lucide icon

const CompletedCoursesSection = ({ courses = [] }) => {
  const [newCoursesModalOpen, setNewCoursesModalOpen] = useState(false);

  const completedCourses = courses.filter(course => course.completed); // assuming course.completed === true/false

  const handleAddCourse = () => {
    setNewCoursesModalOpen(true);
  };

  return (
    <div className="w-full bg-blue-950/30 backdrop-blur-md rounded-md shadow-lg text-white p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Completed Courses</h2>
        <button
          onClick={handleAddCourse}
          className="p-2 rounded-full hover:bg-blue-600 transition-colors"
          aria-label="Add new course"
        >
          <Plus className="w-5 h-5 text-blue-400" />
        </button>
      </div>

      {completedCourses.length > 0 ? (
        <ul className="space-y-2">
          {completedCourses.map((course, index) => (
            <li key={index} className="bg-gray-700 p-3 rounded-lg">
              {course.name}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-400 italic">No courses completed yet.</p>
      )}

      {/* Modal or form for adding a new course */}
      {newCoursesModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-6 rounded-xl max-w-md w-full">
            <h3 className="text-white text-lg font-semibold mb-4">Add New Course</h3>
            {/* You can replace this with a form or your modal component */}
            <button
              onClick={() => setNewCoursesModalOpen(false)}
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
export default CompletedCoursesSection;