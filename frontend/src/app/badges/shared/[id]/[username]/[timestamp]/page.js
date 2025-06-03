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
      <div className="min-h-screen flex flex-col bg-black text-green-400">
        <Navbar />
        <div className="flex-grow flex flex-col items-center justify-center">
          <div className="loader border-8 border-t-8 border-green-700 h-16 w-16 animate-spin rounded-full mb-4" />
          <p className="text-green-500 text-lg">Loading Badge Gallery...</p>
        </div>
      </div>
    );
  }

  const BadgeDescription = ({ badge }) => (
    <div className="space-y-2 text-green-300">
      <h2 className="text-2xl font-bold">{badge.name}</h2>
      <p className="italic text-green-400">{badge.course}</p>
      <p>{truncateText(badge.description,200)}</p>
    </div>
  );

const BadgeSkillsList = ({ skills }) => (
  <div>
    <h3 className="text-green-400 font-semibold mb-2">Skills Earned</h3>
    {skills && skills.length > 0 ? (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {skills.slice(0, 8).map((skill, idx) => (
        <div
          key={idx}
          title={skill}
          className="bg-black/60 text-green-300 border border-green-700 rounded-md px-3 py-2 text-sm shadow-md hover:shadow-lg transition-all duration-200"
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
      <div className="flex-1 p-2 shadow-md border border-green-700 rounded-md bg-black/60">
        <div className="text-sm uppercase text-green-400">Level</div>
        <div className="text-lg font-semibold">{badge.level || 'N/A'}</div>
      </div>

      {/* Earners */}
      <div className="flex-1 p-2 shadow-md border border-green-700 rounded-md bg-black/60">
        <div className="text-sm uppercase text-green-400">Earners</div>
        <div className="text-lg font-semibold">43</div>
      </div>
    </div>

    {/* Row: Vertical full-width below */}
    <div className="p-2 shadow-md border border-green-700 rounded-md bg-black/60">
      <div className="text-sm uppercase text-green-400">Vertical</div>
      <div className="text-lg font-semibold">{badge.vertical || 'General'}</div>
    </div>
  </div>
);

const RelatedBadges = () => {
  const [relatedBadges, setRelatedBadges] = useState([]);
  useEffect(() => {
  const fetchBadges = async () => {
    try {
      const res = await axios.get(`${process.env.SERVER_URL}/badges`);
      const allBadges = res.data.badges;

      // Shuffle and pick 3 random badges
      const shuffled = [...allBadges].sort(() => 0.5 - Math.random());
      const picked = shuffled.slice(0, 3);

      // Fetch details for these 3 badges
      const details = await Promise.all(
        picked.map(badge =>
          axios.get(`${process.env.SERVER_URL}/badge/${badge.id}`)
        )
      );

      setRelatedBadges(details.map(d => d.data));
    } catch (error) {
      console.error('Error fetching related badges:', error);
    }
  };

  fetchBadges();
}, []);
  if (relatedBadges.length === 0) {
    return (
      <div className="text-center text-gray-400 mt-6">
        No related badges available.
      </div>
    );
  }

  return (
  <div className="mt-8">
    <h3 className="text-green-400 font-semibold mb-4 text-left">Related Badges</h3>
    <div className="flex gap-4 justify-center">
      {relatedBadges.map(badge => (
        <div
          key={badge.id}
          className="w-24 h-24 rounded-lg overflow-hidden shadow-lg border border-green-700"
        >
          <img
            crossOrigin="anonymous"
            src={`${process.env.SERVER_URL}/badge/images/${badge.id}`}
            alt={badge.name}
            className="w-full h-full object-cover"
          />
        </div>
      ))}
    </div>
  </div>
);

};


  return (
    <div className="min-h-screen flex flex-col bg-black text-green-300 font-sans selection:bg-green-600 selection:text-black">
      <Navbar />
      <div className="mt-4 mx-auto text-lg flex items-center gap-2">
        {verificationStatus ? (
          <>
            <CheckCircle className="w-4 h-4 text-green-400" />
            <span className="text-green-400">
              This badge was <strong>verified</strong> and awarded to {user} on {formatDate(timestamp)}.
            </span>
          </>
        ) : (
          <>
            <Shield className="w-4 h-4 text-red-500" />
            <span className="text-red-400">
              This badge is <strong>not verified</strong>.
            </span>
          </>
        )}
      </div>
      <main className="container mx-auto px-4 py-6 flex-grow">
        {error && (
          <div className="bg-red-900 text-red-400 p-4 mb-4 rounded-md border border-red-600">
            {error}
          </div>
        )}

        <div className="max-w-4xl mx-auto bg-black/80 rounded-lg p-6 shadow-lg border border-green-800">
          <div className="flex flex-col md:flex-row md:space-x-8">
            {/* Left side: Image + Metrics */}
            <div className="flex-shrink-0 mb-6 md:mb-0 md:w-1/3">
              <img
                crossOrigin="anonymous"
                src={`${process.env.SERVER_URL}/badge/images/${badge?.id}` || badge.image?.data}
                alt={badge.name}
                className="w-48 h-48 object-contain rounded-full border border-green-600 shadow-md mx-auto"
              />
              <div className="mt-4">
                <BadgeMetrics badge={badge} />
              </div>
              {/* Related Badges */}
              <RelatedBadges/>
            </div>

            {/* Right side (or full stack on mobile): Description & Skills */}
            <div className="flex flex-col flex-grow gap-4 md:w-2/3">
              {/* On mobile, description appears after image + metrics naturally */}
              <BadgeDescription badge={badge} />
              <BadgeSkillsList skills={badge.skillsEarned} />
              {/* Passing Criteria */}
              <div className="bg-black/60 border border-green-700 rounded-md p-4 shadow text-sm text-green-300">
                <strong>Passing Criteria:</strong> has scored at least 70% in their assessment and completed all mandatory tasks to earn this badge.
              </div>
              {/* Authorized Byline */}
              <div className="text-xs text-gray-400 italic text-right pr-1">
                Authorized and issued by <span className="text-green-400 not-italic">DeepCytes.</span>
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
