import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { Trash2 } from 'lucide-react';
import axios from 'axios';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const DeleteUserDialog = ({ user, updateUserDetails }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleOpen = () => setIsOpen(true);
  const handleClose = () => setIsOpen(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const url = `${process.env.SERVER_URL}/user/delete`;

      const response = await axios.post(
        url,
        { email: user?.email },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          timeout: 10000,
        }
      );

      toast.success(
        <div>
          Deleted user <strong style={{ color: '#FF6B6B' }}>{user?.email}</strong> successfully!
        </div>
      );

      // Update parent or refresh data
      if (updateUserDetails) updateUserDetails();

      handleClose();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error("Failed to delete the user.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <Button className="mx-2 bg-[#530006] border-[#530006]" variant="outline" onClick={handleOpen}>
          <Trash2 />
        </Button>

      {isOpen && (
        <DialogContent className="max-w-md bg-blue-950/30 backdrop-blur-md shadow-lg rounded-md">
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p>Are you sure you want to delete this user?</p>
            <div>
              <span className="font-medium text-gray-300">User: </span>
              <span className="text-base text-gray-400">{user.email}</span>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              className="m-2 text-sm bg-gray-700 border-gray-600"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              className="m-2 text-sm bg-red-700 hover:bg-red-800 border-red-900 text-white"
              onClick={handleDelete}
              disabled={loading}
            >
              <Trash2 className="mr-1" /> {loading ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </DialogContent>
      )}
    </Dialog>
  );
};

export default DeleteUserDialog;
