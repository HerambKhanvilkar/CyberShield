import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { toast } from 'react-toastify';
import { Checkbox } from '@/components/ui/checkbox' 
import { Label } from '@/components/ui/label' 
import CsvDataTable from '@/components/badgeAdminComponents/CsvDataTable';

function MyComponent() {
  // File Upload Code
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');
  const [data, setData] = useState([]);
  const [modifyAndUpdateButton, setModifyAndUpdateButton] = useState(false);
  const [importButton, setImportButton] = useState(false);
  const [jobId, setJobId] = useState('');
  const [status, setStatus] = useState('');
  const [revision, setRevision] = useState(null);
  const [revisionStatus, setRevisionStatus] = useState('');
  const [upsert, setUpsert] = useState(false);
  const [csvUploadtoastId, setCsvUploadtoastId] = useState('');

  // Create a ref to store the latest jobId
  const jobIdRef = useRef(jobId);
  const csvUploadtoastIdRef = useRef(csvUploadtoastId);
  const intervalRef = useRef(null);

  // Update jobIdRef whenever jobId changes
  useEffect(() => {
    setModifyAndUpdateButton(!data?.some( u => (u.error !== null && u.error?.includes('Badge'))) || false);
    if (data.length === 0 ){
      setModifyAndUpdateButton(false);
    }
    setImportButton(data?.length === data?.filter(u => u.error === null).lenght || false);
  }, [data]);

  // Update jobIdRef whenever jobId changes
  useEffect(() => {
    jobIdRef.current = jobId;
    csvUploadtoastIdRef.current = csvUploadtoastId;
  }, [jobId]);


  const getJobStatus = async () => {
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
        // Optionally display a toast
      toast.update(csvUploadtoastIdRef.current, {
        render:response.data.result.message,
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });
        // Update your data as needed from the API result
        const invalidUsers = response.data.result.invalidUsers || [];
        const validUsers = response.data.result.validUsers || [];
        setData([...invalidUsers, ...validUsers]);

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
        getJobStatus();
      }, 1000);

      // Optionally, start an immediate check so user doesn't have to wait the full interval
      getJobStatus();
    }

    // Clean up the interval when component unmounts or jobId changes
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [jobId]);

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
    
    handlePreviewCSV(event.target.files[0]);
  };

  const handlePreviewCSV = async (csv_file) => {
    const previewURL = process.env.SERVER_URL + '/users/import/preview';
    const token = localStorage.getItem("accessToken");
    const toastId = toast.loading("uploading csv ...");
    setCsvUploadtoastId(toastId);

    if (!csv_file) {
      toast.warning('Please select a file to upload.');
      return;
    }

    const formData = new FormData();
    formData.append('file', csv_file); // Append the file to the FormData object

    try {
      const response = await axios.post(previewURL, formData, {
        headers: {
          'Content-Type': 'multipart/form-data', // Set the content type
          Authorization: `Bearer ${token}`, // Add the token to the headers
        },
      });

      setJobId(response.data.jobId);
    } catch (error) {
      console.error('There was a problem with the upload operation:', error);
      toast.error('Error uploading file.'); // Error message
    }
  };
  
  const handleRevision = async (toastId, updatedUser) => {
    const token = localStorage.getItem("accessToken");
    const JobUrl = process.env.SERVER_URL + '/job-status/' + jobIdRef.current;

    try {
      const response = await axios.put(JobUrl, { revision: updatedUser },{
          headers: {
            Authorization: `Bearer ${token}`, // Add the token to the headers
          },
        });

      // Update your data as needed from the API result
      const error = response.data.result.error;
      console.log("error", error);
      setData(prevData =>
        prevData.map(item =>
          item.row == response.data.result.row ? 
          { ...response.data.result } : item
        )
      );

      const config = { isLoading: false, autoClose: 5000, }
      if(!error){
          config.render='User ready for import';
          config.type= "success";
      } else {
        config.render= error;
        if (error.includes('User')){
          config.type= "warning";
        }else{
          config.type= "error";
        }
      }

      toast.update(toastId, config);
    } catch (error) {
      console.error('There was a problem with the update operation', error);
      toast.error('Something went wrong during update'); // Error message
    }
  }

  const handleUserImport = async (upsert) => {
    const token = localStorage.getItem("accessToken");
    const JobUrl = process.env.SERVER_URL + '/users/import/' + jobIdRef.current;
    const toastId = toast.loading("Importing Users ...");
    try {
      const response = await axios.post(JobUrl, { upsert },{
          headers: {
            Authorization: `Bearer ${token}`, // Add the token to the headers
          },
        });

      toast.update(toastId,{
        isLoading: false, 
        render:`${response.data.result.length} users imported`,
        type: "success",
        autoClose: 5000, 
      });

      await getJobStatus();
    } catch (error) {
      console.error('There was a problem with the Import operation', error);
      toast.update(toastId, {
        isLoading: false, 
        render:'Something went wrong during Import',
        type: "error",
        autoClose: 5000, 
      });
    }
  }

  // Handler to update a user with changes from the child
  const updateUser = (updatedUser) => {
    console.log(updatedUser);
    const toastId = toast.loading("uploading csv ...");
    handleRevision(toastId, updatedUser);
  };

  function handleDebug () {
    console.log("data", data);
  }


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
          <div >
            {data && (
              <div>
              <CsvDataTable users={data} onUpdateUser={updateUser}/>
              </div>
            )}
          </div>
      )}
      <div className="inline-flex rounded-md shadow-xs py-2">
      { file ? ( 
        <div className="space-x-2 space-y-2">
        <>
        { modifyAndUpdateButton ? (
            <div className="flex flex-col items-center space-x-2">
          <div>
          <Checkbox id="checkbox" onClick={() => setUpsert(!upsert)} checked={upsert} />
          <Label htmlFor="checkbox" className="text-gray-500"><i>*Update only badge data and not user details </i></Label>
          </div>
          <button  onClick={() => handleUserImport(true)} className="bg-blue-500 text-white text-sm px-4 py-1 rounded">
          Modify and Update                    
          </button>
        </div>
        ): ( null )}
        </>
        <>
        { importButton ? (
          <button  onClick={() => handleUserImport()} className="bg-blue-500 text-white text-sm px-4 py-1 rounded">Import</button>
        ): ( null )}
        </>
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
