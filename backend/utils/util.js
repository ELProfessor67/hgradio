
import nodemailer from "nodemailer"


export const sendEmail = async ({ to, subject, html }) => {
  const transporter = nodemailer.createTransport({
    service: "Gmail", 
    auth: {
      user: process.env.EMAIL_ADMIN,
      pass: process.env.EMAIL_ADMIN_PASS,
    },
  });

  await transporter.sendMail({
    from: `"Radio-Station" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });
};


// import { v2 as cloudinary } from 'cloudinary'

// cloudinary.config({
//   cloud_name: 'ddlwhkn3b',
//   api_key: '814734539723169',
//   api_secret: 'TvKlJO5Io-37u0B0PyiJ1WUTA1o',
// });

// export const getVideoDuration = async (videoUrl) => {
//   try {
//     const uploadIndex = videoUrl.indexOf('/upload/');
//     if (uploadIndex === -1) return null;

//     const pathAfterUpload = videoUrl.substring(uploadIndex + 8);

//     const pathParts = pathAfterUpload.split('/');
//     if (pathParts[0].startsWith('v')) {
//       pathParts.shift(); 
//     }

//     const lastPart = pathParts[pathParts.length - 1];
//     pathParts[pathParts.length - 1] = lastPart.replace(/\.[^/.]+$/, '');

//     const publicId = pathParts.join('/');

//     const result = await cloudinary.api.resource(publicId, {
//       resource_type: 'video',
//     });

//     console.log(result);
    

//     return result.duration; 
//   } catch (err) {
//     console.error('Failed to fetch video metadata:', err.message);
//     return null;
//   }
// };


import ffmpeg from 'fluent-ffmpeg';

export const getVideoDuration = (videoUrl) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoUrl, (err, metadata) => {
      if (err) {
        console.error('FFProbe error:', err);
        return reject(null);
      }

      const duration = metadata.format?.duration
      resolve(duration || 0);
    });
  });
};