import { AppDataSource } from "@database";
import { Repository } from "typeorm";
import { UserDAO, UserType } from "@daos/UserDAO";
import { ReportStatus } from "@daos/ReportDAO";
import * as bcrypt from "bcryptjs";
import { CategoryDAO } from "@daos/CategoryDAO";

export class UserRepository {
  private repo: Repository<UserDAO>;

  constructor() {
    this.repo = AppDataSource.getRepository(UserDAO);
  }

  findAllUsers = async (): Promise<UserDAO[]> => {
    return this.repo.find({ relations: ["office", "company", "company.categories"] });
  };

  findUserById = async (id: number): Promise<UserDAO | null> => {
    return this.repo.findOne({ where: { id }, relations: ["office", "company", "company.categories"] });
  }

  findUserByTelegramUsername = async (telegramUsername: string): Promise<UserDAO | null> => {
    return this.repo.findOne({ where: { telegramUsername } });
  }

  findUserByUsername = async (username: string): Promise<UserDAO | null> => {
    return this.repo.findOne({ where: { username }, relations: ['codeConfirmation'] });
  }

  createNewUser = async (user: UserDAO): Promise<UserDAO> => {
    return this.repo.save(user);
  };

  login = async (username: string, password: string): Promise<UserDAO | null> => {
    // Ensure relations (office, company) are loaded so the returned user
    // contains the office data (name) required when mapping to DTO/token.
    const user = await this.repo.findOne({ where: { username }, relations: ["office", "company", "company.categories"] });
    if (user) {
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (isPasswordValid) return user;
    }
    return null;
  };

  findLeastLoadedStaffForOffice = async (officeId: number): Promise<UserDAO | null> => {
    const qb = this.repo
      .createQueryBuilder('u')
      .leftJoin('u.assignedReports', 'r', 'r.status IN (:...statuses)', {
        statuses: [ReportStatus.Assigned, ReportStatus.InProgress, ReportStatus.Suspended],
      })
      .where('u.userType = :type', { type: UserType.TECHNICAL_STAFF_MEMBER })
      .andWhere('u.office_id = :officeId', { officeId })
      .select(['u.id', 'u.firstName', 'u.lastName', 'u.username', 'u.email', 'u.userType'])
      .addSelect('COUNT(r.id)', 'assigned_count')
      .groupBy('u.id')
      .orderBy('assigned_count', 'ASC')
      .addOrderBy('u.lastName', 'ASC')
      .addOrderBy('u.firstName', 'ASC')
      .addOrderBy('u.username', 'ASC')
      .limit(1);

    const res = await qb.getRawAndEntities();
    return res.entities[0] || null;
  };

  updateUser = async (user: UserDAO): Promise<UserDAO> => {
    // Use save to persist nested relations (e.g. codeConfirmation).
    const saved = await this.repo.save(user);
    if (!saved) {
      throw new Error(`User with id ${user.id} not found`);
    }
    return saved;
  };

  findMaintainersByCategory = async (category: CategoryDAO): Promise<UserDAO[]> => {
    if (!category?.id) return [];
    return this.repo.createQueryBuilder('user')
      .innerJoin('user.company', 'company')
      .innerJoin('company.categories', 'c', 'c.id = :categoryId', { categoryId: category.id })
      .where('user.userType = :type', { type: UserType.EXTERNAL_MAINTAINER })
      .getMany();
  };
}

export const userRepository = new UserRepository();