import 'dotenv/config';
import 'reflect-metadata';
import { AppDataSource, initializeDatabase, closeDatabase } from '@database';
import { OfficeDAO } from '@daos/OfficeDAO';
import { CategoryDAO } from '@daos/CategoryDAO';
import { UserDAO, UserType } from '@daos/UserDAO';
import { logInfo, logError } from '@utils/logger';
import * as bcrypt from "bcryptjs";

const OFFICES: string[] = [
    'Organization',
    'Public Services Division',
    'Environmental Quality Division',
    'Green Areas, Parks and Animal Welfare Division',
    'Infrastructure Division',
    'General Services Division',
];

const USERS: Array<{ username:string; email:string; password:string; firstName: string; lastName:string; userType:UserType; offices?: number[] }> = [
    { username: 'admin', email: 'admin@gmail.com', firstName: 'Stefano', lastName: 'Lo Russo', password: 'admin', userType: UserType.ADMINISTRATOR },
    { username: 'user', email: 'user@gmail.com', firstName: 'Francesco', lastName: 'Totti', password: 'user', userType: UserType.CITIZEN },
];

const CATEGORIES: Array<{ name: string; office: string }> = [
    { name: 'Water Supply - Drinking Water', office: 'Public Services Division' },
    { name: 'Architectural Barriers', office: 'Infrastructure Division' },
    { name: 'Sewer System', office: 'Public Services Division' },
    { name: 'Public Lighting', office: 'Public Services Division' },
    { name: 'Waste', office: 'Environmental Quality Division' },
    { name: 'Road Signs and Traffic Lights', office: 'Infrastructure Division' },
    { name: 'Roads and Urban Furnishings', office: 'Infrastructure Division' },
    { name: 'Public Green Areas and Playgrounds', office: 'Green Areas, Parks and Animal Welfare Division' },
    { name: 'Other', office: 'General Services Division' },
];

async function upsertUsers(users: Array<{ username:string; email:string; password:string; firstName: string; lastName:string; userType:UserType; offices?: number[] }>) {
    const repo = AppDataSource.getRepository(UserDAO);

    for(const { username, email, password, firstName, lastName, userType, offices } of users) {
        const trimmedUsername = username.trim();
        const trimmedEmail = email.trim();
        if (!trimmedUsername || !trimmedEmail) continue;

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        let user = await repo.findOne({ where: { username: trimmedUsername } });
        if(user) {
            logInfo(`[populate-db] User already exists: ${trimmedUsername} (id=${user.id})`);
            continue;
        }

        if(!offices || offices.length === 0) {
            user = repo.create({ username: trimmedUsername, email: trimmedEmail, passwordHash, firstName, lastName, userType });
            user = await repo.save(user);
            logInfo(`[populate-db] Inserted user: ${trimmedUsername} (id=${user.id})`);
        } else {
            const officesEntity = [];
            const officeRepo = AppDataSource.getRepository(OfficeDAO);
            for(const office of offices){
                const officeEntity = await officeRepo.findOne({ where: { id: office } });
                if(officeEntity) {
                    officesEntity.push(officeEntity);
                } else {
                    logError(`[populate-db] Skipping office id='${office}' for user '${trimmedUsername}': not found.`);
                }
            }
            user = repo.create({ username: trimmedUsername, email: trimmedEmail, passwordHash, firstName, lastName, userType, offices: officesEntity });
            user = await repo.save(user);
            logInfo(`[populate-db] Inserted user: ${trimmedUsername} (id=${user.id})`);
        }
    }
}

async function upsertOffices(offices: string[]) {
    const repo = AppDataSource.getRepository(OfficeDAO);
    const map = new Map<string, OfficeDAO>();

    for (const name of offices) {
        const trimmed = name.trim();
        if (!trimmed) continue;

        let office = await repo.findOne({ where: { name: trimmed } });
        if (office) {
            logInfo(`[populate-db] Office already exists: ${trimmed} (id=${office.id})`);
        } else {
            office = repo.create({ name: trimmed });
            office = await repo.save(office);

            logInfo(`[populate-db] Inserted office: ${trimmed} (id=${office.id})`);
        }
        map.set(trimmed, office);
    }

    return map;
}

async function upsertCategories(items: Array<{ name: string; office: string }>, officesByName: Map<string, OfficeDAO>) {
    const repo = AppDataSource.getRepository(CategoryDAO);

    for (const { name, office } of items) {
        const trimmedName = name.trim();
        const trimmedOffice = office.trim();
        if (!trimmedName || !trimmedOffice) continue;

        const officeEntity = officesByName.get(trimmedOffice);
        if (!officeEntity) {
            logError(`[populate-db] Skipping category '${trimmedName}': office '${trimmedOffice}' not found in OFFICES.`);
            continue;
        }

        let cat = await repo.findOne({ where: { name: trimmedName } });
        if (cat) {
            if (!cat.office || cat.office.id !== officeEntity.id) {
                cat.office = officeEntity;
                await repo.save(cat);

                logInfo(`[populate-db] Updated category office: ${trimmedName} -> office=${officeEntity.name}`);
            } else {
                logInfo(`[populate-db] Category already exists: ${trimmedName} (id=${cat.id})`);
            }
        } else {
            cat = repo.create({ name: trimmedName, office: officeEntity });
            cat = await repo.save(cat);

            logInfo(`[populate-db] Inserted category: ${trimmedName} (id=${cat.id}) -> office=${officeEntity.name}`);
        }
    }
}

async function deleteActualState() {
    const tables = ['users', 'office_roles', 'categories'];
    for (const t of tables) {
        const sql = "TRUNCATE TABLE " + t + " RESTART IDENTITY CASCADE";
        await AppDataSource.query(sql);
        console.log("Cleaned table *" + t +"*");
    }
}

export async function firstInitialization() {
    try {
        await initializeDatabase();

        await deleteActualState();

        const officesByName = await upsertOffices(OFFICES);
        await upsertCategories(CATEGORIES, officesByName);
        await upsertUsers(USERS);

        logInfo('[populate-db] Done.');
    } catch (err) {
        logError('[populate-db] Failed:', err);
        process.exitCode = 1;
    } finally {
        await closeDatabase();
    }
}