// script to download and install face-api.js models
import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define where to save the models
const modelsDir = path.join(__dirname, '../public/models');

// Create directory if it doesn't exist
if (!fs.existsSync(modelsDir)) {
  fs.mkdirSync(modelsDir, { recursive: true });
  console.log(`Created models directory at ${modelsDir}`);
}

// Define models to download using jsdelivr which doesn't redirect
const models = [
  // TinyFaceDetector model
  {
    name: 'tiny_face_detector_model-weights_manifest.json',
    url: 'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights/tiny_face_detector_model-weights_manifest.json'
  },
  {
    name: 'tiny_face_detector_model-shard1',
    url: 'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights/tiny_face_detector_model-shard1'
  },
  
  // Face Landmark Model
  {
    name: 'face_landmark_68_model-weights_manifest.json',
    url: 'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights/face_landmark_68_model-weights_manifest.json'
  },
  {
    name: 'face_landmark_68_model-shard1',
    url: 'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights/face_landmark_68_model-shard1'
  },
  
  // Face Recognition Model
  {
    name: 'face_recognition_model-weights_manifest.json',
    url: 'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights/face_recognition_model-weights_manifest.json'
  },
  {
    name: 'face_recognition_model-shard1',
    url: 'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights/face_recognition_model-shard1'
  },
  {
    name: 'face_recognition_model-shard2',
    url: 'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights/face_recognition_model-shard2'
  },
  
  // Face Expression Model
  {
    name: 'face_expression_model-weights_manifest.json',
    url: 'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights/face_expression_model-weights_manifest.json'
  },
  {
    name: 'face_expression_model-shard1',
    url: 'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights/face_expression_model-shard1'
  }
];

// Function to download a file
function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${url}, status code: ${response.statusCode}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close(resolve);
        console.log(`Downloaded ${dest}`);
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {}); // Delete the file on error
      reject(err);
    });
    
    file.on('error', (err) => {
      fs.unlink(dest, () => {}); // Delete the file on error
      reject(err);
    });
  });
}

// Download all models
async function downloadModels() {
  console.log('Starting download of face-api.js models...');
  
  for (const model of models) {
    const dest = path.join(modelsDir, model.name);
    
    try {
      await downloadFile(model.url, dest);
    } catch (error) {
      console.error(`Error downloading ${model.name}:`, error);
    }
  }
  
  console.log('All models downloaded successfully!');
  console.log(`Models are saved in ${modelsDir}`);
  console.log('Make sure these files are accessible at /models/* path in your web application.');
}

// Execute the download
downloadModels().catch(console.error); 