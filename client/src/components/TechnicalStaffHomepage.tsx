import { useEffect, useState } from 'react';
import CustomNavbar from './CustomNavbar';
import { getAssignedReports } from '../api/api';
import type { Report } from '../models/models';
import { Accordion, Badge, Spinner, Alert } from 'react-bootstrap';
import ReportMiniMap from './ReportMiniMap';
import { HomepageMap } from './HomepageMap';

export default function TechnicalStaffHomepage() {
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await getAssignedReports();
                setReports(data);
            } catch (e: any) {
                setError(e?.message || 'Failed to load assigned reports');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

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
                                        <span className="fw-semibold me-3" style={{ color: '#00205B' }}>{r.title}</span>
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
        </div>
    );
}
