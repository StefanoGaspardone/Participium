import { useEffect, useState } from 'react';
import CustomNavbar from './CustomNavbar';
import { Accordion, Card, Container, Row, Col, Form, Button, Alert, Spinner, Image } from 'react-bootstrap';
import { getReportsByStatus, getCategories, updateReportCategory, updateReportStatus } from '../api/api';
import type { Report, Category } from '../models/models';
import { useAppContext } from '../contexts/AppContext';

import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';

interface PendingReport extends Report { }

export default function PROHomepage() {
    const { user } = useAppContext();
    const [reports, setReports] = useState<PendingReport[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [categories, setCategories] = useState<Category[]>([]);
    const [updatingId, setUpdatingId] = useState<number | null>(null);
    const [statusUpdatingId, setStatusUpdatingId] = useState<number | null>(null);
    const [rejectReason, setRejectReason] = useState<Record<number, string>>({});
    const [expanded, setExpanded] = useState<number | null>(null);

    // Lightbox state: slides array and current index
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxSlides, setLightboxSlides] = useState<{ src: string }[]>([]);
    const [lightboxIndex, setLightboxIndex] = useState(0);

    useEffect(() => {
        const bootstrap = async () => {
            try {
                setLoading(true);
                const [cats, reps] = await Promise.all([
                    getCategories(),
                    getReportsByStatus('PendingApproval'),
                ]);
                reps.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                setCategories(cats);
                setReports(reps);
            } catch (e: any) {
                setError(e?.message || 'Failed to load data');
            } finally {
                setLoading(false);
            }
        };
        bootstrap();
    }, []);

    const handleToggle = (id: number) => {
        setExpanded(prev => (prev === id ? null : id));
    };

    const handleCategoryChange = async (report: PendingReport, categoryIdStr: string) => {
        const categoryId = Number(categoryIdStr);
        if (!categoryId || categoryId === report.category.id) return;
        try {
            setUpdatingId(report.id);
            const updated = await updateReportCategory(report.id, categoryId);
            setReports(rs => rs.map(r => (r.id === report.id ? { ...r, category: updated.category } : r)));
        } catch (e: any) {
            alert(e?.message || 'Category update failed');
        } finally {
            setUpdatingId(null);
        }
    };

    const acceptReport = async (report: PendingReport) => {
        try {
            setStatusUpdatingId(report.id);
            await updateReportStatus(report.id, 'Assigned');
            setReports(rs => rs.filter(r => r.id !== report.id));
        } catch (e: any) {
            alert(e?.message || 'Accept failed');
        } finally {
            setStatusUpdatingId(null);
        }
    };

    const rejectReport = async (report: PendingReport) => {
        const reason = rejectReason[report.id]?.trim();
        if (!reason) {
            alert('Please provide a rejection reason.');
            return;
        }
        try {
            setStatusUpdatingId(report.id);
            await updateReportStatus(report.id, 'Rejected', reason);
            setReports(rs => rs.filter(r => r.id !== report.id));
        } catch (e: any) {
            alert(e?.message || 'Reject failed');
        } finally {
            setStatusUpdatingId(null);
        }
    };

    // Open lightbox for a report's images at a specific index
    const openLightbox = (images: string[], index: number) => {
        setLightboxSlides(images.map(src => ({ src })));
        setLightboxIndex(index);
        setLightboxOpen(true);
    };

    if (user?.userType !== 'PUBLIC_RELATIONS_OFFICER') {
        return (
            <>
                <CustomNavbar />
                <Container className="mt-4">
                    <Alert variant="danger" className="text-center">
                        Access denied: this page is reserved for Public Relations Officers.
                    </Alert>
                </Container>
            </>
        );
    }

    return (
        <>
            <CustomNavbar />
            <Container className="mt-4">
                <h2 className="mb-3 text-center">Pending Reports</h2>
                {error && <Alert variant="danger">{error}</Alert>}
                {loading && (
                    <div className="d-flex justify-content-center my-4">
                        <Spinner animation="border" role="status" aria-label="Loading reports" />
                    </div>
                )}
                {!loading && reports.length === 0 && (
                    <Alert variant="info">No reports pending approval.</Alert>
                )}

                <Accordion activeKey={expanded ? String(expanded) : undefined} alwaysOpen>
                    {reports.map(r => (
                        <Card key={r.id} className="mb-2 shadow-sm">
                            <Accordion.Item eventKey={String(r.id)}>
                                <Accordion.Header onClick={() => handleToggle(r.id)}>
                                    <div className="d-flex flex-column flex-md-row w-100">
                                        <strong className="me-auto">{r.title}</strong>
                                        <small className="text-muted">{new Date(r.createdAt).toLocaleString()}</small>
                                    </div>
                                </Accordion.Header>
                                <Accordion.Body>
                                    <Row>
                                        <Col md={8}>
                                            <p><strong>Description:</strong> {r.description}</p>
                                            <p><strong>Category:</strong> {r.category.name}</p>

                                            <Form.Group className="mb-3">
                                                <Form.Label>Change Category</Form.Label>
                                                <Form.Select
                                                    disabled={updatingId === r.id || statusUpdatingId === r.id}
                                                    defaultValue={r.category.id}
                                                    onChange={e => handleCategoryChange(r, e.target.value)}
                                                    aria-label="Select new category"
                                                >
                                                    {categories.map(c => (
                                                        <option key={c.id} value={c.id}>
                                                            {c.name}
                                                        </option>
                                                    ))}
                                                </Form.Select>
                                                {updatingId === r.id && <small className="text-primary">Updating category…</small>}
                                            </Form.Group>

                                            <Form.Group className="mb-3">
                                                <Form.Label>Rejection Reason (only if rejecting)</Form.Label>
                                                <Form.Control
                                                    as="textarea"
                                                    rows={3}
                                                    placeholder="Enter reason to reject this report"
                                                    disabled={statusUpdatingId === r.id}
                                                    value={rejectReason[r.id] || ''}
                                                    onChange={e => setRejectReason(prev => ({ ...prev, [r.id]: e.target.value }))}
                                                />
                                            </Form.Group>

                                            <div className="d-flex gap-2">
                                                <Button
                                                    variant="success"
                                                    size="sm"
                                                    disabled={statusUpdatingId === r.id}
                                                    onClick={() => acceptReport(r)}
                                                >
                                                    {statusUpdatingId === r.id ? 'Processing…' : 'Accept'}
                                                </Button>
                                                <Button
                                                    variant="danger"
                                                    size="sm"
                                                    disabled={statusUpdatingId === r.id}
                                                    onClick={() => rejectReport(r)}
                                                >
                                                    {statusUpdatingId === r.id ? 'Processing…' : 'Reject'}
                                                </Button>
                                            </div>
                                        </Col>

                                        <Col md={4}>
                                            <div className="d-flex flex-wrap gap-2">
                                                {r.images.slice(0, 3).map((img, idx) => (
                                                    <button
                                                        key={idx}
                                                        type="button"
                                                        className="p-0 border-0 bg-transparent"
                                                        onClick={() => openLightbox(r.images, idx)}
                                                        aria-label={`Open image ${idx + 1}`}
                                                    >
                                                        <Image
                                                            src={img}
                                                            alt={`Report image ${idx + 1}`}
                                                            thumbnail
                                                            style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                                                        />
                                                    </button>
                                                ))}
                                            </div>
                                        </Col>
                                    </Row>
                                </Accordion.Body>
                            </Accordion.Item>
                        </Card>
                    ))}
                </Accordion>
            </Container>

            {/* Lightbox: slides + index enable arrow navigation; controller enables click-on-backdrop to close */}
            <Lightbox
                open={lightboxOpen}
                close={() => setLightboxOpen(false)}
                slides={lightboxSlides}
                index={lightboxIndex}
                controller={{ closeOnBackdropClick: true }}
                on={(
                    // keep internal index in sync if user navigates with arrows/keyboard
                    { index: (newIndex: number) => setLightboxIndex(newIndex) } as any
                )}
            />
        </>
    );
}