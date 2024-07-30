import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAuth, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { ref, get, set } from 'firebase/database';
import { db } from '../../firebase';
import './login.css';

const Login = () => {
    const [emailOrPhone, setEmailOrPhone] = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState(new Array(6).fill(''));
    const [isOtpSent, setIsOtpSent] = useState(false);
    const [error, setError] = useState('');
    const [timer, setTimer] = useState(60);
    const [resendVisible, setResendVisible] = useState(false);
    const [isPasswordLogin, setIsPasswordLogin] = useState(true);
    const navigate = useNavigate();
    const auth = getAuth();

    const checkUserExists = async () => {
        const userSnapshot = await get(ref(db, 'users'));
        const users = userSnapshot.val();
        let userFound = null;

        Object.keys(users).forEach((key) => {
            const user = users[key];
            if (user.email === emailOrPhone || user.phone === emailOrPhone) {
                userFound = { ...user, id: key };
            }
        });

        return userFound;
    };

    const handleGoogleLogin = async () => {
        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            const userName = user.displayName || user.email;
            const userPhotoUrl = user.photoURL;

            const userRef = ref(db, `users/${user.uid}`);

            const snapshot = await get(userRef);
            if (!snapshot.exists()) {
                await set(userRef, {
                    name: userName,
                    imgUrl: userPhotoUrl,
                    emailg: user.email,
                });
            }

            navigate('/dashboard');
        } catch (err) {
            setError(`Error logging in with Google: ${err.message}`);
            console.error('Google Login Error:', err);
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const userFound = await checkUserExists();

            if (!userFound) {
                setError('Email or Phone not found');
                return;
            }

            if (isOtpSent) {
                const otpCode = otp.join('');
                const response = await fetch('http://localhost:5000/api/verify-otp', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: emailOrPhone, otp: otpCode })
                });

                if (response.ok) {
                    const data = await response.json();
                    console.log('OTP verification response:', data);

                    if (data.message === 'OTP verified') {
                        await updateLoggedInStatus(userFound.id, true);
                        await set(ref(db, `users/${userFound.id}/otpStatus`), null);

                        await signInWithEmailAndPassword(auth, userFound.email, password);

                        navigate('/dashboard');
                    } else {
                        setError('Invalid OTP');
                    }
                } else {
                    const errorData = await response.json();
                    if (errorData.error === 'Invalid or expired OTP') {
                        setError('OTP expired or invalid');
                    } else {
                        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
                    }
                }
            }
        } catch (err) {
            setError(`Error logging in: ${err.message}`);
            console.error('Login Error:', err);
        }
    };

    const sendOtp = async () => {
        try {
            const userFound = await checkUserExists();

            if (!userFound) {
                setError('Email or Phone not found');
                return;
            }

            const response = await fetch('http://localhost:5000/api/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: emailOrPhone })
            });

            if (response.ok) {
                const data = await response.json();
                if (data.message === 'OTP sent') {
                    setIsOtpSent(true);
                    setError('');
                    setResendVisible(false);
                    setTimer(60);
                    setOtp(new Array(6).fill('')); // Clear OTP input data
                } else {
                    setError(data.error || 'Failed to send OTP');
                }
            } else {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }
        } catch (err) {
            setError(`Error sending OTP: ${err.message}`);
            console.error('Send OTP Error:', err);
        }
    };

    const updateLoggedInStatus = async (userId, isLoggedIn) => {
        try {
            const userRef = ref(db, `users/${userId}/isLogin`);
            await set(userRef, isLoggedIn);
            console.log(`User ${userId} isLoggedIn status updated to ${isLoggedIn}`);
        } catch (err) {
            console.error('Error updating login status:', err);
        }
    };

    useEffect(() => {
        let timerId;
        if (isOtpSent && timer > 0) {
            timerId = setInterval(() => {
                setTimer(prev => {
                    if (prev <= 1) {
                        setResendVisible(true);
                        clearInterval(timerId);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else if (timer <= 0) {
            setResendVisible(true);
        }
        return () => clearInterval(timerId);
    }, [isOtpSent, timer]);

    const handleOtpChange = (e, index) => {
        const { value } = e.target;
        if (/^[0-9]$/.test(value) || value === '') {
            const newOtp = [...otp];
            newOtp[index] = value;
            setOtp(newOtp);

            if (value !== '' && index < otp.length - 1) {
                document.getElementById(`otp-input-${index + 1}`).focus();
            }
        }
    };

    const handleBackspace = (e, index) => {
        if (e.key === 'Backspace' && index > 0 && otp[index] === '') {
            document.getElementById(`otp-input-${index - 1}`).focus();
        }
    };

    return (
        <div className="login-container">
            <div className="container">
                <div className="row py-5 mt-4 align-items-center">
                    <div className="col-md-6 pr-lg-5 mb-5 mb-md-0">
                        <img
                            src="https://bootstrapious.com/i/snippets/sn-registeration/illustration.svg"
                            alt=""
                            className="img-fluid mb-3 d-none d-md-block"
                        />
                        <h1>Welcome Back!</h1>
                        <p className="font-italic text-muted mb-0">Login to your account to access your dashboard.</p>
                    </div>

                    <div className="col-md-6 col-lg-5 ml-auto">
                        <form onSubmit={handleLogin}>
                            <div className="row">
                                <div className="input-group col-lg-12 mb-4">
                                    <div className="input-group-prepend">
                                        <span className="input-group-text bg-white px-4 border-md border-right-0">
                                            <i className="fa fa-envelope text-muted"></i>
                                        </span>
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Email or Phone Number"
                                        className="form-control bg-white border-left-0 border-md"
                                        value={emailOrPhone}
                                        onChange={(e) => setEmailOrPhone(e.target.value)}
                                    />
                                </div>

                                {!isOtpSent && (
                                    <>
                                        <div className="input-group col-lg-12 mb-4">
                                            <div className="input-group-prepend">
                                                <span className="input-group-text bg-white px-4 border-md border-right-0">
                                                    <i className="fa fa-lock text-muted"></i>
                                                </span>
                                            </div>
                                            <input
                                                type="password"
                                                placeholder="Password"
                                                className="form-control bg-white border-left-0 border-md"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                            />
                                        </div>

                                        <div className="form-group col-lg-12 mx-auto mb-0">
                                            <button
                                                type="button"
                                                className={`btn btn-secondary btn-block py-2 ${password ? '' : 'd-none'}`}
                                                onClick={sendOtp}
                                            >
                                                <span className="font-weight-bold">Send OTP</span>
                                            </button>
                                        </div>
                                    </>
                                )}

                                {isOtpSent && (
                                    <>
                                        <div className="input-group col-lg-12 mb-4">
                                            <div className="otp-input-container">
                                                {otp.map((value, index) => (
                                                    <input
                                                        key={index}
                                                        id={`otp-input-${index}`}
                                                        type="text"
                                                        className="otp-input"
                                                        value={value}
                                                        onChange={(e) => handleOtpChange(e, index)}
                                                        onKeyDown={(e) => handleBackspace(e, index)}
                                                        maxLength="1"
                                                    />
                                                ))}
                                            </div>
                                        </div>

                                        <div className="form-group col-lg-12 mx-auto mb-0">
                                            <button type="submit" className="btn btn-primary btn-block py-2">
                                                <span className="font-weight-bold">Verify OTP</span>
                                            </button>
                                        </div>

                                        {timer > 0 && (
                                            <div className="text-center text-info w-100 mt-3">
                                                <span>OTP expires in {timer} seconds</span>
                                            </div>
                                        )}

                                        {resendVisible && (
                                            <div className="text-center text-info w-100">
                                                <span>Didn't receive the OTP?</span>
                                                <button
                                                    type="button"
                                                    className="btn btn-link text-info"
                                                    onClick={sendOtp}
                                                >
                                                    Resend OTP
                                                </button>
                                            </div>
                                        )}
                                    </>
                                )}

                                <div className="text-center w-100">
                                    <p className="text-muted font-weight-bold">
                                        Or login with:
                                    </p>
                                    <button
                                        type="button"
                                        className="btn btn-primary"
                                        onClick={handleGoogleLogin}
                                    >
                                        <i className="fa fa-google mr-2"></i>
                                        Google
                                    </button>
                                </div>

                                <div className="text-center w-100">
                                    <p className="text-muted font-weight-bold">
                                        No account yet? <Link to="/signup" className="text-primary ml-2">Sign up here</Link>
                                    </p>
                                </div>
                            </div>
                        </form>

                        {error && <p className="text-danger mt-3">{error}</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
