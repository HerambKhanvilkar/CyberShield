import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Button } from "@/components/ui/button";

const BadgeAssignmentDropdown = ({ user, updateUserDetails }) => {
  const [badges, setBadges] = useState([]);
  const [selectedBadge, setSelectedBadge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [setUsers] = useState(false);

  useEffect(() => {
    const fetchBadges = async () => {
      try {
        setLoading(true);
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
          const revokableBadges = response.data.badges.filter((badge) =>
            userBadges.includes(badge.id)
          );
          setBadges(revokableBadges);
        }
      } catch (error) {
        console.error('Error fetching badges:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBadges();
  }, [user]);

  const handleRevoke = async () => {
    try {
      const token = localStorage.getItem("token");
      const url = `${process.env.SERVER_URL}/revoke-badge`;
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
          Badge revoked from <strong style={{ color: '#00CBF0' }}>{response.data.user.firstName}</strong>!
        </div>
      );
      setSelectedBadge(null); // Reset selection after revocation
    } catch (error) {
      console.error("Error revoking badge:", error);
    }
  };

  return (
    <div className="p-4 bg-blue-950/30 backdrop-blur-md rounded-md shadow-lg space-y-4 max-w-md">
      <h2 className="text-lg font-semibold text-white">Revoke Badge</h2>

      <div>
        <select
          className="w-full p-2 rounded bg-white text-black disabled:bg-gray-200"
          value={selectedBadge || ""}
          onChange={(e) => setSelectedBadge(e.target.value)}
          disabled={loading}
        >
          <option value="">{loading ? "Loading badges..." : "Select a badge"}</option>
          {!loading &&
            badges.map((badge) => (
              <option key={badge.id} value={badge.id}>
                {badge.name}
              </option>
            ))}
        </select>
      </div>

      <div className="flex justify-end space-x-2">
        <Button
          className="text-sm bg-gray-700 text-white hover:bg-gray-600"
          onClick={() => setSelectedBadge(null)}
        >
          Cancel
        </Button>
        <Button
          className={`text-sm ${selectedBadge ? 'text-red-500' : 'text-gray-400'} bg-gray-800 hover:bg-red-700 hover:text-white`}
          onClick={handleRevoke}
          disabled={!selectedBadge}
        >
          Revoke
        </Button>
      </div>
    </div>
  );
};

export default BadgeAssignmentDropdown;
