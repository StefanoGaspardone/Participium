import CustomNavbar from "./CustomNavbar";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Map from "./HomepageMap";
import { Form, Button, Row, Col } from "react-bootstrap";
import "./upload.css";
import { Loader2Icon, XIcon } from "lucide-react";
import {
  getCategories,
  uploadImages,
  createReport,
  type CreateReportPayload,
} from "../api/api";
import type { Category, Coord } from "../models/models";
import { isApiError, type FieldErrors } from "../models/models";

type Props = {
  selected: Coord | null;
  setSelected: React.Dispatch<React.SetStateAction<Coord | null>>;
};

export default function UploadReport({ selected, setSelected }: Props) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [anonymous, setAnonymous] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const addressRef = useRef<HTMLInputElement | null>(null);
  const titleRef = useRef<HTMLInputElement | null>(null);
  const descRef = useRef<HTMLTextAreaElement | null>(null);
  const categoryRef = useRef<HTMLSelectElement | null>(null);

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
          categoryRef.current?.focus();
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

      alert("Report successfully created!");
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
              categoryRef.current?.focus();
            } else if (keys.includes("images")) {
              fileInputRef.current?.focus();
            }
          }, 0);
        } else {
          setGeneralError(err.message || "Request failed");
        }
      } else if (err instanceof Error) {
        setGeneralError(err.message);
      } else {
        setGeneralError("Network error, please retry.");
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
          <Button
            id="go-to-homepage-button"
            className="w-100 mb-3"
            variant="secondary"
            onClick={() => navigate("/")}
          >
            Go back to Homepage
          </Button>
          <Form onSubmit={handleSubmit}>
            <section className="upload-map mb-3">
              <Map selected={selected} setSelected={setSelected} />
            </section>
            <Row className="mb-3">
              <Col md={12}>
                <Form.Group>
                  <Form.Label>Address</Form.Label>
                  <Form.Control
                    id="address-field"
                    type="text"
                    value={selected ? selected.address : ""}
                    readOnly
                    isInvalid={Boolean(fieldErrors.location)}
                    ref={addressRef}
                    tabIndex={0}
                  />
                  {fieldErrors.location && (
                    <Form.Control.Feedback type="invalid">
                      {Array.isArray(fieldErrors.location)
                        ? fieldErrors.location.join(", ")
                        : fieldErrors.location}
                    </Form.Control.Feedback>
                  )}
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Title</Form.Label>
              <Form.Control
                id="title-field"
                type="text"
                placeholder="Enter a title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                ref={titleRef}
                isInvalid={Boolean(fieldErrors.title)}
              />
              {fieldErrors.title && (
                <Form.Control.Feedback type="invalid">
                  {Array.isArray(fieldErrors.title)
                    ? fieldErrors.title.join(", ")
                    : fieldErrors.title}
                </Form.Control.Feedback>
              )}
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                id="description-field"
                as="textarea"
                rows={3}
                placeholder="Describe the issue"
                value={description}
                ref={descRef}
                onChange={(e) => setDescription(e.target.value)}
                className="auto-textarea"
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
            <Form.Group className="mb-3">
              <Form.Label>Category</Form.Label>
              <Form.Select
                id="select-category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                isInvalid={Boolean(fieldErrors.categoryId)}
                ref={categoryRef}
              >
                <option value="" disabled>
                  Select a category
                </option>
                {categories.map((category) => (
                  <option
                    id={"category-" + category.id.toString()}
                    key={category.id}
                    value={String(category.id)}
                  >
                    {category.name}
                  </option>
                ))}
              </Form.Select>
              {fieldErrors.categoryId && (
                <Form.Control.Feedback type="invalid">
                  {Array.isArray(fieldErrors.categoryId)
                    ? fieldErrors.categoryId.join(", ")
                    : fieldErrors.categoryId}
                </Form.Control.Feedback>
              )}
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Images (min 1, max 3)</Form.Label>
              <Row className="g-2">
                {previews.map((src, index) => (
                  <Col key={index} xs={12} sm={6} md={4}>
                    <div className="image-tile">
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
                    </div>
                  </Col>
                ))}
                {images.length < 3 && (
                  <Col xs={12} sm={6} md={4}>
                    <div
                      id="add-image-button"
                      role="button"
                      onClick={onClickAddImage}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ")
                          onClickAddImage();
                      }}
                      tabIndex={0}
                      className="add-image-tile"
                    >
                      Click to add an image
                    </div>
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
            {/* <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                id="anonymousCheck"
                label="Submit anonymously"
                checked={anonymous}
                onChange={(e) => setAnonymous(e.target.checked)}
              />
            </Form.Group> */}
            {generalError && (
              <div className="text-danger mb-2" role="alert">
                {generalError}
              </div>
            )}
            {Object.keys(fieldErrors || {}).length > 0 && (
              <div className="text-danger mb-2" role="alert">
                There are some errors - please check the highlighted fields.
              </div>
            )}
            <Button
              id="submit-button"
              variant="primary"
              type="submit"
              className={`w-100 d-inline-flex align-items-center justify-content-center gap-2 ${
                !canSubmitRequired || isSubmitting ? "submit-disabled" : ""
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
          </Form>
        </section>
      </main>
    </>
  );
}
