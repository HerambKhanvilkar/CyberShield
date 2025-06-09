"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { toast } from "react-toastify";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";


export default function ProfilePage() {
  const [userData, setUserData] = useState(null);
  const [allBadges, setAllBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profileUpdateModal, setProfileUpdateModal] = useState(false);
  const [selectedBadgeId, setSelectedBadgeId] = useState(null);
  const [preview, setPreview] = useState(null);
   const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    password: '',
    newPassword: '',
     profileImage: null,
    badges: []
  });

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
  
async function handlePreviewResize(image){
  const imagePreviewForm = convertToFormData({ image });
  const apiUrl = process.env.SERVER_URL + '/preview/image';
  const token = localStorage.getItem("accessToken");
  const toastId = toast.loading("Preparing preview...");
  try {
    const response = await axios.post(apiUrl, imagePreviewForm, {
      headers: {
        'Content-Type': 'multipart/form-data', // Set the content type
        Authorization: `Bearer ${token}`, // Add the token to the headers
      },
    });
    toast.update(toastId,{
      isLoading: false, 
      render:"Image ready for preview",
      type: "success",
      autoClose: 5000, 
    });

    return response.data;
  } catch (error) {
    console.error("Something went wrong... ");
    toast.update(toastId,{
      isLoading: false, 
      render:response.data.message,
      type: "error",
      autoClose: 5000, 
    });
  }
}

  function handleUpdateProfileModal(status){
    setProfileUpdateModal(status);
  }

//   useEffect(() => {
//   }, [preview]);

  async function handleFormChange(e) {
    const { name, value, type, checked } = e.target;
    if (type === 'file'){
      setFormData({ ...formData, [name]: e.target.files[0] });
      const fileReader = new FileReader();
      fileReader.onloadend = () => {
        console.log("updating Picture ...");
        setPreview(fileReader.result); // Set the preview to the file's data URL
      };
      // const result = await handlePreviewResize(e.target.files[0]);
      // fileReader.readAsDataURL(result); // Read the file as a data URL
      fileReader.readAsDataURL(e.target.files[0]); // Read the file as a data URL
    } else if (type === 'button') {
      // Handle checkbox input
      setFormData((prevData) => {
        const updatedBadges = prevData.badges.map((badge) => {
          if (badge.badgeId === value) {
            // Toggle the isPublic attribute
            return { ...badge, isPublic: !badge.isPublic };
          }
          return badge; // Return the badge unchanged if it doesn't match
        });

        return {
          ...prevData,
          badges: updatedBadges,
        };
      });
    } else {
      // Handle other inputs
      console.log(name, value);
      setFormData({ ...formData, [name]: value });
    }
  }

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

  async function handleProfileUpdate(e){
      e.preventDefault();
    console.log('Form Data:', formData);
    const formDataObject = convertToFormData(formData);
    console.log('Form Data:', formDataObject);
    const apiUrl = process.env.SERVER_URL + '/user/profile';
    const token = localStorage.getItem("accessToken");
    let toastId;

    try {
        toastId = toast.loading("Updating Profile...");
        const response = await axios.put(apiUrl, formDataObject, {
          headers: {
            'Content-Type': 'multipart/form-data', // Set the content type
            Authorization: `Bearer ${token}`, // Add the token to the headers
          },
        });

      setProfileUpdateModal(false);
      await fetchUser();
      toast.update(toastId,{
        isLoading: false, 
        render:response.data.message,
        type: "success",
        autoClose: 5000, 
      });
    } catch (e) {
      toast.update(toastId,{
        isLoading: false, 
        render:response.data.message,
        type: "error",
        autoClose: 5000, 
      });
      console.log(e);
    }
  }
const fetchUser = async () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) return toast.error("No token found!");

    const response = await axios.get(`${process.env.SERVER_URL}/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const user = response.data;

    // Fetch all badges
    const badgesRes = await axios.get(`${process.env.SERVER_URL}/badges`);
    setAllBadges(badgesRes.data.badges);

    // Create badgeMap by id (not badgeId)
    const badgeMap = {};
    allBadges.forEach((badge) => {
      badgeMap[badge.id] = badge;
    });

    // Enrich user badges
    const enrichedBadges = (user.badges || []).map((b) => ({
      ...badgeMap[b.badgeId],
      badgeId: b.badgeId,
      earnedDate: b.earnedDate,
    }));

    setUserData({ ...user, badges: enrichedBadges });
    setPreview(process.env.SERVER_URL + user.image);
    console.log("user", user);
    setFormData({ ...formData, firstName: user.firstName, lastName: user.lastName, badges: user.badges})

    // Set default selected badge to latest (first in list)
    if (enrichedBadges.length > 0) {
      setSelectedBadgeId(enrichedBadges[0].badgeId);

      //show all details of the first badge
      console.log("User badges enriched:", enrichedBadges);
    }

    setLoading(false);
  } catch (err) {
    console.error("Error fetching user data:", err);
    toast.error("Failed to load user data");
    setLoading(false);
  }
};

  useEffect(() => {

    fetchUser();
  }, []);

  if (loading || !userData) {
    return (
      <main className="bg-[#00011E] text-white min-h-screen flex items-center justify-center">
        <p>Loading profile...</p>
      </main>
    );
  }

  const selectedBadge = userData.badges.find(
    (badge) => badge.badgeId === selectedBadgeId
  );

  // Check if selected badge is the latest (first in userData.badges)
  const isLatestBadge = userData.badges.length > 0 && selectedBadgeId === userData.badges[0].badgeId;

  return (
    <>
      <Navbar />
      <main className="bg-[#00011E] text-white min-h-screen px-4 py-6 md:px-8">
        <div className="w-4/5 h-full mx-auto grid md:grid-cols-5 gap-6">
          {/* Sidebar */}
          <aside className="md:col-span-1 bg-[#0C0E3C] p-4 rounded-2xl text-center shadow-lg">
            <div className="border-4 border-purple-500 rounded-full w-28 h-28 mx-auto overflow-hidden mb-4">
              <img
                src={ process.env.SERVER_URL + userData.image}
                alt="User's Profile picture"
                className="object-cover w-full h-full"
              />
            </div>
            <h2 className="text-lg font-bold">
              {userData.firstName} {userData.lastName}
            </h2>
            <p className="text-sm text-gray-400 mt-1">{userData.email}</p>

            <div className="mt-6">
              <h3 className="text-sm font-semibold text-gray-300 mb-2">
                My Badges
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {userData.badges?.length > 0 ? (
                  userData.badges.map((badge, i) => (
                    <img
                      key={i}
                      src={process.env.SERVER_URL + `/badge/images/${badge.badgeId}`}
                      alt={badge.badgeId}
                      className={`w-12 h-12 rounded-full border-2 cursor-pointer ${
                        selectedBadgeId === badge.badgeId
                          ? "border-purple-500"
                          : "border-transparent"
                      }`}
                      onClick={() => setSelectedBadgeId(badge.badgeId)}
                      title={badge.name}
                    />
                  ))
                ) : (
                  <p className="text-gray-400 text-xs col-span-full">No badges</p>
                )}
              </div>
            </div>
    <button onClick={() => handleUpdateProfileModal(true)} data-modal-target="crud-modal" data-modal-toggle="crud-modal" className="block text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800" type="button">
    Update modal
    </button>

          </aside>

          {/* Main Content */}
          <section className="md:col-span-4 grid gap-6">
    <div className="grid md:grid-cols-2 md:gap-6">
            {/* Achievements */}
            <div className="relative z-0 w-full mb-5 group">
              <h3 className="text-xl font-semibold mb-4">Achievements</h3>
              { userData.achievements.length > 0 ? (
              <ol className="list-none pl-5 space-y-2 text-sm md:text-base text-gray-300">
                { userData.achievements.map((a, i) => (
                <li key={i} className="bg-[#0c0e3c] text-blue-100 text-xs font-semibold px-2.5 py-0.5 rounded" >{a}</li>
              ))}
              </ol>
              ) : (
              <p>
                  You haven’t earned any Achievements yet.
                </p>
              )}
            </div>

            {/* Courses */}
            <div className="relative z-0 w-full mb-5 group">
              <h3 className="text-xl font-semibold mb-4">Courses</h3>
    {userData.courses.length > 0 ? (
               <ul className="list-none pl-5 space-y-2 text-sm md:text-base text-gray-300">
      {userData.courses.map((c,i) => (
                <li key={i} className="bg-[#0c0e3c] text-blue-100 text-xs font-semibold px-2.5 py-0.5 rounded" >{c}</li>
      ))}
              </ul>
    ): (
              <p>
                  You haven’t Done any courses yet.
                </p>
    )}
            </div>
    </div>

            {/* Badge Details */}
            <div className="bg-[#0C0E3C] p-6 rounded-2xl shadow-md">
            {selectedBadge ? (
              <>
                <h3 className="text-xl font-semibold mb-4">
                  {isLatestBadge ? "Latest Badge" : "Badge Details"}
                </h3>
                <div className="grid md:grid-cols-3 gap-6 items-center">
                  <img
                    src={process.env.SERVER_URL + `/badge/images/${selectedBadge.badgeId}`}
                    alt={`Badge ${selectedBadge.badgeId}`}
                    className="w-24 h-24 mx-auto md:mx-0"
                  />
                  <div className="md:col-span-2 text-sm text-gray-300 space-y-2">
                    <p>
                      <span className="text-white font-semibold">Name:</span>{" "}
                      {selectedBadge.name}
                    </p>
                    <p>
                      <span className="text-white font-semibold">Description:</span>{" "}
                      {selectedBadge.description}
                    </p>
                    <div className="flex gap-6 mt-2">
                      <div>
                        <p className="text-white font-semibold">Earned</p>
                        <p>{new Date(selectedBadge.earnedDate).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-white font-semibold">Level</p>
                        <p>{selectedBadge.level}</p>
                      </div>
                      <div>
                        <p className="text-white  font-semibold">Skills Earned</p>
                        <div className="flex flex-wrap ">
                          {selectedBadge.skillsEarned?.map((skill, idx) => (
                            <span key={idx} className="bg-blue-300 text-blue-800 text-xs font-semibold px-2.5 py-0.5 m-1 rounded" >{skill}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center text-gray-300 space-y-4">
                <h3 className="text-xl font-semibold text-white">No Badges Yet</h3>
                <p>
                  You haven’t earned any badges yet. To start earning badges, click the
                  button below.
                </p>
                <button
                  onClick={() => window.open("https://learn.deepcytes.io/", "_blank")}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-300"
                >
                  Start Earning Badges
                </button>
              </div>
            )}
          </div>
          </section>
        </div>
      </main>

    { profileUpdateModal ? (
<div id="crud-modal" tabIndex="-1" aria-hidden="true" className={("") + " bg-gray-900/50  backdrop-blur-md overflow-y-auto overflow-x-hidden fixed top-0 right-0 left-0 z-50 flex justify-center items-center w-full md:inset-0 max-h-full" }>
    <div className="relative p-4 w-full max-w-md max-h-full">
        <div className="relative bg-[#00011E] rounded-lg shadow-sm dark:bg-gray-700">
            <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t dark:border-gray-600 border-gray-200">
                <h3 className="text-lg font-semibold text-white-900 dark:text-white">
                    Update Profile
                </h3>
                <button type="button" onClick={() => handleUpdateProfileModal(false)} className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white" data-modal-toggle="crud-modal">
                    <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/>
                    </svg>
                    <span className="sr-only">Close modal</span>
                </button>
            </div>
            <form className="p-4 md:p-5" onSubmit={handleProfileUpdate} >
                <div className="grid gap-4 mb-4 grid-cols-1">
                    <div className="flex flex-row items-center justify-space-evenly w-full col-span-2">
                        <a href="#">
                            <img className="rounded-full h-20 w-20" src={preview} alt="Profile Image"/>
                        </a>
                        <div>
                            <label htmlFor="dropzone-file" className="text-white bg-blue-600 hover:bg-blue-700  focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-xs px-3 py-1.5 focus:outline-none dark:focus:ring-blue-800">Change Picture
                  <input
                    id="dropzone-file"
                    type="file"
                    name="profileImage"
                    className="hidden"
                    accept="image/*"
                    onChange={handleFormChange}
                  />
      </label>
                        </div>
                    </div>
                    <div className="col-span-2">
                        <label htmlFor="name" className="block mb-2 text-sm font-medium text-gray-900 text-white">First Name</label>
                        <input type="text" value={formData.firstName} onChange={handleFormChange} name="firstName" id="firstName" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500" placeholder="Type first name" />
                    </div>
                    <div className="col-span-2">
                        <label htmlFor="name" className="block mb-2 text-sm font-medium text-gray-900 text-white">Last Name</label>
                        <input type="text" value={formData.lastName} onChange={handleFormChange} name="lastName" id="lastName" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500" placeholder="Type last name" />
                    </div>
                    <div>
                        <label htmlFor="password" className="block mb-2 text-sm font-medium text-gray-900 text-white">Your password</label>
                        <input value={formData.password} type="password" onChange={handleFormChange} name="password" id="password" placeholder="••••••••" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white" /> 
                    </div>

                    <div>
                        <label htmlFor="password" className="block mb-2 text-sm font-medium text-gray-900 text-white">New password</label>
                        <input value={formData.newPassword} type="password" onChange={handleFormChange} name="newPassword" id="newPassword" placeholder="••••••••" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white" />
                    </div>

                    <div className="col-span-2 flex flex-col" >
                    { formData.badges.length > 0 ? (
                      <>
                      <label htmlFor="visible-badges" className="text-blue-100" > Check Badges you want visible by other users </label>
                      <div id="visible-badges" className="flex flex-col items-start mx-5 space-y-2 space-x-2">
                        { formData.badges.map((b, i) => (
                          <span key={i} className="p-x-2.5 flex justify-space-between" >
                          <Checkbox id={b.badgeId} name="badges" value={b.badgeId} checked={b.isPublic === true} type="button" onClick={handleFormChange} />
                          <Label htmlFor={b.badgeId}>{allBadges.find(a => a.id == b.badgeId ).name}</Label>
                          </span>
                          ))}
                      </div>
                      </>
                    ) : (null )}
                    </div>
                </div>

                <button type="submit" className="text-white inline-flex items-center bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">
                    <svg className="me-1 -ms-1 w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd"></path></svg>
                    Update
                </button>
            </form>
        </div>
    </div>
</div>
    ) : ( null )}
      <Footer />
    </>
  );
}
