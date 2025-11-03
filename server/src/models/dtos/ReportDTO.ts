import { ReportDAO, ReportStatus } from "@daos/ReportDAO";
import { CategoryDTO, createCategoryDTO } from "@dtos/CategoryDTO";
import { createUserDTO, UserDTO } from "@dtos/UserDTO";

export interface ReportDTO {
    id: number;
    title: string;  
    description: string;
    category: CategoryDTO;
    images: string[];
    status: ReportStatus;
    anonymous?: boolean;
    rejectedDescription?: string | null;
    createdBy: UserDTO;
    createdAt: Date;
}

export interface CreateReportDTO {
    title: string;  
    description: string;
    categoryId: number;
    images: string[];
    anonymous: boolean;
    createdAt: Date;
}

export const createReportDTO = (report: ReportDAO): ReportDTO => {
    return {
        id: report.id,
        title: report.title,
        description: report.description,
        category: createCategoryDTO(report.category),
        images: report.images,
        status: report.status,
        anonymous: report.anonymous,
        rejectedDescription: report.rejectedDescription || null,
        createdBy: createUserDTO(report.createdBy),
        createdAt: new Date(report.createdAt),
    } as ReportDTO;
}