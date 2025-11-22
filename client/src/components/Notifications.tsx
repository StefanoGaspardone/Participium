import { useState, useEffect } from "react";
import { Dropdown, Badge } from "react-bootstrap";
import { BsBell, BsBellFill } from "react-icons/bs";
import {getMyNotifications, markNotificationAsSeen, type Notification} from "../api/api";
import "./Notifications.css";

export default function Notifications() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [show, setShow] = useState(false);

    const unreadCount = notifications.filter(n => !n.seen).length;

    const fetchNotifications = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getMyNotifications();
            console.log("data: ", data);
            setNotifications(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load notifications");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const handleToggle = (isOpen: boolean) => {
        setShow(isOpen);
        if (isOpen) {
            fetchNotifications();
        }
    };

    const handleNotificationClick = async (notification: Notification) => {
        // Se già letta, non fare nulla lato API
        if (notification.seen) {
            return;
        }

        // Aggiorna lo stato locale immediatamente per feedback visivo
        setNotifications(prev =>
            prev.map(n =>
                n.id === notification.id
                    ? { ...n, seen: true }
                    : n
            )
        );

        // Chiama l'API in background
        try {
            await markNotificationAsSeen(notification.id);
        } catch (error) {
            console.error("Failed to mark notification as seen:", error);
            // Rollback in caso di errore
            setNotifications(prev =>
                prev.map(n =>
                    n.id === notification.id
                        ? { ...n, seen: false }
                        : n
                )
            );
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return "Ora";
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
        return `${Math.floor(diffMins / 1440)}g ago`;
    };

    return (
        <Dropdown show={show} onToggle={handleToggle} align="end" className="notifications-dropdown">
            <Dropdown.Toggle
                as="div"
                id="notifications-toggle"
                className="notifications-toggle position-relative"
                role="button"
                tabIndex={0}
            >
                {unreadCount > 0 ? (
                    <BsBellFill className="bell-icon bell-icon-active" size={24} />
                ) : (
                    <BsBell className="bell-icon" size={24} />
                )}
                {unreadCount > 0 && (
                    <Badge
                        pill
                        bg="danger"
                        className="notification-badge position-absolute"
                    >
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </Badge>
                )}
            </Dropdown.Toggle>

            <Dropdown.Menu className="notifications-menu shadow-sm">
                <div className="notifications-header">
                    <h6 id="report-updates" className="mb-0">Report updates</h6>
                </div>

                <div className="notifications-body">
                    {loading && (
                        <div className="text-center py-4">
                            <div className="spinner-border spinner-border-sm text-primary" role="status">
                                <span className="visually-hidden">Caricamento...</span>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="text-center py-4 text-danger">
                            <small>{error}</small>
                        </div>
                    )}

                    {!loading && !error && notifications.length === 0 && (
                        <div className="text-center py-4 text-muted">
                            <BsBell size={32} className="mb-2 opacity-50" />
                            <p className="mb-0 small">Nessuna notifica</p>
                        </div>
                    )}

                    {!loading && !error && notifications.length > 0 && (
                        <div className="notifications-list">
                            {notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={`notification-item ${!notification.seen ? 'unread' : ''}`}
                                    onClick={() => handleNotificationClick(notification)}
                                    role="button"
                                    tabIndex={0}
                                >
                                    <div className="notification-content">
                                        <div className="notification-title">
                                            {notification.report.title}
                                        </div>
                                        <div className="notification-status">
                                            <span className="status-label">Status:</span>{" "}
                                            <span className="status-old">{notification.previousStatus}</span>
                                            {" → "}
                                            <span className="status-new">{notification.newStatus}</span>
                                        </div>
                                        <div className="notification-time">
                                            {formatDate(notification.createdAt)}
                                        </div>
                                    </div>
                                    {!notification.seen && (
                                        <div className="unread-indicator"></div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </Dropdown.Menu>
        </Dropdown>
    );
}
