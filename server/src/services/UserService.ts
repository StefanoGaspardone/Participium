import {randomInt} from 'crypto';
import {userRepository, UserRepository} from "@repositories/UserRepository";
import {CodeConfirmationDAO} from '@daos/CodeConfirmationDAO';
import {MapUserDAOtoDTO, NewMunicipalityUserDTO, NewUserDTO, UserDTO} from "@dtos/UserDTO";
import {UserDAO, UserType} from "@daos/UserDAO";
import * as bcrypt from "bcryptjs";
import {officeRepository, OfficeRepository} from "@repositories/OfficeRepository";
import {BadRequestError} from "@errors/BadRequestError";
import {NotFoundError} from "@errors/NotFoundError";
import {categoryRepository, CategoryRepository} from "@repositories/CategoryRepository";
import {mailService, MailService} from "@services/MailService";
import {CodeConfirmationService, codeService} from '@services/CodeConfirmationService';
import {companyRepository, CompanyRepository} from "@repositories/CompanyRepository";
import {reportRepository, ReportRepository} from "@repositories/ReportRepository";
import { OfficeDAO } from "@daos/OfficeDAO";

export class UserService {

    private userRepo: UserRepository;
    private officeRepo: OfficeRepository;
    private mailService: MailService;
    private codeService: CodeConfirmationService;
    private categoryRepo: CategoryRepository
    private companyRepository: CompanyRepository;
    private reportRepo: ReportRepository;

    constructor() {
        this.userRepo = userRepository;
        this.officeRepo = officeRepository;
        this.categoryRepo = categoryRepository;
        this.mailService = mailService;
        this.codeService = codeService;
        this.companyRepository = companyRepository;
        this.reportRepo = reportRepository;
    }

    findAllUsers = async (): Promise<UserDTO[]> => {
        const users = await this.userRepo.findAllUsers();
        return users.map(MapUserDAOtoDTO);
    }

    findUserByTelegramUsername = async (telegramUsername: string): Promise<UserDTO> => {
        const user = await this.userRepo.findUserByTelegramUsername(telegramUsername);

        if (!user) throw new NotFoundError(`No user found with telegram username ${telegramUsername}`);
        return MapUserDAOtoDTO(user);
    }

    signUpUser = async (payload: NewUserDTO) => {
        try {
            let user = new UserDAO();
            user.firstName = payload.firstName;
            user.lastName = payload.lastName;
            user.email = payload.email;
            user.username = payload.username;
            user.userType = UserType.CITIZEN;
            user.image = payload.image;
            user.telegramUsername = payload.telegramUsername;
            user.emailNotificationsEnabled = payload.emailNotificationsEnabled;
            user.isActive = false;
            const salt = await bcrypt.genSalt(10);
            user.passwordHash = await bcrypt.hash(payload.password, salt);
            const saved = await this.userRepo.createNewUser(user);

            await this.createCodeConfirmationForUser(saved.id);
        } catch (error) {
            throw error;
        }
    }

    login = async (username: string, password: string): Promise<UserDAO | null> => {
        try {
            const user = await this.userRepo.login(username, password);

            if (user && !user.isActive) throw new BadRequestError('Account not activated. Please verify your email before logging in.');
            return user;
        } catch (error) {
            throw error;
        }
    }

    createMunicipalityUser = async (payload: NewMunicipalityUserDTO): Promise<UserDAO> => {
        try {
            const user = new UserDAO();
            user.firstName = payload.firstName;
            user.lastName = payload.lastName;
            user.email = payload.email;
            user.username = payload.username;
            user.userType = payload.userType;
            user.offices = [];
            if (payload.userType == UserType.TECHNICAL_STAFF_MEMBER && payload.officeIds) {
                for (const officeId of payload.officeIds) {
                    const office = await this.officeRepo.findOfficeById(officeId);
                    if (!office) {
                        throw new BadRequestError(`Office with id ${officeId} not found.`);
                    }
                    user.offices.push(office);
                }
            } else if (payload.userType == UserType.MUNICIPAL_ADMINISTRATOR || payload.userType == UserType.PUBLIC_RELATIONS_OFFICER) {
                const office = await this.officeRepo.findOrganizationOffice();
                if (!office) {
                    throw new BadRequestError("Organization office not found.");
                }
                user.offices.push(office);
            } else if (payload.userType === UserType.EXTERNAL_MAINTAINER && payload.companyId) {
                const company = await this.companyRepository.findCompanyById(payload.companyId);
                if (!company) {
                    throw new BadRequestError("Company not found.");
                }
                user.company = company;
            }
            user.image = payload.image;

            const salt = await bcrypt.genSalt(10);
            user.passwordHash = await bcrypt.hash(payload.password, salt);

            return this.userRepo.createNewUser(user);
        } catch (error) {
            throw error;
        }
    }

    updateUser = async (id: number, updateData: Partial<UserDAO>): Promise<UserDTO> => {
        const user = await this.userRepo.findUserById(id);
        if (!user) throw new NotFoundError(`User with id ${id} not found`);

        if (updateData.firstName !== undefined) user.firstName = updateData.firstName;
        if (updateData.lastName !== undefined) user.lastName = updateData.lastName;
        if (updateData.email !== undefined) user.email = updateData.email;
        if (updateData.username !== undefined) user.username = updateData.username;
        if (updateData.image !== undefined) user.image = updateData.image;
        if (updateData.telegramUsername !== undefined) user.telegramUsername = updateData.telegramUsername;
        if (updateData.emailNotificationsEnabled !== undefined) user.emailNotificationsEnabled = updateData.emailNotificationsEnabled;
        const updatedUser = await this.userRepo.updateUser(user);
        return MapUserDAOtoDTO(updatedUser);
    }

    findMaintainersByCategory = async (categoryId: number): Promise<UserDTO[]> => {
        const categoryDAO = await this.categoryRepo.findCategoryById(categoryId);
        if (!categoryDAO) {
            throw new NotFoundError(`Category with id ${categoryId} not found`);
        }
        const maintainers = await this.userRepo.findMaintainersByCategory(categoryDAO);
        return maintainers.map(MapUserDAOtoDTO);
    }


    private createCodeConfirmationForUser = async (userId: number): Promise<CodeConfirmationDAO> => {
        const user = await this.userRepo.findUserById(userId);
        if (!user) throw new NotFoundError(`User with id ${userId} not found`);

        const codeString = randomInt(0, 1000000).toString().padStart(6, '0');
        const expirationDate = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

        const saved = await this.codeService.create(codeString, expirationDate, userId);

        user.codeConfirmation = saved;
        await this.userRepo.updateUser(user);

        await this.mailService.sendMail({
            to: user.email,
            subject: 'Your verification code',
            text: `Hi ${user.firstName || user.username || ''},\n\nYour verification code is: ${codeString}\nThe code expires in 30 minutes.\n\nIf you haven't requested this code, please ignore this email.\n\n---\nParticipium`,
            html: `
                <div style="font-family: Arial,Helvetica,sans-serif; color:#222;">
                    <h2 style="margin:0 0 8px 0;">Participium - Verification code</h2>
                    <p style="margin:0 0 16px 0;">Hi ${user.firstName || user.username || ''}, welcome to Participium!</p>
                    <p style="margin:0 0 8px 0;">Your verification code is:</p>
                    <p style="font-family: monospace; font-size: 26px; font-weight: 700; margin:8px 0;">${codeString}</p>
                    <p style="margin:12px 0 0 0; color:#666;">The code expires in 30 minutes. If you haven't requested this code, please ignore this email.</p>
                    <hr style="border:none;border-top:1px solid #eee;margin:20px 0;">
                    <small style="color:#888">This message was sent by Participium.</small>
                </div>
                `
        });

        return saved;
    }

    validateUser = async (username: string, code: string) => {
        const user = await this.userRepo.findUserByUsername(username);

        if (!user) throw new NotFoundError(`User with username ${username} not found`);
        if (user.isActive) throw new BadRequestError('User is already active');

        const confirmation = user.codeConfirmation;
        if (!confirmation) throw new BadRequestError('No verification code found for this user');

        const now = new Date();
        if (confirmation.expirationDate && now > confirmation.expirationDate) throw new BadRequestError('Verification code has expired');

        if (String(confirmation.code) !== String(code)) throw new BadRequestError('Invalid verification code');

        try {
            await this.codeService.deleteById(confirmation.id);
        } catch (err) {
            throw err;
        }

        user.codeConfirmation = undefined as any;
        user.isActive = true;

        await this.userRepo.updateUser(user);
    }

    resendCode = async (username: string) => {
        const user = await this.userRepo.findUserByUsername(username);

        if (!user) throw new NotFoundError(`User with username ${username} not found`);
        if (user.isActive) throw new BadRequestError('User is already active');

        await this.createCodeConfirmationForUser(user.id);
    }

    findTechnicalStaffMembers = async (): Promise<UserDTO[]> => {
        const staffMembers = await this.userRepo.findTechnicalStaffMembers();
        return staffMembers.map(MapUserDAOtoDTO);
    }

    updateTsm = async (tsmId: number, officeIds: number[]): Promise<UserDTO> => {
        const tsm = await this.userRepo.findUserById(tsmId);
        if (!tsm) throw new NotFoundError(`Technical staff member with id ${tsmId} not found`);
        if (tsm.userType !== UserType.TECHNICAL_STAFF_MEMBER) throw new BadRequestError(`User with id ${tsmId} is not a technical staff member`);

        const offices: OfficeDAO[] = [];
        for (const officeId of officeIds) {
            const office = await this.officeRepo.findOfficeById(officeId);
            if(!office){
                throw new BadRequestError(`Office with id ${officeId} not found.`);
            }
            offices.push(office);
        }

        //check that there are no assigned reports to offices that the tsm is no longer assigned to
        const assignedReports = await this.reportRepo.findReportsAssignedTo(tsm.id);
        for(const report of assignedReports){
            if(!officeIds.includes(report.category.office.id)){
                throw new BadRequestError(`Cannot remove technical staff member from office ${report.category.office.name} because they have assigned reports related to this office.`);
            }
        }

        tsm.offices = offices;
        const updatedTsm = await this.userRepo.updateUser(tsm);
        return MapUserDAOtoDTO(updatedTsm);
    }
}

export const userService = new UserService();