'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { CheckCircle, Shield } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { cn } from "@/lib/utils";
import { Marquee } from "@/components/magicui/marquee";

const reviews = [
  {
    name: "Jack",
    username: "@jack",
    body: "I've never seen anything like this before. It's amazing. I love it.",
    img: "https://avatar.vercel.sh/jack",
  },
  {
    name: "Jill",
    username: "@jill",
    body: "I don't know what to say. I'm speechless. This is amazing.",
    img: "https://avatar.vercel.sh/jill",
  },
  {
    name: "John",
    username: "@john",
    body: "I'm at a loss for words. This is amazing. I love it.",
    img: "https://avatar.vercel.sh/john",
  },
  {
    name: "Jane",
    username: "@jane",
    body: "I'm at a loss for words. This is amazing. I love it.",
    img: "https://avatar.vercel.sh/jane",
  },
  {
    name: "Jenny",
    username: "@jenny",
    body: "I'm at a loss for words. This is amazing. I love it.",
    img: "https://avatar.vercel.sh/jenny",
  },
  {
    name: "James",
    username: "@james",
    body: "I'm at a loss for words. This is amazing. I love it.",
    img: "https://avatar.vercel.sh/james",
  },
];

const SharedBadgePage = () => {
  const { id, username, timestamp } = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [badge, setBadge] = useState(null);
  const [allBadges, setAllBadges] = useState([]);

  const [verificationStatus, setVerificationStatus] = useState(null);
  const [user, setUser] = useState('');
  const [error, setError] = useState('');

  const truncateText = (text, maxLength) => {
  if (text === null || text === undefined) {
    return '';
  }
  if (text.length > maxLength) {
    return text.substring(0, maxLength) + '...';
  }
  return text;
};

  useEffect(() => {
    const fetchBadgeData = async () => {
      try {
        const badgeRes = await axios.get(`${process.env.SERVER_URL}/badge/${id}`);
        setBadge(badgeRes.data);
        const allBadgesRes = await axios.get(`${process.env.SERVER_URL}/badges`);
        setAllBadges(allBadgesRes.data);


        try {
          const verifyRes = await axios.get(
            `${process.env.SERVER_URL}/verify-badge/${id}/${username}/${timestamp}`
          );
          setVerificationStatus(verifyRes.data.verified);
          setUser(`${verifyRes.data.firstName} ${verifyRes.data.lastName}`);
        } catch {
          setVerificationStatus(false);
        }
      } catch (err) {
        setError('Failed to load badge information. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBadgeData();
  }, [id, username, timestamp]);


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
  
  const formatDate = (ts) => {
    const date = new Date(parseInt(ts) * 1000);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (isLoading || !badge) {
    return (
      <div className="min-h-screen flex flex-col bg-black text-white">
        <Navbar />
        <div className="flex-grow flex flex-col items-center justify-center">
          <div className="loader border-8 border-t-8 border-[#38C8F8] h-16 w-16 animate-spin rounded-full mb-4" />
          <p className="text-white text-lg">Loading Badge Gallery...</p>
        </div>
      </div>
    );
  }

  const BadgeDescription = ({ badge }) => (
    <div className="space-y-2 text-white">
      <h2 className="text-2xl font-bold">
        <div className="text-[#38C8F8] text-3xl uppercase">{user}</div>
        <div className="text-gray-400 ">{badge.name}</div>
      </h2>
    </div>
  );

const BadgeSkillsList = ({ skills }) => (
  <div>
    <h3 className="text-gray-500 hover:text-[#38C8F8] font-semibold mb-2 transition-colors duration-200">Skills Earned</h3>
    {skills && skills.length > 0 ? (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {skills.map((skill, idx) => (
          <div
            key={idx}
            title={skill}
            className="bg-black/60 text-white border border-[#38C8F8] rounded-md px-3 py-2 text-sm shadow-md transition-all duration-200 
                       hover:border-cyan-400 hover:text-[#38C8F8] hover:shadow-[0_0_8px_2px_#38C8F8]"
          >
            {skill}
          </div>
        ))}
      </div>
    ) : (
      <div className="text-sm text-gray-400 italic">No skills listed.</div>
    )}
  </div>
);

const BadgeMetrics = ({ badge }) => (
  <div className="w-full mt-4 text-center text-green-300 flex md:flex-col justify-around items-center gap-2">
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
    <div className="min-h-screen flex flex-col bg-blue-800 text-white font-sans selection:bg-[#38C8F8] selection:text-black">
      <Navbar />
      <div className="mt-4 px-4 mx-auto text-lg text-green-400">
        {verificationStatus ? (
          <p>
            <CheckCircle className="inline-block w-4 h-4 mr-1 align-text-bottom" />
            This badge was <strong>verified</strong> and awarded to {user} on {formatDate(timestamp)}.
          </p>
        ) : (
          <p>
            <Shield className="inline-block w-4 h-4 mr-1 align-text-bottom text-red-500" />
            <span className="text-red-400">
              This badge is <strong>not verified</strong>.
            </span>
          </p>
        )}
      </div>
      <main className="container mx-auto px-4 py-6 flex-grow">
        {error && (
          <div className="bg-red-900 text-red-400 p-4 mb-4 rounded-md border border-red-600">
            {error}
          </div>
        )}
{/* bg-gradient-to-b from-[#1E3A8A] to-[#00011E] or from-[#03001e] via-[#7303c0] via-[#ec38bc] to-[#fdeff9]*/}
<div className="max-w-4xl mx-auto relative rounded-lg shadow-lg border border-[#38C8F8]">
  <div className="absolute inset-0 bg-[url('/0.png')] bg-cover bg-center rounded-lg filter brightness-70"></div>
  <div className="relative glass p-6">
              {/* Authorized Byline */}
              <div className="text-xs text-gray-400 italic text-right pr-1">
                Authorized and issued by {/* <span className="text-[#38C8F8] not-italic">DeepCytes.</span> */}
                <img
                  src="https://static.wixstatic.com/media/e48a18_c949f6282e6a4c8e9568f40916a0c704~mv2.png/v1/crop/x_0,y_151,w_1920,h_746/fill/w_203,h_79,fp_0.50_0.50,q_85,usm_0.66_1.00_0.01,enc_auto/For%20Dark%20Theme.png"
                  alt="Authorized Badge"
                  className="ml-auto w-20 mb-2 mr-1"
                />
              </div>
          <div className="flex flex-col md:flex-row md:space-x-8">
            {/* Left side: Image + Metrics */}
            <div className="flex-shrink-0 mb-2 md:mb-0 md:w-1/3">
              <img
                crossOrigin="anonymous"
                src={`${process.env.SERVER_URL}/badge/images/${badge?.id}` || badge.image?.data}
                alt={badge.name}
                className="w-48 h-48 object-contain rounded-full border border-[#38C8F8] shadow-md mx-auto"
              />
              <div className="mt-4">
                <BadgeMetrics badge={badge} />
              </div>
            </div>

            {/* Right side (or full stack on mobile): Description & Skills */}
            <div className="flex flex-col justify-around flex-grow gap-4 md:w-2/3">
              {/* On mobile, description appears after image + metrics naturally */}
              <BadgeDescription badge={badge} />
              <div className="grid md:grid-cols-1 md:gap-6">
  <MarqueeDemo skills={badge.skillsEarned} />
              </div>
  { /* <BadgeSkillsList skills={badge.skillsEarned} /> */}
              {/* Passing Criteria */}
              <div className="flex space-x-2 ">
              <div className="relative w-full z-0 mb-5 group bg-black/60 border rounded-md p-4 shadow text-sm text-white hover:text-[#38C8F8]">
                <strong className='block text-gray-500 hover:text-white -mt-7 bg-black w-max px-2.5'>Passing Criteria</strong> Scored at least 70% in their assessment and completed all mandatory tasks to earn this badge.
              </div>
              <div className="relative z-0 w-2/5 mb-5 group bg-black/60 border  rounded-md p-4 shadow text-sm text-white hover:text-[#38C8F8]">
                <strong className='block text-gray-500 hover:text-white -mt-7 bg-black w-max px-2.5'>Course</strong> {badge.course}
              </div>
              </div>
            </div>
          </div>
        </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SharedBadgePage;
