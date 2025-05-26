import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { MinusCircle} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";

const BadgeAssignmentDialog = ({ user, updateUserDetails }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [badges, setBadges] = useState([]);
  const [selectedBadge, setSelectedBadge] = useState(null);

  useEffect(() => {
    const fetchBadges = async () => {
      try {
        const token = localStorage.getItem("token");
        const url = `${process.env.SERVER_URL}/badges`;
        const userBadges = user?.badges.map( b => Number(b.badgeId));
        const response = await axios.get(
          url,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            timeout: 10000,
          }
        );
        if(response){
          const revokableBadges = response.data.badges.filter((badge) => userBadges.includes(badge.id));
          setBadges(revokableBadges);
        } else {
          console.log("defeart");
        }
      } catch (error) {
        console.error('Error fetching badges:', error);
      }
    };
    if (isOpen){
      fetchBadges();
    }
  }, [isOpen]);

  const handleOpen = () => {
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    setSelectedBadge(null);
  };

  const handleRevoke = async () => {
    // Implement logic to assign the selected badge to the user
    try {
      const token = localStorage.getItem("token");
      const url = `${process.env.SERVER_URL}/revoke-badge`;
      const response = await axios.post(
        url,
        {
          "email": user.email,
          "badgeId": selectedBadge
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          timeout: 10000,
        }
      );

      console.log("Calling updateUserDetail from inside Revooke", user.email, response.data.user);
      updateUserDetails(user.email, response.data.user);
      toast.success(
             <div >
                Badge revoked from <strong style={{ color: '#00CBF0' }}> {response.data.user.firstName} </strong>!
            </div>
      );
    } catch (error) {
    }
    handleClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <Button className="bg-[#530006] border-[#530006] mx-2" variant="outline" onClick={handleOpen}>
        <MinusCircle/>
      </Button>
      {isOpen && (
      <DialogContent className="max-w-md bg-blue-950/30 backdrop-blur-md shadow-lg rounded-md">
        <DialogHeader>
          <DialogTitle>Revoke Badge</DialogTitle>
        </DialogHeader>
        <div className="relative space-y-4">
        <span>Badge: </span>
          <select
            className="w-full p-5"
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
        </div>

        <div>
        <span >from: </span>
        <span className="text-base mt-2 text-gray-400">{user?.email} </span>
        </div>

          <div className="flex justify-end">
          <Button 
            className="m-2 text-sm text-white-800 bg-gray-800 border-[#530006]"
            onClick={handleClose}
          >
            Cancel
          </Button>

            <Button 
              className={`text-sm ${selectedBadge ? 'text-red-500' : 'text-black-900 '} bg-gray-800 hover:bg-red-700 hover:text-white m-2 border-[#530006]`}
              onClick={handleRevoke}
              disabled={!selectedBadge}
              >
              Revoke
            </Button>
          </div>
      </DialogContent>
      )}
    </Dialog>
  );
};

export default BadgeAssignmentDialog;

