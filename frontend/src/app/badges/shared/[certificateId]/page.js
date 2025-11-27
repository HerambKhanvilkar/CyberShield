 'use client';

 import { notFound, useParams } from 'next/navigation';
 import { useEffect, useState } from 'react';
 import axios from 'axios';
 import { CheckCircle, Shield } from 'lucide-react';
 import Navbar from '@/components/Navbar';
 import Footer from '@/components/Footer';
 import { cn } from '@/lib/utils';
 import { Marquee } from '@/components/magicui/marquee';

 const SharedBadgePage = () => {
   const { certificateId } = useParams();
   const [isLoading, setIsLoading] = useState(true);
   const [badge, setBadge] = useState(null);

   const [verificationStatus, setVerificationStatus] = useState(false);
   const [user, setUser] = useState('');
   const [displayCertificateId, setDisplayCertificateId] = useState(null);
   const [error, setError] = useState('');
   const [earnersCount, setEarnersCount] = useState(null);
   const [earnedDate, setEarnedDate] = useState(null);

   useEffect(() => {
     const fetchByCertificate = async () => {
       if (!certificateId) return setIsLoading(false);
       try {
         const res = await axios.get(`${process.env.SERVER_URL}/verify-badge/certificate/${certificateId}`);
         if (!res.data || !res.data.verified) {
           setVerificationStatus(false);
           return;
         }

         setVerificationStatus(true);
         setUser(`${res.data.firstName || ''} ${res.data.lastName || ''}`.trim());
         setBadge(res.data.badge || null);
         setDisplayCertificateId(res.data.certificateId || certificateId);
         setEarnedDate(res.data.earnedDate || null);
       } catch (err) {
         console.error('Failed to load badge by certificate:', err);
         setError('Failed to load badge information. Please try again later.');
       } finally {
         setIsLoading(false);
       }
     };

     fetchByCertificate();
   }, [certificateId]);

   useEffect(() => {
     const fetchEarnersCount = async () => {
       if (!badge || !badge.id) return;
       try {
         const response = await axios.get(`${process.env.SERVER_URL}/badge/earners/${badge.id}`);
         setEarnersCount(response.data.earners);
       } catch (error) {
         console.error('Failed to fetch earners count:', error);
         setEarnersCount('N/A');
       }
     };
     fetchEarnersCount();
   }, [badge]);

   if (isLoading) {
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

   if (!verificationStatus) return notFound();

   const ReviewCard = ({ name }) => (
     <figure
       className={cn(
         'relative h-full w-max cursor-pointer overflow-hidden rounded-xl border p-4',
         'border-gray-950/[.1] bg-gray-950/[.01] hover:bg-gray-950/[.05]',
         'dark:border-gray-50/[.1] dark:bg-gray-50/[.10] dark:hover:bg-gray-50/[.15]'
       )}
     >
       <div className="flex flex-row items-center gap-2">
         <div className="flex flex-col">
           <figcaption className="text-sm font-medium dark:text-white">{name}</figcaption>
         </div>
       </div>
     </figure>
   );

   function MarqueeDemo({ skills }) {
     const firstRow = skills.slice(0, Math.ceil(skills.length / 2));
     const secondRow = skills.slice(Math.ceil(skills.length / 2));
     return (
       <div className="relative flex w-full rounded-2xl flex-col items-center justify-center overflow-hidden">
         <Marquee pauseOnHover className="[--duration:10s]">
           {firstRow.map((skill, i) => (
             <ReviewCard key={i} name={skill} />
           ))}
         </Marquee>
         <Marquee reverse pauseOnHover className="[--duration:10s]">
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
     if (!ts) return '';
     const date = new Date(ts);
     if (isNaN(date.getTime())) return '';
     return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
   };

   const BadgeDescription = ({ badge }) => (
     <div className="text-white">
       <div className="text-3xl font-bold text-[#38C8F8] uppercase">{user}</div>
       <div className="text-xl font-semibold text-gray-400">
         <i> {badge?.name} </i>
       </div>
     </div>
   );

   const BadgeMetrics = ({ badge }) => (
     <div className="w-full justify-center mt-4 text-center text-green-300 flex flex-col items-center gap-2">
       <div className="flex flex-row w-full md:items-center gap-8 justify-center rounded-md ">
         <div className="flex flex-col items-center p-2 shadow-md rounded-md ">
           <svg width="32px" height="32px" viewBox="-2.4 -2.4 28.80 28.80" fill="#8cdfde" xmlns="http://www.w3.org/2000/svg" stroke="#8cdfde" strokeWidth="0.00024000000000000003"><g id="SVGRepo_bgCarrier" strokeWidth="0" transform="translate(0,0), scale(1)"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" stroke-linejoin="round" stroke="#8cbfde" strokeWidth="0.144"></g><g id="SVGRepo_iconCarrier"><path fill-rule="evenodd" clip-rule="evenodd" d="M11 2a1 1 0 0 1 2 0v2.062A8.004 8.004 0 0 1 19.938 11H22a1 1 0 0 1 0 2h-2.062A8.004 8.004 0 0 1 13 19.938V22a1 1 0 0 1-2 0v-2.062A8.004 8.004 0 0 1 4.062 13H2a1 1 0 0 1 0-2h2.062A8.004 8.004 0 0 1 11 4.062V2zm7 10a6 6 0 1 0-12 0 6 6 0 0 0 12 0zm-3 0a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" fill="#8cbfde"></path></g></svg>
           <div className="text-lg text-white hover:text-[#38C8F8] font-semibold">{badge?.level || 'N/A'}</div>
         </div>

         <div className="flex flex-col items-center p-2 shadow-md rounded-md ">
           <svg width="32px" height="32px" viewBox="0 0 24 24" fill="#8cbfde" stroke="#8cbfde" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path opacity="0.4" d="M17.9981 7.16C17.9381 7.15 17.8681 7.15 17.8081 7.16C16.4281 7.11 15.3281 5.98 15.3281 4.58C15.3281 3.15 16.4781 2 17.9081 2C19.3381 2 20.4881 3.16 20.4881 4.58C20.4781 5.98 19.3781 7.11 17.9981 7.16Z" stroke="#292D32" strokeWidth="1.5" strokeLinecap="round" stroke-linejoin="round"></path> <path opacity="0.4" d="M16.9675 14.4402C18.3375 14.6702 19.8475 14.4302 20.9075 13.7202C22.3175 12.7802 22.3175 11.2402 20.9075 10.3002C19.8375 9.59016 18.3075 9.35016 16.9375 9.59016" stroke="#292D32" strokeWidth="1.5" strokeLinecap="round" stroke-linejoin="round"></path> <path opacity="0.4" d="M5.96656 7.16C6.02656 7.15 6.09656 7.15 6.15656 7.16C7.53656 7.11 8.63656 5.98 8.63656 4.58C8.63656 3.15 7.48656 2 6.05656 2C4.62656 2 3.47656 3.16 3.47656 4.58C3.48656 5.98 4.58656 7.11 5.96656 7.16Z" stroke="#292D32" strokeWidth="1.5" strokeLinecap="round" stroke-linejoin="round"></path> <path opacity="0.4" d="M6.9975 14.4402C5.6275 14.6702 4.1175 14.4302 3.0575 13.7202C1.6475 12.7802 1.6475 11.2402 3.0575 10.3002C4.1275 9.59016 5.6575 9.35016 7.0275 9.59016" stroke="#292D32" strokeWidth="1.5" strokeLinecap="round" stroke-linejoin="round"></path> <path d="M12.0001 14.6302C11.9401 14.6202 11.8701 14.6202 11.8101 14.6302C10.4301 14.5802 9.33008 13.4502 9.33008 12.0502C9.33008 10.6202 10.4801 9.47021 11.9101 9.47021C13.3401 9.47021 14.4901 10.6302 14.4901 12.0502C14.4801 13.4502 13.3801 14.5902 12.0001 14.6302Z" stroke="#292D32" strokeWidth="1.5" strokeLinecap="round" stroke-linejoin="round"></path> <path d="M9.0907 17.7804C7.6807 18.7204 7.6807 20.2603 9.0907 21.2003C10.6907 22.2703 13.3107 22.2703 14.9107 21.2003C16.3207 20.2603 16.3207 18.7204 14.9107 17.7804C13.3207 16.7204 10.6907 16.7204 9.0907 17.7804Z" stroke="#292D32" strokeWidth="1.5" strokeLinecap="round" stroke-linejoin="round"></path> </g></svg>
           <div className="text-lg text-white hover:text-[#38C8F8] font-semibold">{earnersCount !== null ? earnersCount : '...'}</div>
         </div>
       </div>

       <div className="flex flex-col items-center p-2 shadow-md rounded-md ">
         <svg width="32px" height="32px" fill="#8cbfde" viewBox="0 0 32 32"xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><defs></defs><title>parent-child</title><path d="M28,12a2,2,0,0,0,2-2V4a2,2,0,0,0-2-2H4A2,2,0,0,0,2,4v6a2,2,0,0,0,2,2H15v4H9a2,2,0,0,0-2,2v4H4a2,2,0,0,0-2,2v4a2,2,0,0,0,2,2h8a2,2,0,0,0,2-2V24a2,2,0,0,0-2-2H9V18H23v4H20a2,2,0,0,0-2,2v4a2,2,0,0,0,2,2h8a2,2,0,0,0,2-2V24a2,2,0,0,0-2-2H25V18a2,2,0,0,0-2-2H17V12ZM12,28H4V24h8Zm16,0H20V24h8ZM4,4H28v6H4Z"></path><rect id="_Transparent_Rectangle_" data-name="&lt;Transparent Rectangle&gt;" fill="none" width="32" height="32"></rect></g></svg>
         <div className="text-lg text-white hover:text-[#38C8F8] font-semibold">{badge?.vertical || 'General'}</div>
       </div>
     </div>
   );

   return (
     <div className="min-h-screen flex flex-col glow-container text-white font-sans selection:bg-[#38C8F8] selection:text-black">
       <div className="ball"></div>
       <div className="ball" style={{ '--delay': '-12s', '--size': '0.35', '--speed': '25s' }}></div>
       <div className="ball" style={{ '--delay': '-10s', '--size': '0.3', '--speed': '15s' }}></div>
       <Navbar />
       <div className="z-10 mt-4 px-4 mx-auto text-lg text-green-400">
         {verificationStatus ? (
           <p>
             <CheckCircle className="inline-block w-4 h-4 mr-1 align-text-bottom" />
             This badge was <strong>verified</strong> and awarded to {user} {earnedDate ? `on ${formatDate(earnedDate)}` : ''}.
           </p>
         ) : (
           <p>
             <Shield className="inline-block w-4 h-4 mr-1 align-text-bottom text-red-500" />
             <span className="text-red-400">This badge is <strong>not verified</strong>.</span>
           </p>
         )}
       </div>
       <main className="z-20 container mx-auto md:max-w-[900px] px-4 py-6 flex-grow">
         {error && (
           <div className="bg-red-900 text-red-400 p-4 mb-4 rounded-md border border-red-600">{error}</div>
         )}

         <div className="relative bg-center bg-cover bg-[url('/0.png')] backdrop-blur-lg text-white rounded-[25px] z-0 w-full mb-5">
           <div className="flex p-1 flex-col glass backdrop-blur-md border border-white/10 shadow-lg transition-shadow duration-300 ease-in-out hover:shadow-[0_0_10px_3px_rgba(0,178,255,0.8)] rounded-lg">
             <div className="flex flex-col md:flex-row md:space-x-8">
               <div className="flex-shrink-0 mb-2 md:mb-0 md:w-1/3">
                 <img
                   crossOrigin="anonymous"
                   src={`${process.env.SERVER_URL}/badge/images/${badge?.id}` || badge?.image?.data}
                   alt={badge?.name}
                   className="w-48 h-48 object-contain rounded-full border border-[#38C8F8] shadow-md mx-auto"
                 />
                 <div className="mt-4">
                   <BadgeMetrics badge={badge} />
                 </div>
               </div>

               <div className="flex flex-col p-2.5 justify-around flex-grow gap-4 md:w-2/3">
                 <BadgeDescription badge={badge} />
                 <div className="grid md:grid-cols-1 md:gap-6">
                   {badge?.skillsEarned && badge.skillsEarned.length > 0 ? (
                     <MarqueeDemo skills={badge.skillsEarned} />
                   ) : (
                     <p>No skills listed for this badge.</p>
                   )}
                 </div>

                 <div className="flex flex-col sm:flex-row space-x-1 ">
                   <div className="relative w-full z-0 mb-5 group bg-black/60 border rounded-md p-4 shadow text-sm text-white hover:text-[#38C8F8]">
                     <strong className='block text-gray-500 hover:text-white rounded-lg -mt-7 bg-black w-max px-2.5'>Passing Criteria</strong>
                     Scored at least 70% in their assessment and completed all mandatory tasks to earn this badge.
                   </div>

                   <div className="z-0 sm:w-2/5 mb-5 group bg-black/60 border rounded-md p-4 shadow text-sm text-white hover:text-[#38C8F8]">
                     <strong className='block text-gray-500 hover:text-white rounded-lg -mt-7 bg-black w-max px-2.5'>Course</strong> {badge?.course}
                   </div>
                 </div>

                 {displayCertificateId && (
                   <div className="mt-auto mb-2 w-full">
                     <div className="relative w-full z-0 group bg-black/60 border rounded-md p-4 shadow text-sm text-white hover:text-[#38C8F8]">
                       <strong className='block text-gray-500 hover:text-white rounded-lg -mt-7 bg-black w-max px-2.5 mb-2'>Certificate ID</strong>
                       <div className="mt-1 font-mono font-semibold text-sm">{displayCertificateId}</div>
                     </div>
                   </div>
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