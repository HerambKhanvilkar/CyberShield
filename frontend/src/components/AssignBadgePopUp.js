import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Button } from "@/components/ui/button";
import { Check,RotateCcw } from 'lucide-react';

const BadgeAssignmentDropdown = ({ user, updateUserDetails }) => {
  const [badges, setBadges] = useState([]);
  const [selectedBadge, setSelectedBadge] = useState(null);

  useEffect(() => {
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
    } catch (error) {
      console.error("Error assigning badge:", error);
    }
  };

  return (
    <div className="p-4 bg-blue-950/30 backdrop-blur-md rounded-md shadow-lg space-y-4 max-w-md">
      <h2 className="text-lg font-semibold text-white">Assign Badge</h2>
      
      <div className='flex flex-row items-center space-x-2'>
        <select
          className="w-full p-2 rounded bg-white text-black"
          value={selectedBadge || ""}
          onChange={(e) => setSelectedBadge(e.target.value)}
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
    </div>
  );
};

export default BadgeAssignmentDropdown;
