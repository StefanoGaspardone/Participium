import CustomNavbar from "./CustomNavbar";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import MapDefault from "./HomepageMap";
import { Form, Button, Row, Col, Card } from "react-bootstrap";
import "./upload.css";
import { Loader2Icon, XIcon } from "lucide-react";
import {
  getCategories,
  uploadImages,
  createReport,
  type CreateReportPayload,
} from "../api/api";
import { isApiError, type Category, type Coord, type FieldErrors } from "../models/models";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import Select, { components, type MenuProps, type SingleValue, type OptionProps } from "react-select";
import "./AuthForms.css";

type Props = {
  selected: Coord | null;
  setSelected: React.Dispatch<React.SetStateAction<Coord | null>>;
};

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

export default function UploadReport({ selected, setSelected }: Props) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [anonymous] = useState(false); // feature currently disabled
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const addressRef = useRef<HTMLInputElement | null>(null);
  const titleRef = useRef<HTMLInputElement | null>(null);
  const descRef = useRef<HTMLTextAreaElement | null>(null);
  const categorySelectRef = useRef<any>(null);
  const [hover, setHover] = useState(false);

  const navigate = useNavigate();

  const autoGrow = () => {
    const el = descRef.current;
    if (!el) return;

    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  };

  useEffect(() => {
    autoGrow();
  }, [description]);

  useEffect(() => {
    const urls = images.map((f) => URL.createObjectURL(f));
    setPreviews(urls);

    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [images]);

  let first = true;
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await getCategories();
        setCategories(res);
      } catch (e) {
        console.error("Failed to load categories", e);
      }
    };

    if (first) {
      fetchCategories();
      first = false;
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!canSubmitRequired) {
      setFieldErrors((prev) => ({
        ...prev,
        ...(selected
          ? {}
          : {
            lat: "Select a location on the map",
            long: "Select a location on the map",
          }),
      }));
      setGeneralError("Please fill all required fields.");

      setTimeout(() => {
        if (!selected) {
          addressRef.current?.focus();
        } else if (title.trim().length === 0) {
          titleRef.current?.focus();
        } else if (description.trim().length === 0) {
          descRef.current?.focus();
        } else if (!categoryId) {
          categorySelectRef.current?.focus();
        } else if (images.length < 1) {
          fileInputRef.current?.focus();
        }
      }, 0);

      return;
    }
    setIsSubmitting(true);
    setFieldErrors({});
    setGeneralError(null);

    try {
      const imageUrls = await Promise.all(
        images.map((img) => uploadImages(img))
      );

      const payload: CreateReportPayload = {
        title: title.trim(),
        description: description.trim(),
        categoryId: Number(categoryId),
        images: imageUrls,
        lat: selected!.lat,
        long: selected!.lng,
        anonymous,
      };
      await createReport(payload);

      toast.success("Report successfully created!");
      navigate("/");
    } catch (err: unknown) {
      if (isApiError(err)) {
        if (err.errors) {
          setFieldErrors(err.errors);

          setTimeout(() => {
            const keys = Object.keys(err.errors as Record<string, unknown>);
            if (keys.includes("location")) {
              addressRef.current?.focus();
            } else if (keys.includes("title")) {
              titleRef.current?.focus();
            } else if (keys.includes("description")) {
              descRef.current?.focus();
            } else if (keys.includes("categoryId")) {
              categorySelectRef.current?.focus();
            } else if (keys.includes("images")) {
              fileInputRef.current?.focus();
            }
          }, 0);
        } else {
          const msg = err.message || "Request failed";
          setGeneralError(msg);
          toast.error(msg);
        }
      } else if (err instanceof Error) {
        setGeneralError(err.message);
        toast.error(err.message);
      } else {
        setGeneralError("Network error, please retry.");
        toast.error("Network error, please retry.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const onClickAddImage = () => {
    if (images.length >= 3) return;
    fileInputRef.current?.click();
  };

  const onFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;
    if (images.length >= 3) return;

    setImages((prev) => [...prev, file]);
    e.target.value = "";
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const canSubmitRequired = Boolean(
    selected &&
    title.trim().length > 0 &&
    description.trim().length > 0 &&
    categoryId &&
    images.length >= 1
  );

  return (
    <>
      <CustomNavbar />
      <main className="upload-container">
        <section className="upload-form">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
            <Card className="auth-card p-3 p-md-4">
              <Button
                id="go-to-homepage-button"
                variant="warning"
                className="mb-3"
                onClick={() => navigate("/")}
                onMouseEnter={() => setHover(true)}
                onMouseLeave={() => setHover(false)}
                onFocus={() => setHover(true)}
                onBlur={() => setHover(false)}
                style={{
                  transform: hover ? 'translateY(-2px) scale(1.03)' : 'translateY(0) scale(1)',
                  transition: 'transform 0.2s ease'
                }}
              >
                Go back to Homepage
              </Button>
              <Form onSubmit={handleSubmit} className="d-flex flex-column auth-grid-gap">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05, duration: 0.4 }}>
                  <section className="upload-map mb-3">
                    <MapDefault selected={selected} setSelected={setSelected} />
                  </section>
                </motion.div>
                <Row className="mb-1">
                  <Col md={12}>
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.4 }}>
                      <Form.Group className="mb-3 underline-anim">
                        <Form.Label>Address</Form.Label>
                        <Form.Control
                          id="address-field"
                          type="text"
                          value={selected ? selected.address : ""}
                          readOnly
                          isInvalid={Boolean(fieldErrors.location)}
                          ref={addressRef}
                          tabIndex={0}
                          className="auth-input"
                        />
                        {fieldErrors.location && (
                          <Form.Control.Feedback type="invalid">
                            {Array.isArray(fieldErrors.location)
                              ? fieldErrors.location.join(", ")
                              : fieldErrors.location}
                          </Form.Control.Feedback>
                        )}
                      </Form.Group>
                    </motion.div>
                  </Col>
                </Row>
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.4 }}>
                  <Form.Group className="mb-3 underline-anim">
                    <Form.Label>Title</Form.Label>
                    <Form.Control
                      id="title-field"
                      type="text"
                      placeholder="Enter a title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      ref={titleRef}
                      isInvalid={Boolean(fieldErrors.title)}
                      className="auth-input"
                    />
                    {fieldErrors.title && (
                      <Form.Control.Feedback type="invalid">
                        {Array.isArray(fieldErrors.title)
                          ? fieldErrors.title.join(", ")
                          : fieldErrors.title}
                      </Form.Control.Feedback>
                    )}
                  </Form.Group>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.4 }}>
                  <Form.Group className="mb-3 underline-anim">
                    <Form.Label>Description</Form.Label>
                    <Form.Control
                      id="description-field"
                      as="textarea"
                      rows={3}
                      placeholder="Describe the issue"
                      value={description}
                      ref={descRef}
                      onChange={(e) => setDescription(e.target.value)}
                      className="auto-textarea auth-input"
                      isInvalid={Boolean(fieldErrors.description)}
                    />
                    {fieldErrors.description && (
                      <Form.Control.Feedback type="invalid">
                        {Array.isArray(fieldErrors.description)
                          ? fieldErrors.description.join(", ")
                          : fieldErrors.description}
                      </Form.Control.Feedback>
                    )}
                  </Form.Group>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.4 }}>
                  <Form.Group className="mb-3">
                    <Form.Label>Category</Form.Label>
                    <Select<{ value: string; label: string }>
                      inputId="select-category"
                      instanceId="select-category"
                      ref={categorySelectRef}
                      options={categories.map(c => ({ value: String(c.id), label: c.name }))}
                      value={categories.map(c => ({ value: String(c.id), label: c.name })).find(o => o.value === categoryId) ?? null}
                      onChange={(opt: SingleValue<{ value: string; label: string }>) => setCategoryId(opt?.value ?? "")}
                      placeholder="Select a category"
                      isDisabled={isSubmitting}
                      classNamePrefix="rs"
                      components={{ Menu: AnimatedMenu, Option: CategoryOption }}
                    />
                    {fieldErrors.categoryId && (
                      <div className="text-danger mt-1">
                        {Array.isArray(fieldErrors.categoryId)
                          ? fieldErrors.categoryId.join(", ")
                          : fieldErrors.categoryId}
                      </div>
                    )}
                  </Form.Group>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.4 }}>
                  <Form.Group className="mb-3">
                    <Form.Label>Images (min 1, max 3)</Form.Label>
                    <Row className="g-2">
                      {previews.map((src, index) => (
                        <Col key={index} xs={12} sm={6} md={4}>
                          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.25 }} className="image-tile">
                            <img
                              src={src}
                              alt={`selected-${index}`}
                              className="image-tile-img"
                            />
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => removeImage(index)}
                              className="image-remove-btn"
                              aria-label={`Remove image ${index + 1}`}
                            >
                              <XIcon size={20} />
                            </Button>
                          </motion.div>
                        </Col>
                      ))}
                      {images.length < 3 && (
                        <Col xs={12} sm={6} md={4}>
                          <motion.button initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.25 }}
                            id="add-image-button"
                            onClick={onClickAddImage}
                            className="add-image-tile"
                            type="button"
                            aria-label="Add image"
                          >
                            Click to add an image
                          </motion.button>
                        </Col>
                      )}
                    </Row>
                    <input
                      id="image-input"
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={onFilesSelected}
                      className="d-none"
                      aria-label="Add image file"
                      title="Add image file"
                    />
                    {fieldErrors.images && (
                      <div className="text-danger mt-1">
                        {Array.isArray(fieldErrors.images)
                          ? fieldErrors.images.join(", ")
                          : fieldErrors.images}
                      </div>
                    )}
                  </Form.Group>
                </motion.div>
                {generalError && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-danger mb-2" role="alert">
                    {generalError}
                  </motion.div>
                )}
                {Object.keys(fieldErrors || {}).length > 0 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-danger mb-2" role="alert">
                    There are some errors - please check the highlighted fields.
                  </motion.div>
                )}
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38, duration: 0.45 }}>
                  <Button
                    id="submit-button"
                    variant="primary"
                    type="submit"
                    className={`w-100 mt-2 auth-button-primary d-inline-flex align-items-center justify-content-center gap-2 ${!canSubmitRequired || isSubmitting ? "submit-disabled" : ""
                      }`}
                    disabled={!canSubmitRequired || isSubmitting}
                    aria-disabled={!canSubmitRequired || isSubmitting}
                    aria-busy={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2Icon size={18} className="spin" aria-hidden="true" />
                        <span>Uploading…</span>
                      </>
                    ) : (
                      "Upload"
                    )}
                  </Button>
                </motion.div>
              </Form>
            </Card>
          </motion.div>
        </section>
      </main>
    </>
  );
}
