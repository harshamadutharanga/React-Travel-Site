import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth, db, storage } from '../../firebase'; // Ensure you have `storage` imported from Firebase
import 'font-awesome/css/font-awesome.min.css';
import $ from 'jquery';
import './sign.css';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { ref, set, get } from 'firebase/database';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import bcrypt from 'bcryptjs';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';

const SignUp = () => {
    const [email, setEmail] = useState('');
    const [emailValid, setEmailValid] = useState(true);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordStrength, setPasswordStrength] = useState('');
    const [error, setError] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phone, setPhone] = useState('');
    const [jobtitle, setJobtitle] = useState('');
    const [profilePicture, setProfilePicture] = useState(null); // State for profile picture
    const [imageUrl, setImageUrl] = useState(''); // State for image URL
    const [verificationSent, setVerificationSent] = useState(false); // State to check if verification email is sent
    const navigate = useNavigate();

    useEffect(() => {
        $('input, select').on('focus', function () {
            $(this).parent().find('.input-group-text').css('border-color', '#80bdff');
        });
        $('input, select').on('blur', function () {
            $(this).parent().find('.input-group-text').css('border-color', '#ced4da');
        });
    }, []);

    const isValidEmail = (email) => {
        const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
        return gmailRegex.test(email);
    };

    const handleEmailChange = (e) => {
        const { value } = e.target;
        setEmail(value);
        setEmailValid(true);

        if (!isValidEmail(value)) {
            setEmailValid(false);
        }
    };

    const checkUserExists = async (phoneNumber, email) => {
        const usersRef = ref(db, 'users');

        try {
            const snapshot = await get(usersRef);

            if (snapshot.exists()) {
                const userData = snapshot.val();
                const userKeys = Object.keys(userData);

                for (let i = 0; i < userKeys.length; i++) {
                    const user = userData[userKeys[i]];

                    if (user.phone === phoneNumber || user.email === email) {
                        return true;
                    }
                }
            }
            return false;
        } catch (error) {
            console.error('Error checking user:', error);
            return true;
        }
    };

    const handleSignUp = async (e) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        const userExists = await checkUserExists(phone, email);
        if (userExists) {
            setError('Phone number or email already in use');
            return;
        }

        if (!isValidEmail(email)) {
            setError('Please enter a valid Gmail address');
            return;
        }

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            await sendEmailVerification(user);
            setVerificationSent(true);
            setError('Verification email sent. Please verify your email before completing registration.');

            // Poll to check if email is verified
            const intervalId = setInterval(async () => {
                await user.reload();
                if (user.emailVerified) {
                    clearInterval(intervalId);

                    // Upload image to Firebase Storage if image is selected
                    let downloadURL = '';
                    if (profilePicture) {
                        const storageRefInstance = storageRef(storage, `profile-images/${user.uid}`);
                        await uploadBytes(storageRefInstance, profilePicture);

                        // Get the image URL
                        downloadURL = await getDownloadURL(storageRefInstance);
                        setImageUrl(downloadURL);
                    }

                    // Save user data including image URL and isLogin status
                    const hashedPassword = await bcrypt.hash(password, 10);
                    const registerDate = new Date().toISOString();

                    await set(ref(db, `users/${user.uid}`), {
                        firstName,
                        lastName,
                        email,
                        phone,
                        jobtitle,
                        password: hashedPassword,
                        registerDate,
                        imageUrl: downloadURL,
                    });

                    setError('');
                    navigate('/login');
                }
            }, 3000); // Check every 3 seconds
        } catch (err) {
            setError(err.message);
        }
    };

    const handlePasswordChange = (e) => {
        const { value } = e.target;
        setPassword(value);

        if (value.length === 0) {
            setPasswordStrength('');
        } else if (value.length < 8) {
            setPasswordStrength('Weak');
        } else if (value.length < 12) {
            setPasswordStrength('Medium');
        } else {
            setPasswordStrength('Strong');
        }
    };



    const handleProfilePictureChange = (e) => {
        if (e.target.files[0]) {
            setProfilePicture(e.target.files[0]);
        }
    };

    return (
        <div className="signup-container">
            <div className="containers">
                <div className="row py-5 mt-4 align-items-center">
                    <div className="col-md-5 pr-lg-5 mb-5 mb-md-0">
                        <img src="https://bootstrapious.com/i/snippets/sn-registeration/illustration.svg" alt="" className="img-fluid mb-3 d-none d-md-block" />
                        <h1>Create an Account</h1>
                        <p className="font-italic text-muted mb-0">Create a minimal registration page using Bootstrap 4 HTML form elements.</p>
                        <p className="font-italic text-muted">Snippet By <a href="https://bootstrapious.com" className="text-muted"><u>Bootstrapious</u></a></p>
                    </div>

                    <div className="col-md-7 col-lg-6 ml-auto cardform">
                        <form onSubmit={handleSignUp}>
                            <div className="row">
                                <div className="input-group col-lg-6 mb-4">
                                    <div className="input-group-prepend">
                                        <span className="input-group-text bg-white px-4 border-md border-right-0">
                                            <i className="fa fa-user text-muted"></i>
                                        </span>
                                    </div>
                                    <input
                                        id="firstName"
                                        type="text"
                                        name="firstname"
                                        placeholder="First Name"
                                        className="form-control bg-white border-left-0 border-md"
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                    />
                                </div>

                                <div className="input-group col-lg-6 mb-4">
                                    <div className="input-group-prepend">
                                        <span className="input-group-text bg-white px-4 border-md border-right-0">
                                            <i className="fa fa-user text-muted"></i>
                                        </span>
                                    </div>
                                    <input
                                        id="lastName"
                                        type="text"
                                        name="lastname"
                                        placeholder="Last Name"
                                        className="form-control bg-white border-left-0 border-md custom-input"
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                    />
                                </div>

                                <div className="input-group col-lg-12 mb-4">
                                    <div className="input-group-prepend">
                                        <span className="input-group-text bg-white px-4 border-md border-right-0">
                                            <i className="fa fa-envelope text-muted"></i>
                                        </span>
                                    </div>
                                    <input
                                        id="email"
                                        type="email"
                                        name="email"
                                        placeholder="Email Address"
                                        className={`form-control bg-white border-left-0 border-md ${emailValid ? '' : 'is-invalid'}`}
                                        value={email}
                                        onChange={handleEmailChange}
                                    />
                                    {!emailValid && <div className="invalid-feedback">Please enter a valid Gmail address.</div>}
                                </div>

                                <div className="input-group col-lg-6 mb-4 text-info" >
                                    <PhoneInput
                                        country={'lk'}
                                        value={phone}
                                        onChange={setPhone}
                                        inputProps={{
                                            name: 'phone',
                                            required: true,
                                            autoFocus: false,
                                        }}
                                        containerStyle={{ maxWidth: '300px' }}
                                        inputStyle={{ width: '100%' }}
                                        buttonStyle={{ borderLeft: '1px solid #ced4da' }}
                                    />
                                </div>

                                <div className="input-group col-lg-6 mb-4" style={{ height: '40px' }} >
                                    <div className="input-group-prepend">
                                        <span className="input-group-text bg-white px-4 border-md border-right-0">
                                            <i className="fa fa-briefcase text-muted"></i>
                                        </span>
                                    </div>
                                    <select
                                        id="jobtitle"
                                        name="jobtitle"
                                        className="form-control bg-white border-left-0 border-md"
                                        value={jobtitle}
                                        onChange={(e) => setJobtitle(e.target.value)}
                                    >
                                        <option value="">Select Job Title</option>
                                        <option value="Developer">Developer</option>
                                        <option value="Designer">Designer</option>
                                        <option value="Manager">Manager</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>

                                <div className="input-group col-lg-12 mb-4">
                                    <div className="input-group-prepend">
                                        <span className="input-group-text bg-white px-4 border-md border-right-0">
                                            <i className="fa fa-picture-o text-muted"></i>
                                        </span>
                                    </div>
                                    <input
                                        type="file"
                                        className="form-control bg-white border-left-0 border-md pt-2"
                                        onChange={handleProfilePictureChange}
                                    />
                                </div>

                                <div className="input-group col-lg-6 mb-4">
                                    <div className="input-group-prepend">
                                        <span className="input-group-text bg-white px-4 border-md border-right-0">
                                            <i className="fa fa-lock text-muted"></i>
                                        </span>
                                    </div>
                                    <input
                                        id="password"
                                        type="password"
                                        name="password"
                                        placeholder="Password"
                                        className="form-control bg-white border-left-0 border-md"
                                        value={password}
                                        onChange={handlePasswordChange}
                                    />
                                </div>

                                <div className="input-group col-lg-6 mb-4">
                                    <div className="input-group-prepend">
                                        <span className="input-group-text bg-white px-4 border-md border-right-0">
                                            <i className="fa fa-lock text-muted"></i>
                                        </span>
                                    </div>
                                    <input
                                        id="confirmPassword"
                                        type="password"
                                        name="confirmPassword"
                                        placeholder="Confirm Password"
                                        className="form-control bg-white border-left-0 border-md"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                    />
                                </div>

                                <div className="form-group col-lg-12 mx-auto mb-0">
                                    <button type="submit" className="btn btn-primary btn-block py-2">
                                        <span className="font-weight-bold">Create your account</span>
                                    </button>
                                </div>

                                <div className="text-center w-100">
                                    <p className="text-muted font-weight-bold mt-2 mb-0">Already Registered?<Link to="/login" className="text-primary ml-1">Login</Link></p>
                                </div>

                                <div className="form-group col-lg-12 mx-auto d-flex align-items-center my-4">
                                    <div className="border-bottom w-100 ml-5"></div>
                                    <span className="px-2 small text-muted font-weight-bold text-muted">OR</span>
                                    <div className="border-bottom w-100 mr-5"></div>
                                </div>

                                <div className="form-group col-lg-12 mx-auto">
                                    <button type="submit" className="btn btn-primary btn-block py-2 btn-facebook">
                                        <i className="fa fa-facebook-f mr-2"></i>
                                        <span className="font-weight-bold">Continue with Facebook</span>
                                    </button>
                                    <button type="submit" className="btn btn-primary btn-block py-2 btn-google">
                                        <i className="fa fa-google mr-2"></i>
                                        <span className="font-weight-bold">Continue with Google</span>
                                    </button>
                                </div>
                            </div>
                        </form>
                        {error && <p className="text-danger mt-3"></p>}
                        {verificationSent && <p className="text-success mt-3">Verification email sent. Please verify your email before completing registration.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SignUp;
