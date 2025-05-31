import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { toast } from 'react-toastify';
import ErrorTable from '@/components/badgeAdminComponents/CsvDataTable';

function MyComponent() {
  // File Upload Code
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');
  const [data, setData] = useState({});
  const [jobId, setJobId] = useState('');
  const [status, setStatus] = useState('');
  const [revision, setRevision] = useState(null);
  const [revisionStatus, setRevisionStatus] = useState('');
  const [refresh, setRefresh] = useState(false);
  const [updatedRows, setUpdatedRows] = useState([]); // Format: { [email]: { ...changedData } }

  // Create a ref to store the latest jobId
  const jobIdRef = useRef(jobId);
  const revisionRef = useRef(revision);
  const intervalRef = useRef(null);

  // Update jobIdRef whenever jobId changes
  useEffect(() => {
    jobIdRef.current = jobId;
    revisionRef.current = revision;
  }, [jobId]);

  const handleUpload = async () => {
    const apiUrl = process.env.SERVER_URL + '/users/import';
    const token = localStorage.getItem("accessToken");

    if (!file) {
      setMessage('Please select a file to upload.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file); // Append the file to the FormData object

    try {
      const response = await axios.post(apiUrl, formData, {
        headers: {
          'Content-Type': 'multipart/form-data', // Set the content type
          Authorization: `Bearer ${token}`, // Add the token to the headers
        },
      });

      setData(response.data);
      toast.success('File uploaded successfully!'); // Success message
    } catch (error) {
      console.error('There was a problem with the upload operation:', error);
      toast.error('Error uploading file.'); // Error message
    }
  };

  const getJobStatus = async (rev) => {
    try {
      if(!jobIdRef.current){ 
        console.log('tick, but no jobId available yet.');
        return;
      }
      const token = localStorage.getItem("accessToken");
      const JobUrl = process.env.SERVER_URL + '/job-status/' + jobIdRef.current;
      const response = await axios.get(JobUrl, {
        headers: {
          'Content-Type': 'multipart/form-data', // Set the content type
          Authorization: `Bearer ${token}`, // Add the token to the headers
        },
      });

      // When API returns a status of "completed"
      if (response.data.status === 'completed') {
        if (rev){
          if (response.data.revisionStatus === 'completed') {
            setData(response.data.result);
            toast.success("Revision completed!");
            setRevision(null);
            // Clear the interval to stop polling
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            return;
          }
        }
        // Optionally display a toast
        toast.success("Job completed!");
        // Update your data as needed from the API result
        setData(response.data.result);
        console.log(response.data.result);

        // Clear the interval to stop polling
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
    } catch (error) {
      console.error('There was a problem with the upload operation:', error);
      toast.error('Error uploading file.'); // Error message
      // Optionally clear the interval on error depending on your error handling strategy
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }

  // Set up polling when a new jobId is set.
  useEffect(() => {
    // Start polling only if a jobId exists
    if (jobId) {
      // Clear any existing interval
      if (intervalRef.current) clearInterval(intervalRef.current);

      // Poll every 3 seconds (adjust time as needed)
      intervalRef.current = setInterval(() => {
        getJobStatus(revisionRef.current);
      }, 1000);

      // Optionally, start an immediate check so user doesn't have to wait the full interval
      getJobStatus(revisionRef.current);
    }

    // Clean up the interval when component unmounts or jobId changes
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [jobId]);

  const handleDebug = () => {
    console.log(data);
    console.log(updatedRows);
  }

  const handleRevision = async() => {
    try {
      const job_id = jobId;
      setJobId(null);
      const changes = new Set(updatedRows);
      const changedUsers = [];
      for ( const row of changes){
        const user = data
          .invalidUsers.find(u => u.row == row ) ||
          data.validUsers.find(u => u.row == row)

        if (user){
          changedUsers.push(user);
        }
      }
      const token = localStorage.getItem("accessToken");
      const JobRevisionUrl = process.env.SERVER_URL + '/job-status/' + jobIdRef.current;
      const response = await axios.put(JobRevisionUrl, 
        {
          'revision': changedUsers
        },
        {
        headers: {
          Authorization: `Bearer ${token}`, // Add the token to the headers
        },
      });

      setJobId(response.data.jobStatus.jobId);
      setRevision(true);
      console.log("put", response.data);
      toast.success(response.data.message); // Success message

    } catch (e){
      toast.error("Something went wrong");
      console.log(e);
    }
  }


  const handleDownload = async () => {
    const apiUrl = process.env.SERVER_URL + '/users/sample';
      try {
        const token = localStorage.getItem("accessToken");
        const response = await axios.get(apiUrl, {
              responseType: 'blob', // Important for handling binary data
              headers: {
                  Authorization: `Bearer ${token}`, // Add the token to the headers
              },
          });

          const url = window.URL.createObjectURL(new Blob([response.data])); // Create a URL for the Blob
          toast.success("Sample CVS downloaded!");
          const a = document.createElement('a'); // Create an anchor element
          a.style.display = 'none';
          a.href = url;
          a.download = 'users_sample_data.csv'; // Set the file name
          document.body.appendChild(a); // Append the anchor to the body
          a.click(); // Programmatically click the anchor to trigger the download
          window.URL.revokeObjectURL(url); // Clean up the URL object
          document.body.removeChild(a); // Remove the anchor from the document
      } catch (error) {
          console.error('There was a problem with the download operation:', error);
          toast.error("Something went wrong!");
      }
    }

  const handleFileChange = (event) => {
    setFile(event.target.files[0]); // Get the selected file
  };

  const handleJobIdChange = (job_id) => {
    setJobId(job_id); // Get the selected file
  };


  const handlePreviewCSV = async () => {
    const previewURL = process.env.SERVER_URL + '/users/import/preview';
    const token = localStorage.getItem("accessToken");

    if (!file) {
      toast.warning('Please select a file to upload.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file); // Append the file to the FormData object

    try {
      const response = await axios.post(previewURL, formData, {
        headers: {
          'Content-Type': 'multipart/form-data', // Set the content type
          Authorization: `Bearer ${token}`, // Add the token to the headers
        },
      });

      setJobId(response.data.jobId);
      toast.success(response.data.message); // Success message
    } catch (error) {
      console.error('There was a problem with the upload operation:', error);
      toast.error('Error uploading file.'); // Error message
    }

    
  };

  // Handler to update a user with changes from the child
  const updateUser = (updatedUser) => {
    console.log(updatedUser);
    setData((prevData) => ({
      ...prevData,
      invalidUsers: prevData.invalidUsers.map((user) =>
        user.row === updatedUser.row ? updatedUser : user
      ),
      validUsers: prevData.validUsers.map((user) =>
        user.row === updatedUser.row ? updatedUser : user
      ),
    }));
    // Here you can also perform API calls to update the server
    setUpdatedRows([...updatedRows, updatedUser.row]);
  };



  return (
    <div className="flex flex-col lg:flex-row justify-between gap-6 mb-6">
    {/* Left side - Description and buttons */}
      <div className="flex flex-col justify-between space-y-4 lg:max-w-sm">
        <div>

          <label className="block mb-2 text-sm font-medium text-white-900" htmlFor="file_input">Select file</label>
          <Input
            aria-describedby="file_input_help" 
            placeholder="foobar"
            type="file" 
            accept=".csv" 
            id="file_input"
            onChange={handleFileChange} />
          <p className="mt-1 text-sm text-gray-300" id="file_input_help">CSV (MAX. 10MB).</p>
        </div>
        <div className="space-x-2">
          <button className="bg-green-700 text-white text-sm px-4 py-1 rounded"
          onClick={handleDownload}
          >
            Download Template
          </button>
        </div>
      </div>

    {/* Right side - CSV Preview Card */}
    <div className="flex-1">
      { !file ? (
          <div className="w-full h-64 border border-dashed border-gray-400 rounded-lg bg-white/5 flex items-center justify-center text-gray-400">
          Select a File to preview.
          </div>
      ) : (
          <ScrollArea >
            {data && (
              <div>
              <button type="button" onClick={handlePreviewCSV} className="text-white bg-gradient-to-r from-cyan-400 via-cyan-500 to-cyan-600 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-cyan-800 shadow-lg shadow-cyan-800/80 font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2 mb-2">Refresh</button>

              <ErrorTable data={data} onUpdateUser={updateUser}/>
              </div>
            )}
          </ScrollArea>
      )}
      <div className="inline-flex rounded-md shadow-xs py-2">
      { file ? ( 
        <div className="space-x-2 space-y-2">
        <button  onClick={handlePreviewCSV} className="bg-blue-500 text-white text-sm px-4 py-1 rounded">
        Preview CSV                    
        </button>
        <button  onClick={handleDebug} className="bg-blue-500 text-white text-sm px-4 py-1 rounded">
        Debug                    
        </button>
        <button  onClick={handleRevision} className="bg-blue-500 text-white text-sm px-4 py-1 rounded">
        Revision                    
        </button>
        </div>
      ) : ( 
        null
      )}
      </div>
    </div>
  </div>
  )
}

export default MyComponent;
