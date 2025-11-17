import { useAppContext } from "../contexts/AppContext.tsx";
import "./ProfilePage.css";
import CustomNavbar from "./CustomNavbar.tsx";

export default function ProfilePage() {
    const { user, isLoggedIn } = useAppContext();

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
                    {/* Personal Information */}
                    <div className="profile-info-card">
                        <h2 className="profile-info-title">Personal Information</h2>
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
                                <span className="profile-info-label">email</span>
                                <span className="profile-info-value">{user.email}</span>
                            </div>
                            {user.telegramUsername && <div className="profile-info-item">
                                <span className="profile-info-label">Telegram</span>
                                <span className="profile-info-value">@{user.telegramUsername}</span>
                            </div>}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="profile-actions">
                        <button className="profile-button profile-button-primary">
                            ✏️ Edit Profile
                        </button>
                    </div>
                </div>
            </div>
        </div>
        </>
    );
}