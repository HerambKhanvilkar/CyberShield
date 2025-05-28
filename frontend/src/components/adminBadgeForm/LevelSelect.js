const LevelSelect = ({ formData, handleChange }) => {

  return (
    <div>
          <label htmlFor="level" className="block mb-2 text-sm font-medium text-white">Select badge level </label>
  <select 
    id="level" 
    name="level"
    value={formData.level}
    onChange={handleChange}
    className="border text-sm rounded-lg block w-full p-2.5 bg-gray-700 border-gray-600 placeholder-gray-400 text-white focus:ring-blue-500 focus:border-blue-500">

    <option value="">Select a level</option>
          { ['Amateur', 'Intermediate', 'Professional'].map(d => (
        <option key={d} value={d}>
          {d}
          </option>
          ))}
          </select>
</div>
  );
};

export default LevelSelect;

