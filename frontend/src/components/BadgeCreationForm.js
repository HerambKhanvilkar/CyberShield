import React, { useEffect, useState, useRef } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import SearchDropdown from "@/components/adminBadgeForm/SearchDropdown";
import IdInput from "@/components/adminBadgeForm/IdInput";
import NameInput from "@/components/adminBadgeForm/NameInput";
import DescriptionTextArea from "@/components/adminBadgeForm/DescriptionTextArea";
import LevelSelect from "@/components/adminBadgeForm/LevelSelect";

function BadgeCreationForm () {

  const [isSkillsDropDownOpen, setIsSkillsDropDownOpen] = useState(false);
  const [isVerticalsDropDownOpen, setIsVerticalsDropDownOpen] = useState(false);
  const [skillsEarned, setSkillsEarned] = useState([]);
  const [verticals, setVerticals] = useState([]);
  const dropDownInputRef = useRef(null);
  const [preview, setPreview] = useState('');
  const [newSkill, setNewSkill] = useState('');
  const [newVertical, setNewVertical] = useState('');
  const [newSkillModalOpen, setNewSkillModalOpen] = useState(false);
  const [newVerticalModalOpen, setNewVerticalModalOpen] = useState(false);

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
      // drop down closing code
    } else {
      // Handle other inputs
      setFormData({ ...formData, [name]: value });
    }

    if (type !== 'checkbox' && type !== 'radio'){
      isSkillsDropDownOpen 
        ? handleSkillsDropDownToggle()
        : null
      isVerticalsDropDownOpen
        ? handleVerticalsDropDownToggle()
        : null
    }
  };

  const handleRemoveFile = () => {
    setFormData({ ...formData, image: null });
    setPreview('');
  };

  function convertToFormData(jsonObject) {
  const form = new FormData();

  for (const key in jsonObject) {
    if (Object.hasOwnProperty.call(jsonObject, key)) {
      console.log("key", key);
      console.log("jsonObject[key]", jsonObject[key]);
      form.append(key, jsonObject[key]);
    }
  }

  return formData;
}
  
  const handleBadgeFormSubmit = async (e) => {
      e.preventDefault();
    console.log('Form Data:', formData);
    const formDataObject = convertToFormData(formData);
    console.log('Form Data:', formDataObject);
    const apiUrl = process.env.SERVER_URL + '/badge/import';
    const token = localStorage.getItem("accessToken");

    if (!formData.image) {
      toast.info('Please select a file to upload.');
      return;
    }

    try {
      const response = await axios.post(apiUrl, formDataObject, {
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
        file: null,
      })
      setPreview('');
      toast.success(response.data.message); // Success message
    } catch (error) {
      if (response.status === 400){
        toast.error(response.data); // Error message
      }
      console.error('There was a problem with the upload operation:', error);
    }
  }

const handleNewVerticalChange = (e) => {
  setNewVertical(e.target.value);
};

const handleNewSkillChange = (e) => {
  setNewSkill(e.target.value);
};

const handleAddNewVertical = (e) => {
  if (newVertical.trim() !== '') {
    setVerticals([...verticals, newVertical.trim()]);
    setNewVertical('');
    handleNewVerticalModalToggle();
  }
};

const handleAddNewSkill = (e) => {
  if (newSkill.trim() !== '') {
    setSkillsEarned([...skillsEarned, newSkill.trim()]);
    setNewSkill('');
    handleNewSkillModalToggle();
  }
};

const handleNewVerticalModalToggle = () => {
  setNewVerticalModalOpen(!newVerticalModalOpen);
};

const handleNewSkillModalToggle = () => {
  setNewSkillModalOpen(!newSkillModalOpen);
};

  return (
          <div className='w-full'>
            <form onSubmit={handleBadgeFormSubmit} className="flex flex-col w-4/5 mx-auto">
            <div className="flex flex-row">
              <div className="w-1/2 mr-2">
                <div className="grid md:grid-cols-2 md:gap-6">
                  <div className="relative z-0 w-full mb-5 group">
                    <IdInput
                      formData={formData}
                      handleChange={handleChange}
                    />
                  </div>

                  <div className="relative z-0 w-full mb-5 group">
                    <NameInput
                      formData={formData}
                      handleChange={handleChange}
                    />
                  </div>
                </div>

                <div className="relative z-0 w-full mb-5 group">
                  <DescriptionTextArea
                      formData={formData}
                      handleChange={handleChange}
                    />
                </div>

                <div className="grid md:grid-cols-2 md:gap-6">
                  <div className="relative z-0 w-full mb-5 group">
                    <LevelSelect
                        formData={formData}
                        handleChange={handleChange}
                      />
                  </div>

                  <div className="hidden relative z-0 w-full mb-5 group">
                    <label htmlFor="difficulty" className="block mb-2 text-sm font-medium text-white">Select badge difficulty </label>
                    <select id="difficulty" className="border text-sm rounded-lg block w-full p-2.5 bg-gray-700 border-gray-600 placeholder-gray-400 text-white focus:ring-blue-500 focus:border-blue-500">
                      { ['Easy', 'Medium', 'Hard', 'Expert', 'Extreme'].map(d => ( <option key={d} value={d}> {d} </option>))}
                    </select>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 md:gap-6">
                  <div className="relative z-0 w-full mb-5 group">
                    <button id="dropSkilldownSearchButton" 
                      data-dropdown-toggle="dropdownSearch" data-dropdown-placement="bottom" 
                      onClick={handleSkillsDropDownToggle} 
                      className={`${isSkillsDropDownOpen ? 'bg-blue-600' : 'bg-gray-700' } w-full text-white justify-between focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-2.5 py-2.5 text-center inline-flex items-center bg-blue-600 hover:bg-blue-700 focus:ring-blue-800`} 
                      type="button"
                      >
                        Select Skills for Badge
                        <svg className="w-2.5 h-2.5 ms-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6" >
                          <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4" />
                        </svg>
                    </button>
                  </div>

                  <div className={`relative z-1 w-full mb-5 group ${isSkillsDropDownOpen ? '' : 'hidden' }`}>
                    <div id="dropdownSearch" className={`${isSkillsDropDownOpen ? '' : 'hidden' } w-full z-4 absolute rounded-lg shadow-sm w-60 bg-gray-700`}>
                      <SearchDropdown  
                        skillsEarned={skillsEarned} 
                        formData={formData} 
                        handleChange={handleChange}
                      />
                      <a
                        onClick={handleNewSkillModalToggle}
                        className="flex items-center p-3 text-sm font-medium border-gray-600 bg-gray-700 hover:bg-gray-600 text-blue-500 hover:underline"
                      >
                        Add new Skill
                      </a>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 md:gap-6">
                  <div className="relative z-0 w-full mb-5 group">
                    <button id="dropdownSearchButton" data-dropdown-toggle="dropdownSearch" data-dropdown-placement="bottom" 
                      onClick={handleVerticalsDropDownToggle} 
                      className={`${isVerticalsDropDownOpen ? 'bg-blue-600' : 'bg-gray-700' } w-full text-white justify-between focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-2.5 py-2.5 text-center inline-flex items-center bg-blue-600 hover:bg-blue-700 focus:ring-blue-800`} 
                      type="button"
                      >
                        Select a Vertical for Badge
                          <svg className="w-2.5 h-2.5 ms-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6" >
                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4" />
                          </svg>
                    </button>
                  </div>

                  <div className={`relative z-1 w-full mb-5 group ${isVerticalsDropDownOpen ? '' : 'hidden' }`}>
                    <div id="dropdownSearch" className={`${isVerticalsDropDownOpen ? '' : 'hidden' } w-full z-4 absolute rounded-lg shadow-sm w-60 bg-gray-700`}>
                      <SearchDropdown  
                      skillsEarned={verticals} 
                      formData={formData} 
                      handleChange={handleChange}
                      />
                      <a
                    onClick={handleNewVerticalModalToggle}
                      className="flex items-center p-3 text-sm font-medium border-gray-600 bg-gray-700 hover:bg-gray-600 text-blue-500 hover:underline"
                      >
                      Add new Vertical
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              <div className="w-1/2 ml-2">
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
                          className="hidden"
                          accept="image/*"
                          onChange={handleChange}
                        />
                      </label>
                    )}
                    <button
                      type="submit"
                      className="text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-800 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center"
                      >
                      Submit
                    </button>
                </div>
              </div>
            </div>

          
</form>
    { ( newSkillModalOpen || newVerticalModalOpen ) ? (
<div
  id="new-modal"
  tabIndex="-1"
  className=" bg-gray-900/50  backdrop-blur-md overflow-y-auto overflow-x-hidden fixed top-0 right-0 left-0 z-50 flex justify-center items-center w-full md:inset-0 max-h-full "
>
  <div className="relative p-4 w-full max-w-md max-h-full">
    <div className="relative bg-gray-800 rounded-lg shadow-sm">
      <div className="flex items-center justify-between p-4 md:p-5 border-b border-gray-600 rounded-t">
        <h3 className="text-xl font-semibold text-white">
          Add new { newVerticalModalOpen ? 'Vertical' : 'Skill' }
        </h3>
        <button
          onClick={newVerticalModalOpen ? handleNewVerticalModalToggle : handleNewSkillModalToggle}
          type="button"
          className="text-gray-400 bg-transparent hover:bg-gray-700 hover:text-white rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center"
          data-modal-hide="authentication-modal"
        >
          <svg
            className="w-3 h-3"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 14 14"
          >
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"
            />
          </svg>
          <span className="sr-only">Close modal</span>
        </button>
      </div>
      <div className="p-4 space-y-4 md:p-5">
        <div>
          <input
            type="text"
            onChange={newVerticalModalOpen ? handleNewVerticalChange : handleNewSkillChange}
            name="text"
            id="text"
            className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
            placeholder={`new ${newVerticalModalOpen ? 'vertcal' : 'skill'}`}
            required
          />
        </div>
        <button
          type="submit"
          onClick={newVerticalModalOpen ? handleAddNewVertical : handleAddNewSkill}
          className="w-full text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
        >
          Create new {newVerticalModalOpen ? 'vertcal' : 'skill'}
        </button>
        <div className="text-sm font-medium text-gray-400">
          <i>
            *NOTE: new {newVerticalModalOpen ? 'vertcal' : 'skill'} is not added to the database unless the badge is created successfully.
          </i>
        </div>
      </div>
    </div>
  </div>
</div>
  ): ( null )}
          </div>
  );
}

export default BadgeCreationForm;
