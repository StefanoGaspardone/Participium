import { ReportDAO, ReportStatus } from "@daos/ReportDAO";
import { CategoryDTO, createCategoryDTO } from "@dtos/CategoryDTO";
import { UserDTO, MapUserDAOtoDTO } from "@dtos/UserDTO";

export interface ReportDTO {
    id: number;
    title: string;
    description: string;
    category: CategoryDTO;
    images: string[];
    lat: number;
    long: number;
    status: ReportStatus;
    anonymous?: boolean;
    rejectedDescription?: string | null;
    createdBy: UserDTO;
    assignedTo?: UserDTO | null;
    createdAt: Date;
}

export interface CreateReportDTO {
    title: string;
    description: string;
    categoryId: number;
    images: string[];
    lat: number;
    long: number;
    anonymous: boolean;
}

export interface CreateReportTelegramDTO {
    userId: number;
    title: string;
    description: string;
    categoryId: number;
    images: string[];
    latitude: number;
    longitude: number;
    anonymous: boolean;
}

export const createReportDTO = (report: ReportDAO): ReportDTO => {
    return {
        id: report.id,
        title: report.title,
        description: report.description,
        category: createCategoryDTO(report.category),
        images: report.images,
        lat: Number(report.lat),
        long: Number(report.long),
        status: report.status,
        anonymous: report.anonymous,
        rejectedDescription: report.rejectedDescription || null,
        createdBy: MapUserDAOtoDTO(report.createdBy),
        assignedTo: report.assignedTo ? MapUserDAOtoDTO(report.assignedTo) : null,
        createdAt: new Date(report.createdAt),
    } as ReportDTO;
}