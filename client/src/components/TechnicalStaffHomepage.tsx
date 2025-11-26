import { useEffect, useState } from 'react';
import CustomNavbar from './CustomNavbar';
import { getAssignedReports, updateReportStatus } from '../api/api';
import type { Report } from '../models/models';
import { Accordion, Badge, Alert, Button, Card } from 'react-bootstrap';
import ReportMiniMap from './ReportMiniMap';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2Icon } from 'lucide-react';
import './AuthForms.css';
import Chats from './Chats';

export default function TechnicalStaffHomepage() {
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [updatingReportId, setUpdatingReportId] = useState<number | null>(null);

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
                                            <div id={"expand-report-" + r.title} className="d-flex flex-column flex-md-row w-100">
                                                <span id="report-title" className="fw-semibold me-3" style={{ color: '#00205B' }}>{r.title}</span>
                                                <Button
                                                    size="sm"
                                                    variant="outline-primary"
                                                    onClick={(e) => { e.stopPropagation(); e.preventDefault(); setActiveReport(r); setShow(true); }}
                                                >
                                                    Send message
                                                </Button>
                                                <div className="ms-md-auto d-flex align-items-center gap-2">
                                                    <Badge bg="secondary">{r.category?.name}</Badge>
                                                    <Badge id={"current-status" + r.title} bg={r.status === 'Assigned' ? 'primary' :
                                                        r.status === 'Resolved' ? 'success' : 'warning'}>
                                                        {r.status}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </Accordion.Header>
                                        <Accordion.Body>
                                            <div className="row">
                                                <div className="col-md-8">
                                                    <p className="mb-2"><strong>Description:</strong> {r.description}</p>
                                                    {r.images?.length ? (
                                                        <div className="d-flex flex-wrap gap-2 mb-3">
                                                            {r.images.map((img, i) => (
                                                                <img
                                                                    key={i}
                                                                    src={img}
                                                                    alt={`report-${r.id}-img-${i}`}
                                                                    style={{ width: 120, height: 90, objectFit: 'cover', borderRadius: 6, border: '1px solid #ddd' }}
                                                                />
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <p className="text-muted fst-italic">No images</p>
                                                    )}
                                                    <p className="mb-2"><strong>Created At:</strong> {new Date(r.createdAt).toLocaleString()}</p>

                                                    {/* Status update actions */}
                                                    <div className="mt-3">
                                                        <p className="mb-2" style={{ fontWeight: 500, color: '#00205B' }}>Update Status:</p>
                                                        {getAvailableActions(r.status).length > 0 ? (
                                                            <div className="d-flex gap-2">
                                                                {getAvailableActions(r.status).map(action => (
                                                                    <Button
                                                                        id={"switch-report-status" + r.title}
                                                                        key={action.value}
                                                                        variant={
                                                                            action.value === 'Resolved' ? 'success' :
                                                                                action.value === 'InProgress' ? 'primary' :
                                                                                    'warning'
                                                                        }
                                                                        size="sm"
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
                                                                                    size={14}
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
                                                </div>
                                                <div className="col-md-4 mt-2">
                                                    <ReportMiniMap lat={Number(r.lat)} long={Number(r.long)} />
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
