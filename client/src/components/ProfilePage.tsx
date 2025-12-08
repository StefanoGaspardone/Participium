import { useState } from "react";
import { Link } from "react-router-dom";
import { useAppContext } from "../contexts/AppContext.tsx";
import "./ProfilePage.css";
import CustomNavbar from "./CustomNavbar.tsx";
import { updateUser, type UpdateUserPayload, uploadImages } from "../api/api.ts";

export default function ProfilePage() {
    const { user, isLoggedIn, setUser } = useAppContext();
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [profilePic, setProfilePic] = useState<File | null>(null);
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        firstName: user?.firstName || "",
        lastName: user?.lastName || "",
        email: user?.email || "",
        username: user?.username || "",
        telegramUsername: user?.telegramUsername || "",
        emailNotifications: user?.emailNotificationsEnabled || false,
    });

    if (!isLoggedIn || !user) {
        return (
            <div className="profile-page">
                <CustomNavbar/>
                <div className="profile-container">
                    <div className="profile-body">
                        <h2>Please <Link to = '/login'>log in</Link> to view your profile</h2>
                    </div>
                </div>
            </div>
        );
    }

    // Get user initials for placeholder avatar
    const getInitials = () => {
        const firstInitial = user.firstName?.charAt(0).toUpperCase() || '';
        const lastInitial = user.lastName?.charAt(0).toUpperCase() || '';
        return `${firstInitial}${lastInitial}`;
    };

    const handleEditClick = () => {
        setIsEditing(true);
        setError(null);
        setSuccessMessage(null);
        setProfilePic(null);
        setPreviewImage(null);
        // Reset form data to current user data
        setFormData({
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            username: user.username,
            telegramUsername: user.telegramUsername || "",
            emailNotifications: user.emailNotificationsEnabled || false,
        });
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setError(null);
        setSuccessMessage(null);
        setProfilePic(null);
        setPreviewImage(null);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files ? e.target.files[0] : null;
        setProfilePic(file);

        // Create preview URL
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        } else {
            setPreviewImage(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setSuccessMessage(null);

        try {
            let imageUrl: string | null = null;

            // Upload new profile picture if one was selected
            if (profilePic) {
                imageUrl = await uploadImages(profilePic);
            }

            const payload: UpdateUserPayload = {
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                username: formData.username,
                telegramUsername: formData.telegramUsername || null,
                emailNotificationsEnabled: formData.emailNotifications
            };
            if (imageUrl) {
                payload.image = imageUrl;
            }
            const response = await updateUser(payload);

            // Update the user in context
            if (response.user) {
                setUser(response.user);
            }

            //setSuccessMessage("Profile updated successfully!");
            setIsEditing(false);
            setProfilePic(null);
            setPreviewImage(null);

            // Clear success message after 3 seconds
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message || "Failed to update profile");
            } else {
                setError("Failed to update profile");
            }
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <>
            <CustomNavbar/>
            <div className="profile-page">
                <div className="profile-container">
                    {/* Header Section */}
                    <div className="profile-header">
                        <div className="profile-avatar-container">
                            {previewImage ? (
                                <img
                                    src={previewImage}
                                    alt="Preview"
                                    className="profile-avatar"
                                />
                            ) : user.image ? (
                                <img
                                    src={user.image}
                                    alt={`${user.firstName} ${user.lastName}`}
                                    className="profile-avatar"
                                />
                            ) : (
                                <div className="profile-avatar-placeholder">
                                    {getInitials()}
                                </div>
                            )}
                        </div>
                        <h1 className="profile-name">
                            {user.firstName} {user.lastName}
                        </h1>
                        <p className="profile-username">@{user.username}</p>
                        <div style={{ marginTop: '15px' }}>
                        <span className={`profile-badge ${user.userType === 'admin' ? 'profile-badge-admin' : 'profile-badge-user'}`}>
                            {user.userType || 'User'}
                        </span>
                        </div>
                    </div>

                    {/* Body Section */}
                    <div className="profile-body">
                        {/* Success/Error Messages */}
                        {successMessage && (
                            <div className="profile-message profile-message-success">
                                {successMessage}
                            </div>
                        )}
                        {error && (
                            <div className="profile-message profile-message-error">
                                {error}
                            </div>
                        )}

                        {/* Personal Information */}
                        <div className="profile-info-card">
                            <h2 className="profile-info-title">Personal Information</h2>

                            {!isEditing ? (
                                <div className="profile-info-grid">
                                    <div className="profile-info-item">
                                        <span className="profile-info-label">First Name</span>
                                        <span className="profile-info-value">{user.firstName}</span>
                                    </div>
                                    <div className="profile-info-item">
                                        <span className="profile-info-label">Last Name</span>
                                        <span className="profile-info-value">{user.lastName}</span>
                                    </div>
                                    <div className="profile-info-item">
                                        <span className="profile-info-label">Username</span>
                                        <span className="profile-info-value">{user.username}</span>
                                    </div>
                                    <div className="profile-info-item">
                                        <span className="profile-info-label">Email</span>
                                        <span className="profile-info-value">{user.email}</span>
                                    </div>
                                    {user.telegramUsername && (
                                        <div className="profile-info-item">
                                            <span className="profile-info-label">Telegram</span>
                                            <span className="profile-info-value">{user.telegramUsername}</span>
                                        </div>
                                    )}
                                    <div className="profile-info-item">
                                        <span className="profile-info-label">Receive email notifications</span>
                                        <span className="profile-info-value">{user.emailNotificationsEnabled? "yes" : "no"}</span>
                                    </div>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="profile-edit-form">
                                    <div className="profile-form-group" style={{ marginBottom: '20px' }}>
                                        <label className="profile-form-label" htmlFor="profilePicture">Profile Picture</label>
                                        <input
                                            type="file"
                                            id="profilePicture"
                                            accept="image/*"
                                            onChange={handleImageChange}
                                            className="profile-form-input"
                                        />
                                        {profilePic && (
                                            <small style={{ display: 'block', marginTop: '5px', color: '#6c757d' }}>
                                                Selected: {profilePic.name}
                                            </small>
                                        )}
                                    </div>

                                    <div className="profile-info-grid">
                                        <div className="profile-form-group">
                                            <label className="profile-form-label" htmlFor="firstName">First Name</label>
                                            <input
                                                type="text"
                                                id="firstName"
                                                name="firstName"
                                                value={formData.firstName}
                                                onChange={handleInputChange}
                                                className="profile-form-input"
                                                required
                                            />
                                        </div>
                                        <div className="profile-form-group">
                                            <label className="profile-form-label" htmlFor="lastName">Last Name</label>
                                            <input
                                                type="text"
                                                id="lastName"
                                                name="lastName"
                                                value={formData.lastName}
                                                onChange={handleInputChange}
                                                className="profile-form-input"
                                                required
                                            />
                                        </div>
                                        <div className="profile-form-group">
                                            <label className="profile-form-label" htmlFor="username">Username</label>
                                            <input
                                                type="text"
                                                id="username"
                                                name="username"
                                                value={formData.username}
                                                onChange={handleInputChange}
                                                className="profile-form-input"
                                                required
                                            />
                                        </div>
                                        <div className="profile-form-group">
                                            <label className="profile-form-label" htmlFor="email">Email</label>
                                            <input
                                                type="email"
                                                id="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleInputChange}
                                                className="profile-form-input"
                                                required
                                            />
                                        </div>
                                        <div className="profile-form-group">
                                            <label className="profile-form-label" htmlFor="telegramUsername">Telegram Username</label>
                                            <input
                                                type="text"
                                                id="telegramUsername"
                                                name="telegramUsername"
                                                value={formData.telegramUsername}
                                                onChange={handleInputChange}
                                                className="profile-form-input"
                                                placeholder="Optional"
                                            />
                                        </div>
                                    </div>
                                    <div className="profile-form-group profile-notifications-toggle">
                                        <label className="profile-toggle-label" htmlFor="emailNotifications">
                                            <div className="profile-toggle-content">
                                                <div className="profile-toggle-info">
                                                    <span className="profile-toggle-title">Email Notifications</span>
                                                    <span className="profile-toggle-description">
                                                        Receive updates and alerts via email
                                                    </span>
                                                </div>
                                                <div className="profile-toggle-switch">
                                                    <input
                                                        type="checkbox"
                                                        id="emailNotifications"
                                                        name="emailNotifications"
                                                        checked={formData.emailNotifications}
                                                        onChange={(e) => setFormData(prev => ({ ...prev, emailNotifications: e.target.checked }))}
                                                        className="profile-toggle-input"
                                                    />
                                                    <span className="profile-toggle-slider"></span>
                                                </div>
                                            </div>
                                        </label>
                                    </div>
                                </form>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="profile-actions">
                            {!isEditing ? (
                                <button
                                    className="profile-button profile-button-primary"
                                    onClick={handleEditClick}
                                >
                                    Edit Profile
                                </button>
                            ) : (
                                <>
                                    <button
                                        className="profile-button profile-button-primary"
                                        onClick={handleSubmit}
                                        disabled={isLoading}
                                    >
                                        {isLoading ? "Saving..." : "Save Changes"}
                                    </button>
                                    <button
                                        className="profile-button profile-button-secondary"
                                        onClick={handleCancelEdit}
                                        disabled={isLoading}
                                    >
                                        Cancel
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
