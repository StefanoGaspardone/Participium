import { useEffect, useState } from 'react';
import CustomNavbar from './CustomNavbar';
import { getAssignedReports, updateReportStatus, getExternalMaintainers, assignReportToExternalMaintainer } from '../api/api';
import type { Report, User } from '../models/models';
import { useAppContext } from '../contexts/AppContext';
import { ChevronLeft, ChevronRight, Loader2Icon } from 'lucide-react';
import { Accordion, Badge, Alert, Button, Row, Col } from 'react-bootstrap';
import ReportMiniMap from './ReportMiniMap';
import { motion, AnimatePresence } from 'framer-motion';
import { FaUserCircle } from "react-icons/fa";
import './AuthForms.css';
import Chats from './Chats';
import { fetchAddress } from './HomepageMap';
import { Lightbox } from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import { REPORT_STATUS_COLORS } from '../constants/reportStatusColors';

export default function TechnicalStaffHomepage() {
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [updatingReportId, setUpdatingReportId] = useState<number | null>(null);
    const [assigningReportId, setAssigningReportId] = useState<number | null>(null);
    const [maintainersByReportId, setMaintainersByReportId] = useState<User[]>([]);
    const [selectedMaintainerByReportId, setSelectedMaintainerByReportId] = useState<Record<number, number | null>>({});

    const [show, setShow] = useState<boolean>(false);
    const [expanded, setExpanded] = useState<number | null>(null);
    const [activeReport, setActiveReport] = useState<Report | null>(null);
    const [chatTargetUserId, setChatTargetUserId] = useState<number | null>(null);
    const [imageIndexByReport, setImageIndexByReport] = useState<Record<number, number>>({});
    const [addressByReport, setAddressByReport] = useState<Record<number, string>>({});

    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxSlides, setLightboxSlides] = useState<{ src: string }[]>([]);
    const [lightboxIndex, setLightboxIndex] = useState(0);


    const { user } = useAppContext();

    const handleToggle = () => {
        setShow(prev => !prev);
    }

    const handleRToggle = (id: number) => {
        const next = (expanded === id ? null : id);
        setExpanded(next);

        // If we're opening the panel and don't have the address yet, fetch it
        if (next !== null && !addressByReport[id]) {
            const report = reports.find(r => r.id === id);
            if (report) fetchAndSetAddress(report.id, Number(report.lat), Number(report.long));
        }
    };

    const fetchAndSetAddress = async (reportId: number, lat: number, lng: number) => {
        setAddressByReport(prev => ({ ...prev, [reportId]: 'Fetching address...' }));
        try {
            const addr = await fetchAddress(lat, lng);
            setAddressByReport(prev => ({ ...prev, [reportId]: addr }));
        } catch {
            setAddressByReport(prev => ({ ...prev, [reportId]: 'Not available' }));
        }
    };

    const openLightbox = (images: string[], index: number) => {
        setLightboxSlides(images.map(src => ({ src })));
        setLightboxIndex(index);
        setLightboxOpen(true);
    };

    const getCurrentImageIndex = (reportId: number, imagesLength: number) => {
        if (!imagesLength) return 0;
        return imageIndexByReport[reportId] ?? 0;
    };

    const showNextImage = (reportId: number, imagesLength: number) => {
        if (!imagesLength) return;
        setImageIndexByReport(prev => {
            const cur = prev[reportId] ?? 0;
            const next = (cur + 1) % imagesLength;
            return { ...prev, [reportId]: next };
        });
    };

    const showPrevImage = (reportId: number, imagesLength: number) => {
        if (!imagesLength) return;
        setImageIndexByReport(prev => {
            const cur = prev[reportId] ?? 0;
            const next = (cur - 1 + imagesLength) % imagesLength;
            return { ...prev, [reportId]: next };
        });
    };

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await getAssignedReports();
                setReports(data);
            } catch (e) {
                setError(e instanceof Error ? e.message : 'Failed to load assigned reports');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const handleStatusChange = async (reportId: number, newStatus: "InProgress" | "Suspended" | "Resolved") => {
        setUpdatingReportId(reportId);
        setError(null);
        try {
            const updatedReport = await updateReportStatus(reportId, newStatus);
            setReports(prev => prev.map(r => r.id === reportId ? updatedReport : r));
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to update report status');
        } finally {
            setUpdatingReportId(null);
        }
    };

    const handleFetchMaintainers = async (report: Report) => {
        try {
            const categoryId = Number(report?.category?.id);
            if (!categoryId || isNaN(categoryId)) return;
            const maintainers = await getExternalMaintainers(categoryId);
            setMaintainersByReportId(maintainers);
        } catch (e) {
            // Do not block UI; optionally surface a lightweight message
            console.error('Failed to fetch external maintainers', e);
        }
    };

    const handleAssignMaintainer = async (reportId: number, overrideMaintainerId?: number) => {
        const maintainerId = overrideMaintainerId ?? selectedMaintainerByReportId[reportId];
        if (!maintainerId) return;
        try {
            setAssigningReportId(reportId);
            const report = await assignReportToExternalMaintainer(reportId, maintainerId);
            setReports(prev => prev.map(r => r.id === reportId ? report : r));
        } catch (e) {
            console.error('Failed to assign external maintainer', e);
        } finally {
            setAssigningReportId(null);
        }
    };

    useEffect(() => {
        console.log(reports)
    }, [reports]);

    const getAvailableActions = (status: string) => {
        switch (status) {
            case 'Assigned':
                return [{ label: 'Start Progress', value: 'InProgress' as const }];
            case 'InProgress':
                return [
                    { label: 'Mark as Resolved', value: 'Resolved' as const },
                    { label: 'Suspend', value: 'Suspended' as const }
                ];
            case 'Suspended':
                return [{ label: 'Resume Progress', value: 'InProgress' as const }];
            case 'Resolved':
                return [];
            default:
                return [];
        }
    };

    return (
        <>
            <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%)' }}>
                <CustomNavbar />
                <div className="container py-5">
                    <motion.h1
                        className="mb-3 text-center auth-title"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        {user?.office ? `${user.office} office` : 'Office'}
                    </motion.h1>
                    <motion.h2
                        className="text-center auth-title"
                        initial={{ opacity: 0, y: -12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        My Assigned Reports
                    </motion.h2>

                    {loading && (
                        <motion.div
                            className="d-flex justify-content-center align-items-center my-5"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.3 }}
                        >
                            <Loader2Icon className="animate-spin" size={32} color="#265ea8" />
                            <span className="ms-2" style={{ color: '#265ea8', fontWeight: 500 }}>Loading reports...</span>
                        </motion.div>
                    )}

                    <AnimatePresence mode="wait">
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <Alert variant="danger">{error}</Alert>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {!loading && !error && reports.length === 0 && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.4 }}
                        >
                            <Alert variant="info">No reports assigned to you yet.</Alert>
                        </motion.div>
                    )}
                    {!loading && !error && reports.length > 0 && (
                        <Accordion
                            activeKey={expanded ? String(expanded) : undefined}
                            alwaysOpen
                        >
                            {reports.map((r, idx) => (
                                <motion.div
                                    key={r.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.08, duration: 0.4 }}
                                >
                                        <Accordion.Item eventKey={String(r.id)} className="mt-4">
                                            <Accordion.Header
                                                onClick={() => handleRToggle(r.id)}
                                            >
                                                <button
                                                    type="button"
                                                    onClick={(e) => { e.stopPropagation(); handleFetchMaintainers(r); }}
                                                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); handleFetchMaintainers(r); } }}
                                                    className="d-flex w-100 align-items-center justify-content-between"
                                                    style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }}
                                                >
                                                    <h4 id="report-title" className="mb-0 fw-bold" style={{ color: '#00205B', fontSize: '1.5rem' }}>{r.title}</h4>
                                                    <small className="text-muted" style={{ fontSize: '0.9rem', whiteSpace: 'nowrap', marginLeft: '1rem', marginRight: '0.5rem' }}>
                                                        <span
                                                            id={"current-status" + r.title}
                                                            style={{
                                                                fontSize: '1rem',
                                                                padding: '0.5rem 1rem',
                                                                marginRight: '0.5rem',
                                                                backgroundColor: REPORT_STATUS_COLORS[r.status] || '#64748B',
                                                                color: 'white',
                                                                borderRadius: '0.375rem',
                                                                fontWeight: 600,
                                                                display: 'inline-block'
                                                            }}
                                                        >
                                                            {r.status}
                                                        </span>
                                                        {new Date(r.createdAt).toLocaleString()}
                                                    </small>
                                                </button>
                                            </Accordion.Header>
                                            <Accordion.Body>
                                                {/* Top section: Images and Map side by side */}
                                                <Row className="mb-4">
                                                    <Col md={6}>
                                                        <div style={{
                                                            border: '1px solid #ddd',
                                                            borderRadius: '8px',
                                                            padding: '1rem',
                                                            height: '300px',
                                                            overflow: 'hidden'
                                                        }}>
                                                            {r.images?.length ? (
                                                                <div style={{ position: 'relative', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                    {r.images.length > 1 && (
                                                                        <motion.button
                                                                            type="button"
                                                                            aria-label="Previous image"
                                                                            onClick={(e) => { e.stopPropagation(); showPrevImage(r.id, r.images.length); }}
                                                                            className="image-nav-btn left"
                                                                            whileHover={{ scale: 1.05 }}
                                                                            whileTap={{ scale: 0.95 }}
                                                                        >
                                                                            <ChevronLeft size={18} />
                                                                        </motion.button>
                                                                    )}

                                                                    <button
                                                                        type="button"
                                                                        aria-label="View report image in fullscreen"
                                                                        onClick={(e) => { e.stopPropagation(); openLightbox(r.images, getCurrentImageIndex(r.id, r.images.length)); }}
                                                                        style={{ cursor: 'pointer', background: 'none', border: 'none', padding: 0 }}
                                                                    >
                                                                        <AnimatePresence mode="wait">
                                                                            <motion.img
                                                                                key={getCurrentImageIndex(r.id, r.images.length)}
                                                                                src={r.images[getCurrentImageIndex(r.id, r.images.length)]}
                                                                                alt={`Report image ${getCurrentImageIndex(r.id, r.images.length) + 1}`}
                                                                                initial={{ opacity: 0, x: 18 }}
                                                                                animate={{ opacity: 1, x: 0 }}
                                                                                exit={{ opacity: 0, x: -18 }}
                                                                                transition={{ duration: 0.28 }}
                                                                                style={{ width: '100%', maxWidth: '460px', height: '270px', objectFit: 'cover', borderRadius: '6px', display: 'block' }}
                                                                            />
                                                                        </AnimatePresence>
                                                                    </button>

                                                                    {r.images.length > 1 && (
                                                                        <motion.button
                                                                            type="button"
                                                                            aria-label="Next image"
                                                                            onClick={(e) => { e.stopPropagation(); showNextImage(r.id, r.images.length); }}
                                                                            className="image-nav-btn right"
                                                                            whileHover={{ scale: 1.05 }}
                                                                            whileTap={{ scale: 0.95 }}
                                                                        >
                                                                            <ChevronRight size={18} />
                                                                        </motion.button>
                                                                    )}

                                                                    <div className="image-counter">
                                                                        {getCurrentImageIndex(r.id, r.images.length) + 1} / {r.images.length}
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="d-flex align-items-center justify-content-center h-100">
                                                                    <p className="text-muted fst-italic mb-0">No images available</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="mt-2" style={{ marginLeft: '10px', justifyContent: 'center', display: 'flex' }}>
                                                            <h5 style={{ color: '#00205B', fontWeight: 350 }}>{r.description}</h5>
                                                        </div>
                                                    </Col>
                                                    <Col md={6}>
                                                        <div style={{
                                                            overflow: 'hidden',
                                                            height: '300px'
                                                        }}>
                                                            <ReportMiniMap lat={Number(r.lat)} long={Number(r.long)} />
                                                        </div>
                                                        <div className="mt-2" style={{ fontSize: '1rem', color: '#333', textAlign: 'center' }}>
                                                            <strong id={`report-address-${r.id}`}>
                                                                {addressByReport[r.id] ?? 'Not fetched'}
                                                            </strong>
                                                        </div>
                                                    </Col>
                                                </Row>

                                                {/* Bottom section: Description, Category, Status */}
                                                <div className="row">
                                                    <div className="col-6">
                                                        <div className="mb-3">
                                                            <h5 style={{ color: '#00205B', fontWeight: 600 }}>Category</h5>
                                                            <Badge bg="secondary" style={{ fontSize: '1rem', padding: '0.5rem 1rem' }}>
                                                                {r.category?.name}
                                                            </Badge>
                                                        </div>
                                                        {/* Status update actions */}
                                                        <div className="mb-3">
                                                            <h5 style={{ color: '#00205B', fontWeight: 600 }}>Update Status</h5>
                                                            {getAvailableActions(r.status).length > 0 ? (
                                                                <div className="d-flex gap-2 flex-wrap">
                                                                    {getAvailableActions(r.status).map(action => {
                                                                        let variant: string;
                                                                        if (action.value === 'Resolved') {
                                                                            variant = 'success';
                                                                        } else if (action.value === 'InProgress') {
                                                                            variant = 'primary';
                                                                        } else {
                                                                            variant = 'warning';
                                                                        }
                                                                    
                                                                        let background: string;
                                                                        if (action.value === 'Resolved') {
                                                                            background = 'linear-gradient(90deg, #28a745, #34ce57)';
                                                                        } else if (action.value === 'InProgress') {
                                                                            background = 'linear-gradient(90deg, #007bff, #0056b3)';
                                                                        } else {
                                                                            background = 'linear-gradient(90deg, #ffc107, #ff9800)';
                                                                        }
                                                                    
                                                                        return (
                                                                            <Button
                                                                                id={"switch-report-status" + r.title}
                                                                                key={action.value}
                                                                                variant={variant}
                                                                                size="lg"
                                                                                disabled={updatingReportId === r.id}
                                                                                onClick={() => handleStatusChange(r.id, action.value)}
                                                                                className="auth-button-primary"
                                                                                style={{
                                                                                    background,
                                                                                    border: 'none'
                                                                                }}
                                                                            > {updatingReportId === r.id ? (
                                                                                <>
                                                                                    <Loader2Icon
                                                                                        size={16}
                                                                                        className="animate-spin me-1"
                                                                                    />
                                                                                    Updating...
                                                                                </>
                                                                            ) : (
                                                                                <>{action.label}</>
                                                                            )}
                                                                            </Button>
                                                                        );
                                                                    })}
                                                                </div>
                                                            ) : (
                                                                <motion.div
                                                                    initial={{ opacity: 0, y: -5 }}
                                                                    animate={{ opacity: 1, y: 0 }}
                                                                    transition={{ duration: 0.3 }}
                                                                >
                                                                    <Alert variant="info" className="mb-0 py-2">
                                                                        This report is completed and cannot be modified.
                                                                    </Alert>
                                                                </motion.div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className='col-6'>
                                                        <div className="mb-3">
                                                            <h5 style={{ color: '#00205B', fontWeight: 600 }}>Assign to an external maintainer</h5>
                                                            {r?.coAssignedTo ? (
                                                                r?.coAssignedTo.id === 13 ? (
                                                                    <p className=''>Assigned to external maintainer out of Participium</p>
                                                                ) : (
                                                                    <div className="d-flex align-items-center gap-2">
                                                                        <FaUserCircle style={{ width: 40, height: 40, color: '#abcabc' }} />
                                                                        <div>
                                                                            <div style={{ fontWeight: 600 }}>{r.coAssignedTo.firstName} {r.coAssignedTo.lastName}</div>
                                                                            <div style={{ fontWeight: 700 }}>{r.coAssignedTo.company?.name.toUpperCase() ?? 'COMPANY'}</div>
                                                                        </div>
                                                                    </div>
                                                                )
                                                            ) : (
                                                                <div>
                                                                    <div className="d-flex align-items-center gap-2 mb-1">
                                                                        <select
                                                                            id={`assign-maintainer-select-${r.id}`}
                                                                            className="form-select"
                                                                            value={selectedMaintainerByReportId[r.id] ?? ''}
                                                                            onChange={e => setSelectedMaintainerByReportId(prev => ({ ...prev, [r.id]: Number(e.target.value) }))}
                                                                            onFocus={() => handleFetchMaintainers(r)}
                                                                            disabled={assigningReportId === r.id}
                                                                            style={{ maxWidth: 280 }}
                                                                        >
                                                                            <option value="" disabled>Select maintainer</option>
                                                                            {maintainersByReportId
                                                                                .filter(Boolean)
                                                                                .filter(mnt => mnt.id !== 13)
                                                                                .map(m => (
                                                                                    <option key={m?.id} value={m?.id}>{m?.firstName} {m?.lastName} {m?.company ? `- ${typeof m.company === 'string' ? m.company : m.company?.name}` : ''}</option>
                                                                                ))}
                                                                        </select>
                                                                        <Button
                                                                            id={`assign-maintainer-button-${r.id}`}
                                                                            variant="primary"
                                                                            onClick={() => handleAssignMaintainer(r.id)}
                                                                            disabled={!selectedMaintainerByReportId[r.id] || assigningReportId === r.id}
                                                                        >
                                                                            {assigningReportId === r.id ? (
                                                                                <>
                                                                                    <Loader2Icon size={16} className="animate-spin me-1" />
                                                                                    Assigning...
                                                                                </>
                                                                            ) : (
                                                                                'Assign'
                                                                            )}
                                                                        </Button>
                                                                    </div>
                                                                    <motion.div className="mt-1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55, duration: 0.4 }}>
                                                                        or{" "}
                                                                        <button id={`assign-outside-button-${r.id}`}
                                                                            onClick={() => handleAssignMaintainer(r.id, 13)}
                                                                            className="auth-link-inline"
                                                                            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#265ea8', fontWeight: 600, fontFamily: 'inherit' }}
                                                                        > assign to maintainer out of participium
                                                                        </button>
                                                                    </motion.div>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <h5 style={{ color: '#00205B', fontWeight: 600 }}>Comunication</h5>
                                                            <motion.div className="" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55, duration: 0.4 }}>
                                                                <button 
                                                                id="chat-redirect-issuer" 
                                                                onClick={() => { setChatTargetUserId(r.createdBy?.id ?? null); setActiveReport(r); setShow(true); }} 
                                                                className="auth-link-inline"
                                                                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#265ea8', fontWeight: 600, fontFamily: 'inherit' }}
                                                                > Click
                                                                </button>
                                                                {" "}to open chat with the report submitter
                                                            </motion.div>
                                                            {r?.coAssignedTo && r?.coAssignedTo.id !== 13 && (
                                                                <motion.div className="" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55, duration: 0.4 }}>
                                                                    <button 
                                                                    id="chat-redirect-maintainer" 
                                                                    onClick={() => { setChatTargetUserId(r.coAssignedTo?.id ?? null); setActiveReport(r); setShow(true); }} 
                                                                    className="auth-link-inline"
                                                                    style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#265ea8', fontWeight: 600, fontFamily: 'inherit' }}
                                                                    > Click
                                                                    </button>
                                                                    {" "}to open chat with the external maintainer
                                                                </motion.div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </Accordion.Body>
                                        </Accordion.Item>
                                </motion.div>
                            ))}
                        </Accordion>
                    )}
                </div>
                <Chats show={show} handleToggle={handleToggle} activeReport={activeReport} setActiveReport={setActiveReport} targetUserId={chatTargetUserId} />
            </div>
            <Lightbox
                open={lightboxOpen}
                close={() => setLightboxOpen(false)}
                slides={lightboxSlides}
                index={lightboxIndex}
                controller={{ closeOnBackdropClick: true }}
                on={{ index: (newIndex: number) => setLightboxIndex(newIndex) } as any}
            />
        </>
    );
}
