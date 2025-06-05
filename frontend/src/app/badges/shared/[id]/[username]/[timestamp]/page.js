'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { CheckCircle, Shield } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';

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
        <span className="text-[#38C8F8]">{badge.name}</span> -{" "}
        <span className="text-gray-400 text-3xl uppercase">{user}</span>
      </h2>
      <p className="italic text-gray-500 hover:text-[#38C8F8]">Course: {badge.course}</p>
      <p className='text-white hover:text-[#38C8F8]'>{truncateText(badge.description,200)}</p>
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
  <div className="w-full mt-4 text-center text-green-300 flex flex-col gap-2">
    {/* Row: Level & Earners side by side */}
    <div className="flex gap-2">
      {/* Level */}
      <div className="flex-1 p-2 shadow-md border border-[#38C8F8] rounded-md bg-black/60">
        <div className="text-sm uppercase text-gray-500 hover:text-[#38C8F8]">Level</div>
        <div className="text-lg text-white hover:text-[#38C8F8] font-semibold">{badge.level || 'N/A'}</div>
      </div>

      {/* Earners */}
      <div className="flex-1 p-2 shadow-md border border-[#38C8F8] rounded-md bg-black/60">
        <div className="text-sm uppercase text-gray-500 hover:text-[#38C8F8]">Earners</div>
        <div className="text-lg text-white hover:text-[#38C8F8] font-semibold">43</div>
      </div>
    </div>

    {/* Row: Vertical full-width below */}
    <div className="p-2 shadow-md border border-[#38C8F8] rounded-md bg-black/60">
      <div className="text-sm uppercase text-gray-500 hover:text-[#38C8F8]">Vertical</div>
      <div className="text-lg text-white hover:text-[#38C8F8] font-semibold">{badge.vertical || 'General'}</div>
    </div>
  </div>
);

  return (
    <div className="min-h-screen flex flex-col bg-black text-white font-sans selection:bg-[#38C8F8] selection:text-black">
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
{/* bg-gradient-to-b from-[#1E3A8A] to-[#00011E] */}
        <div className="max-w-4xl mx-auto  background:blur-md rounded-lg p-6 shadow-lg border border-[#38C8F8]">
          <div className="flex flex-col md:flex-row md:space-x-8">
            {/* Left side: Image + Metrics */}
            <div className="flex-shrink-0 mb-6 md:mb-0 md:w-1/3">
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
            <div className="flex flex-col flex-grow gap-4 md:w-2/3">
              {/* On mobile, description appears after image + metrics naturally */}
              <BadgeDescription badge={badge} />
              <BadgeSkillsList skills={badge.skillsEarned} />
              {/* Passing Criteria */}
              <div className="bg-black/60 border border-[#38C8F8] rounded-md p-4 shadow text-sm text-white hover:text-[#38C8F8]">
                <strong className='text-gray-500 hover:text-white'>Passing Criteria:</strong> has scored at least 70% in their assessment and completed all mandatory tasks to earn this badge.
              </div>
              {/* Authorized Byline */}
              <div className="text-xs text-gray-400 italic text-right pr-1">
                <img
                  src="https://static.wixstatic.com/media/e48a18_c949f6282e6a4c8e9568f40916a0c704~mv2.png/v1/crop/x_0,y_151,w_1920,h_746/fill/w_203,h_79,fp_0.50_0.50,q_85,usm_0.66_1.00_0.01,enc_auto/For%20Dark%20Theme.png"
                  alt="Authorized Badge"
                  className="ml-auto w-20 mb-2 mr-1"
                />
                Authorized and issued by <span className="text-[#38C8F8] not-italic">DeepCytes.</span>
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