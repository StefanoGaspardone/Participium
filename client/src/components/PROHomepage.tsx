import { useEffect, useState } from 'react';
import CustomNavbar from './CustomNavbar';
import { Accordion, Card, Container, Row, Col, Form, Button, Alert, Image } from 'react-bootstrap';
import ReportMiniMap from './ReportMiniMap';
import { getReportsByStatus, getCategories, updateReportCategory, assignOrRejectReport } from '../api/api';
import type { Report, Category } from '../models/models';
import { useAppContext } from '../contexts/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2Icon } from 'lucide-react';
import './AuthForms.css';

import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";

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
  const [showRejectInput, setShowRejectInput] = useState<Record<number, boolean>>({});
  const [rejectErrors, setRejectErrors] = useState<Record<number, string>>({});
  const [expanded, setExpanded] = useState<number | null>(null);

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
    if (!categoryId) return;
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
      await assignOrRejectReport(report.id, 'Assigned');
      setReports(rs => rs.filter(r => r.id !== report.id));
      // Clear any rejection reason and hide input for this report
      setRejectReason(prev => {
        const { [report.id]: _ignored, ...rest } = prev;
        return rest;
      });
      setShowRejectInput(prev => ({ ...prev, [report.id]: false }));
      setRejectErrors(prev => {
        const { [report.id]: _e, ...rest } = prev;
        return rest;
      });
    } catch (e: any) {
      alert(e?.message || 'Accept failed');
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const rejectReport = async (report: PendingReport) => {
    const reason = rejectReason[report.id]?.trim();
    if (!reason) {
      setRejectErrors(prev => ({ ...prev, [report.id]: 'Please insert a reason for rejection.' }));
      return;
    }
    try {
      setStatusUpdatingId(report.id);
      await assignOrRejectReport(report.id, 'Rejected', reason);
      setReports(rs => rs.filter(r => r.id !== report.id));
      setRejectErrors(prev => {
        const { [report.id]: _removed, ...rest } = prev;
        return rest;
      });
    } catch (e: any) {
      setRejectErrors(prev => ({ ...prev, [report.id]: e?.message || 'Rifiuto non riuscito.' }));
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const openLightbox = (images: string[], index: number) => {
    setLightboxSlides(images.map(src => ({ src })));
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const handleRejectClick = (report: PendingReport) => {
    if (!showRejectInput[report.id]) {
      setShowRejectInput(prev => ({ ...prev, [report.id]: true }));
      return;
    }
    rejectReport(report);
  };

  if (user?.userType !== "PUBLIC_RELATIONS_OFFICER") {
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
      <Container className="my-5">
        <motion.h2
          className="mb-4 text-center auth-title"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Public Relations Officer {user?.username}
        </motion.h2>

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

        {!loading && reports.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            <Alert variant="info">No reports pending approval.</Alert>
          </motion.div>
        )}

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
              <Card className="mb-3 auth-card">
                <Accordion.Item eventKey={String(r.id)}>
                  <Accordion.Header
                    onClick={() => handleToggle(r.id)}
                  >
                    <div className="d-flex flex-column flex-md-row w-100">
                      <strong id={"report-title-" + r.title} className="me-auto">{r.title}</strong>
                      <small className="text-muted">
                        {new Date(r.createdAt).toLocaleString()}
                      </small>
                    </div>
                  </Accordion.Header>
                  <Accordion.Body>
                    <Row>
                      <Col md={8}>
                        <p>
                          <strong>Description:</strong> {r.description}
                        </p>
                        {r.images.slice(0, 3).length > 0 && (
                          <div className="d-flex flex-wrap gap-2 mb-3">
                            {r.images.slice(0, 3).map((img, idx) => (
                              <button
                                key={idx}
                                id={"click-expand-" + r.title}
                                type="button"
                                className="p-0 border-0 bg-transparent"
                                onClick={() => openLightbox(r.images, idx)}
                                aria-label={`Open image ${idx + 1}`}
                              >
                                <Image
                                  src={img}
                                  alt={`Report image ${idx + 1}`}
                                  thumbnail
                                  style={{
                                    width: "100px",
                                    height: "100px",
                                    objectFit: "cover",
                                  }}
                                />
                              </button>
                            ))}
                          </div>
                        )}
                        {r.images.slice(0, 3).length === 0 && (
                          <p className="text-muted fst-italic">No images</p>
                        )}
                        <p>
                          <strong>Category:</strong> {r.category.name}
                        </p>

                        <Form.Group className="mb-3">
                          <Form.Label style={{ fontWeight: 500, color: '#00205B' }}>Change Category</Form.Label>
                          <Form.Select
                            id="select-category"
                            disabled={
                              updatingId === r.id || statusUpdatingId === r.id
                            }
                            defaultValue={r.category.id}
                            onChange={(e) =>
                              handleCategoryChange(r, e.target.value)
                            }
                            aria-label="Select new category"
                            style={{
                              borderRadius: '0.55rem',
                              border: '1px solid #ced4da',
                              fontSize: '0.95rem',
                              transition: 'border-color 0.18s ease, box-shadow 0.25s ease'
                            }}
                          >
                            {categories.map((c) => (
                              <option
                                key={c.id}
                                value={c.id}
                                disabled={c.id === r.category.id}
                              >
                                {c.name}
                                {c.id === r.category.id ? " (attuale)" : ""}
                              </option>
                            ))}
                          </Form.Select>
                          {updatingId === r.id && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="d-flex align-items-center gap-1 mt-2"
                            >
                              <Loader2Icon size={14} className="animate-spin" color="#265ea8" />
                              <small style={{ color: '#265ea8', fontWeight: 500 }}>
                                Updating category…
                              </small>
                            </motion.div>
                          )}
                        </Form.Group>

                        <AnimatePresence>
                          {showRejectInput[r.id] && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.3 }}
                            >
                              <Form.Group className="mb-3">
                                <Form.Label style={{ fontWeight: 500, color: '#00205B' }}>Rejection Reason</Form.Label>
                                <Form.Control
                                  id={"description-field" + r.title}
                                  as="textarea"
                                  rows={3}
                                  placeholder="Enter reason to reject this report"
                                  disabled={statusUpdatingId === r.id}
                                  value={rejectReason[r.id] || ""}
                                  isInvalid={!!rejectErrors[r.id]}
                                  onChange={(e) =>
                                    setRejectReason((prev) => ({
                                      ...prev,
                                      [r.id]: e.target.value,
                                    }))
                                  }
                                  onInput={() =>
                                    setRejectErrors(prev => {
                                      const { [r.id]: _err, ...rest } = prev;
                                      return rest;
                                    })
                                  }
                                  style={{
                                    borderRadius: '0.55rem',
                                    fontSize: '0.95rem'
                                  }}
                                />
                                {rejectErrors[r.id] && (
                                  <Form.Control.Feedback type="invalid" className="d-block">
                                    {rejectErrors[r.id]}
                                  </Form.Control.Feedback>
                                )}
                              </Form.Group>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <div className="d-flex gap-2">
                          <Button
                            variant="success"
                            id={"accept-button" + r.title}
                            size="sm"
                            disabled={statusUpdatingId === r.id}
                            onClick={() => acceptReport(r)}
                            className="auth-button-primary"
                            style={{
                              background: 'linear-gradient(90deg, #28a745, #34ce57)',
                              border: 'none'
                            }}
                          >
                            {statusUpdatingId === r.id ? (
                              <>
                                <Loader2Icon size={14} className="animate-spin me-1" />
                                Processing…
                              </>
                            ) : "Accept"}
                          </Button>
                          <Button
                            variant="danger"
                            id={"reject-button" + r.title}
                            size="sm"
                            disabled={statusUpdatingId === r.id}
                            onClick={() => handleRejectClick(r)}
                            className="auth-button-primary"
                            style={{
                              background: 'linear-gradient(90deg, #dc3545, #e74c3c)',
                              border: 'none'
                            }}
                          >
                            {statusUpdatingId === r.id ? (
                              <>
                                <Loader2Icon size={14} className="animate-spin me-1" />
                                Processing…
                              </>
                            ) : showRejectInput[r.id]
                              ? "Confirm Reject"
                              : "Reject"}
                          </Button>
                        </div>
                      </Col>

                      <Col md={4} className="mt-2">
                        <ReportMiniMap lat={Number(r.lat)} long={Number(r.long)} />
                      </Col>
                    </Row>
                  </Accordion.Body>
                </Accordion.Item>
              </Card>
            </motion.div>
          ))}
        </Accordion>
      </Container>
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
