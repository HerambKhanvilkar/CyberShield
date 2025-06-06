const DescriptionTextArea = ({ formData, handleChange }) => {

  return (
    <div>
            <textarea 
    id="message" 
    rows="4" 
    name="description"
    value={formData.description}
    onChange={handleChange}
    required
    className="block p-2.5 w-full text-sm text-gray-900 rounded-lg border bg-gray-700 border-gray-600 placeholder-gray-400 text-white focus:ring-blue-500 focus:border-blue-500" placeholder="Description"/
    >
</div>
  );
};

export default DescriptionTextArea;

