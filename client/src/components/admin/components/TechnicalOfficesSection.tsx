import { useState } from "react";
import { Form, Button, Badge } from "react-bootstrap";
import { Loader2Icon, XIcon } from "lucide-react";
import { motion } from "framer-motion";
import Select, { type SingleValue } from "react-select";
import { toast } from "react-hot-toast";
import { getTsmOffices, updateTsmOffices } from "../../../api/api";
import type { Office } from "../../../models/models";
import { isApiError } from "../../../models/models";
import { AnimatedMenu } from "./AnimatedMenu";
import { OfficeOption } from "./SelectOptions";
import type { TSM } from "../hooks/useAdminData";

interface Props {
  offices: Office[];
  tsms: TSM[];
  loadingTsms: boolean;
}

function equalSets(a: number[], b: number[]): boolean {
  const sa = new Set(a);
  const sb = new Set(b);
  if (sa.size !== sb.size) return false;
  for (const v of sa) {
    if (!sb.has(v)) return false;
  }
  return true;
}

export default function TechnicalOfficesSection({
  offices,
  tsms,
  loadingTsms,
}: Props) {
  const [selectedTsmId, setSelectedTsmId] = useState<number | null>(null);
  const [tsmOfficeIds, setTsmOfficeIds] = useState<number[]>([]);
  const [savedTsmOfficeIds, setSavedTsmOfficeIds] = useState<number[] | null>(
    null
  );
  const [loadingTsmOffices, setLoadingTsmOffices] = useState(false);
  const [isSavingTsm, setIsSavingTsm] = useState(false);

  const officeOptions = offices.map((o) => ({
    value: String(o.id),
    label: o.name,
  }));

  const handleSelectTsm = async (id: number | null) => {
    setSelectedTsmId(id);
    setTsmOfficeIds([]);
    if (!id) return;

    setLoadingTsmOffices(true);
    try {
      const officesRes = await getTsmOffices(id);
      const ids = parseOfficeIds(officesRes, offices);
      setTsmOfficeIds(ids);
      setSavedTsmOfficeIds(ids.slice());
    } catch (e) {
      console.error("Failed to fetch TSM offices", e);
      toast.error("Unable to load TSM offices.");
    } finally {
      setLoadingTsmOffices(false);
    }
  };

  const handleAddOffice = (officeId: number) => {
    if (!selectedTsmId) return;
    setTsmOfficeIds((prev) => {
      if (prev.includes(officeId)) return prev;
      return [...prev, officeId];
    });
  };

  const handleRemoveOffice = (officeId: number) => {
    setTsmOfficeIds((prev) => prev.filter((id) => id !== officeId));
  };

  const handleSaveTsmOffices = async () => {
    if (!selectedTsmId) return;

    if (tsmOfficeIds.length === 0) {
      toast.error(
        "A Technical Staff Member must be assigned at least one office."
      );
      return;
    }

    if (savedTsmOfficeIds && equalSets(savedTsmOfficeIds, tsmOfficeIds)) {
      toast("No changes to save.");
      return;
    }

    setIsSavingTsm(true);
    try {
      const res = await updateTsmOffices(selectedTsmId, tsmOfficeIds);
      const successMsg = res?.message ?? "Technical staff offices updated.";
      toast.success(successMsg);
      await handleSelectTsm(selectedTsmId);
    } catch (err: unknown) {
      console.error("Failed to update TSM offices", err);
      handleSaveError(err);
      try {
        await handleSelectTsm(selectedTsmId);
      } catch (e) {
        console.error("Failed to refresh TSM offices after error", e);
      }
    } finally {
      setIsSavingTsm(false);
    }
  };

  const isTsmChanged = !savedTsmOfficeIds
    ? true
    : !equalSets(savedTsmOfficeIds, tsmOfficeIds);

  const saveButtonTitle = computeSaveButtonTitle(
    tsmOfficeIds.length,
    isSavingTsm,
    isTsmChanged
  );

  return (
    <div className="mt-2">
      <motion.h4
        className="mb-3 text-center"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        Technical Offices Management
      </motion.h4>
      <Form className="d-flex flex-column auth-grid-gap">
        <TsmSelector
          tsms={tsms}
          selectedTsmId={selectedTsmId}
          loadingTsms={loadingTsms}
          onSelectTsm={handleSelectTsm}
        />

        {selectedTsmId && (
          <>
            <AssignedOffices
              offices={offices}
              tsmOfficeIds={tsmOfficeIds}
              loadingTsmOffices={loadingTsmOffices}
              onRemoveOffice={handleRemoveOffice}
            />

            <AddOfficeSelector
              officeOptions={officeOptions}
              tsmOfficeIds={tsmOfficeIds}
              loadingTsmOffices={loadingTsmOffices}
              selectedTsmId={selectedTsmId}
              onAddOffice={handleAddOffice}
            />

            {!loadingTsmOffices && tsmOfficeIds.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.42, duration: 0.3 }}
              >
                <div className="text-danger small mb-2">
                  A Technical Staff Member must be assigned at least one office.
                </div>
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55, duration: 0.45 }}
              className="d-flex justify-content-end gap-2"
            >
              <Button
                id="save-tsm-offices"
                variant="success"
                onClick={handleSaveTsmOffices}
                disabled={
                  isSavingTsm || tsmOfficeIds.length === 0 || !isTsmChanged
                }
                aria-disabled={
                  isSavingTsm || tsmOfficeIds.length === 0 || !isTsmChanged
                }
                title={saveButtonTitle}
              >
                {isSavingTsm ? (
                  <>
                    <Loader2Icon size={14} className="spin" /> Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </motion.div>
          </>
        )}
      </Form>
    </div>
  );
}

function parseOfficeIds(officesRes: any, offices: Office[]): number[] {
  if (!Array.isArray(officesRes)) return [];
  return officesRes
    .map((x: any) => {
      if (typeof x === "number") return x;
      if (typeof x === "string") {
        const found = offices.find((o) => o.name === x);
        return found ? found.id : Number.NaN;
      }
      if (x?.id !== undefined) return Number(x.id);
      return Number.NaN;
    })
    .filter((n: number) => !Number.isNaN(n));
}

function handleSaveError(err: unknown) {
  if (isApiError(err)) {
    toast.error(err.message);
  } else if (err instanceof Error) {
    toast.error(err.message);
  } else {
    toast.error("Failed to update TSM offices.");
  }
}

function computeSaveButtonTitle(
  officeCount: number,
  isSaving: boolean,
  hasChanges: boolean
): string {
  if (officeCount === 0) return "Assign at least one office to enable";
  if (isSaving) return "Saving...";
  if (!hasChanges) return "No changes to save";
  return "Save changes";
}

interface TsmSelectorProps {
  tsms: TSM[];
  selectedTsmId: number | null;
  loadingTsms: boolean;
  onSelectTsm: (id: number | null) => void;
}

function TsmSelector({
  tsms,
  selectedTsmId,
  loadingTsms,
  onSelectTsm,
}: TsmSelectorProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.12, duration: 0.4 }}
    >
      <Form.Group className="mb-3">
        <Form.Label>Technical Staff Member</Form.Label>
        <Select
          inputId="select-tsm"
          instanceId="select-tsm"
          options={tsms.map((t) => ({
            value: String(t.id),
            label: t.name,
          }))}
          value={
            selectedTsmId
              ? {
                  value: String(selectedTsmId),
                  label: tsms.find((t) => t.id === selectedTsmId)?.name ?? "",
                }
              : null
          }
          onChange={(opt: SingleValue<{ value: string; label: string }>) => {
            const id = opt ? Number(opt.value) : null;
            onSelectTsm(id);
          }}
          isDisabled={loadingTsms || tsms.length === 0}
          placeholder={loadingTsms ? "Loading TSMs..." : "Select a TSM"}
          components={{ Menu: AnimatedMenu }}
          classNamePrefix="rs"
        />
      </Form.Group>
    </motion.div>
  );
}

interface AssignedOfficesProps {
  offices: Office[];
  tsmOfficeIds: number[];
  loadingTsmOffices: boolean;
  onRemoveOffice: (id: number) => void;
}

function AssignedOffices({
  offices,
  tsmOfficeIds,
  loadingTsmOffices,
  onRemoveOffice,
}: AssignedOfficesProps) {
  let content: React.ReactNode;
  if (loadingTsmOffices) {
    content = <div className="text-muted">Loading assigned offices...</div>;
  } else if (tsmOfficeIds.length === 0) {
    content = <div className="text-muted">No offices assigned.</div>;
  } else {
    content = tsmOfficeIds.map((oid) => {
      const office = offices.find((o) => o.id === oid);
      return (
        <motion.div
          key={oid}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18 }}
          className="d-inline-block me-2 mb-2"
        >
          <Badge
            pill
            bg="secondary"
            className="tsm-badge d-inline-flex align-items-center"
            id={`tsm-office-${oid}`}
          >
            <span className="tsm-badge-label">
              {office ? office.name : `Office ${oid}`}
            </span>
            <Button
              variant="light"
              size="sm"
              onClick={() => onRemoveOffice(oid)}
              id={`remove-office-${oid}`}
              className="ms-2 p-0 remove-office-btn d-inline-flex align-items-center justify-content-center"
              aria-label={`Remove office ${office ? office.name : oid}`}
              style={{ width: 22, height: 22, borderRadius: 999 }}
            >
              <XIcon size={12} />
            </Button>
          </Badge>
        </motion.div>
      );
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.22, duration: 0.4 }}
    >
      <Form.Group className="mb-3">
        <Form.Label>Assigned Offices</Form.Label>
        <div>{content}</div>
      </Form.Group>
    </motion.div>
  );
}

interface AddOfficeSelectorProps {
  officeOptions: { value: string; label: string }[];
  tsmOfficeIds: number[];
  loadingTsmOffices: boolean;
  selectedTsmId: number | null;
  onAddOffice: (id: number) => void;
}

function AddOfficeSelector({
  officeOptions,
  tsmOfficeIds,
  loadingTsmOffices,
  selectedTsmId,
  onAddOffice,
}: AddOfficeSelectorProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.32, duration: 0.4 }}
    >
      <Form.Group className="mb-3">
        <Form.Label>Add Office</Form.Label>
        <Select
          inputId="select-add-office"
          instanceId="select-add-office"
          options={officeOptions.filter(
            (o) => !tsmOfficeIds.includes(Number(o.value))
          )}
          value={null}
          onChange={(opt: SingleValue<{ value: string; label: string }>) => {
            if (opt) onAddOffice(Number(opt.value));
          }}
          isDisabled={
            officeOptions.length === 0 || loadingTsmOffices || !selectedTsmId
          }
          placeholder={
            loadingTsmOffices ? "Loading offices..." : "Select office to add"
          }
          components={{
            Menu: AnimatedMenu,
            Option: OfficeOption,
          }}
          classNamePrefix="rs"
        />
      </Form.Group>
    </motion.div>
  );
}
