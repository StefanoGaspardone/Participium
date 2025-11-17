import { UserDTO } from '@dtos/UserDTO';
import { Telegraf, Context } from 'telegraf';
import { CONFIG } from '../config/index';
import LocalSession from 'telegraf-session-local';
import { logError, logInfo } from '@utils/logger';
import { Auth } from '@telegram/commands/auth';
import fs from 'fs';
import { NewReport } from './commands/new_report';

export interface AuthSessionState {
    awaitingPassword?: boolean;
    user?: UserDTO | null;
    valid?: boolean;
}

export interface SessionData {
    report?: any;
    auth: AuthSessionState;
}

export interface CustomContext extends Context {
    session: SessionData;
}

interface BotHandler {
    register(bot: Telegraf<CustomContext>): void;
}

export class TelegramBot {
    private bot: Telegraf<CustomContext>;
    
    constructor() {
        if(!CONFIG.TELEGRAM.BOT_API_TOKEN || CONFIG.TELEGRAM.BOT_API_TOKEN.startsWith('000') ){
            logError('[TELEGRAM BOT INIT] Invalid or missing bot token');
        }

        this.bot = new Telegraf<CustomContext>(CONFIG.TELEGRAM.BOT_API_TOKEN);
    }

    private loadMiddlewares = (): void => {
        try {
            fs.writeFileSync(CONFIG.TELEGRAM.SESSION_JSON_PATH, '{}', { encoding: 'utf-8' });
        } catch {}

        const session = new LocalSession({ database: CONFIG.TELEGRAM.SESSION_JSON_PATH });
        this.bot.use(session.middleware());

        this.bot.use(async (ctx, next) => {
            if(!ctx.session.auth) ctx.session.auth = { awaitingPassword: false, user: null, valid: false };
            return next();
        });
    }

    private loadCommands = (): void => {
        const handlers: BotHandler[] = [
            new Auth(),
            new NewReport(),
        ];

        handlers.forEach(handler => {
            handler.register(this.bot);
        });

        this.bot.start((ctx) => ctx.reply('Welcome to the Participium telegram bot!\nTo get started, run */connect* to associate your account.', { parse_mode: 'Markdown' }));
    }

    public initializeBot = async (): Promise<void> => {
        this.loadMiddlewares();
        this.loadCommands();

        this.bot.catch((err, ctx) => {
            logError('[TELEGRAM BOT ERR]', err)
        });
        logInfo('[TELEGRAM BOT INIT] Telegram bot initialized and running on https://t.me/ParticipiumSE05Bot');
        
        try {
            await this.bot.telegram.deleteWebhook({ drop_pending_updates: true });
        } catch(e) {
            logError('[TELEGRAM BOT INIT] deleteWebhook failed', e);
        }

        await this.bot.launch();
    }

    public stopBot = async (): Promise<void> => {
        try {
            this.bot.stop();
            logInfo('[TELEGRAM BOT CLOSE] Telegram bot stopped');
        } catch(error) {
            logError('[TELEGRAM BOT CLOSE] Error in telegram bot closing: ', error);
        }
    }

    public getBotInstance(): Telegraf<CustomContext> {
        return this.bot;
    }
}

export const botInstance = new TelegramBot();