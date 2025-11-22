import 'dotenv/config';
import 'reflect-metadata';
import { AppDataSource, initializeDatabase, closeDatabase } from '@database';
import { OfficeDAO } from '@daos/OfficeDAO';
import { CategoryDAO } from '@daos/CategoryDAO';
import { logInfo, logError } from '@utils/logger';
import { UserType } from "@daos/UserDAO";
import * as bcrypt from "bcryptjs";
import { NotificationDAO } from '@daos/NotificationsDAO';
import { ReportDAO, ReportStatus } from '@daos/ReportDAO';
import { UserDAO } from '@daos/UserDAO';

const OFFICES: string[] = [
    'Organization',
    'Public Services Division',
    'Environmental Quality Division',
    'Green Areas, Parks and Animal Welfare Division',
    'Infrastructure Division',
    'General Services Division',
];

const USERS: Array<{ username:string; email:string; password:string; firstName: string; lastName:string; userType:UserType; office?: number }> = [
    { username: 'admin', email: 'admin@gmail.com', firstName: 'Stefano', lastName: 'Lo Russo', password: 'admin', userType: UserType.ADMINISTRATOR },
    { username: 'user', email: 'user@gmail.com', firstName: 'Francesco', lastName: 'Totti', password: 'user', userType: UserType.CITIZEN },
    { username: 'giack.team5', email: 'giack@five.se', firstName: 'Giacomo', lastName: 'Pirlo', password: 'password', userType: UserType.CITIZEN},
    { username: 'tsm1', email: 'tsm1@part.se', firstName:'Carmine', lastName:'Conte', password:'password', userType: UserType.TECHNICAL_STAFF_MEMBER, office: 1},
    { username: 'tsm2', email: 'tsm2@part.se', firstName:'Carmine', lastName:'Conte', password:'password', userType: UserType.TECHNICAL_STAFF_MEMBER, office: 2},
    { username: 'tsm3', email: 'tsm3@part.se', firstName:'Carmine', lastName:'Conte', password:'password', userType: UserType.TECHNICAL_STAFF_MEMBER, office: 3},
    { username: 'tsm4', email: 'tsm4@part.se', firstName:'Carmine', lastName:'Conte', password:'password', userType: UserType.TECHNICAL_STAFF_MEMBER, office: 4},
    { username: 'tsm5', email: 'tsm5@part.se', firstName:'Carmine', lastName:'Conte', password:'password', userType: UserType.TECHNICAL_STAFF_MEMBER, office: 5},
    { username: 'tsm6', email: 'tsm6@part.se', firstName:'Carmine', lastName:'Conte', password:'password', userType: UserType.TECHNICAL_STAFF_MEMBER, office: 6},
    { username: 'munadm', email: 'munadm@part.se', firstName: 'Giorgio', lastName: 'Turio', password: 'password', userType: UserType.MUNICIPAL_ADMINISTRATOR},
    { username: 'pro', email: 'pro@part.se', firstName: 'Carlo', lastName: 'Ultimo', password: 'password', userType: UserType.PUBLIC_RELATIONS_OFFICER}
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

async function upsertUsers(users: Array<{ username:string; email:string; password:string; firstName: string; lastName:string; userType:UserType; office?: number }>) {
    const repo = AppDataSource.getRepository('UserDAO');

    for(const { username, email, password, firstName, lastName, userType, office } of users) {
        const trimmedUsername = username.trim();
        const trimmedEmail = email.trim();
        if (!trimmedUsername || !trimmedEmail) continue;

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        let user = await repo.findOne({ where: { username: trimmedUsername } });
        if(!user) {
            if(!office){
                user = repo.create({ username: trimmedUsername, email: trimmedEmail, passwordHash, firstName, lastName, userType });
                user = await repo.save(user);
            } else {
                user = repo.create({ username: trimmedUsername, email: trimmedEmail, passwordHash, firstName, lastName, userType, office });
                user = await repo.save(user);
            }

            logInfo(`[populate-db] Inserted user: ${trimmedUsername} (id=${user.id})`);
        } else {
            logInfo(`[populate-db] User already exists: ${trimmedUsername} (id=${user.id})`);
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
        if (!office) {
            office = repo.create({ name: trimmed });
            office = await repo.save(office);

            logInfo(`[populate-db] Inserted office: ${trimmed} (id=${office.id})`);
        } else {
            logInfo(`[populate-db] Office already exists: ${trimmed} (id=${office.id})`);
        }
        map.set(trimmed, office);
    }

    return map;
}

async function upsertCategories(items: Array<{ name: string; office: string }>, rolesByName: Map<string, OfficeDAO>) {
    const repo = AppDataSource.getRepository(CategoryDAO);

    for (const { name, office } of items) {
        const trimmedName = name.trim();
        const trimmedOffice = office.trim();
        if (!trimmedName || !trimmedOffice) continue;

        const role = rolesByName.get(trimmedOffice);
        if (!role) {
            logError(`[populate-db] Skipping category '${trimmedName}': office '${trimmedOffice}' not found in OFFICES.`);
            continue;
        }

        let cat = await repo.findOne({ where: { name: trimmedName } });
        if (!cat) {
            cat = repo.create({ name: trimmedName, office: role });
            cat = await repo.save(cat);

            logInfo(`[populate-db] Inserted category: ${trimmedName} (id=${cat.id}) -> office=${role.name}`);
        } else {
            if (!cat.office || cat.office.id !== role.id) {
                cat.office = role;
                await repo.save(cat);

                logInfo(`[populate-db] Updated category office: ${trimmedName} -> office=${role.name}`);
            } else {
                logInfo(`[populate-db] Category already exists: ${trimmedName} (id=${cat.id})`);
            }
        }
    }
}

async function upsertReports() {
    const userRepo = AppDataSource.getRepository('UserDAO');
    const categoryRepo = AppDataSource.getRepository(CategoryDAO);
    const reportRepo = AppDataSource.getRepository(ReportDAO);

    // Choose a creator (prefer 'user')
    const creator = await userRepo.findOne({ where: { username: 'user' } }) || await userRepo.findOne({});
    if (!creator) {
        logError('[populate-db] No users found to attach reports to. Skipping reports.');
        return;
    }

    // Prepare a couple of sample reports using existing categories
    // Try to pick two meaningful categories from the DB (based on CATEGORIES list)
    const desiredCategoryNames = CATEGORIES.slice(0, 2).map(c => c.name);
    const categories: Array<any> = [];
    for (const name of desiredCategoryNames) {
        const cat = await categoryRepo.findOne({ where: { name } });
        if (cat) categories.push(cat);
    }

    if (categories.length === 0) {
        logError('[populate-db] No categories found to attach reports to. Skipping reports.');
        return;
    }

    const samples = [
        {
            title: 'Pothole near central square',
            description: 'Large pothole next to the crosswalk causing danger to cyclists.',
            category: categories[0],
            images: ['https://via.placeholder.com/800x600.png?text=pothole'],
            lat: 45.0703,
            long: 7.6869,
            anonymous: false,
            status: ReportStatus.PendingApproval
        },
        {
            title: 'Broken street light on via Roma',
            description: 'Street light not working for several nights.',
            category: categories[1] || categories[0],
            images: ['https://via.placeholder.com/800x600.png?text=streetlight'],
            lat: 45.0685,
            long: 7.6939,
            anonymous: false,
            status: ReportStatus.Assigned
        },
        {
            title: 'Broken street light',
            description: 'Street light not working for several nights.',
            category: categories[1] || categories[0],
            images: ['https://via.placeholder.com/800x600.png?text=streetlight'],
            lat: 45.10544455769265,
            long: 7.627810175221917,
            anonymous: false,
            status: ReportStatus.Assigned
        },
        {
            title: 'Pothole on main street near Po river',
            description: 'Large pothole next to the crosswalk causing danger to cyclists and cars.',
            category: categories[0],
            images: ['https://via.placeholder.com/800x600.png?text=pothole'],
            lat: 45.03383151753928,
            long: 7.67612830699156,
            anonymous: false,
            status: ReportStatus.Assigned
        }
    ];

    for (const s of samples) {
        try {
            const existing = await reportRepo.findOne({ where: { title: s.title } });
            if (existing) {
                logInfo(`[populate-db] Report already exists: ${s.title} (id=${existing.id})`);
                continue;
            }

            const r = reportRepo.create({
                title: s.title,
                description: s.description,
                category: s.category,
                images: s.images,
                lat: s.lat,
                long: s.long,
                anonymous: s.anonymous,
                status: s.status,
                createdAt: new Date(),
                createdBy: creator
            });

            const saved = await reportRepo.save(r);
            logInfo(`[populate-db] Inserted report: ${saved.title} (id=${saved.id})`);
        } catch (err) {
            logError('[populate-db] Error inserting sample report:', err);
        }
    }
}

async function upsertNotifications() {
    const userRepo = AppDataSource.getRepository('UserDAO');
    const reportRepo = AppDataSource.getRepository(ReportDAO);
    const notifRepo = AppDataSource.getRepository(NotificationDAO);

    const user1 = await userRepo.findOne({ where: { username: 'user' } }) || await userRepo.findOne({});
    const user2 = await userRepo.findOne({ where: { username: 'admin' } }) || null;

    if (!user1) {
        logError('[populate-db] No users found to attach notifications to. Skipping notifications.');
        return;
    }

    const reports = await reportRepo.find({ take: 2 });
    if (!reports || reports.length === 0) {
        logError('[populate-db] No reports found. Skipping notifications.');
        return;
    }

    // First notification
    try {
        const exists1 = await notifRepo.findOne({ where: { user: { id: user1.id }, report: { id: reports[0].id }, previousStatus: ReportStatus.PendingApproval, newStatus: ReportStatus.Assigned }, relations: ['user', 'report'] });
        if (!exists1) {
            const notif1 = notifRepo.create({
                user: user1,
                report: reports[0],
                previousStatus: ReportStatus.PendingApproval,
                newStatus: ReportStatus.Assigned,
                seen: false,
            });
            await notifRepo.save(notif1);
            logInfo(`[populate-db] Inserted notification id=${notif1.id} for user=${user1.username} reportId=${reports[0].id}`);
        } else {
            logInfo(`[populate-db] Notification already exists for user=${user1.username} reportId=${reports[0].id}`);
        }
    } catch (err) {
        logError('[populate-db] Error inserting first notification:', err);
    }

    // Second notification
    try {
        const targetUser = user2 || user1;
        const secondReport = reports[1] || reports[0];
        const exists2 = await notifRepo.findOne({ where: { user: { id: targetUser.id }, report: { id: secondReport.id }, previousStatus: ReportStatus.Assigned, newStatus: ReportStatus.Resolved }, relations: ['user', 'report'] });
        if (!exists2) {
            const notif2 = notifRepo.create({
                user: targetUser,
                report: secondReport,
                previousStatus: ReportStatus.Assigned,
                newStatus: ReportStatus.Resolved,
                seen: false,
            });
            await notifRepo.save(notif2);
            logInfo(`[populate-db] Inserted notification id=${notif2.id} for user=${targetUser.username} reportId=${secondReport.id}`);
        } else {
            logInfo(`[populate-db] Notification already exists for user=${targetUser.username} reportId=${secondReport.id}`);
        }
    } catch (err) {
        logError('[populate-db] Error inserting second notification:', err);
    }
}

async function deleteActualState() {
    const tables = ['users', 'reports', 'office_roles', 'categories', 'notifications'];
    for (const t of tables) {
        const sql = "TRUNCATE TABLE " + t + " RESTART IDENTITY CASCADE";
        await AppDataSource.query(sql);
        console.log("Cleaned table *" + t +"*");
    }
}

async function main() {
    try {
        await initializeDatabase();

        await deleteActualState();

        const rolesByName = await upsertOffices(OFFICES);
        await upsertCategories(CATEGORIES, rolesByName);

        await upsertUsers(USERS);

        await upsertReports();
        await upsertNotifications();

        logInfo('[populate-db] Done.');
    } catch (err) {
        logError('[populate-db] Failed:', err);
        process.exitCode = 1;
    } finally {
        await closeDatabase();
    }
}

main();