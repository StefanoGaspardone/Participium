import { useEffect, useState } from 'react';
import CustomNavbar from './CustomNavbar';
import { getAssignedReports, updateReportStatus, getExternalMaintainers, assignReportToExternalMaintainer } from '../api/api';
import type { Report, User } from '../models/models';
import { Accordion, Badge, Alert, Button, Card } from 'react-bootstrap';
import ReportMiniMap from './ReportMiniMap';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2Icon } from 'lucide-react';
import { FaUserCircle } from "react-icons/fa";
import './AuthForms.css';
import Chats from './Chats';

export default function TechnicalStaffHomepage() {
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [updatingReportId, setUpdatingReportId] = useState<number | null>(null);
    const [assigningReportId, setAssigningReportId] = useState<number | null>(null);
    const [maintainersByReportId, setMaintainersByReportId] = useState<User[]>([]);
    const [selectedMaintainerByReportId, setSelectedMaintainerByReportId] = useState<Record<number, number | null>>({});

    const [show, setShow] = useState<boolean>(false);
    const [activeReport, setActiveReport] = useState<Report | null>(null);

    const handleToggle = () => {
        setShow(prev => !prev);
    }

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

    const handleAssignMaintainer = async (report: Report, overrideMaintainerId?: number) => {
        const maintainerId = overrideMaintainerId ?? selectedMaintainerByReportId[report.id];
        if (!maintainerId) return;
        try {
            setAssigningReportId(report.id);
            const res = await assignReportToExternalMaintainer(report.id, maintainerId);
            
            setReports(prev => prev.map(r => r.id === report.id ? res.report : r));
        } catch (e) {
            console.error('Failed to assign external maintainer', e);
        } finally {
            setAssigningReportId(null);
        }
    };

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
        <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%)' }}>
            <CustomNavbar />
            <div className="container py-5">
                <motion.h2
                    className="mb-4 text-center auth-title"
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
                    <Accordion alwaysOpen>
                        {reports.map((r, idx) => (
                            <motion.div
                                key={r.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.08, duration: 0.4 }}
                            >
                                <Card className="mb-3 auth-card">
                                    <Accordion.Item eventKey={String(idx)}>
                                        <Accordion.Header>
                                            <div onClick={() => handleFetchMaintainers(r)} className="d-flex w-100 align-items-center justify-content-between">
                                                <h4 id="report-title" className="mb-0 fw-bold" style={{ color: '#00205B', fontSize: '1.5rem' }}>{r.title}</h4>
                                                <small className="text-muted" style={{ fontSize: '0.9rem', whiteSpace: 'nowrap', marginLeft: '1rem' }}>
                                                    {new Date(r.createdAt).toLocaleString()}
                                                </small>
                                            </div>
                                        </Accordion.Header>
                                        <Accordion.Body>
                                            {/* Top section: Images and Map side by side */}
                                            <div className="row mb-4">
                                                <div className="col-md-6">
                                                    <div style={{
                                                        border: '1px solid #ddd',
                                                        borderRadius: '8px',
                                                        padding: '1rem',
                                                        height: '400px',
                                                        overflow: 'hidden'
                                                    }}>
                                                        {r.images?.length ? (
                                                            <div style={{
                                                                display: 'flex',
                                                                gap: '0.5rem',
                                                                overflowX: 'auto',
                                                                height: '100%',
                                                                alignItems: 'center'
                                                            }}>
                                                                {r.images.map((img, i) => (
                                                                    <img
                                                                        key={i}
                                                                        src={img}
                                                                        alt={`report-${r.id}-img-${i}`}
                                                                        style={{
                                                                            minWidth: '250px',
                                                                            height: '100%',
                                                                            objectFit: 'cover',
                                                                            borderRadius: '6px',
                                                                            flexShrink: 0
                                                                        }}
                                                                    />
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <div className="d-flex align-items-center justify-content-center h-100">
                                                                <p className="text-muted fst-italic mb-0">No images available</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="col-md-6">
                                                    <div style={{
                                                        border: '1px solid #ddd',
                                                        borderRadius: '8px',
                                                        overflow: 'hidden',
                                                        height: '300px'
                                                    }}>
                                                        <ReportMiniMap lat={Number(r.lat)} long={Number(r.long)} />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Bottom section: Description, Category, Status */}
                                            <div className="row">
                                                <div className="col-6">
                                                    <div className="mb-3">
                                                        <h5 style={{ color: '#00205B', fontWeight: 600 }}>Description</h5>
                                                        <p className="mb-0">{r.description}</p>
                                                    </div>

                                                    <div className="mb-3">
                                                        <h5 style={{ color: '#00205B', fontWeight: 600 }}>Category</h5>
                                                        <Badge bg="secondary" style={{ fontSize: '1rem', padding: '0.5rem 1rem' }}>
                                                            {r.category?.name}
                                                        </Badge>
                                                    </div>

                                                    <div className="mb-3">
                                                        <h5 style={{ color: '#00205B', fontWeight: 600 }}>Current Status</h5>
                                                        <Badge
                                                            id={"current-status" + r.title}
                                                            bg={r.status === 'Assigned' ? 'primary' : r.status === 'Resolved' ? 'success' : 'warning'}
                                                            style={{ fontSize: '1rem', padding: '0.5rem 1rem' }}
                                                        >
                                                            {r.status}
                                                        </Badge>
                                                    </div>
                    
                                                    {/* Status update actions */}
                                                    <div className="mb-3">
                                                        <h5 style={{ color: '#00205B', fontWeight: 600 }}>Update Status</h5>
                                                        {getAvailableActions(r.status).length > 0 ? (
                                                            <div className="d-flex gap-2 flex-wrap">
                                                                {getAvailableActions(r.status).map(action => (
                                                                    <Button
                                                                        id={"switch-report-status" + r.title}
                                                                        key={action.value}
                                                                        variant={
                                                                            action.value === 'Resolved' ? 'success' :
                                                                                action.value === 'InProgress' ? 'primary' :
                                                                                    'warning'
                                                                        }
                                                                        size="lg"
                                                                        disabled={updatingReportId === r.id}
                                                                        onClick={() => handleStatusChange(r.id, action.value)}
                                                                        className="auth-button-primary"
                                                                        style={{
                                                                            background: action.value === 'Resolved'
                                                                                ? 'linear-gradient(90deg, #28a745, #34ce57)'
                                                                                : action.value === 'InProgress'
                                                                                    ? 'linear-gradient(90deg, #007bff, #0056b3)'
                                                                                    : 'linear-gradient(90deg, #ffc107, #ff9800)',
                                                                            border: 'none'
                                                                        }}
                                                                    >
                                                                        {updatingReportId === r.id ? (
                                                                            <>
                                                                                <Loader2Icon
                                                                                    size={16}
                                                                                    className="animate-spin me-1"
                                                                                />
                                                                                Updating...
                                                                            </>
                                                                        ) : action.label}
                                                                    </Button>
                                                                ))}
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

                                                    {/* Send message button */}
                                                    <div>
                                                        <h5 style={{ color: '#00205B', fontWeight: 600 }}>Communication</h5>
                                                        <Button
                                                            variant="primary"
                                                            size="lg"
                                                            onClick={() => { setActiveReport(r); setShow(true); }}
                                                            className="auth-button-primary"
                                                            style={{
                                                                background: 'linear-gradient(90deg, #007bff, #0056b3)',
                                                                border: 'none'
                                                            }}
                                                        >
                                                            Send message
                                                        </Button>
                                                    </div>
                                                </div>
                                                <div className = 'col-6'>
                                                    <div className="mb-4">
                                                        <h5 style={{ color: '#00205B', fontWeight: 600 }}>External Maintainer</h5>
                                                        { r?.coAssignedTo ? (
                                                            r?.coAssignedTo.id === 13 ? (
                                                                <p className = ''>Assigned to external maintainer out of Participium</p>
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
                                                                <div className="d-flex align-items-center gap-2 mb-2">
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
                                                                        {maintainersByReportId.filter(mnt => mnt.id !== 13).map(m => (
                                                                            <option key={m.id} value={m.id}>{m.firstName} {m.lastName} {m.company ? `- ${m.company.name}` : ''}</option>
                                                                        ))}
                                                                    </select>
                                                                    <Button
                                                                        id={`assign-maintainer-button-${r.id}`}
                                                                        variant="primary"
                                                                        onClick={() => handleAssignMaintainer(r)}
                                                                        disabled={!selectedMaintainerByReportId[r.id] || assigningReportId === r.id}
                                                                        className="auth-button-primary"
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
                                                                <Button
                                                                    id={`assign-outside-button-${r.id}`}
                                                                    variant="link"
                                                                    className="ms-2 p-0"
                                                                    disabled={assigningReportId === r.id}
                                                                    onClick={() => handleAssignMaintainer(r, 13)}
                                                                >
                                                                    {assigningReportId === r.id ? (
                                                                        <>
                                                                            <Loader2Icon size={16} className="animate-spin me-1" />
                                                                            Assigning...
                                                                        </>
                                                                    ) : (
                                                                        'or assign to maintainer out of Participium'
                                                                    )}
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </Accordion.Body>
                                    </Accordion.Item>
                                </Card>
                            </motion.div>
                        ))}
                    </Accordion>
                )}
            </div>
            <Chats show={show} handleToggle={handleToggle} activeReport={activeReport} setActiveReport={setActiveReport} />
        </div>
    );
}
