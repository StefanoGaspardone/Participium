import { useState, useEffect, useRef } from "react";
import { Badge } from "react-bootstrap";
import { BsBell, BsBellFill } from "react-icons/bs";
import { getMyNotifications, markNotificationAsSeen, type Notification } from "../api/api";
import { motion, AnimatePresence } from "framer-motion";
import "./Notifications.css";
import { REPORT_STATUS_COLORS } from "../constants/reportStatusColors.ts";

export default function Notifications() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement | null>(null);

    const unreadCount = notifications.filter(n => !n.seen).length;

    const fetchNotifications = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getMyNotifications();
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

    const toggleOpen = () => {
        setOpen(o => {
            const newVal = !o;
            if (newVal) fetchNotifications();
            return newVal;
        });
    };

    const close = () => setOpen(false);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (!containerRef.current) return;
            if (!containerRef.current.contains(e.target as Node)) {
                close();
            }
        };
        if (open) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [open]);

    const handleNotificationClick = async (notification: Notification) => {
        // If already read, do nothing on the API side
        if (notification.seen) {
            return;
        }

        // Update local state immediately for visual feedback
        setNotifications(prev =>
            prev.map(n =>
                n.id === notification.id
                    ? { ...n, seen: true }
                    : n
            )
        );

        // Call the API in the background
        try {
            await markNotificationAsSeen(notification.id);
        } catch (error) {
            console.error("Failed to mark notification as seen:", error);
            // Rollback in case of error
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

        if (diffMins < 1) return "Now";
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
        return `${Math.floor(diffMins / 1440)}d ago`;
    };

    const menuVariants = {
        hidden: { opacity: 0, scale: 0.92, y: -6 },
        visible: { opacity: 1, scale: 1, y: 0 }
    };

    return (
        <div ref={containerRef} className="notifications-dropdown" style={{ position: 'relative', zIndex: 10000 }}>
            <motion.div
                id="notifications-toggle"
                role="button"
                tabIndex={0}
                onClick={toggleOpen}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.93 }}
                style={{
                    position: 'relative',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0.35rem',
                    borderRadius: 8,
                    cursor: 'pointer',
                    transition: 'background 0.25s',
                    userSelect: 'none'
                }}
            >
                {unreadCount > 0 ? (
                    <BsBellFill className="bell-icon bell-icon-active" size={22} />
                ) : (
                    <BsBell className="bell-icon" size={22} />
                )}
                {unreadCount > 0 && (
                    <Badge
                        pill
                        bg="danger"
                        className="notification-badge"
                        style={{
                            position: 'absolute',
                            top: -2,
                            right: -2,
                            transform: 'translate(25%, -25%)',
                            fontSize: '0.65rem',
                            minWidth: 22,
                            height: 18,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 0 0 2px rgba(255,255,255,0.9)'
                        }}
                    >
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </Badge>
                )}
            </motion.div>
            <AnimatePresence>
                {open && (
                    <motion.div
                        key="notif-menu"
                        variants={menuVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        transition={{ duration: 0.16, ease: 'easeOut' }}
                        className="notifications-menu shadow-sm"
                        style={{
                            position: 'absolute',
                            right: 0,
                            marginTop: '0.4rem',
                            background: '#ffffff',
                            borderRadius: 14,
                            width: 320,
                            maxHeight: 400,
                            overflow: 'hidden',
                            boxShadow: '0 4px 14px rgba(0,0,0,0.12)',
                            border: '1px solid rgba(0,0,0,0.05)',
                            display: 'flex',
                            flexDirection: 'column',
                            zIndex: 9999
                        }}
                    >
                        <div className="notifications-header" style={{ padding: '0.6rem 1rem', borderBottom: '1px solid #e6e6e6', background: 'linear-gradient(135deg,#f3f5f9,#eceff3)' }}>
                            <h6 id="report-updates" className="mb-0" style={{ fontWeight: 600, color: '#00205B', letterSpacing: '0.4px' }}>Report updates</h6>
                        </div>
                        <div className="notifications-body" style={{ padding: '0.4rem 0.4rem 0.8rem', overflowY: 'auto' }}>
                            {loading && (
                                <div className="text-center py-4">
                                    <div className="spinner-border spinner-border-sm text-primary" role="status">
                                        <span className="visually-hidden">Loading...</span>
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
                                    <p className="mb-0 small">No notifications</p>
                                </div>
                            )}
                            {!loading && !error && notifications.length > 0 && (
                                <div className="notifications-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                    {notifications.map(notification => (
                                        <motion.div
                                            key={notification.id}
                                            layout
                                            initial={{ opacity: 0, y: 6 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.22 }}
                                            className={`notification-item ${!notification.seen ? 'unread' : ''}`}
                                            onClick={() => handleNotificationClick(notification)}
                                            role="button"
                                            tabIndex={0}
                                            style={{
                                                background: '#ffffff',
                                                border: '1px solid #e6e6e6',
                                                borderRadius: 10,
                                                padding: '0.55rem 0.75rem 0.55rem 0.85rem',
                                                position: 'relative',
                                                cursor: 'pointer',
                                                transition: 'transform 0.18s, box-shadow 0.18s'
                                            }}
                                            whileHover={{ scale: 1.015 }}
                                            whileTap={{ scale: 0.97 }}
                                        >
                                            <div className="notification-content" style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                                <div className="notification-title" style={{ fontWeight: 600, fontSize: '0.9rem', lineHeight: 1.2 }}>
                                                    {notification.report.title}
                                                </div>
                                                <div className="notification-status" style={{ fontSize: '0.75rem', color: '#444' }}>
                                                    <span className="status-label" style={{ fontWeight: 500 }}>Status:</span>{' '}
                                                    <span className="status-old" style={{ textDecoration: 'line-through', opacity: 0.6, color: REPORT_STATUS_COLORS[notification.previousStatus] || '#6B7280' }}>{notification.previousStatus}</span>
                                                    {' → '}
                                                    <span className="status-new" style={{ fontWeight: 600, color: REPORT_STATUS_COLORS[notification.newStatus] || '#6B7280' }}>{notification.newStatus}</span>
                                                </div>
                                                <div className="notification-time" style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.5px', opacity: 0.6 }}>
                                                    {formatDate(notification.createdAt)}
                                                </div>
                                            </div>
                                            {!notification.seen && (
                                                <motion.div
                                                    className="unread-indicator"
                                                    initial={{ opacity: 0, scale: 0.6 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.6 }}
                                                    style={{
                                                        position: 'absolute',
                                                        top: 8,
                                                        right: 8,
                                                        width: 10,
                                                        height: 10,
                                                        borderRadius: '50%',
                                                        background: '#dc3545',
                                                        boxShadow: '0 0 0 3px rgba(220,53,69,0.25)'
                                                    }}
                                                />
                                            )}
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
