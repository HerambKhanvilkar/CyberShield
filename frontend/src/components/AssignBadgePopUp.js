import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Button } from "@/components/ui/button";
import { Check,RotateCcw } from 'lucide-react';

const BadgeAssignmentDropdown = ({ user, updateUserDetails }) => {
  const [badges, setBadges] = useState([]);
  const [selectedBadge, setSelectedBadge] = useState(null);

  const fetchBadges = async () => {
    try {
      const token = localStorage.getItem("token");
      const url = `${process.env.SERVER_URL}/badges`;
      const userBadges = user?.badges.map(b => Number(b.badgeId));
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        timeout: 10000,
      });

      if (response) {
        const assignableBadges = response.data.badges.filter(
          badge => !userBadges.includes(badge.id)
        );
        setBadges(assignableBadges);
      }
    } catch (error) {
      console.error('Error fetching badges:', error);
    }
  };
  useEffect(() => {
    fetchBadges();
  }, [user]);

  const handleAssign = async () => {
    try {
      const token = localStorage.getItem("token");
      const url = `${process.env.SERVER_URL}/assign-badge`;
      const response = await axios.post(
        url,
        {
          email: user.email,
          badgeId: selectedBadge
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          timeout: 10000,
        }
      );

      updateUserDetails(user.email, response.data.user);
      toast.success(
        <div>
          Badge assigned to <strong style={{ color: '#00CBF0' }}>{response.data.user.firstName}</strong>!
        </div>
      );
      setSelectedBadge(null); // Reset selection after assigning
      await fetchBadges(); // refresh dropdown
    } catch (error) {
      console.error("Error assigning badge:", error);
    }
  };

  return (
    <div className="p-4 max-w-md">
      <label className="text-sm font-medium text-gray-300 mb-1">Assign Badge</label>
      <div className='flex flex-row items-center space-x-2'>
        <select
          className="w-full p-2 rounded bg-[#1A1B2E]/60 text-gray-400 border-gray-600 focus:border-cyan-500 focus:ring-cyan-500"
          value={selectedBadge || ""}
          onChange={(e) => setSelectedBadge(Number(e.target.value))}
          disabled={badges.length === 0}
        >
          <option value="">Select a badge</option>
          {badges.map((badge) => (
            <option key={badge.id} value={badge.id}>
              {badge.name}
            </option>
          ))}
        </select>
        <Button
          className="text-sm bg-gray-800 text-white"
          onClick={() => setSelectedBadge(null)}
        >
          <RotateCcw />
        </Button>
        <Button
          className={`text-sm ${selectedBadge ? 'text-green-400' : 'text-gray-400'} bg-gray-800 hover:bg-green-700 hover:text-white`}
          onClick={handleAssign}
          disabled={!selectedBadge}
        >
          <Check />
        </Button>
      </div>
      {badges.length === 0 && (
        <p className="text-sm mt-2 text-gray-300">All available badges are already assigned.</p>
      )}
    </div>
  );
};

export default BadgeAssignmentDropdown;
