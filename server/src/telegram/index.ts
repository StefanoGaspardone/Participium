import { UserDTO } from '@dtos/UserDTO';
import { Telegraf, Context } from 'telegraf';
import { CONFIG } from '../config/index';
import LocalSession from 'telegraf-session-local';
import { logError, logInfo, logWarn } from '@utils/logger';
import { Auth } from '@telegram/commands/auth';
import fs from 'node:fs';
import { NewReport } from './commands/new_report';
import { HelpAssistance } from './commands/help_assistance';
import { Reports } from './commands/reports';

export interface AuthSessionState {
    awaitingPassword?: boolean;
    user?: UserDTO | null;
    valid?: boolean;
    token: string | null;
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
    private readonly bot: Telegraf<CustomContext>;

    private pollingActive = false;
    private disabledReason?: string;
    
    constructor() {
        if(!CONFIG.TELEGRAM.BOT_API_TOKEN || CONFIG.TELEGRAM.BOT_API_TOKEN.startsWith('000') ){
            logError('[TELEGRAM BOT INIT] Invalid or missing bot token');
        }

        this.bot = new Telegraf<CustomContext>(CONFIG.TELEGRAM.BOT_API_TOKEN);
    }

    private readonly loadMiddlewares = (): void => {
        try {
            fs.writeFileSync(CONFIG.TELEGRAM.SESSION_JSON_PATH, '{}', { encoding: 'utf-8' });
        } catch {}

        const session = new LocalSession({ database: CONFIG.TELEGRAM.SESSION_JSON_PATH });
        this.bot.use(session.middleware());

        this.bot.use(async (ctx, next) => {
            if(!ctx.session.auth) ctx.session.auth = { awaitingPassword: false, user: null, valid: false, token: null };
            return next();
        });
    }

    private readonly loadCommands = (): void => {
        const handlers: BotHandler[] = [
            new Auth(),
            new NewReport(),
            new HelpAssistance(),
            new Reports(),
        ];

        handlers.forEach(handler => {
            handler.register(this.bot);
        });

        this.bot.start((ctx) => {
            ctx.session.auth =  {
                awaitingPassword: false,
                user: null,
                valid: false,
                token: null,
            };
            ctx.reply('Welcome to the Participium telegram bot!\nTo get started, run */connect* to associate your account.\nRun */help* to see available commands.', { parse_mode: 'Markdown' });
        });
    }

    public initializeBot = async (): Promise<void> => {
        this.loadMiddlewares();
        this.loadCommands();

        this.bot.catch((err, ctx) => {
            logError('[TELEGRAM BOT ERR]', err)
        });

        try { await this.bot.telegram.deleteWebhook({ drop_pending_updates: true }); } catch {}
        
        const launchPromise = this.bot.launch({ dropPendingUpdates: true });
        
        this.pollingActive = true;
        this.disabledReason = undefined;

        logInfo('[TELEGRAM BOT INIT] Telegram bot initialized and running on https://t.me/ParticipiumSE05Bot');

        launchPromise.catch((e: any) => {
            if(e?.response?.error_code === 409) {
                logWarn('[TELEGRAM BOT INIT] Another instance is already running, on https://t.me/ParticipiumSE05Bot, but it is unreachable now');
                
                this.pollingActive = false;
                this.disabledReason = '409-CONFLICT';
                
                return;
            }

            logError('[TELEGRAM BOT INIT] Bot initialization failed: ', e);
            
            this.pollingActive = false;
            this.disabledReason = 'LAUNCH-ERROR';
        });
    }

    public stopBot = async (): Promise<void> => {
        if(this.pollingActive) {
            try {
                this.bot.stop();
                logInfo('[TELEGRAM BOT CLOSE] Telegram bot stopped');
            } catch(error) {
                logError('[TELEGRAM BOT CLOSE] Error in telegram bot closing: ', error);
            }
        }

        this.pollingActive = false;
    }

    public getBotInstance(): Telegraf<CustomContext> {
        return this.bot;
    }
}

export const botInstance = new TelegramBot();