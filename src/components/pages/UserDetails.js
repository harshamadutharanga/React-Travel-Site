import React, { useState, useEffect } from 'react';
import firebase from '../../firebase';
import './UserDetails.css';
import 'firebase/compat/auth';
import 'firebase/compat/database';
import 'firebase/compat/storage';

const UserDetails = ({ userDetails, setUserDetails, handleFileUpload }) => {
    const [editing, setEditing] = useState(false);
    const [formData, setFormData] = useState({
        firstName: userDetails.firstName || '',
        lastName: userDetails.lastName || '',
        jobtitle: userDetails.jobtitle || '',
        phone: userDetails.phone || '',
        email: userDetails.email || '',
        uid: userDetails.uid || '',
        imageUrl: userDetails.imageUrl || ''
    });


    // Handle changes in form inputs
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({ ...prevData, [name]: value }));
    };

    // Handle saving edited user details
    const handleSave = async () => {
        try {
            const user = firebase.auth().currentUser;
            if (!user) {
                console.error('No authenticated user found');
                return;
            }
    
            const userRef = firebase.database().ref(`users/${user.uid}`);
            await userRef.update({
                firstName: formData.firstName,
                lastName: formData.lastName,
                jobtitle: formData.jobtitle,
                phone: formData.phone,
                email: formData.email,
                imageUrl: formData.imageUrl
            });
    
            setEditing(false);
            console.log('User details updated successfully');
    
            // Update userDetails state to reflect changes
            setUserDetails({
                ...userDetails,
                firstName: formData.firstName,
                lastName: formData.lastName,
                jobtitle: formData.jobtitle,
                phone: formData.phone,
                email: formData.email,
                imageUrl: formData.imageUrl
            });
        } catch (error) {
            console.error('Error updating user details:', error);
        }
    };
    

    const handleDelete = async () => {
        try {
            const user = firebase.auth().currentUser;
            if (!user) {
                console.error('No authenticated user found');
                return;
            }
    
            const userRef = firebase.database().ref(`users/${user.uid}`);
    
            // Remove the profile picture from storage if it exists
            if (formData.imageUrl) {
                const storageRef = firebase.storage().refFromURL(formData.imageUrl);
                await storageRef.delete();
            }
    
            // Remove the user from the database
            await userRef.remove();
    
            // Delete the user from Firebase Authentication
            await user.delete();
    
            // Redirect to /login page
            window.location.href = '/login';
    
        } catch (error) {
            console.error('Error deleting user:', error);
        }
    };
    

    return (
        <div className="user-details">
            <h3 className="user">User Details</h3>
            <div className="profile-container">
                <img
                    src={formData.imageUrl || 'default-profile.png'}
                    alt="Profile"
                    className="profile-picture img-fluid rounded-circle"
                />
                <input
                    type="file"
                    id="profilePictureInput"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleFileUpload}
                />
                <label htmlFor="profilePictureInput" className="upload-button">
                    Change Profile Picture
                </label>
            </div>
            <form className="user-details-form">
                <div className="form-group">
                    <label>First Name:</label>
                    <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        disabled={!editing}
                    />
                </div>
                <div className="form-group">
                    <label>Last Name:</label>
                    <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        disabled={!editing}
                    />
                </div>
                <div className="form-group">
                    <label>Job Title:</label>
                    <input
                        type="text"
                        name="jobtitle"
                        value={formData.jobtitle}
                        onChange={handleChange}
                        disabled={!editing}
                    />
                </div>
                <div className="form-group">
                    <label>Phone:</label>
                    <input
                        type="text"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        disabled={!editing}
                    />
                </div>
                <div className="form-group">
                    <label>Email:</label>
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        disabled={!editing}
                    />
                </div>
                <div className="button-group">
                    {editing ? (
                        <>
                            <button type="button" onClick={handleSave} className="btn btn-success">
                                Save
                            </button>
                            <button type="button" onClick={() => setEditing(false)} className="btn btn-secondary">
                                Cancel
                            </button>
                        </>
                    ) : (
                        <button type="button" onClick={() => setEditing(true)} className="btn btn-primary">
                            Edit
                        </button>
                    )}
                    <button type="button" onClick={handleDelete} className="btn btn-danger">
                        Delete
                    </button>
                </div>
            </form>
        </div>
    );
};

export default UserDetails;
