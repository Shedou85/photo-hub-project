import React, { useState } from 'react';

function PhotoUploader() {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');
  const [uploadedImageUrl, setUploadedImageUrl] = useState('');

  const onFileChange = (event) => {
    setFile(event.target.files[0]);
    setUploadedImageUrl('');
    setMessage('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');
    setUploadedImageUrl('');

    if (!file) {
      setMessage('Please select a file to upload.');
      return;
    }

    const formData = new FormData();
    formData.append('photo', file); // 'photo' must match the key the server expects

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/upload`, {
        method: 'POST',
        // Note: Do not set 'Content-Type' header for FormData.
        // The browser will automatically set it to 'multipart/form-data'
        // with the correct boundary.
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`Upload successful!`);
        // Construct the full URL for display
        const fullUrl = `${import.meta.env.VITE_API_BASE_URL}${data.url}`;
        setUploadedImageUrl(fullUrl);
      } else {
        setMessage(`Upload failed: ${data.message}`);
      }
    } catch (error) {
      setMessage(`An error occurred: ${error.message}`);
    }
  };

  return (
    <div>
      <h2>Upload a Photo</h2>
      <form onSubmit={handleSubmit}>
        <input type="file" onChange={onFileChange} accept="image/png, image/jpeg, image/gif" />
        <button type="submit">Upload</button>
      </form>
      {message && <p>{message}</p>}
      {uploadedImageUrl && (
        <div>
          <p>Image URL:</p>
          <a href={uploadedImageUrl} target="_blank" rel="noopener noreferrer">{uploadedImageUrl}</a>
          <div>
            <img src={uploadedImageUrl} alt="Uploaded preview" style={{ maxWidth: '400px', marginTop: '10px' }} />
          </div>
        </div>
      )}
    </div>
  );
}

export default PhotoUploader;
