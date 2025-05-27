import React, { useEffect, useState, useRef } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';

function BadgeCreationForm () {

  const [isSkillsDropDownOpen, setIsSkillsDropDownOpen] = useState(false);
  const [isVerticalsDropDownOpen, setIsVerticalsDropDownOpen] = useState(false);
  const [skillsEarned, setSkillsEarned] = useState([]);
  const [verticals, setVerticals] = useState([]);
  const dropDownInputRef = useRef(null);
  const [preview, setPreview] = useState('');
   const [formData, setFormData] = useState({
    id: '',
    name: '',
    desc: '',
    level: '',
    vertical: '',
    skillsEarned: [],
    image: null,
  });

  useEffect(() => {
  const fetchSkills = async () => {

    try {
    const apiUrl = process.env.SERVER_URL + '/badges/Skills';
    const token = localStorage.getItem("accessToken");
      const response = await axios.get(apiUrl, {
        headers: {
          'Content-Type': 'multipart/form-data', // Set the content type
          Authorization: `Bearer ${token}`, // Add the token to the headers
        },
      });
      // if (!response.ok || Array.isArray(response.data) ) {
      if (!response) {
        throw new Error('Network response was not ok');
      }
      const data = await response.data.data;
      setSkillsEarned(data); // Pass the response data to the parent component

    } catch (error) {
          console.error('Error fetching data:', error);
        setSkillsEarned([]);
    }
  };

  const fetchVerticals = async () => {

    try {
    const apiUrl = process.env.SERVER_URL + '/badges/verticals';
    const token = localStorage.getItem("accessToken");
      const response = await axios.get(apiUrl, {
        headers: {
          'Content-Type': 'multipart/form-data', // Set the content type
          Authorization: `Bearer ${token}`, // Add the token to the headers
        },
      });
      // if (!response.ok || Array.isArray(response.data) ) {
      if (!response) {
        throw new Error('Network response was not ok');
      }
      const data = await response.data.data;
      setVerticals(data); // Pass the response data to the parent component

    } catch (error) {
          console.error('Error fetching data:', error);
        setVerticals([]);
    }
  };
    fetchSkills();
    fetchVerticals();

  }, []);

  const handleSkillsDropDownToggle = () => {
    if ( !isSkillsDropDownOpen && isVerticalsDropDownOpen){
      handleVerticalsDropDownToggle();
    }
    setIsSkillsDropDownOpen(!isSkillsDropDownOpen);
  }

  const handleVerticalsDropDownToggle = () => {
    if ( !isVerticalsDropDownOpen && isSkillsDropDownOpen){
      handleSkillsDropDownToggle();
    }
    setIsVerticalsDropDownOpen(!isVerticalsDropDownOpen);
  }

  const handleChange = (e) => {
   const { name, value, type, checked } = e.target;

    if (type === 'checkbox') {
      console.log("name", name, value, formData.skillsEarned);
      console.log("checked", checked);
      // Handle checkbox input
      setFormData((prevData) => {
        const skillsEarned = checked
          ? [...prevData.skillsEarned, value] // Add if checked
          : prevData.skillsEarned.filter((skill) => skill !== value); // Remove if unchecked
        return { ...prevData, skillsEarned };
      });
    } else if (type === 'radio') {
      // Handle radio input
      setFormData({ ...formData, [name]: value });
    } else if (type === 'file') {
      // Handle file input
      setFormData({ ...formData, [name]: e.target.files[0] });
      const fileReader = new FileReader();
      fileReader.onloadend = () => {
        setPreview(fileReader.result); // Set the preview to the file's data URL
      };
      fileReader.readAsDataURL(e.target.files[0]); // Read the file as a data URL
    } else {
      // Handle other inputs
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleRemoveFile = () => {
    setFormData({ ...formData, image: null });
    setPreview('');
  };
  
  const handleBadgeFormSubmit = async (e) => {
      e.preventDefault();
    // console.log('Form Data:', formData);
    const apiUrl = process.env.SERVER_URL + '/users/import';
    const token = localStorage.getItem("accessToken");

    if (!formData.image) {
      toast.info('Please select a file to upload.');
      return;
    }

    try {
      const response = await axios.post(apiUrl, formData, {
        headers: {
          'Content-Type': 'multipart/form-data', // Set the content type
          Authorization: `Bearer ${token}`, // Add the token to the headers
        },
      });

      setFormData({
        id: '',
        name: '',
        desc: '',
        level: '',
        vertical: '',
        skillsEarned: [],
        image: null,
      })
      toast.success(response.data.message); // Success message
    } catch (error) {
      console.error('There was a problem with the upload operation:', error);
      toast.error(response.data.message); // Error message
    }
  }

  return (
          <div>
            <form onSubmit={handleBadgeFormSubmit} className="max-w-md mx-auto">
  <div className="grid md:grid-cols-2 md:gap-6">
    <div className="relative z-0 w-full mb-5 group">
        <input 
    value={formData.id}
    onChange={handleChange}
          type="number" 
          name="id" 
          id="id" 
                      className="block py-2.5 px-0 w-full text-sm bg-transparent border-0 border-b-2 appearance-none text-white border-gray-600 focus:border-blue-500 focus:outline-none focus:ring-0 peer" 
          placeholder=" " required />
        <label 
          htmlFor="id" 
                      className="peer-focus:font-medium absolute text-sm text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:start-0 rtl:peer-focus:translate-x-1/4 peer-focus:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6">
          Badge ID
          </label>
    </div>
    <div className="relative z-0 w-full mb-5 group">
        <input 
    value={formData.name}
    onChange={handleChange}
          type="text" 
          name="name" 
          id="name" 
                      className="block py-2.5 px-0 w-full text-sm bg-transparent border-0 border-b-2 appearance-none text-white border-gray-600 focus:border-blue-500 focus:outline-none focus:ring-0 peer" 
          placeholder=" " required />
        <label 
          htmlFor="name" 
                      className="peer-focus:font-medium absolute text-sm text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:start-0 rtl:peer-focus:translate-x-1/4 peer-focus:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6">
          Badge Name
          </label>
    </div>
  </div>
              <div className="relative z-0 w-full mb-5 group">
            <textarea 
    id="message" 
    rows="4" 
    name="desc"
    value={formData.desc}
    onChange={handleChange}
    required
    className="block p-2.5 w-full text-sm text-gray-900 rounded-lg border bg-gray-700 border-gray-600 placeholder-gray-400 text-white focus:ring-blue-500 focus:border-blue-500" placeholder="Description"/
    >
              </div>
  <div className="grid md:grid-cols-2 md:gap-6">
    <div className="relative z-0 w-full mb-5 group">
          <label htmlFor="difficulty" className="block mb-2 text-sm font-medium text-white">Select badge difficulty </label>
  <select id="difficulty" className="border text-sm rounded-lg block w-full p-2.5 bg-gray-700 border-gray-600 placeholder-gray-400 text-white focus:ring-blue-500 focus:border-blue-500">

          { ['Easy', 'Medium', 'Hard', 'Expert', 'Extreme'].map(d => (
        <option key={d} value={d}>
          {d}
          </option>
          ))}
          </select>
    </div>
    <div className="relative z-0 w-full mb-5 group">
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
  </div>
  <div className="grid md:grid-cols-2 md:gap-6">

    <div className="relative z-0 w-full mb-5 group">
    <button 
          id="dropdownSearchButton" onClick={handleSkillsDropDownToggle} data-dropdown-toggle="dropdownSearch" data-dropdown-placement="bottom" 
          className={`${isSkillsDropDownOpen ? 'bg-blue-600' : 'bg-gray-700' } w-full text-white justify-between focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-2.5 py-2.5 text-center inline-flex items-center bg-blue-600 hover:bg-blue-700 focus:ring-blue-800`} 
          type="button"
          >
              Select Skills for Badge
            <svg
              className="w-2.5 h-2.5 ms-3"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 10 6"
             >
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="m1 1 4 4 4-4"
            />
              </svg>
      </button>
    </div>
    <div className={`relative z-1 w-full mb-5 group ${isSkillsDropDownOpen ? '' : 'hidden' }`}>
<div id="dropdownSearch" className={`${isSkillsDropDownOpen ? '' : 'hidden' } z-1 absolute w-full rounded-lg shadow-sm w-60 bg-gray-700`}>
    <div className="p-3">
      <label htmlFor="input-group-search" className="sr-only">Search</label>
      <div className="relative">
        <div className="absolute inset-y-0 rtl:inset-r-0 start-0 flex items-center ps-3 pointer-events-none">
          <svg className="w-4 h-4 text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
          </svg>
        </div>
        <input type="text" id="input-group-search"  ref={dropDownInputRef} className="block w-full p-2 ps-10 text-sm bg-gray-600 border-gray-500 placeholder-gray-400 text-white focus:ring-blue-500 focus:border-blue-500" placeholder="Search Skill" />
      </div>
    </div>
    <ul className="h-48 px-3 pb-3 overflow-y-auto text-sm text-gray-200" aria-labelledby="dropdownSearchButton">
    {Array.isArray(skillsEarned) && skillsEarned.length > 0 ? (
                    skillsEarned.map((skill, index) => (
      <li key={index}>
        <div className="flex items-center ps-2 rounded-sm hover:bg-gray-600">
          <input id="checkbox-item-11"    
                      name="skillsEarned"
                      value={skill}
            checked={formData.skillsEarned.includes(skill)}
            onChange={handleChange}
                      type="checkbox" value={skill} className="w-4 h-4 text-blue-600 rounded-sm  ring-offset-gray-700 focus:ring-offset-gray-700 focus:ring-2 bg-gray-600 border-gray-500"/>
          <label htmlFor="checkbox-item-11" className="w-full py-2 ms-2 text-sm font-medium rounded-sm text-gray-300">{skill}</label>
        </div>
      </li>
                    ))
                  ) : (
                    <p className="text-gray-400">No data available.</p>
      )}
    </ul>
          <a
          className="flex items-center p-3 text-sm font-medium border-gray-600 bg-gray-700 hover:bg-gray-600 text-blue-500 hover:underline"
          >
          Add new Skill
          </a>
    </div>

  </div>
  </div>
  <div className="grid md:grid-cols-2 md:gap-6">

    <div className="relative z-0 w-full mb-5 group">
    <button 
          id="dropdownSearchButton" onClick={handleVerticalsDropDownToggle} data-dropdown-toggle="dropdownSearch" data-dropdown-placement="bottom" 
          className={`${isVerticalsDropDownOpen ? 'bg-blue-600' : 'bg-gray-700' } w-full text-white justify-between focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-2.5 py-2.5 text-center inline-flex items-center bg-blue-600 hover:bg-blue-700 focus:ring-blue-800`} 
          type="button"
          >
              Select a Vertical for Badge
            <svg
              className="w-2.5 h-2.5 ms-3"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 10 6"
             >
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="m1 1 4 4 4-4"
            />
              </svg>
      </button>
    </div>
    <div className={`relative z-1 w-full mb-5 group ${isVerticalsDropDownOpen ? '' : 'hidden' }`}>
<div id="dropdownSearch" className={`${isVerticalsDropDownOpen ? '' : 'hidden' } w-full z-4 absolute rounded-lg shadow-sm w-60 bg-gray-700`}>
    <div className="p-3">
      <label htmlFor="input-group-search" className="sr-only">Search</label>
      <div className="relative">
        <div className="absolute inset-y-0 rtl:inset-r-0 start-0 flex items-center ps-3 pointer-events-none">
          <svg className="w-4 h-4 text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
          </svg>
        </div>
        <input type="text" id="input-group-search"  ref={dropDownInputRef} className="block w-full p-2 ps-10 text-sm bg-gray-600 border-gray-500 placeholder-gray-400 text-white focus:ring-blue-500 focus:border-blue-500" placeholder="Search vertical"/>
      </div>
    </div>
    <ul className="h-48 px-3 pb-3 overflow-y-auto text-sm text-gray-200" aria-labelledby="dropdownSearchButton">

    {Array.isArray(verticals) && verticals.length > 0 ? (
                    verticals.map((vertical, index) => (
      <li key={index}>
        <div className="flex items-center ps-2 rounded-sm hover:bg-gray-600">
          <input id="checkbox-item-11" name="vertical" type="radio" value={vertical} 
                      checked={formData.vertical === vertical}
                      onChange={handleChange}
                      className="w-4 h-4 text-blue-600 rounded-sm  ring-offset-gray-700 focus:ring-offset-gray-700 focus:ring-2 bg-gray-600 border-gray-500"/>
          <label htmlFor="checkbox-item-11" className="w-full py-2 ms-2 text-sm font-medium rounded-sm text-gray-300">{vertical}</label>
        </div>
      </li>
                    ))
                  ) : (
                    <p className="text-gray-400">No data available.</p>
      )}
    </ul>
          <a
          className="flex items-center p-3 text-sm font-medium border-gray-600 bg-gray-700 hover:bg-gray-600 text-blue-500 hover:underline"
          >
          Add new Vertical
          </a>
    </div>

  </div>
  </div>
  <div className="grid md:grid-cols-1 pb-2.5 md:gap-6">
      {preview ? (
        <div className="flex flex-col items-center justify-center w-full h-full rounded-lg bg-gray-700 border-gray-600">
          <img src={preview} alt="Preview" className="w-full h-full object-cover p-2.5 rounded-lg" />
        <button 
        type="button" 
        onClick={handleRemoveFile}
        className="focus:outline-none text-white bg-red-700 hover:bg-red-800 focus:ring-4 focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-900">
            Remove Image
          </button>
        </div>
      ) : (
        <label
          htmlFor="dropzone-file"
          className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-gray-700 border-gray-600 hover:border-gray-500 hover:bg-gray-600"
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <svg
              className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 20 16"
            >
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
              />
            </svg>
            <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
              <span className="font-semibold">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">SVG, PNG, JPG or GIF (MAX. 800x400px)</p>
          </div>
          <input
            id="dropzone-file"
            type="file"
            name="image"
            value=""
            className="hidden"
            accept="image/*"
            onChange={handleChange}
          />
        </label>
      )}
  </div>

          <button
          type="submit"
          className="text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-800 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center"
          >
          Submit
          </button>
</form>
          </div>
  );
}

export default BadgeCreationForm;
