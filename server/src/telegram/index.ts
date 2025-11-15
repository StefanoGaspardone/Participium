import { UserDTO } from '@dtos/UserDTO';
import { Telegraf, Context } from 'telegraf';
import { CONFIG } from '../config/index';
import LocalSession from 'telegraf-session-local';
import { logError, logInfo } from '@utils/logger';
import { Auth } from '@telegram/commands/auth';

export interface SessionData {
    report?: any;
    user?: UserDTO;
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
        this.bot = new Telegraf<CustomContext>(CONFIG.TELEGRAM.BOT_API_TOKEN);
    }

    private loadMiddlewares = (): void => {
        const session = new LocalSession({ database: 'session_db.json' });
        this.bot.use(session.middleware());
    }

    private loadCommands = (): void => {
        const handlers: BotHandler[] = [
            new Auth(),
            // new AuthFlow(),
            // new ReportFlow()
        ];

        handlers.forEach(handler => {
            handler.register(this.bot);
        });

        this.bot.start((ctx) => ctx.reply('Welcome to the Participium telegram bot! To get started, run **/connect** to associate your account.'));
    }

    public initializeBot = async (): Promise<void> => {
        try {
            this.loadMiddlewares();
            this.loadCommands();

            await this.bot.launch();
            logInfo('[TELEGRAM BOT INIT] Telegram bot ParticipiumSE05 initialize and running on t.me/ParticipiumSE05Bot');
        } catch(error) {
            logError('[TELEGRAM BOT INIT] Error in telegram bot initialization: ', error);
        }
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