import { useEffect, useState } from 'react';
import CustomNavbar from './CustomNavbar';
import { Accordion, Badge, Card, Container, Row, Col, Form, Button, Alert, Modal } from 'react-bootstrap';
import ReportMiniMap from './ReportMiniMap';
import { fetchAddress } from './HomepageMap';
import { getReportsByStatus, getCategories, updateReportCategory, assignOrRejectReport } from '../api/api';
import type { Report, Category } from '../models/models';
import { useAppContext } from '../contexts/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2Icon, ChevronLeft, ChevronRight } from 'lucide-react';
import Select, { components, type MenuProps, type SingleValue, type OptionProps } from 'react-select';
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
  // modal-based rejection UI
  const [rejectModalReport, setRejectModalReport] = useState<PendingReport | null>(null);
  const [rejectModalReason, setRejectModalReason] = useState('');
  const [rejectModalError, setRejectModalError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [addressByReport, setAddressByReport] = useState<Record<number, string>>({});

  const [imageIndexByReport, setImageIndexByReport] = useState<Record<number, number>>({});

  // react-select options for categories
  const categoryOptions = categories.map((cat) => ({ value: String(cat.id), label: cat.name }));

  const AnimatedMenu = (props: MenuProps<any, false>) => (
    <AnimatePresence>
      {props.selectProps.menuIsOpen && (
        <components.Menu {...props}>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            {props.children}
          </motion.div>
        </components.Menu>
      )}
    </AnimatePresence>
  );

  const CategoryOption = (props: OptionProps<any, false>) => {
    const id = `select-category-${String(props.data.value)}`;
    return (
      <div id={id}>
        <components.Option {...props} />
      </div>
    );
  };

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
    } catch (e) {
      setAddressByReport(prev => ({ ...prev, [reportId]: 'Not available' }));
    }
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
      // nothing else to clear (rejection now handled via modal)
    } catch (e: any) {
      alert(e?.message || 'Accept failed');
    } finally {
      setStatusUpdatingId(null);
    }
  };

  // Confirm rejection from modal
  const confirmReject = async () => {
    if (!rejectModalReport) return;
    const reason = rejectModalReason.trim();
    if (!reason) {
      setRejectModalError('Please insert a reason for rejection.');
      return;
    }
    try {
      setStatusUpdatingId(rejectModalReport.id);
      await assignOrRejectReport(rejectModalReport.id, 'Rejected', reason);
      setReports(rs => rs.filter(r => r.id !== rejectModalReport.id));
      setRejectModalReport(null);
      setRejectModalReason('');
      setRejectModalError(null);
    } catch (e: any) {
      setRejectModalError(e?.message || 'Rifiuto non riuscito.');
    } finally {
      setStatusUpdatingId(null);
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

  const showPrevImage = (reportId: number, imagesLength: number) => {
    if (!imagesLength) return;
    setImageIndexByReport(prev => {
      const cur = prev[reportId] ?? 0;
      const next = (cur - 1 + imagesLength) % imagesLength;
      return { ...prev, [reportId]: next };
    });
  };

  const showNextImage = (reportId: number, imagesLength: number) => {
    if (!imagesLength) return;
    setImageIndexByReport(prev => {
      const cur = prev[reportId] ?? 0;
      const next = (cur + 1) % imagesLength;
      return { ...prev, [reportId]: next };
    });
  };

  const handleRejectClick = (report: PendingReport) => {
    setRejectModalReport(report);
    setRejectModalReason('');
    setRejectModalError(null);
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
                    <div className="d-flex w-100 align-items-center justify-content-between">
                      <h4 id={"report-title-" + r.title} className="mb-0 fw-bold" style={{ color: '#00205B', fontSize: '1.5rem' }}>{r.title}</h4>
                      <small className="text-muted" style={{ fontSize: '0.9rem', whiteSpace: 'nowrap', marginLeft: '1rem', marginRight: '0.5rem' }}>
                        {new Date(r.createdAt).toLocaleString()}
                      </small>
                    </div>
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

                              <div onClick={(e) => e.stopPropagation()} style={{ cursor: 'pointer' }}>
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
                                    onClick={() => openLightbox(r.images, getCurrentImageIndex(r.id, r.images.length))}
                                  />
                                </AnimatePresence>
                              </div>

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
                        <div className="mt-2" style={{ marginLeft: '10px' }}>
                          <h5 style={{ color: '#00205B', fontWeight: 400 }}>{r.description}</h5>
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

                    {/* Bottom section: Description, Category, Actions */}
                    <Row>
                      <Col md={6}>
                        <div className="mb-3 d-flex" style={{ gap: '0.5rem', marginLeft: '10px', alignItems: 'center' }}>
                          <h5 style={{ color: '#00205B', fontWeight: 600, margin: 0 }}>Current category</h5>
                          <Badge bg="secondary" style={{ fontSize: '1rem', padding: '0.5rem 1rem' }}>
                            {r.category.name}
                          </Badge>
                        </div>
                        <Form.Group
                          className="mb-3 d-flex"
                          style={{ alignItems: 'center', gap: '0.5rem', marginLeft: '10px' }}
                        >
                          <h5 style={{ color: '#F97316', fontWeight: 600, margin: 0, whiteSpace: 'nowrap' }}>Change category</h5>
                          <div style={{ minWidth: '300px', maxWidth: '400px' }}>
                            <Select
                              inputId={`select-category-${r.id}`}
                              instanceId={`select-category-${r.id}`}
                              options={categoryOptions}
                              value={categoryOptions.find((o) => o.value === String(r.category.id)) ?? null}
                              onChange={(opt: SingleValue<{ value: string; label: string }>) =>
                                handleCategoryChange(r, opt?.value ?? "")
                              }
                              isDisabled={updatingId === r.id || statusUpdatingId === r.id}
                              placeholder="Select a category"
                              components={{ Menu: AnimatedMenu, Option: CategoryOption }}
                              classNamePrefix="rs"
                            />
                          </div>
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
                      </Col>
                      <Col md={6}>
                        {/* rejection now handled via modal; inline reject form removed */}

                        <div style={{ textAlign: 'center' }}>
                          <h5 style={{ color: '#00205B', fontWeight: 600 }}>Actions</h5>
                          <div className="d-flex gap-2 flex-wrap" style={{ justifyContent: 'center' }}>
                            <Button
                              variant="success"
                              id={"accept-button" + r.title}
                              size="lg"
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
                                  <Loader2Icon size={16} className="animate-spin me-1" />
                                  Processing…
                                </>
                              ) : "Accept"}
                            </Button>
                            <Button
                              variant="danger"
                              id={"reject-button" + r.title}
                              size="lg"
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
                                  <Loader2Icon size={16} className="animate-spin me-1" />
                                  Processing…
                                </>
                              ) : "Reject"}
                            </Button>
                          </div>
                        </div>
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
      <Modal show={!!rejectModalReport} onHide={() => setRejectModalReport(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Reason for rejection</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Control
              as="textarea"
              rows={4}
              placeholder="Enter reason to reject this report"
              value={rejectModalReason}
              onChange={(e) => { setRejectModalReason(e.target.value); setRejectModalError(null); }}
              isInvalid={!!rejectModalError}
            />
            {rejectModalError && (
              <Form.Control.Feedback type="invalid" className="d-block">
                {rejectModalError}
              </Form.Control.Feedback>
            )}
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setRejectModalReport(null)}>Cancel</Button>
          <Button variant="danger" onClick={confirmReject} disabled={statusUpdatingId === rejectModalReport?.id}>
            {statusUpdatingId === rejectModalReport?.id ? (
              <>
                <Loader2Icon size={14} className="animate-spin me-1" />
                Processing…
              </>
            ) : (
              'Confirm Reject'
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
