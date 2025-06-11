"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { toast } from "react-toastify";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eye, EyeClosed, Check, Edit, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { Marquee } from "@/components/magicui/marquee";


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
    setFormData({ ...formData, badges: user.badges})

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

  const selectedBadge = allBadges.find(
    (badge) => badge.id == selectedBadgeId
  );

  // Check if selected badge is the latest (first in userData.badges)
  const isLatestBadge = userData.badges.length > 0 && selectedBadgeId === userData.badges[0].badgeId;


const ReviewCard = ({
  name
}) => {
  return (
    <figure
      className={cn(
        "relative h-full w-max cursor-pointer overflow-hidden rounded-xl border p-4",
        // light styles
        "border-gray-950/[.1] bg-gray-950/[.01] hover:bg-gray-950/[.05]",
        // dark styles
        "dark:border-gray-50/[.1] dark:bg-gray-50/[.10] dark:hover:bg-gray-50/[.15]",
      )}
    >
      <div className="flex flex-row items-center gap-2">
        <div className="flex flex-col">
          <figcaption className="text-sm font-medium dark:text-white">
            {name}
          </figcaption>
        </div>
      </div>
    </figure>
  );
};

function MarqueeDemo({ skills }) {
const firstRow = skills.slice(0, skills.length / 2);
const secondRow = skills.slice(skills.length / 2);
  return (
    <div className="relative flex w-full flex-col items-center justify-center overflow-hidden">
      <Marquee pauseOnHover className="[--duration:20s]">
        {firstRow.map((skill, i) => (
          <ReviewCard key={i} name={skill} />
        ))}
      </Marquee>
      <Marquee reverse pauseOnHover className="[--duration:20s]">
        {secondRow.map((skill, i) => (
          <ReviewCard key={i} name={skill} />
        ))}
      </Marquee>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-background"></div>
      <div className="pointer-events-none absolute inset-y-0 right-0 w-1/4 bg-gradient-to-l from-background"></div>
    </div>
  );
}

  const BadgeDescription = ({ badge }) => (
    <div className="space-y-2 text-white">
      <h2 className="text-2xl font-bold">
        <div className="text-[#38C8F8] text-3xl uppercase">{badge.name}</div>
        <div className="text-gray-400 text-sm">{badge.description}</div>
      </h2>
    </div>
  );

const BadgeMetrics = ({ badge }) => (
  <div className="w-full justify-between mt-4 text-center text-green-300 flex md:flex-col items-center gap-2">
    {/* Row: Level & Earners side by side */}
      {/* Level */}
      <div className="flex flex-col items-center p-2 shadow-md rounded-md bg-black/60">
  <svg width="32px" height="32px" viewBox="0 0 512.00 512.00" xmlns="http://www.w3.org/2000/svg" fill="#8cbfde" stroke="#8cbfde" stroke-width="26.624000000000002"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round" stroke="#05ffee" stroke-width="23.552"><path fill="#000000" d="M255 471L91.7 387V41h328.6v346zm-147.3-93.74L255 453l149.3-75.76V57H107.7v320.26zm146.43-65.76l98.27-49.89v-49.9l-98.14 49.82-94.66-48.69v50zm.13 32.66l-94.66-48.69v50l94.54 48.62 98.27-49.89v-49.9z"></path></g><g id="SVGRepo_iconCarrier"><path fill="#000000" d="M255 471L91.7 387V41h328.6v346zm-147.3-93.74L255 453l149.3-75.76V57H107.7v320.26zm146.43-65.76l98.27-49.89v-49.9l-98.14 49.82-94.66-48.69v50zm.13 32.66l-94.66-48.69v50l94.54 48.62 98.27-49.89v-49.9z"></path></g></svg>
        <div className="text-lg text-white hover:text-[#38C8F8] font-semibold">{badge.level || 'N/A'}</div>
      </div>

      {/* Earners */}
      <div className="flex flex-col items-center p-2 shadow-md rounded-md bg-black/60">
  <svg width="32px" height="32px" viewBox="0 0 512.00 512.00" xmlns="http://www.w3.org/2000/svg" fill="#8cbfde" stroke="#8cbfde" stroke-width="26.624000000000002"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round" stroke="#05ffee" stroke-width="23.552"><path fill="#000000" d="M255 471L91.7 387V41h328.6v346zm-147.3-93.74L255 453l149.3-75.76V57H107.7v320.26zm146.43-65.76l98.27-49.89v-49.9l-98.14 49.82-94.66-48.69v50zm.13 32.66l-94.66-48.69v50l94.54 48.62 98.27-49.89v-49.9z"></path></g><g id="SVGRepo_iconCarrier"><path fill="#000000" d="M255 471L91.7 387V41h328.6v346zm-147.3-93.74L255 453l149.3-75.76V57H107.7v320.26zm146.43-65.76l98.27-49.89v-49.9l-98.14 49.82-94.66-48.69v50zm.13 32.66l-94.66-48.69v50l94.54 48.62 98.27-49.89v-49.9z"></path></g></svg>
        <div className="text-lg text-white hover:text-[#38C8F8] font-semibold">43</div>
      </div>

    {/* Row: Vertical full-width below */}
    <div className="flex flex-col items-center p-2 shadow-md rounded-md bg-black/60">
  <svg width="32px" height="32px" viewBox="0 0 512.00 512.00" xmlns="http://www.w3.org/2000/svg" fill="#8cbfde" stroke="#8cbfde" stroke-width="26.624000000000002"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round" stroke="#05ffee" stroke-width="23.552"><path fill="#000000" d="M255 471L91.7 387V41h328.6v346zm-147.3-93.74L255 453l149.3-75.76V57H107.7v320.26zm146.43-65.76l98.27-49.89v-49.9l-98.14 49.82-94.66-48.69v50zm.13 32.66l-94.66-48.69v50l94.54 48.62 98.27-49.89v-49.9z"></path></g><g id="SVGRepo_iconCarrier"><path fill="#000000" d="M255 471L91.7 387V41h328.6v346zm-147.3-93.74L255 453l149.3-75.76V57H107.7v320.26zm146.43-65.76l98.27-49.89v-49.9l-98.14 49.82-94.66-48.69v50zm.13 32.66l-94.66-48.69v50l94.54 48.62 98.27-49.89v-49.9z"></path></g></svg>
      <div className="text-lg text-white hover:text-[#38C8F8] font-semibold">{badge.vertical || 'General'}</div>
    </div>
  </div>
);



  return (
    <>
      <Navbar />
      <main className="bg-[#00011E] text-white min-h-screen px-4 py-6 md:px-8">
        <div className="w-full h-full mx-auto grid md:grid-cols-5 gap-6">
          <aside className="md:col-span-1 p-4 rounded-2xl bg-white/5 backdrop-blur-lg border border-white/10 shadow-lg text-center">
          {/* Profile Picture */}
          <div className="border-4 border-[#0c0e3c] rounded-full w-max h-28 mx-auto overflow-hidden mb-4">
            <img
              src={process.env.SERVER_URL + userData.image}
              alt="User's Profile picture"
              className="object-cover w-full h-full"
            />
          </div>

          {/* User Info */}
          <h2 className="text-lg font-bold text-white">
            {userData.firstName} {userData.lastName}
          </h2>
          <p className="text-sm text-gray-400 mt-1">{userData.email}</p>

          {/* Edit Button */}
          <Button
            onClick={() => handleUpdateProfileModal(true)}
            className="bg-gray-500 px-2.5 my-2 py-1 h-max text-blue-100 hover:text-black hover:bg-blue-500"
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>

          {/* My Badges Section */}
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-gray-300 mb-2">My Badges</h3>
            <div className="flex flex-row flex-wrap gap-2 justify-center">
              {userData.badges?.length > 0 ? (
                userData.badges.map((badge, i) => (
                  <img
                    key={i}
                    src={process.env.SERVER_URL + `/badge/images/${badge.badgeId}`}
                    alt={badge.badgeId}
                    className={`w-12 h-12 rounded-full border-2 cursor-pointer transition ${
                      selectedBadgeId === badge.badgeId
                        ? "border-purple-500"
                        : "border-white/10"
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
        </aside>


          {/* Main Content */}
          <section className="md:col-span-4 grid gap-6">
            <div className="grid md:grid-cols-2 md:gap-6">
              {/* Achievements */}
              <div className="relative p-4 rounded-2xl bg-white/5 backdrop-blur-lg border border-white/10 shadow-lg w-full mb-5">
                <h3 className="text-xl font-semibold text-white border-b border-gray-700 pb-2 mb-4 flex items-center gap-2">
                  🏆 Achievements
                </h3>
                {userData.achievements.length > 0 ? (
                  <ol className="list-none pl-5 space-y-2 text-sm md:text-base text-gray-300">
                    {userData.achievements.map((a, i) => (
                      <li
                        key={i}
                        className="bg-[#0c0e3c] text-blue-100 text-xs font-semibold px-2.5 py-1 rounded border border-blue-400/10"
                      >
                        {a}
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="text-gray-400 text-sm">You haven’t earned any Achievements yet.</p>
                )}
              </div>

              {/* Courses */}
              <div className="relative p-4 rounded-2xl bg-white/5 backdrop-blur-lg border border-white/10 shadow-lg w-full mb-5">
                <h3 className="text-xl font-semibold text-white border-b border-gray-700 pb-2 mb-4 flex items-center gap-2">
                  📚 Courses
                </h3>

                {userData.courses.length > 0 ? (
                  <ul className="list-none pl-5 space-y-2 text-sm md:text-base text-gray-300">
                    {userData.courses.map((c, i) => (
                      <li
                        key={i}
                        className="bg-[#0c0e3c] text-blue-100 text-xs font-semibold px-2.5 py-1 rounded border border-blue-400/10"
                      >
                        {c}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-400 text-sm">You haven’t done any courses yet.</p>
                )}
              </div>
            </div>

            {/* Badge Details */}
            <div className="p-6 rounded-2xl shadow-md">
            {selectedBadge ? (
              <>
        <div className="max-w-4xl mx-auto  background:blur-md rounded-lg p-6 shadow-lg border ">
          <div className="flex flex-col md:flex-row md:space-x-8">
            {/* Left side: Image + Metrics */}
            <div className="flex-shrink-0 mb-6 md:mb-0 md:w-1/3">
              <img
                crossOrigin="anonymous"
                src={`${process.env.SERVER_URL}/badge/images/${selectedBadge?.id}` || selectedBadge.image?.data}
                alt={selectedBadge.name}
                className="w-48 h-48 object-contain rounded-full border border-[#38C8F8] shadow-md mx-auto"
              />
              <div className="mt-4">
                <BadgeMetrics badge={selectedBadge} />
              </div>
            </div>

            {/* Right side (or full stack on mobile): Description & Skills */}
            <div className="flex flex-col flex-grow justify-evenly gap-4 md:w-2/3">
              {/* On mobile, description appears after image + metrics naturally */}
              <BadgeDescription badge={selectedBadge} />
              <div className="grid md:grid-cols-1 md:gap-6">
              <MarqueeDemo skills={selectedBadge.skillsEarned} />
              </div>
  { /* <BadgeSkillsList skills={badge.skillsEarned} /> */}
              {/* Passing Criteria */}
              <div className="flex space-x-2">
              <div className=" w-full mb-5 group bg-black/60 border border-[#38C8F8] rounded-md p-4 shadow text-sm text-white hover:text-[#38C8F8]">
                <strong className='relative z-10 text-gray-500 hover:text-white start-0 translate-x-1/4 text-blue-500 scale-700 translate-y-0 scale-75 '>Passing Criteria:</strong> has scored at least 70% in their assessment and completed all mandatory tasks to earn this badge.
              </div>
              <div className="relative z-0 w-2/5 mb-5 group bg-black/60 border border-[#38C8F8] rounded-md p-4 shadow text-sm text-white hover:text-[#38C8F8]">
                <strong className='text-gray-500 hover:text-white'>Course name:</strong> {selectedBadge.course}
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
    <div className="relative p-4 w-full max-w-lg max-h-full">
        <div className="relative bg-[#00011E] rounded-lg shadow-sm dark:bg-gray-700">
            <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t dark:border-gray-600 border-gray-200">
                <h3 className="text-lg font-semibold text-white-900 dark:text-white">
                    Update Profile
                </h3>
                <button type="button" onClick={() => handleUpdateProfileModal(false)} className="text-gray-400 bg-transparent hover:text-white rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white" data-modal-toggle="crud-modal">
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
                        <div className="flex flex-row mx-4">
                            <label htmlFor="dropzone-file" className=" flex flex-row text-blue-100 bg-blue-600 hover:bg-blue-700  focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-xs px-3 py-1.5 focus:outline-none dark:focus:ring-blue-800">
      <Upload className="mr-2 h-4 w-4" />
      <span>Upload </span>
      </label>
                  <input
                    id="dropzone-file"
                    type="file"
                    name="profileImage"
                    className="hidden"
                    accept="image/*"
                    onChange={handleFormChange}
                  />
                        </div>
                    </div>
                    <div className="space-y-2 col-span-2">
      <Label htmlFor="disabled">Email</Label>
      <Input id="disabled" disabled placeholder={userData.email} />
                    </div>
                    <div className="flex justify-between space-x-2 space-y-2 ">
                    <div className="relative z-0 w-full group col-span-1">
                        <Label htmlFor="firstName" >First Name</Label>
                        <Input type="text" value={formData.firstName} onChange={handleFormChange} name="firstName" id="firstName"  placeholder={userData.firstName} />
                    </div>
                    <div className="relative z-0 w-full group col-span-1">
                        <Label htmlFor="lastName" >Last Name</Label>
                        <Input type="text" value={formData.lastName} onChange={handleFormChange} name="lastName" id="lastName"   placeholder={userData.lastName}  />
                    </div>
                </div>
                    <div className="space-y-2 col-span-2">
                        <Label htmlFor="password" >Your password</Label>
                        <Input value={formData.password} type="password" onChange={handleFormChange} name="password" id="password" placeholder="••••••••" /> 
                    </div>

                    <div className="space-y-2 col-span-2">
                        <Label htmlFor="password">New password</Label>
                        <Input value={formData.newPassword} type="password" onChange={handleFormChange} name="newPassword" id="newPassword" placeholder="••••••••" />
                    </div>

                    <div className="space-y-2 col-span-2">
                    { formData.badges.length > 0 ? (
                      <>
                      <Label htmlFor="visible-badges" className="text-gray-500 mb-2" ><i>*Check Badges you want visible by other users </i></Label>
                      <div id="visible-badges" className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        { formData.badges.map((b, i) => (
                          <span key={i} className="space-x-2 flex justify-space-between" >
                          { b.isPublic ? ( 
                            <Button className="h-4 w-4 bg-blue-800 hover:bg-blue-600"
                          id={b.badgeId} name="badges" value={b.badgeId} 
                          checked={ b.isPublic === true} 
                          type="button" onClick={handleFormChange} >
                            <Eye className="h-4 w-4 text-blue-100" /> 
                            </Button>
                          ) : ( 
                            <Button className="h-4 w-4"
                          id={b.badgeId} name="badges" value={b.badgeId} 
                          checked={ b.isPublic === true} 
                          type="button" onClick={handleFormChange} >
                            <EyeClosed className="h-4 w-4" />
                            </Button>
                          )}
                          <Label htmlFor={b.badgeId}>{allBadges.find(a => a.id == b.badgeId ).name}</Label>
                          </span>
                          ))}
                      </div>
                      </>
                    ) : (null )}
                    </div>
                </div>
                    <Button type="submit" className="bg-gray-500 px-2.5 h-max text-blue-100 hover:text-black-800 hover:bg-blue-500"><Check className="mr-2 h-4 w-4" />Confirm</Button>
            </form>
        </div>
    </div>
</div>
    ) : ( null )}
      <Footer />
    </>
  );
}
