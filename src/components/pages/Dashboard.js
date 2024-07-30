import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/database';
import 'firebase/compat/storage'; // Import Firebase Storage
import { Line, Pie } from 'react-chartjs-2';
import 'chart.js/auto';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import './Dashboard.css';
import 'font-awesome/css/font-awesome.min.css';
import Product from './product'; // Make sure the path to Product is correct
import Place from './place'
import UserDetails from './UserDetails'; // Import UserDetails component
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCog } from '@fortawesome/free-solid-svg-icons';

const Dashboard = () => {
    const navigate = useNavigate();
    const [userCounts, setUserCounts] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [activeUserCount, setActiveUserCount] = useState(0);
    const [inactiveUserCount, setInactiveUserCount] = useState(0);
    const [jobTitleCounts, setJobTitleCounts] = useState({});
    const [userDetails, setUserDetails] = useState({
        firstName: '',
        lastName: '',
        jobtitle: '',
        phone: '',
        email: '',
        imageUrl: '',
    });
    const [view, setView] = useState('dashboard'); // Add state for managing views
    const [unregisterUserCount, setUnregisterUserCount] = useState(0); // State for unregister user count
    const [newMembers, setNewMembers] = useState([]); // State for storing the latest 5 users

    const handleViewChange = (viewName) => {
        setView(viewName);
    };

    useEffect(() => {
        // Fetch user details from Firebase
        const fetchUserDetails = async () => {
            const userId = firebase.auth().currentUser.uid;
            const userRef = firebase.database().ref(`users/${userId}`);
            const snapshot = await userRef.once('value');
            const data = snapshot.val();
            if (data) {
                setUserDetails(data);
                if (!data.registerDate) {
                    // User is not registered
                    setView('dashboard'); // Redirect to dashboard view if not registered
                    return;
                }
            }
        };

        fetchUserDetails();
    }, []);

    useEffect(() => {
        const database = firebase.database();
        const usersRef = database.ref('users');

        // Generate last 7 days array
        const generateLast7Days = () => {
            const result = [];
            for (let i = 6; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                result.push(date.toLocaleDateString());
            }
            return result;
        };

        const last7Days = generateLast7Days();

        // Fetch users data
        usersRef.on('value', (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const dateCounts = last7Days.reduce((acc, date) => {
                    acc[date] = 0;
                    return acc;
                }, {});
                const jobTitleCounts = {};
                let activeCount = 0;
                let inactiveCount = 0;
                let unregisterCount = 0;

                const allUsers = Object.values(data);
                const latestUsers = allUsers
                    .sort((a, b) => new Date(b.registerDate) - new Date(a.registerDate)) // Sort by registration date
                    .slice(0, 5); // Get latest 5 users

                setNewMembers(latestUsers);

                for (const key in data) {
                    if (data.hasOwnProperty(key)) {
                        const user = data[key];
                        const registerDate = user.registerDate ? new Date(user.registerDate).toLocaleDateString() : 'Googl User';

                        if (registerDate in dateCounts) {
                            dateCounts[registerDate]++;
                        }

                        const jobTitle = user.jobtitle || 'Googl User';
                        if (jobTitle in jobTitleCounts) {
                            jobTitleCounts[jobTitle]++;
                        } else {
                            jobTitleCounts[jobTitle] = 1;
                        }

                        if (user.isActive) {
                            activeCount++;
                        } else {
                            inactiveCount++;
                        }

                        if (!user.registerDate) {
                            unregisterCount++;
                        }
                    }
                }

                setUserCounts(last7Days.map(date => ({
                    date,
                    count: dateCounts[date]
                })));
                setTotalCount(Object.keys(data).length - unregisterCount); // Total registered users
                setActiveUserCount(activeCount);
                setInactiveUserCount(inactiveCount);
                setJobTitleCounts(jobTitleCounts);
                setUnregisterUserCount(unregisterCount); // Update unregister user count
            } else {
                setUserCounts(last7Days.map(date => ({ date, count: 0 })));
                setTotalCount(0);
                setActiveUserCount(0);
                setInactiveUserCount(0);
                setJobTitleCounts({});
                setUnregisterUserCount(0); // No unregister users
            }
        }, (error) => {
            console.error('Error fetching user counts:', error);
        });

        // Clean up listener
        return () => {
            usersRef.off();
        };
    }, []);

    useEffect(() => {
        const user = firebase.auth().currentUser;
        if (user) {
            const userRef = firebase.database().ref('users').child(user.uid);
            userRef.on('value', (snapshot) => {
                const data = snapshot.val();
                if (data) {
                    setUserDetails({
                        firstName: data.firstName || '',
                        lastName: data.lastName || '',
                        jobtitle: data.jobtitle || '',
                        phone: data.phone || '',
                        email: user.email || '',
                        imageUrl: data.imageUrl || '',
                    });
                }
            });

            return () => {
                userRef.off();
            };
        }
    }, []);

    useEffect(() => {
        // Handle user login and logout for managing sessions
        const handleAuthStateChanged = (user) => {
            if (user) {
                const sessionId = new Date().getTime(); // Unique session ID
                const userRef = firebase.database().ref('users').child(user.uid);

                // Create or update session
                const sessionsRef = userRef.child('sessions');
                sessionsRef.child(sessionId).set(true);

                // Update isActive status if there are active sessions
                sessionsRef.once('value', (snapshot) => {
                    const sessionsData = snapshot.val();
                    if (sessionsData) {
                        const hasActiveSessions = Object.keys(sessionsData).length > 0;
                        userRef.update({ isActive: hasActiveSessions });
                    }
                });

                // Clean up session on logout
                const handleSignOut = async () => {
                    sessionsRef.child(sessionId).remove();
                    const remainingSessionsSnapshot = await sessionsRef.once('value');
                    const remainingSessions = remainingSessionsSnapshot.val();
                    const hasActiveSessions = remainingSessions && Object.keys(remainingSessions).length > 0;
                    userRef.update({ isActive: hasActiveSessions });
                };

                // Set up sign-out listener
                const unsubscribe = firebase.auth().onAuthStateChanged((authUser) => {
                    if (!authUser) {
                        handleSignOut();
                    }
                });

                // Clean up listener
                return () => unsubscribe();
            }
        };

        const unsubscribe = firebase.auth().onAuthStateChanged(handleAuthStateChanged);

        return () => unsubscribe();
    }, []);

    const handleLogout = async () => {
        try {
            // Get the current user
            const user = firebase.auth().currentUser;
            if (user) {
                const userRef = firebase.database().ref(`users/${user.uid}`);
    
                // Check if the user has a `registerDate` field
                const userSnapshot = await userRef.once('value');
                const userData = userSnapshot.val();
    
                if (userData) {
                    if (!userData.registerDate) {
                        // Remove all session references
                        const sessionsRef = userRef.child('sessions');
                        await sessionsRef.remove(); // Remove all sessions
    
                        // Delete the user if there is no `registerDate`
                        await userRef.remove();
                    } else {
                        // Update `isActive` to false in Realtime Database if `registerDate` exists
                        await userRef.update({ isActive: false });
                    }
    
                    // Now sign the user out
                    await firebase.auth().signOut();
    
                    // Redirect to the login page after logout
                    navigate('/login');
                } else {
                    console.error('User data not found');
                }
            }
        } catch (error) {
            console.error('Error logging out:', error);
        }
    };
    
    
    // Function to handle file upload
    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        const storageRef = firebase.storage().ref(`profile_pictures/${file.name}`);
        try {
            // Upload file to Firebase Storage
            const snapshot = await storageRef.put(file);
            const downloadUrl = await snapshot.ref.getDownloadURL();

            // Update user details with imageUrl in Firebase Realtime Database
            const user = firebase.auth().currentUser;
            if (user) {
                const userRef = firebase.database().ref('users').child(user.uid);
                await userRef.update({ imageUrl: downloadUrl });

                // Update local state with new imageUrl
                setUserDetails(prevDetails => ({
                    ...prevDetails,
                    imageUrl: downloadUrl,
                }));
            }
        } catch (error) {
            console.error('Error uploading file:', error);
        }
    };

    const jobTitleData = {
        labels: Object.keys(jobTitleCounts),
        datasets: [
            {
                label: 'Job Title',
                data: Object.values(jobTitleCounts),
                backgroundColor: [
                    '#FF6384',
                    '#36A2EB',
                    '#FFCE56',
                    '#FF9900',
                    '#33FF99',
                    '#9966FF',
                ],
                borderWidth: 1,
            },
        ],
    };

    const jobTitleOptions = {
        plugins: {
            tooltip: {
                callbacks: {
                    label: (tooltipItem) => {
                        const label = jobTitleData.labels[tooltipItem.dataIndex] || '';
                        const dataset = jobTitleData.datasets[0];
                        const total = dataset.data.reduce((accumulator, currentValue) => accumulator + currentValue, 0);
                        const currentValue = dataset.data[tooltipItem.dataIndex];
                        const percentage = total > 0 ? ((currentValue / total) * 100).toFixed(2) : 0;
                        return `${label}: ${currentValue} (${percentage}%)`;
                    },
                },
            },
            datalabels: {
                formatter: (value, context) => {
                    return context.chart.data.labels[context.dataIndex];
                },
                color: '#fff',
                labels: {
                    title: {
                        font: {
                            weight: 'bold',
                        },
                    },
                },
            },
        },
    };

    const chartData = {
        labels: userCounts.map(item => item.date),
        datasets: [
            {
                label: 'User Count',
                data: userCounts.map(item => item.count),
                borderColor: 'rgba(75,192,192,1)',
                backgroundColor: 'rgba(75,192,192,0.2)',
                fill: true,
            },
        ],
    };

    const chartOptions = {
        scales: {
            x: {
                title: {
                    display: true,
                    text: 'Date',
                },
                ticks: {
                    maxTicksLimit: 7,
                },
            },
            y: {
                title: {
                    display: true,
                    text: 'Count',
                },
                beginAtZero: true,
                ticks: {
                    precision: 0,
                    suggestedMin: 0,
                    stepSize: 1,
                    suggestedMax: 10,
                },
            },
        },
    };

    // Conditionally render content based on the view state
    const renderContent = () => {
        switch (view) {
            case 'userDetails':
                return (
                    <UserDetails
                        userDetails={userDetails}
                        setUserDetails={setUserDetails} // Pass setUserDetails function to UserDetails component
                        handleFileUpload={handleFileUpload}
                    />
                );
            case 'Products':
                return (
                    <Product />
                );
            case 'Place':
                return (
                    <Place />
                );

            case 'dashboard':
            default:
                return (
                    <>
                        <div className="row">
                            <div className="col-lg-3 col-md-6 col-sm-12 mb-3">
                                <div className="card small-card1">
                                    <div className="card-body text-center user">
                                        <i className="fa fa-user mr-2 fa-1x"></i>
                                        <h1 className="card-title1 h4" style={{ fontSize: '25px' }}>{totalCount}</h1>
                                        <p>Register Users</p>
                                    </div>
                                </div>
                            </div>
            
                            <div className="col-lg-3 col-md-6 col-sm-12 mb-3">
                                <div className="card small-card2">
                                    <div className="card-body text-center user">
                                        <i className="fa fa-user mr-2 fa-1x fa-beat"></i>
                                        <h1 className="card-title1 h4" style={{ fontSize: '25px' }}>{activeUserCount}</h1>
                                        <p>Active Users</p>
                                    </div>
                                </div>
                            </div>
            
                            <div className="col-lg-3 col-md-6 col-sm-12 mb-3">
                                <div className="card small-card3">
                                    <div className="card-body text-center">
                                        <i className="fa fa-user-times mr-2" style={{ fontSize: '15px' }}></i>
                                        <h1 className="card-title1 h4 card3" style={{ fontSize: '25px' }}>{inactiveUserCount}</h1>
                                        <p>Inactive Users</p>
                                    </div>
                                </div>
                            </div>
            
                            <div className="col-lg-3 col-md-6 col-sm-12 mb-3">
                                <div className="card small-card4">
                                    <div className="card-body text-center">
                                        <FontAwesomeIcon
                                            icon={faCog}
                                            spin
                                            style={{
                                                '--fa-animation-duration': '15s',
                                                color: '#bd3041',
                                                fontSize: '16px',
                                                border: '3px solid #f7d1c7',
                                                backgroundColor: '#f7d1c7',
                                                borderRadius: '50%',
                                                padding: '12px',
                                                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.05)'
                                            }}
                                        />
                                        <h1 className="card-title1 h4">{unregisterUserCount}</h1>
                                        <p>Unregister Active</p>
                                    </div>
                                </div>
                            </div>
            
                            <div className="col-lg-6 col-md-6 col-sm-12 mb-3">
                                <div className="card small-card">
                                    <div className="card-body">
                                        <Line data={chartData} options={chartOptions} />
                                    </div>
                                </div>
                            </div>
            
            
                            <div className="col-lg-3 col-md-6 col-sm-12 mb-3">
                                <div className="card small-card">
                                    <div className="card-body">
                                        <div style={{ width: '100%', height: '300px' }}>
                                            <Pie data={jobTitleData} options={jobTitleOptions} plugins={[ChartDataLabels]} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                        <div className="col-lg-3 col-md-6 col-sm-12 mb-3">
                            <div className="card small-card shadow-sm border-light">
                                <div className="card-body">
                                    <div className="new-members">
                                        <h2 className="text-center mb-4">New Members</h2>
                                        <ul className="list-unstyled">
                                            {newMembers.slice(0, 5).map((user, index) => (
                                                <li key={index} className="d-flex align-items-center mb-3">
                                                    <img
                                                        src={user.imageUrl || user.imgUrl}
                                                        alt={`${user.firstName} ${user.lastName}`}
                                                        className="rounded-circle me-2"
                                                        width="50"
                                                        height="50"
                                                    />
                                                    <p className="mb-0">
                                                        <strong>{user.firstName} {user.lastName}{user.name}</strong>
                                                        <br />
                                                        <small className="text-muted">{new Date(user.registerDate).toLocaleDateString('en-CA')}</small>
                                                    </p>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>    
                    </>
                );
        }
    };

    return (
        <div className="container-fluid">
            <div className="row">
                <nav id="sidebar" className="col-md-3 col-lg-2 d-md-block">
                    <div className="card sidebar-card">
                        <div className="card-body">
                            <div className="profile text-center mb-4">
                                <label htmlFor="profilePictureInput" className="profile-picture-label">
                                    <img src={userDetails.imageUrl || userDetails.imgUrl} alt="Profile" className="profile-picture img-fluid rounded-circle mb-3" />
                                </label>
                                <h4 className="card-title mb-0">{userDetails.firstName }{userDetails.lastName} {userDetails.name}</h4>
                                <p className="card-text text-muted">{userDetails.jobtitle || 'Google User'}</p>
                            </div>
                            <hr />
                            <ul className="nav flex-column">
                                <li className="nav-item">
                                    <Link to="/" className="nav-link">
                                        <i className="fa fa-home mr-2"></i> Home
                                    </Link>
                                </li>
                                <li className="nav-item">
                                    <Link to="#" className={`nav-link ${view === 'dashboard' ? 'active' : ''}`} onClick={() => handleViewChange('dashboard')}>
                                        <i className="fa fa-tachometer mr-2"></i> Dashboard
                                    </Link>
                                </li>
                                {userDetails.registerDate && (
                                    <li className="nav-item">
                                        <Link to="#" className={`nav-link ${view === 'userDetails' ? 'active' : ''}`} onClick={() => handleViewChange('userDetails')}>
                                            <i className="fa fa-user mr-2"></i> User Details
                                        </Link>
                                    </li>
                                )}
                                <li className="nav-item">
                                    <Link to="#" className={`nav-link ${view === 'Products' ? 'active' : ''}`} onClick={() => handleViewChange('Products')}>
                                        <i className="fa fa-archive mr-2"></i> Products
                                    </Link>
                                </li>
                                <li className="nav-item">
                                    <Link to="#" className={`nav-link ${view === 'Place' ? 'active' : ''}`} onClick={() => handleViewChange('Place')}>
                                        <i className="fa fa-map-marker mr-2"></i> Places
                                    </Link>
                                </li>
                                <li className="nav-item">
                                    <Link to="#" className="nav-link">
                                        <i className="fa fa-calendar mr-2"></i> Bookings
                                    </Link>
                                </li>
                                <li className="nav-item">
                                    <Link to="#" className="nav-link">
                                        <i className="fa fa-address-book mr-2"></i> Contacts
                                    </Link>
                                </li>
                                <li className="nav-item">
                                    <Link to="#" className="nav-link">
                                        <i className="fa fa-cogs mr-2"></i> Settings
                                    </Link>
                                </li>
                                <li className="nav-item">
                                    <Link to="#" className="nav-link" onClick={handleLogout}>
                                        <i className="fa fa-sign-out mr-2"></i> Logout
                                    </Link>
                                </li>
                            </ul>
                        </div>
                    </div>
                </nav>

                <main role="main" className="col-md-9 ml-sm-auto col-lg-10 px-md-4">
                    <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
                        <h1 className="text-info">
                            {view === 'userDetails'
                                ? 'User Details'
                            : view === 'Products'
                                ? 'Products'
                            : view === 'Place'
                                ? 'Place'
                            : 'Dashboard'}
                        </h1>
                    </div>
                    {renderContent()}
                </main>
            </div>
        </div>
    );
};

export default Dashboard;
