import axios from "axios";

const cloudName = "ddlwhkn3b";
const api = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

export const uploadFile = async (file: File): Promise<string | null> => {
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "images_preset");
    formData.append("folder", "SIDESONE");

    const res = await axios.post<{ secure_url: string }>(api, formData);
    return res.data.secure_url;
  } catch (error) {
    console.error("Error uploading file:", error);
    return null;
  }
};

const pdfApi = `https://api.cloudinary.com/v1_1/${cloudName}/raw/upload`;

export const uploadPdf = async (file: File): Promise<string | null> => {

  if (file.type !== "application/pdf") {
  return "Only PDF files are allowed."
}


  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "images_preset"); 
    formData.append("folder", "SIDESONE/pdfNotes");    

    const res = await axios.post<{ secure_url: string }>(pdfApi, formData);
    return res.data.secure_url;
  } catch (error) {
    console.error("Error uploading PDF:", error);
    return null;
  }
};


const videoApi = `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`;

export const uploadVideo = async (file: File): Promise<string | null> => {
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "videos_preset"); 
    formData.append("folder", "SIDESONE");

    const res = await axios.post<{ secure_url: string }>(videoApi, formData);
    return res.data.secure_url;
  } catch (error) {
    console.error("Error uploading video:", error);
    return null;
  }
};