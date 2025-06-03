import React, { useEffect, useState, useRef } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import SearchDropdown from "@/components/adminBadgeForm/SearchDropdown";
import IdInput from "@/components/adminBadgeForm/IdInput";
import NameInput from "@/components/adminBadgeForm/NameInput";
import DescriptionTextArea from "@/components/adminBadgeForm/DescriptionTextArea";
import LevelRadio from "@/components/adminBadgeForm/LevelRadio";
import { ScrollArea } from "@/components/ui/scroll-area";

function BadgeCreationForm () {
  const [searchResults, setSearchResults] = useState([]); // Initialize as an empty array
  const [selectedBadge, setSelectedBadge] = useState(null);
  const [isLevelsDropDownOpen, setIsLevelsDropDownOpen] = useState(false);
  const [isCoursesDropDownOpen, setIsCoursesDropDownOpen] = useState(false);
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
    level: 'Amateur',
    vertical: '',
    skillsEarned: [],
    image: null,
  });

  const fetchBadges = async () => {
    const badgesRes = await axios.get(`${process.env.SERVER_URL}/badges`);
    setSearchResults(badgesRes.data.badges);
  }

  useEffect(() => {
    fetchBadges();
  }, []);

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

  const [newLevelModalOpen, setNewLevelModalOpen] = useState(false);
  const handleNewLevelModalToggle = () => {
    setNewLevelModalOpen(!newLevelModalOpen);
  };

  const [newCoursesModalOpen, setNewCoursesModalOpen] = useState(false);
  const handleNewCoursesModalToggle = () => {
    setNewCoursesModalOpen(!newCoursesModalOpen); // Correct variable
  };

  // Utility function to close all dropdowns
  const closeAllDropdowns = () => {
    setIsLevelsDropDownOpen(false);
    setIsSkillsDropDownOpen(false);
    setIsVerticalsDropDownOpen(false);
    setIsCoursesDropDownOpen(false);
  };

  // Unified toggle handlers
  const handleLevelsDropDownToggle = () => {
    const nextState = !isLevelsDropDownOpen;
    closeAllDropdowns();
    setIsLevelsDropDownOpen(nextState);
  };

  const handleSkillsDropDownToggle = () => {
    const nextState = !isSkillsDropDownOpen;
    closeAllDropdowns();
    setIsSkillsDropDownOpen(nextState);
  };

  const handleVerticalsDropDownToggle = () => {
    const nextState = !isVerticalsDropDownOpen;
    closeAllDropdowns();
    setIsVerticalsDropDownOpen(nextState);
  };

  const handleCoursesDropDownToggle = () => {
    const nextState = !isCoursesDropDownOpen;
    closeAllDropdowns();
    setIsCoursesDropDownOpen(nextState);
  };

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
      console.log(name, value, type, checked);
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
    let toastId;

    if (!formData.image) {
      toast.info('Please select a file to upload.');
      return;
    }

    try {
      let response; 
      if (!selectedBadge){
        toastId = toast.loading("Creating Badge...");
        response = await axios.post(apiUrl, formDataObject, {
          headers: {
            'Content-Type': 'multipart/form-data', // Set the content type
            Authorization: `Bearer ${token}`, // Add the token to the headers
          },
        });
      } else {
        toastId = toast.loading("Modifying Badge...");
        response = await axios.put(apiUrl, formDataObject, {
          headers: {
            'Content-Type': 'multipart/form-data', // Set the content type
            Authorization: `Bearer ${token}`, // Add the token to the headers
          },
        });
      }
  

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
      toast.update(toastId,{
        isLoading: false, 
        render:response.data.message,
        type: "success",
        autoClose: 5000, 
      });
      await fetchBadges();

    } catch (error) {
      toast.update(toastId,{
        isLoading: false, 
        render: 'Something went wrong!',
        type: "error",
        autoClose: 5000, 
      });

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

const updateBadgeDetails = (email, updatedBadge) => {
  setUsers(prev =>
    prev.map(user => (user.email === email ? updatedUser : user))
  );
};

useEffect(() => {
  if (selectedBadge) {
    const badgeImageUrl = `${process.env.SERVER_URL}/badge/images/${selectedBadge.id}`;

    setFormData({
      id: selectedBadge.id || '',
      name: selectedBadge.name || '',
      desc: selectedBadge.description || '',
      level: selectedBadge.level || 'Amateur',
      vertical: selectedBadge.vertical || '',
      skillsEarned: selectedBadge.skillsEarned || [],
      image: selectedBadge.image || null,
    });

    // Always show preview from badge ID
    setPreview(badgeImageUrl);
  } else {
    setFormData({
      id: '', 
      name: '', 
      desc: '', 
      level: 'Amateur', 
      vertical: '', 
      skillsEarned: '', 
      image: '', 
    });
    setPreview('');
  }
}, [selectedBadge]);


  return (
    <div className='w-full'>
      <form onSubmit={handleBadgeFormSubmit} className="flex flex-col w-full mx-auto">
      <div className="flex flex-col md:flex-row">
        {/* Left: Badges List */}
        <div className="relative z-0 w-full mb-5 group md:w-1/3 mx-4 bg-slate-800/60 rounded-lg p-2 border border-gray-700">
          <h2 className="text-white font-semibold mb-2">Badges List </h2>
         <div className="flow-root">
          <ScrollArea className="h-[350px] pr-2 overflow-y-auto">
        <ul role="list" className="divide-y divide-gray-700">
    {Array.isArray(searchResults) && searchResults.length > 0 ? (
      searchResults.map((badge , index) => (
        <li>
                <div onClick={() => setSelectedBadge(badge)} className="flex items-center">
                    <div className="shrink-0">
                        <img 
                        className="w-8 h-8 rounded-full" 
                        src={`${process.env.SERVER_URL}/badge/images/${badge.id}` || badge.img?.data} 
                        alt={badge.name}
                        />
                    </div>
                    <div className="flex-1 min-w-0 ms-4">
                        <p className="text-sm font-medium truncate text-white">
                            {badge.name}
                        </p>
                        <p className="text-sm truncate text-gray-400">
                            {badge.vertical}
                        </p>
                    </div>
                    <div className="focus:ring-4 focus:outline-none focus:ring-gray-300 font-medium rounded-lg text-sm px-2.5 py-2.5 text-center me-2 mb-2 text-gray-400 ">
                      {badge.level}
                    </div>
                </div>
            </li>
      ))) : (
        <p className="text-gray-400">No data available.</p>
      )}
        </ul>
          </ScrollArea>
     <div className="relative end-6 bottom-6 group">
        <button type="button" onClick={() => setSelectedBadge(null)} className="flex items-center justify-center text-white rounded-full w-10 h-10 rtl bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-800 absolute bottom-0 right-0">
            <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 18 18">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 1v16M1 9h16"/>
            </svg>
            <span className="sr-only">Open actions menu</span>
        </button>
    </div>
   </div>
      </div>
        <div className="w-full md:w-1/3 mx-4">
          {/* Badge Id */}
          <div className="grid md:grid-cols-2 md:gap-6">
            <div className="relative z-0 w-full mb-5 group">
              <IdInput
                formData={formData}
                handleChange={handleChange}
              />
            </div>
            {/* Badge Name */}
            <div className="relative z-0 w-full mb-5 group">
              <NameInput
                formData={formData}
                handleChange={handleChange}
              />
            </div>
          </div>

          <div className="relative z-0 w-full mb-5 group">
            {/* Badge Description */}
            <DescriptionTextArea
                formData={formData}
                handleChange={handleChange}
              />
          </div>
          <div className="relative z-0 w-full mb-5 group">
            {/* Badge Levels */}
    <LevelRadio 
    formData={formData} 
    handleChange={handleChange}
    />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-1 space-y-4">
            {/* Skills */}
            <div className="grid md:grid-cols-2 md:gap-6">
              <div className="relative z-0 w-full mb-2.5 md:mb-5 group">
                <button
                  id="dropLeveldownSearchButton"
                  data-dropdown-toggle="dropdownSearch"
                  data-dropdown-placement="bottom"
                  onClick={handleSkillsDropDownToggle}
                  className={`${isSkillsDropDownOpen ? 'bg-blue-600' : 'bg-gray-700' } w-full text-white justify-between focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-2.5 py-2.5 text-center inline-flex items-center bg-blue-600 hover:bg-blue-700 focus:ring-blue-800`}
                  type="button"
                >
                  Select Skills
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
                      d={isSkillsDropDownOpen ? "M9 5 5 1 1 5" : "m1 1 4 4 4-4"} />
                  </svg>
                </button>

                <div
                  id="dropdownSearch"
                  className={`w-full mb-5 group ${isSkillsDropDownOpen ? '' : 'hidden'} z-4 absolute rounded-lg shadow-sm bg-gray-700`}
                >
                  <SearchDropdown
                    //levelsList={['Noob','Amateur', 'Intermediate','Expert','Professional','Specialist']} // You must pass this prop for level options
                    skillsEarned={skillsEarned}
                    formData={formData}
                    handleChange={handleChange}
                    isSkillsDropdown // Optional prop to let SearchDropdown know which mode it's in
                  />
                  <a
                    onClick={handleNewSkillModalToggle}
                    className="flex items-center p-3 text-sm font-medium border-gray-600 bg-gray-700 hover:bg-gray-600 text-blue-500 hover:underline"
                  >
                    Add new Skill
                  </a>
                </div>
              </div>
              <div className="relative z-0 w-full md:mb-5 group">
                <button id="dropdownSearchButton" data-dropdown-toggle="dropdownSearch" data-dropdown-placement="bottom" 
                  onClick={handleVerticalsDropDownToggle} 
                  className={`${isVerticalsDropDownOpen ? 'bg-blue-600' : 'bg-gray-700' } w-full text-white justify-between focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-2.5 py-2.5 text-center inline-flex items-center bg-blue-600 hover:bg-blue-700 focus:ring-blue-800`} 
                  type="button"
                  >
                    Select a Vertical
                      <svg className="w-2.5 h-2.5 ms-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6" >
                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
    d={isVerticalsDropDownOpen ? "M9 5 5 1 1 5" : "m1 1 4 4 4-4"} />
                      </svg>
                </button>

                <div id="dropdownSearch" className={`${isVerticalsDropDownOpen ? '' : 'hidden' } mb-5 group w-full z-4 absolute rounded-lg shadow-sm w-60 bg-gray-700`}>
                  <SearchDropdown  
                  skillsEarned={verticals} 
                  formData={formData} 
                  handleChange={handleChange}
                  type={'vertical'}
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

            {/* Courses */}
            <div className="grid md:grid-cols-2 md:gap-6">
              <div className={`relative z-1 w-full mb-5 group ${isCoursesDropDownOpen ? '' : 'hidden'}`}>
                <div
                  id="dropdownSearch"
                  className={`w-full z-4 absolute rounded-lg shadow-sm bg-gray-700`}
                >
                  <SearchDropdown
                    //levelsList={['Noob','Amateur', 'Intermediate','Expert','Professional','Specialist']} // You must pass this prop for level options
                    formData={formData}
                    handleChange={handleChange}
                    isCourseDropdown // Optional prop to let SearchDropdown know which mode it's in
                  />
                  <a
                    onClick={handleNewCoursesModalToggle}
                    className="flex items-center p-3 text-sm font-medium border-gray-600 bg-gray-700 hover:bg-gray-600 text-blue-500 hover:underline"
                  >
                    Add new Course
                  </a>
                </div>
              </div>
            </div>
            
            {/* Vertical */}
            <div className="grid md:grid-cols-2 md:gap-6">

              <div className="relative z-0 w-full mb-5 group">
                <button
                  id="dropLeveldownSearchButton"
                  data-dropdown-toggle="dropdownSearch"
                  data-dropdown-placement="bottom"
                  onClick={handleCoursesDropDownToggle}
                  className={`${isCoursesDropDownOpen ? 'bg-blue-600' : 'bg-gray-700'} z-0 w-full text-white justify-between focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-2.5 py-2.5 text-center inline-flex items-center hover:bg-blue-700 focus:ring-blue-800`}
                  type="button"
                >
                  Select Course
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

            </div>
          </div>
        </div>

        <div className="w-full md:w-1/3 mx-4">
          <div className="grid md:grid-cols-1 pb-2.5 md:gap-6">
              {preview ? (
                <div className="flex flex-col items-center justify-center w-full max-h-[400px] rounded-lg bg-gray-700 border-gray-600">
                <img className="rounded-full w-60 h-60" src={preview}  alt="badge-image-preview"/>

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
        Create new {newVerticalModalOpen ? 'vertical' : 'skill'}
      </button>
      <div className="text-sm font-medium text-gray-400">
        <i>
          *NOTE: new {newVerticalModalOpen ? 'vertical' : 'skill'} is not added to the database unless the badge is created successfully.
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
