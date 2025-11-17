import { useState } from "react";
import { useAppContext } from "../contexts/AppContext.tsx";
import "./ProfilePage.css";
import CustomNavbar from "./CustomNavbar.tsx";
import { updateUser, type UpdateUserPayload } from "../api/api.ts";

export default function ProfilePage() {
    const { user, isLoggedIn, setUser } = useAppContext();
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        firstName: user?.firstName || "",
        lastName: user?.lastName || "",
        email: user?.email || "",
        username: user?.username || "",
        telegramUsername: user?.telegramUsername || "",
    });

    if (!isLoggedIn || !user) {
        return (
            <div className="profile-page">
                <CustomNavbar/>
                <div className="profile-container">
                    <div className="profile-body">
                        <h2>Please log in to view your profile</h2>
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
        // Reset form data to current user data
        setFormData({
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            username: user.username,
            telegramUsername: user.telegramUsername || "",
        });
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setError(null);
        setSuccessMessage(null);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setSuccessMessage(null);

        try {
            const payload: UpdateUserPayload = {
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                username: formData.username,
                telegramUsername: formData.telegramUsername || null,
            };

            const response = await updateUser(user.id, payload);

            // Update the user in context
            if (response.user) {
                setUser(response.user);
            }

            setSuccessMessage("Profile updated successfully!");
            setIsEditing(false);

            // Clear success message after 3 seconds
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err: any) {
            setError(err.message || "Failed to update profile");
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
                        {user.image ? (
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
                                        <span className="profile-info-value">@{user.telegramUsername}</span>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="profile-edit-form">
                                <div className="profile-info-grid">
                                    <div className="profile-form-group">
                                        <label className="profile-form-label">First Name</label>
                                        <input
                                            type="text"
                                            name="firstName"
                                            value={formData.firstName}
                                            onChange={handleInputChange}
                                            className="profile-form-input"
                                            required
                                        />
                                    </div>
                                    <div className="profile-form-group">
                                        <label className="profile-form-label">Last Name</label>
                                        <input
                                            type="text"
                                            name="lastName"
                                            value={formData.lastName}
                                            onChange={handleInputChange}
                                            className="profile-form-input"
                                            required
                                        />
                                    </div>
                                    <div className="profile-form-group">
                                        <label className="profile-form-label">Username</label>
                                        <input
                                            type="text"
                                            name="username"
                                            value={formData.username}
                                            onChange={handleInputChange}
                                            className="profile-form-input"
                                            required
                                        />
                                    </div>
                                    <div className="profile-form-group">
                                        <label className="profile-form-label">Email</label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            className="profile-form-input"
                                            required
                                        />
                                    </div>
                                    <div className="profile-form-group">
                                        <label className="profile-form-label">Telegram Username</label>
                                        <input
                                            type="text"
                                            name="telegramUsername"
                                            value={formData.telegramUsername}
                                            onChange={handleInputChange}
                                            className="profile-form-input"
                                            placeholder="Optional"
                                        />
                                    </div>
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