const LevelRadio = ({ formData, handleChange }) => {
  const levels = ['Amateur', 'Experienced', 'Professional', 'Expert'];
  const colors = {
'Amateur': 'yellow',
    'Experienced': 'blue',
    'Professional': 'red',
    'Expert': 'orange'
  }

  return (
<div className="flex flex-wrap">
    { levels.map(level => (
      <div className="flex items-center me-4">
        <input 
          onChange={handleChange}
          checked={formData.level === level}
          name="level"
          id={level + "-radio"} 
          type="radio" 
          value={level} 
          className={`w-4 h-4 text-${colors[level]}-100 focus:ring-${colors[level]}-100 ring-offset-gray-800 focus:ring-2 bg-gray-700 border-gray-600`}
        />
        <label 
          htmlFor="red-radio" 
          className="ms-2 text-sm font-medium"
        >
        {level}
      </label>
    </div>
    ))}
</div>
  );
};

export default LevelRadio;

