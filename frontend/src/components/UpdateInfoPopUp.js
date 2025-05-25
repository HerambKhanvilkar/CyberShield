import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

import { Button } from "@/components/ui/button";

const BadgeAssignmentDialog = ({ user, updateUserDetails }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [changes, setChanges] = useState(false);

  const handleOpen = () => {
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleUpdateInfo = async () => {
    // Implement logic to assign the selected badge to the user
    try {
      const token = localStorage.getItem("token");
      const url = `${process.env.SERVER_URL}/user/info`;
      const body = {"email": user.email};
      if (firstName.trim()){
        body["firstName"] = firstName;
      }
      if (lastName.trim()){
        body["lastName"] = lastName;
      }
      if (password.trim()){
        body["password"] = password;
      }
      const response = await axios.post(
        url,
        body,
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
             <div >
                Updated user <strong style={{ color: '#00CBF0' }}> {response.data.user.firstName} </strong>!
            </div>
      );
      setFirstName("");
      setLastName("");
      setPassword("");

    } catch (error) {
      console.error('Error fetching badges:', error);
    }

    handleClose();
  };


  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <Button className="mx-2 " variant="outline" onClick={handleOpen}>
        Update Info
      </Button>
      {isOpen && (
      <DialogContent className="max-w-md bg-blue-950/30 backdrop-blur-md shadow-lg rounded-md">
        <DialogHeader>
          <DialogTitle>User Information</DialogTitle>
        </DialogHeader>
        <div className="relative space-y-4">

        <div>
        <span>Email: </span>
        <span className="text-base mt-2 text-gray-400">{user?.email} </span>
        </div>

        <div>
        <span>First Name: </span>
          <Input
            placeholder={user?.firstName}
            className="pl-8 w-full max-w-md truncate text-ellipsis"
            value={firstName}
            onChange={(e) => {
                setFirstName(e.target.value);
                if(e.target.value !== ""){
                  setChanges(true);
                }
            }}
            maxLength={10} // adjust the value as needed
          />
        </div>

        <div>
        <span>Last Name: </span>
          <Input
            placeholder={user?.lastName}
            className="pl-8 w-full max-w-md truncate text-ellipsis"
            value={lastName}
            onChange={(e) => {
                setLastName(e.target.value);
                if(e.target.value !== ""){
                  setChanges(true);
                }
            }}
            maxLength={10} // adjust the value as needed
          />
        </div>

        <div>
        <span>Password: </span>
          <Input
            placeholder="New Password"
            className="pl-8 w-full max-w-md truncate text-ellipsis"
            value={password}
            onChange={(e) => {
                setPassword(e.target.value);
                if(e.target.value !== ""){
                  setChanges(true);
                }
            }}
            maxLength={12} // adjust the value as needed
          />
        </div>

        </div>

          <div className="flex justify-end">
          <Button 
            className="m-2 text-sm text-white-800 bg-gray-800 border-[#530006]"
            onClick={handleClose}
          >
            Cancel
          </Button>

            <Button 
              className={`text-sm ${changes ? 'text-green-400' : 'text-black-900 '} bg-gray-800 hover:bg-green-700 hover:text-white m-2 border-[#530006]`}
              onClick={handleUpdateInfo}
              disabled={!changes}
              >
              update
            </Button>
          </div>
      </DialogContent>
      )}
    </Dialog>
  );
};

export default BadgeAssignmentDialog;

