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
      <p className="italic text-green-400">{badge.vertical}</p>
      <p>{badge.description}</p>
    </div>
  );

  const BadgeSkillsList = ({ skills }) => (
    <div className="mt-4">
      <h3 className="text-green-400 font-semibold mb-2">Skills Earned</h3>
      <ul className="list-disc list-inside space-y-1 text-green-300">
        {skills?.map((skill, idx) => (
          <li key={idx} className="flex items-center space-x-1" title={skill}>
            <span>{skill}</span>
          </li>
        ))}
      </ul>
    </div>
  );

  const BadgeMetrics = ({ badge }) => (
    <div className="w-full flex justify-around mt-4 text-center text-green-300">
      <div className="p-2 flex-1 shadow-md border border-green-700 rounded-md bg-black/60">
        <div className="text-sm uppercase text-green-400">Level</div>
        <div className="text-lg font-semibold">{badge.level || 'N/A'}</div>
      </div>
      <div className="p-2 flex-1 shadow-md border border-green-700 rounded-md bg-black/60">
        <div className="text-sm uppercase text-green-400">Branch</div>
        <div className="text-lg font-semibold">{badge.skillsEarned?.[0] || 'General'}</div>
      </div>
      <div className="p-2 flex-1 shadow-md border border-green-700 rounded-md bg-black/60">
        <div className="text-sm uppercase text-green-400">Earners</div>
        <div className="text-lg font-semibold">43</div>
      </div>
    </div>
  );

  const BadgeActions = ({ badge }) => {
    const [earned, setEarned] = useState(null);

    useEffect(() => {
      const userStr = localStorage.getItem('user');
      if (!userStr) return;

      try {
        const user = JSON.parse(userStr);
        const found = user.badges?.find((b) => b.id === badge.id);
        if (found) setEarned(found);
      } catch (err) {
        console.error('Failed to parse user', err);
      }
    }, [badge?.id]);

    return (
      <div className="mt-4 text-sm text-green-500">
        {/* Placeholder for share options */}
        Share options here
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-black text-green-300 font-sans selection:bg-green-600 selection:text-black">
      <Navbar />
      <main className="container mx-auto px-4 py-6 flex-grow">
        {error && (
          <div className="bg-red-900 text-red-400 p-4 mb-4 rounded-md border border-red-600">
            {error}
          </div>
        )}

        <div className="max-w-4xl mx-auto bg-black/80 rounded-lg p-6 shadow-lg border border-green-800">
          <div className="flex flex-col md:flex-row md:space-x-8">
            <div className="flex-shrink-0 mb-6 md:mb-0">
              <img
                src={`${process.env.SERVER_URL}/badge/images/${badge?.id}` || badge.image?.data}
                alt={badge.name}
                className="w-48 h-48 object-contain rounded-md border border-green-600 shadow-md"
              />
              <div className="mt-3 text-center text-sm font-semibold text-black px-3 py-1 rounded-full bg-green-700">
                {badge.difficulty}
              </div>
            </div>

            <div className="flex flex-col flex-grow justify-between">
              <BadgeDescription badge={badge} />
              <BadgeSkillsList skills={badge.skillsEarned} />
              <BadgeMetrics badge={badge} />
              <BadgeActions badge={badge} />
              <div className="mt-4 text-green-400">
                Verified for: {user}{' '}
                {verificationStatus ? (
                  <CheckCircle className="inline w-4 h-4" />
                ) : (
                  <Shield className="inline w-4 h-4 text-red-500" />
                )}
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
