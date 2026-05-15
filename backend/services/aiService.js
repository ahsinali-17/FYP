const axios = require("axios");
const FormData = require("form-data");

const analyzeImageWithAI = async (fileBuffer, originalName) => {
  const formData = new FormData();
  formData.append("file", fileBuffer, originalName);
  
  console.log("Sending image to AI Model (Python)...");
  
  const response = await axios.post(
    "http://localhost:5000/predict",
    formData,
    { headers: { ...formData.getHeaders() } }
    // { headers: { "Content-Type": "multipart/form-data", ...formData.getHeaders() },
    //  timeout: 120000 //for cold starts 
    //  }
  );
  
  return response.data;
};

module.exports = { analyzeImageWithAI };