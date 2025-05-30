'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { Award, CheckCircle, Shield } from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const SharedBadgePage = () => {
  const params = useParams();
  const { id, username, timestamp } = params;

  const [badge, setBadge] = useState(null);
  const [issuerData, setIssuerData] = useState({
    name: '',
    logo: '',
    website: '',
  });
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [user, setUser] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchBadgeData = async () => {
      if (!id || !username || !timestamp) return;

      try {
        setIsLoading(true);
        const badgeResponse = await axios.get(`${process.env.SERVER_URL}/badge/${id}`);
        setBadge(badgeResponse.data);

        setIssuerData({
          name: "CyberBadge Academy",
          logo: "/logo.png",
          website: "https://cyberbadge.example.com",
        });

        try {
          const verifyResponse = await axios.get(
            `${process.env.SERVER_URL}/verify-badge/${id}/${username}/${timestamp}`
          );
          setVerificationStatus(verifyResponse.data.verified);
          setUser(verifyResponse.data.firstName + " " + verifyResponse.data.lastName);
        } catch (verifyError) {
          console.error("Verification error:", verifyError);
          setVerificationStatus(false);
        }

        setIsLoading(false);
      } catch (err) {
        console.error("Error fetching badge:", err);
        setError("Failed to load badge information. Please try again later.");
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

  const renderVerificationStatus = () => {
    if (verificationStatus === null) {
      return <div className="text-white/70 italic">Verifying badge...</div>;
    }

    return (
      <div className={`flex items-center gap-2 ${verificationStatus ? 'text-green-400' : 'text-red-400'}`}>
        {verificationStatus ? <CheckCircle size={20} /> : <Shield size={20} />}
        <span>{verificationStatus ? 'Badge Verified' : 'Unable to Verify Badge'}</span>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="text-center">
          <div className="animate-spin border-4 border-t-transparent border-cyan-500 rounded-full h-12 w-12 mx-auto mb-4"></div>
          <p>Loading verification details...</p>
        </div>
      </div>
    );
  }

  if (error || !badge) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white px-4">
        <div className="glass-card max-w-xl mx-auto p-6 text-center space-y-4 rounded-xl shadow-lg">
          <h2 className="text-3xl font-bold text-cyan-400">Badge Not Found</h2>
          <p>{error || 'The shared badge could not be found or verified.'}</p>
          <Link href="/badges" className="px-4 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-700 transition">
            Explore All Badges
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#00011E] text-white px-4">
      <Navbar />
      <div className="max-w-5xl mx-auto mt-10 space-y-6">
        {/* Verification Header */}
        <div className="glass-card p-5 rounded-xl flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
              <Award size={24} />
            </div>
            <p>
              This badge was issued to <strong>{user}</strong> on {formatDate(timestamp)}
            </p>
          </div>
          {renderVerificationStatus()}
        </div>

        {/* Badge Content */}
        <div className="glass-card rounded-xl p-8 grid md:grid-cols-[350px_1fr] gap-8">
          {/* Badge Image */}
          <div className="flex justify-center">
            <div className="max-w-xs rounded-xl overflow-hidden shadow-[0_0_30px_#00d4ff40]">
              <img src={badge.image} alt={badge.name} className="w-full" />
            </div>
          </div>

          {/* Badge Details */}
          <div>
            <p className="text-white/60 mb-4">
              Badge issued to <strong>{user}</strong> on {formatDate(timestamp)}
            </p>
            <h1 className="text-3xl font-bold text-cyan-400 mb-4">{badge.name}</h1>
            <p className="mb-4">
              Issued by{' '}
              <a href={issuerData.website} target="_blank" className="text-cyan-400 hover:underline" rel="noreferrer">
                {issuerData.name}
              </a>
            </p>
            <p className="mb-6">{badge.description}</p>

            <h2 className="text-xl font-semibold text-cyan-400 mb-2">Skills</h2>
            <div className="flex flex-wrap gap-2 mb-6">
              {badge.skillsEarned?.map((skill, i) => (
                <span
                  key={i}
                  className="bg-white/10 text-sm px-3 py-1 rounded-full text-white backdrop-blur-sm"
                >
                  {skill}
                </span>
              ))}
            </div>

            <h2 className="text-xl font-semibold text-cyan-400 mb-2">Earning Criteria</h2>
            <div className="bg-white/5 rounded-lg p-4 flex items-center gap-3">
              <CheckCircle className="text-cyan-400" size={20} />
              <span>
                Passing score on {badge.category} level assessment in cybersecurity challenges.
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4">
          <Link
            href="/badges"
            className="px-5 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition"
          >
            Explore All Badges
          </Link>
        </div>
      </div>
      <Footer/>
    </div>
  );
};

export default SharedBadgePage;
