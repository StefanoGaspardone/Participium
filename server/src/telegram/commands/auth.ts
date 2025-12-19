import { Telegraf, MiddlewareFn } from 'telegraf';
import { CustomContext } from "@telegram/index";
import { CONFIG } from '@config';
import { UserDTO } from '@dtos/UserDTO';

interface LoginResponse {
    message: string;
    token: string;
}

export class Auth {
    public register = (bot: Telegraf<CustomContext>): void => {
        bot.command('connect', this.connectUser);
        bot.on('text', this.passwordInterceptor);
    }

    private connectUser = async (ctx: CustomContext) => {
        const telegramUsername = ctx.from?.username;

        if(!telegramUsername) return ctx.reply('*Error:* To connect, you must have set a Telegram username (e.g. @yourusername) in your Telegram settings.', { parse_mode: 'Markdown' });
        
        ctx.session.auth =  {
            awaitingPassword: false,
            user: null,
            valid: false,
            token: null,
        }
        
        await ctx.reply(`Attempting to connect to user *@${telegramUsername}*...`, { parse_mode: 'Markdown' });

        try {
            const resp = await fetch(`http://localhost:${CONFIG.APP_PORT}/api/users/@${telegramUsername}`);

            if(!resp.ok) {
                if(resp.status === 404) return ctx.reply(`*Failed:* No registered users with the telegram username *@${telegramUsername}* were found in our system. Please make sure the telegram username is correct and that you have completed registration on our app.`, { parse_mode: 'Markdown' });
                return ctx.reply(`*Error*: Your request cannot be completed at this time. Please try again later.`, { parse_mode: 'Markdown' });
            }

            const data = (await resp.json()) as { user?: UserDTO };
            const user = data?.user;

            if(!user?.id) return ctx.reply(`*Failed*\nNo registered users with the username *@${telegramUsername}* were found in our system. Please make sure the username is correct and that you have completed registration on our app.`, { parse_mode: 'Markdown' });
            if(!user.isActive) return ctx.reply(`*Failed*\nYour account is currently inactive, check your email to get the confirmation code.\nWhen done, return here and run again **/connect**.`, { parse_mode: 'Markdown' });

            ctx.session.auth = {
                awaitingPassword: true,
                user,
                valid: false,
                token: null,
            };

            return ctx.reply(`Hi *${user.firstName} ${user.lastName}*.\nPlease, enter your *password*`, { parse_mode: 'Markdown' });
        } catch {
            return ctx.reply('*Error*: a network error occurred or the server was unresponsive. Please try again later.', { parse_mode: 'Markdown' });
        }
    }

    private passwordInterceptor: MiddlewareFn<CustomContext> = async (ctx, next) => {
        const auth = ctx.session.auth;
        const msg: any = ctx.message;
        const text: string | undefined = msg?.text;

        if(!auth?.awaitingPassword || !auth.user || !text || text.startsWith('/')) return next();
        
        await this.handlePassword(ctx);
    };

    private handlePassword = async (ctx: CustomContext) => {
        const auth = ctx.session.auth;
        const msg: any = ctx.message!;
        const password = (msg.text as string).trim();

        try { await ctx.deleteMessage(msg.message_id); } catch {}

        try {
            const pending = auth.user as UserDTO;
            const body: any = { username: pending.username, password };

            const loginResp = await fetch(`http://localhost:${CONFIG.APP_PORT}/api/users/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            const data: LoginResponse = await loginResp.json() as LoginResponse;

            if(!loginResp.ok) return ctx.reply('*Login failed:* Wrong password.\nTry again or /connect to restart.', { parse_mode: 'Markdown' });
        
            ctx.session.auth = { awaitingPassword: false, valid: true, user: ctx.session.auth.user, token: data.token, };
            ctx.reply(`*Login successful!* Welcome *${pending.firstName} ${pending.lastName}*.`, { parse_mode: 'Markdown' });
        } catch {
            return ctx.reply('*Error:* Cannot verify password now. Try later.', { parse_mode: 'Markdown' });
        }
    }
}