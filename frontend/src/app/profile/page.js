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
import { BoxReveal } from "@/components/magicui/box-reveal";
import { ScrollArea } from "@/components/ui/scroll-area";
import Link from "next/link";

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
      </h2>
        <div className="text-gray-400 font-mono text-xs">{badge.description}</div>
    </div>
  );

const BadgeMetrics = ({ badge }) => (
  <div className="w-full justify-between mt-4 text-center text-green-300 flex md:flex-col items-center gap-2">
    {/* Row: Level & Earners side by side */}
      {/* Level */}
      <div className="flex items-center justify-between rounded-md ">
      <div className="flex flex-col items-center p-2 shadow-md rounded-md ">
  <svg width="32px" height="32px" viewBox="0 0 512.00 512.00" xmlns="http://www.w3.org/2000/svg" fill="#8cbfde" stroke="#8cbfde" stroke-width="26.624000000000002"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round" stroke="#05ffee" stroke-width="23.552"><path fill="#000000" d="M255 471L91.7 387V41h328.6v346zm-147.3-93.74L255 453l149.3-75.76V57H107.7v320.26zm146.43-65.76l98.27-49.89v-49.9l-98.14 49.82-94.66-48.69v50zm.13 32.66l-94.66-48.69v50l94.54 48.62 98.27-49.89v-49.9z"></path></g><g id="SVGRepo_iconCarrier"><path fill="#000000" d="M255 471L91.7 387V41h328.6v346zm-147.3-93.74L255 453l149.3-75.76V57H107.7v320.26zm146.43-65.76l98.27-49.89v-49.9l-98.14 49.82-94.66-48.69v50zm.13 32.66l-94.66-48.69v50l94.54 48.62 98.27-49.89v-49.9z"></path></g></svg>
        <div className="text-lg text-white hover:text-[#38C8F8] font-semibold">{badge.level || 'N/A'}</div>
      </div>

      {/* Earners */}
      <div className="flex flex-col items-center p-2 shadow-md rounded-md ">
  <svg width="32px" height="32px" viewBox="0 0 24 24" fill="#8cbfde" stroke="#8cbfde" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path opacity="0.4" d="M17.9981 7.16C17.9381 7.15 17.8681 7.15 17.8081 7.16C16.4281 7.11 15.3281 5.98 15.3281 4.58C15.3281 3.15 16.4781 2 17.9081 2C19.3381 2 20.4881 3.16 20.4881 4.58C20.4781 5.98 19.3781 7.11 17.9981 7.16Z" stroke="#292D32" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path> <path opacity="0.4" d="M16.9675 14.4402C18.3375 14.6702 19.8475 14.4302 20.9075 13.7202C22.3175 12.7802 22.3175 11.2402 20.9075 10.3002C19.8375 9.59016 18.3075 9.35016 16.9375 9.59016" stroke="#292D32" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path> <path opacity="0.4" d="M5.96656 7.16C6.02656 7.15 6.09656 7.15 6.15656 7.16C7.53656 7.11 8.63656 5.98 8.63656 4.58C8.63656 3.15 7.48656 2 6.05656 2C4.62656 2 3.47656 3.16 3.47656 4.58C3.48656 5.98 4.58656 7.11 5.96656 7.16Z" stroke="#292D32" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path> <path opacity="0.4" d="M6.9975 14.4402C5.6275 14.6702 4.1175 14.4302 3.0575 13.7202C1.6475 12.7802 1.6475 11.2402 3.0575 10.3002C4.1275 9.59016 5.6575 9.35016 7.0275 9.59016" stroke="#292D32" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path> <path d="M12.0001 14.6302C11.9401 14.6202 11.8701 14.6202 11.8101 14.6302C10.4301 14.5802 9.33008 13.4502 9.33008 12.0502C9.33008 10.6202 10.4801 9.47021 11.9101 9.47021C13.3401 9.47021 14.4901 10.6302 14.4901 12.0502C14.4801 13.4502 13.3801 14.5902 12.0001 14.6302Z" stroke="#292D32" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path> <path d="M9.0907 17.7804C7.6807 18.7204 7.6807 20.2603 9.0907 21.2003C10.6907 22.2703 13.3107 22.2703 14.9107 21.2003C16.3207 20.2603 16.3207 18.7204 14.9107 17.7804C13.3207 16.7204 10.6907 16.7204 9.0907 17.7804Z" stroke="#292D32" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path> </g></svg>
        <div className="text-lg text-white hover:text-[#38C8F8] font-semibold">43</div>
      </div>
      </div>

    {/* Row: Vertical full-width below */}
    <div className="flex flex-col items-center p-2 shadow-md rounded-md ">
  <svg width="32px" height="32px" fill="#8cbfde" viewBox="0 0 32 32"xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><defs></defs><title>parent-child</title><path d="M28,12a2,2,0,0,0,2-2V4a2,2,0,0,0-2-2H4A2,2,0,0,0,2,4v6a2,2,0,0,0,2,2H15v4H9a2,2,0,0,0-2,2v4H4a2,2,0,0,0-2,2v4a2,2,0,0,0,2,2h8a2,2,0,0,0,2-2V24a2,2,0,0,0-2-2H9V18H23v4H20a2,2,0,0,0-2,2v4a2,2,0,0,0,2,2h8a2,2,0,0,0,2-2V24a2,2,0,0,0-2-2H25V18a2,2,0,0,0-2-2H17V12ZM12,28H4V24h8Zm16,0H20V24h8ZM4,4H28v6H4Z"></path><rect id="_Transparent_Rectangle_" data-name="&lt;Transparent Rectangle&gt;" fill="none" width="32" height="32"></rect></g></svg>
      <div className="text-lg text-white hover:text-[#38C8F8] font-semibold">{badge.vertical || 'General'}</div>
    </div>
  </div>
);



  return (
    <>
      <Navbar />
      <main className="bg-[#00011E] text-white min-h-screen px-4 py-6 md:px-8">
        <div className=" w-full h-full mx-auto grid md:grid-cols-5 gap-6">
          {/* Sidebar */}
          <aside className="relative p-2.5 bg-white/5 backdrop-blur-lg border border-white/10 shadow-lg px-3 py-2 text-white transition-shadow duration-300 ease-in-out hover:shadow-[0_0_10px_3px_rgba(0,178,255,0.8)] rounded-lg z-0 w-full mb-5 group md:col-span-1 p-4 text-center ">
            <div className="border-4 border-[#0c0e3c]  rounded-full w-max h-28 mx-auto overflow-hidden mb-4">
              { userData.image ? (
              <img
                src={ process.env.SERVER_URL + userData.image}
                alt="User's Profile picture"
                className="object-cover w-full h-full"
              />
              ) : (
                <div className="w-25 h-25 rounded-full overflow-hidden cursor-pointer transition-all hover:ring-2 hover:ring-blue-400">
                  <div className="w-full h-full bg-blue-500 text-white flex items-center justify-center text-4xl font-bold">
                {userData.firstName.slice(0,1).toUpperCase()}
                {userData.lastName.slice(0,1).toUpperCase()}
                  </div>
                </div>
              )}
            </div>
            <h2 className="text-lg font-bold">
              {userData.firstName} {userData.lastName}
            </h2>
            <p className="text-sm text-gray-400 mt-1">{userData.email}</p>
    <Button onClick={() => handleUpdateProfileModal(true)} className="bg-gray-500 px-2.5 my-2 py-1 h-max text-blue-100 hover:text-black-800 hover:bg-blue-500"><Edit className="mr-2 h-4 w-4" />Edit</Button>

            <div className="mt-6">
              <h3 className="text-sm font-semibold text-gray-300 mb-2">
                My Badges
              </h3>
              <div className="flex flex-row flex-wrap space-x-2 justify-between space-y-4">
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

          </aside>

          {/* Main Content */}
          <section className="md:col-span-4 grid gap-6">
    <div className="grid md:grid-cols-2 md:gap-6">
            {/* Achievements */}
            <div className="relative p-2.5 bg-white/5 backdrop-blur-lg border border-white/10 shadow-lg px-3 py-2 text-white transition-shadow duration-300 ease-in-out hover:shadow-[0_0_10px_3px_rgba(0,178,255,0.8)] rounded-lg z-0 w-full mb-5 group">
              <h3 className="text-xl font-semibold mb-4">Achievements</h3>
    <ScrollArea className="h-[150px] pr-2 overflow-y-auto">
              { userData.achievements.length > 0 ? (
              <ol className="list-none pl-5 space-y-2 text-sm md:text-base text-gray-300">
                { userData.achievements.map((a, i) => (
                <li key={i} className="bg-white/5 backdrop-blur-lg  text-blue-100 text-xs font-semibold px-2.5 py-0.5 rounded" >
                  <BoxReveal duration="0.9"> 
                  <span className="flex">
                  <svg className="w-5 h-5 mx-2" fill="#ffe852" viewBox="0 0 512 512" data-name="Layer 1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" stroke="oklch(70.7% .165 254.624)"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><title></title><path d="M432.33,129.92a7.93,7.93,0,0,0-5.65-2.34h-38.1A359.67,359.67,0,0,0,392,77.74a8,8,0,0,0-8-8H128a8,8,0,0,0-8,8,360,360,0,0,0,3.43,49.86H85.32a8,8,0,0,0-8,8c0,26.33,9.85,51.85,28.49,73.81,17.38,20.48,41.63,37,70.22,47.86,12.67,14.91,27.08,26.39,42.8,33.54-1.57,47.84-24.13,82.8-31.32,92.77h-6.67a18,18,0,0,0-18,18v22.68a18,18,0,0,0,18,18H331.18a18,18,0,0,0,18-18V401.58a18,18,0,0,0-18-18h-6.57c-7.23-10.4-29.79-46.43-31.42-92.78,15.72-7.15,30.13-18.63,42.8-33.54,28.59-10.88,52.84-27.39,70.22-47.86,18.62-22,28.47-47.48,28.47-73.8v0A7.94,7.94,0,0,0,432.33,129.92ZM93.69,143.6h32.37c6.25,33.08,17.12,63,31.54,87.53C120.19,210.25,96.79,178.6,93.69,143.6Zm239.49,258v22.68a2,2,0,0,1-2,2H180.84a2,2,0,0,1-2-2V401.58a2,2,0,0,1,2-2H331.18A2,2,0,0,1,333.18,401.58Zm-126.4-18a189.48,189.48,0,0,0,27.81-87.21,85.93,85.93,0,0,0,42.86,0c2.51,39.13,18,70.56,28.08,87.22ZM282.2,278.09a71.43,71.43,0,0,1-52.39,0c-25.78-10-49.36-34.92-66.39-70.22-16.68-34.56-26.29-77.64-27.32-122.12H375.92c-1,44.48-10.64,87.56-27.32,122.12C331.57,243.16,308,268.1,282.2,278.09Zm72.22-47c14.43-24.56,25.3-54.46,31.54-87.54h32.36C415.22,178.57,391.83,210.23,354.42,231.12Z"></path></g></svg>
                    {a}
                  </span>
                  </BoxReveal> 
                </li>
              ))}
              </ol>
              ) : (
              <p>
                  You haven’t earned any Achievements yet.
                </p>
              )}
          </ScrollArea >
            </div>

            {/* Courses */}
            <div className="relative p-2.5 bg-white/5 backdrop-blur-lg border border-white/10 shadow-lg px-3 py-2 text-white transition-shadow duration-300 ease-in-out hover:shadow-[0_0_10px_3px_rgba(0,178,255,0.8)] rounded-lg z-0 w-full mb-5 group">
              <h3 className="text-xl font-semibold mb-4">Courses</h3>
    <ScrollArea className="h-[150px] pr-2 overflow-y-auto">
    {userData.courses.length > 0 ? (
               <ul className="list-none pl-5 space-y-2 text-sm md:text-base text-gray-300">
      {userData.courses.map((c,i) => (
                <li key={i} className="bg-white/5 backdrop-blur-lg  text-blue-100 text-xs font-semibold px-2.5 py-0.5 rounded" >
                  <BoxReveal duration="0.9"> 
                  <span className="flex">
        <svg className="h-5 w-5 mx-2" fill="#8dff85" viewBox="0 0 1920 1920" xmlns="http://www.w3.org/2000/svg" stroke="#8dff85"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M1801.441 0v1920H219.03v-439.216h-56.514c-31.196 0-56.515-25.299-56.515-56.47 0-31.172 25.319-56.47 56.515-56.47h56.514V1029.02h-56.514c-31.196 0-56.515-25.3-56.515-56.471 0-31.172 25.319-56.47 56.515-56.47h56.514V577.254h-56.514c-31.196 0-56.515-25.299-56.515-56.47 0-31.172 25.319-56.471 56.515-56.471h56.514V0h1582.412Zm-113.03 112.941H332.06v351.373h56.515c31.196 0 56.514 25.299 56.514 56.47 0 31.172-25.318 56.47-56.514 56.47H332.06v338.824h56.515c31.196 0 56.514 25.3 56.514 56.471 0 31.172-25.318 56.47-56.514 56.47H332.06v338.824h56.515c31.196 0 56.514 25.299 56.514 56.47 0 31.172-25.318 56.471-56.514 56.471H332.06v326.275h1356.353V112.94ZM640.289 425.201H1388.9v112.94H640.288v-112.94Zm0 214.83h639.439v112.94h-639.44v-112.94Zm0 534.845H1388.9v112.94H640.288v-112.94Zm0 214.83h639.439v112.94h-639.44v-112.94Z" fill-rule="evenodd"></path> </g></svg>
                    {c}
                  </span>
                  </BoxReveal> 
                </li>
      ))}
              </ul>
    ): (
              <p>
                  You haven’t Done any courses yet.
                </p>
    )}
          </ScrollArea >
            </div>
    </div>

            {/* Badge Details */}
            <div className="rounded-2xl shadow-md">
            {selectedBadge ? (
              <>
        <div className="relative  p-2.5 bg-[url('/0.png')] backdrop-blur-lg border border-white/10 shadow-lg text-white transition-shadow duration-300 ease-in-out hover:shadow-[0_0_10px_3px_rgba(0,178,255,0.8)] rounded-lg z-0 w-full mb-5 group">
          <div className="flex px-3 flex-col md:flex-row md:space-x-8 glass">
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
              <Link href={`/badges/${selectedBadge?.id}`} >
              <BadgeDescription badge={selectedBadge} />
              </Link>
              <div className="grid md:grid-cols-1 md:gap-6">
              <MarqueeDemo skills={selectedBadge.skillsEarned} />
              </div>
  { /* <BadgeSkillsList skills={badge.skillsEarned} /> */}
              {/* Passing Criteria */}
              <div className="flex space-x-2 ">
              <div className="relative w-full z-0 mb-5 group bg-black/60 border rounded-md p-4 shadow text-sm text-white hover:text-[#38C8F8]">
                <strong className='block text-gray-500 hover:text-white border border-0 border-r border-l  rounded-lg -mt-7 bg-black w-max px-2.5'>Passing Criteria</strong> Scored at least 70% in their assessment and completed all mandatory tasks to earn this badge.
              </div>
              <div className="relative z-0 w-2/5 mb-5 group bg-black/60 border  rounded-md p-4 shadow text-sm text-white hover:text-[#38C8F8]">
                <strong className='block text-gray-500 hover:text-white border border-0 border-r border-l rounded-lg -mt-7 bg-black w-max px-2.5'>Course</strong> {selectedBadge.course}
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
