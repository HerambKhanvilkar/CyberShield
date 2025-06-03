// 'use client';

// import { useParams } from 'next/navigation';
// import { useEffect, useState } from 'react';
// import axios from 'axios';
// import { CheckCircle, Shield } from 'lucide-react';
// import Navbar from '@/components/Navbar';
// import Footer from '@/components/Footer';
// import Link from 'next/link';

// const SharedBadgePage = () => {
//   const params = useParams();
//   const { id, username, timestamp } = params;

//   const [badge, setBadge] = useState(null);
//   const [verificationStatus, setVerificationStatus] = useState(null);
//   const [user, setUser] = useState('');
//   const [isLoading, setIsLoading] = useState(true);
//   const [error, setError] = useState('');

//   useEffect(() => {
//     const fetchBadgeData = async () => {
//       if (!id || !username || !timestamp) return;

//       try {
//         setIsLoading(true);
//         const badgeResponse = await axios.get(`${process.env.SERVER_URL}/badge/${id}`);
//         setBadge(badgeResponse.data);

//         try {
//           const verifyResponse = await axios.get(
//             `${process.env.SERVER_URL}/verify-badge/${id}/${username}/${timestamp}`
//           );
//           setVerificationStatus(verifyResponse.data.verified);
//           setUser(verifyResponse.data.firstName + " " + verifyResponse.data.lastName);
//         } catch (verifyError) {
//           console.error("Verification error:", verifyError);
//           setVerificationStatus(false);
//         }

//         setIsLoading(false);
//       } catch (err) {
//         console.error("Error fetching badge:", err);
//         setError("Failed to load badge information. Please try again later.");
//         setIsLoading(false);
//       }
//     };

//     fetchBadgeData();
//   }, [id, username, timestamp]);

//   const formatDate = (ts) => {
//     const date = new Date(parseInt(ts) * 1000);
//     return date.toLocaleDateString('en-US', {
//       year: 'numeric',
//       month: 'long',
//       day: 'numeric',
//     });
//   };

//   return (
//     <div className="min-h-screen bg-[#00011E] text-white">
//       <Navbar />
//       <div className="max-w-4xl mx-auto py-10 px-4">
//         {isLoading ? (
//           <div className="text-center py-20">
//             <div className="animate-spin h-12 w-12 border-4 border-cyan-400 border-t-transparent rounded-full mx-auto mb-4"></div>
//             <p>Loading badge data...</p>
//           </div>
//         ) : error ? (
//           <div className="bg-white/5 p-6 rounded-xl text-center">
//             <h2 className="text-2xl font-bold text-red-400 mb-4">Error</h2>
//             <p>{error}</p>
//           </div>
//         ) : (
//           <div className="space-y-6">
//             <div className="flex flex-col md:flex-row gap-8 items-start">
//               <img src={`${process.env.SERVER_URL}/badge/images/${badge?.id}` || badge.image?.data} alt={badge.name} className="w-full max-w-sm rounded-xl shadow-lg" />
//               <div className="flex-1 space-y-4">
//                 <h1 className="text-3xl font-bold text-cyan-400">{badge.name}</h1>
//                 <p className="text-white/80">{badge.description}</p>
//                 <p className="text-white/60">Issued to <span className="font-medium text-white">{user}</span> on {formatDate(timestamp)}</p>
//                 <div className="mt-2">
//                   {verificationStatus === null ? (
//                     <p className="text-yellow-400 italic">Verifying badge...</p>
//                   ) : verificationStatus ? (
//                     <p className="flex items-center gap-2 text-green-400"><CheckCircle size={18} /> Badge Verified</p>
//                   ) : (
//                     <p className="flex items-center gap-2 text-red-400"><Shield size={18} /> Unable to Verify Badge</p>
//                   )}
//                 </div>
//               </div>
//             </div>

//             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//               <div>
//                 <h2 className="text-xl font-semibold text-cyan-400 mb-2">Level</h2>
//                 <p>{badge.level}</p>
//               </div>
//               <div>
//                 <h2 className="text-xl font-semibold text-cyan-400 mb-2">Difficulty</h2>
//                 <p>{badge.difficulty}</p>
//               </div>
//               <div className="md:col-span-2">
//                 <h2 className="text-xl font-semibold text-cyan-400 mb-2">Vertical</h2>
//                 <p>{badge.vertical}</p>
//               </div>
//             </div>

//             <div>
//               <h2 className="text-xl font-semibold text-cyan-400 mb-2">Skills</h2>
//               <div className="flex flex-wrap gap-2">
//                 {badge.skillsEarned && badge.skillsEarned.length > 0 ? (
//                   badge.skillsEarned.map((skill, i) => (
//                     <span
//                       key={i}
//                       className="bg-white/10 px-3 py-1 rounded-full text-sm text-white"
//                     >
//                       {skill}
//                     </span>
//                   ))
//                 ) : (
//                   <p className="text-white/70">No skills listed</p>
//                 )}
//               </div>
//             </div>

//             <div>
//               <h2 className="text-xl font-semibold text-cyan-400 mb-2">Earning Criteria</h2>
//               <div className="bg-white/5 rounded-lg p-4">
//                 <p>Passing score on {badge.category} level assessment in cybersecurity challenges.</p>
//               </div>
//             </div>

//             <div className="text-center">
//               <Link href="/badges" className="inline-block px-5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition text-white">
//                 Explore All Badges
//               </Link>
//             </div>
//           </div>
//         )}
//       </div>
//       <Footer />
//     </div>
//   );
// };

// export default SharedBadgePage;




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
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [user, setUser] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchBadgeData = async () => {
      try {
        const badgeRes = await axios.get(`${process.env.SERVER_URL}/badge/${id}`);
        setBadge(badgeRes.data);

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
      <p>{badge.description}</p>
    </div>
  );

const BadgeSkillsList = ({ skills }) => (
  <div>
    <h3 className="text-green-400 font-semibold mb-2">Skills Earned</h3>
    {skills && skills.length > 0 ? (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {skills.map((skill, idx) => (
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

  return (
    <div className="min-h-screen flex flex-col bg-black text-green-300 font-sans selection:bg-green-600 selection:text-black">
      <Navbar />
      <div className="mt-4 mx-auto text-sm flex items-center gap-2">
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
                className="w-48 h-48 object-contain rounded-md border border-green-600 shadow-md mx-auto"
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
