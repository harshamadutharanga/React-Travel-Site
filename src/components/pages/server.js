// server.js
const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const { initializeApp, applicationDefault, cert } = require('firebase-admin/app');
const { getDatabase, ref, set, get } = require('firebase-admin/database');

// Initialize Firebase Admin SDK
const serviceAccount = require('./path/to/serviceAccountKey.json'); // Replace with path to your serviceAccountKey.json

initializeApp({
  credential: cert(serviceAccount),
  databaseURL: "https://totemic-realm-422804-f0-default-rtdb.firebaseio.com/" // Replace with your Firebase Realtime Database URL
});

const db = getDatabase();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Create a transport instance using your email provider's configuration
const transporter = nodemailer.createTransport({
  service: 'Gmail', // Change to your email provider
  auth: {
    user: 'hichchithushara@gmail.com',
    pass: 'vaqw suup igpt udlz'
  }
});

app.post('/send-otp', async (req, res) => {
  const { email } = req.body;
  const otp = crypto.randomInt(100000, 999999).toString(); // Generate a 6-digit OTP

  // Save OTP to Realtime Database
  await set(ref(db, `otps/${email}`), { otp });

  // Send OTP email
  try {
    await transporter.sendMail({
      from: 'hichchithushara@gmail.com',
      to: email,
      subject: 'Your OTP Code',
      text: `Your OTP code is ${otp}`
    });
    res.status(200).send({ message: 'OTP sent' });
  } catch (error) {
    res.status(500).send({ error: 'Failed to send OTP' });
  }
});

app.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;
  const otpSnapshot = await get(ref(db, `otps/${email}`));

  if (otpSnapshot.exists() && otpSnapshot.val().otp === otp) {
    // Clear the OTP after verification
    await set(ref(db, `otps/${email}`), null);
    res.status(200).send({ message: 'OTP verified' });
  } else {
    res.status(400).send({ error: 'Invalid OTP' });
  }
});

app.listen(5000, () => {
  console.log('Server is running on port 5000');
});
