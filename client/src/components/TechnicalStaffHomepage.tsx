import { useEffect, useState } from 'react';
import CustomNavbar from './CustomNavbar';
import { getAssignedReports, updateReportStatus } from '../api/api';
import type { Report } from '../models/models';
import { Accordion, Badge, Spinner, Alert, Button } from 'react-bootstrap';
import { HomepageMap } from './HomepageMap';
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
        <div style={{ minHeight: '100vh', background: '#f5f9ff' }}>
            <CustomNavbar />
            <div className="container py-4">
                <h2 className="mb-4 fw-semibold" style={{ color: '#00205B' }}>My Assigned Reports</h2>
                {loading && (
                    <div className="d-flex align-items-center gap-2 mb-3">
                        <Spinner animation="border" size="sm" />
                        <span>Loading...</span>
                    </div>
                )}
                {error && (
                    <Alert variant="danger">{error}</Alert>
                )}
                {!loading && !error && reports.length === 0 && (
                    <Alert variant="info">No reports assigned to you yet.</Alert>
                )}
                {!loading && !error && reports.length > 0 && (
                    <Accordion alwaysOpen>
                        {reports.map((r, idx) => (
                            <Accordion.Item eventKey={String(idx)} key={r.id}>
                                <Accordion.Header>
                                    <div className="d-flex flex-column flex-md-row w-100">
                                        <div className="d-flex align-items-center">
                                            <span className="fw-semibold me-3" style={{ color: '#00205B' }}>{r.title}</span>
                                            <Button
                                                size="sm"
                                                variant="outline-primary"
                                                onClick={(e) => { e.stopPropagation(); e.preventDefault(); setActiveReport(r); setShow(true); }}
                                            >
                                                Send message
                                            </Button>
                                        </div>
                                        <div className="ms-md-auto d-flex align-items-center gap-2">
                                            <Badge bg="secondary">{r.category?.name}</Badge>
                                            <Badge bg={r.status === 'Assigned' ? 'primary' :
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
                                                <p className="mb-2"><strong>Update Status:</strong></p>
                                                {getAvailableActions(r.status).length > 0 ? (
                                                    <div className="d-flex gap-2">
                                                        {getAvailableActions(r.status).map(action => (
                                                            <Button
                                                                key={action.value}
                                                                variant={
                                                                    action.value === 'Resolved' ? 'success' :
                                                                    action.value === 'InProgress' ? 'primary' :
                                                                    'warning'
                                                                }
                                                                size="sm"
                                                                disabled={updatingReportId === r.id}
                                                                onClick={() => handleStatusChange(r.id, action.value)}
                                                            >
                                                                {updatingReportId === r.id ? (
                                                                    <>
                                                                        <Spinner
                                                                            as="span"
                                                                            animation="border"
                                                                            size="sm"
                                                                            role="status"
                                                                            aria-hidden="true"
                                                                            className="me-1"
                                                                        />
                                                                        Updating...
                                                                    </>
                                                                ) : action.label}
                                                            </Button>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <Alert variant="info" className="mb-0 py-2">
                                                        This report is completed and cannot be modified.
                                                    </Alert>
                                                )}
                                            </div>
                                        </div>
                                        <div className="col-md-4 mt-2">
                                            <HomepageMap selected={null} setSelected={null} reports={[r]} />
                                        </div>
                                    </div>
                                </Accordion.Body>
                            </Accordion.Item>
                        ))}
                    </Accordion>
                )}
            </div>
            <Chats show = { show } handleToggle = { handleToggle } activeReport = { activeReport } setActiveReport = { setActiveReport }/>
        </div>
    );
}
