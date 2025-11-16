import { Telegraf } from 'telegraf';
import { CustomContext } from "@telegram/index";
import { CONFIG } from '@config';
import { UserDTO } from '@dtos/UserDTO';

export class Auth {
    public register = (bot: Telegraf<CustomContext>): void => {
        bot.command('connect', this.connectUser);
    }

    private connectUser = async (ctx: CustomContext) => {
        const telegramUsername = ctx.from?.username;

        if(!telegramUsername) return ctx.reply('*Error:* To connect, you must have set a Telegram username (e.g. @yourusername) in your Telegram settings.', { parse_mode: 'Markdown' });
        if(ctx.session.user) return ctx.reply(`You're already logged in as *${ctx.session.user.firstName} ${ctx.session.user.lastName}*. If you want to reconnect, you can simply run */connect* again.`, { parse_mode: 'Markdown' });

        await ctx.reply(`Attempting to connect to user *@${telegramUsername}*...`, { parse_mode: 'Markdown' });

        try {
            const resp = await fetch(`http://localhost:${CONFIG.APP_PORT}/api/users/@${telegramUsername}`);

            if(!resp.ok) {
                if(resp.status === 404) return ctx.reply(`*Failed:* No registered users with the telegram username *@${telegramUsername}* were found in our system. Please make sure the telegram username is correct and that you have completed registration on our app.`, { parse_mode: 'Markdown' });
                return ctx.reply(`*Error*: Your request cannot be completed at this time. Please try again later.`, { parse_mode: 'Markdown' });
            }

            const data = (await resp.json()) as { user?: UserDTO };
            const user = data?.user;

            if(!user || !user.id) return ctx.reply(`*Failed:* No registered users with the username *@${telegramUsername}* were found in our system. Please make sure the username is correct and that you have completed registration on our app.`, { parse_mode: 'Markdown' });

            ctx.session.user = user;
            return ctx.reply(`*Successfully logged in!* Welcome, *${user.firstName} ${user.lastName}*!\nNow you can play with the bot!`, { parse_mode: 'Markdown' });
        } catch(error) {
            return ctx.reply('*Error*: a network error occurred or the server was unresponsive. Please try again later.', { parse_mode: 'Markdown' });
        }
    }
}