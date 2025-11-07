import 'dotenv/config';
import 'reflect-metadata';
import { AppDataSource, initializeDatabase, closeDatabase } from '@database';
import { MunicipalityRoleDAO } from '@daos/MunicipalityRoleDAO';
import { CategoryDAO } from '@daos/CategoryDAO';
import { logInfo, logError } from '@utils/logger';

const ROLES: string[] = [
    'Public Services Division',
    'Environmental Quality Division',
    'Green Areas, Parks and Animal Welfare Division',
    'Infrastructure Division',
    'General Services Division',
];

const CATEGORIES: Array<{ name: string; municipalityRole: string }> = [
    { name: 'Water Supply - Drinking Water', municipalityRole: 'Public Services Division' },
    { name: 'Architectural Barriers', municipalityRole: 'Infrastructure Division' },
    { name: 'Sewer System', municipalityRole: 'Public Services Division' },
    { name: 'Public Lighting', municipalityRole: 'Public Services Division' },
    { name: 'Waste', municipalityRole: 'Environmental Quality Division' },
    { name: 'Road Signs and Traffic Lights', municipalityRole: 'Infrastructure Division' },
    { name: 'Roads and Urban Furnishings', municipalityRole: 'Infrastructure Division' },
    { name: 'Public Green Areas and Playgrounds', municipalityRole: 'Green Areas, Parks and Animal Welfare Division' },
    { name: 'Other', municipalityRole: 'General Services Division' },
];

async function upsertRoles(roleNames: string[]) {
    const repo = AppDataSource.getRepository(MunicipalityRoleDAO);
    const map = new Map<string, MunicipalityRoleDAO>();
    
    for(const name of roleNames) {
        const trimmed = name.trim();
        if(!trimmed) continue;

        let role = await repo.findOne({ where: { name: trimmed } });
        if(!role) {
                role = repo.create({ name: trimmed });
                role = await repo.save(role);
                
                logInfo(`[populate-db] Inserted role: ${trimmed} (id=${role.id})`);
        } else {
            logInfo(`[populate-db] Role already exists: ${trimmed} (id=${role.id})`);
        }
            map.set(trimmed, role);
        }

    return map;
}

async function upsertCategories(items: Array<{ name: string; municipalityRole: string }>, rolesByName: Map<string, MunicipalityRoleDAO>) {
    const repo = AppDataSource.getRepository(CategoryDAO);

    for(const { name, municipalityRole } of items) {
        const trimmedName = name.trim();
        const trimmedRole = municipalityRole.trim();
        if(!trimmedName || !trimmedRole) continue;

        const role = rolesByName.get(trimmedRole);
        if(!role) {
            logError(`[populate-db] Skipping category '${trimmedName}': role '${trimmedRole}' not found in ROLES.`);
            continue;
        }

        let cat = await repo.findOne({ where: { name: trimmedName } });
        if(!cat) {
            cat = repo.create({ name: trimmedName, municipalityRole: role });
            cat = await repo.save(cat);
            
            logInfo(`[populate-db] Inserted category: ${trimmedName} (id=${cat.id}) -> role=${role.name}`);
        } else {
            if(!cat.municipalityRole || cat.municipalityRole.id !== role.id) {
                cat.municipalityRole = role;
                await repo.save(cat);
                
                logInfo(`[populate-db] Updated category role: ${trimmedName} -> role=${role.name}`);
            } else {
                logInfo(`[populate-db] Category already exists: ${trimmedName} (id=${cat.id})`);
            }
        }
    }
}

async function main() {
    try {
        await initializeDatabase();

        const rolesByName = await upsertRoles(ROLES);
        await upsertCategories(CATEGORIES, rolesByName);

        logInfo('[populate-db] Done.');
    } catch(err) {
        logError('[populate-db] Failed:', err);
        process.exitCode = 1;
    } finally {
        await closeDatabase();
    }
}

main();