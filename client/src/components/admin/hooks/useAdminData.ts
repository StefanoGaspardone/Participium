import { useEffect, useState } from "react";
import {
  getOffices,
  getAllCompanies,
  getCategories,
  getTechnicalStaffMembers,
} from "../../../api/api";
import type { Office, Company, Category } from "../../../models/models";
import { toast } from "react-hot-toast";

export type TSM = { id: number; name: string };

export function useAdminData() {
  const [offices, setOffices] = useState<Office[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tsms, setTsms] = useState<TSM[]>([]);

  const [loadingOffices, setLoadingOffices] = useState(true);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingTsms, setLoadingTsms] = useState(true);

  useEffect(() => {
    const fetchOffices = async () => {
      try {
        const res = await getOffices();
        setOffices(res);
      } catch (e) {
        console.error("Failed to load offices", e);
        toast.error("Unable to load offices.");
      } finally {
        setLoadingOffices(false);
      }
    };
    fetchOffices();
  }, []);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const res = await getAllCompanies();
        setCompanies(res || []);
      } catch (e) {
        console.error("Failed to load companies", e);
        toast.error("Unable to load companies.");
      } finally {
        setLoadingCompanies(false);
      }
    };
    fetchCompanies();
  }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await getCategories();
        setCategories(res);
      } catch (e) {
        console.error("Failed to load categories", e);
        toast.error("Unable to load categories.");
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchTsms = async () => {
      setLoadingTsms(true);
      try {
        const res = await getTechnicalStaffMembers();
        setTsms(
          Array.isArray(res)
            ? res.map((t: any) => ({
                id: Number(t.id),
                name: `${String(t.firstName ?? "")} ${String(
                  t.lastName ?? ""
                )} (${String(t.username ?? "")})`.trim(),
              }))
            : []
        );
      } catch (e) {
        console.error("Failed to load technical staff members", e);
        toast.error("Unable to load technical staff members.");
      } finally {
        setLoadingTsms(false);
      }
    };
    fetchTsms();
  }, []);

  const refreshCompanies = async () => {
    const res = await getAllCompanies();
    setCompanies(res || []);
    return res;
  };

  return {
    offices,
    companies,
    categories,
    tsms,
    loadingOffices,
    loadingCompanies,
    loadingCategories,
    loadingTsms,
    refreshCompanies,
  };
}
