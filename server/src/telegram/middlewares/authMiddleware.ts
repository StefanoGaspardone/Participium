import { CustomContext } from '@telegram/index';
import { MiddlewareFn } from 'telegraf';

export const requireAppUser: MiddlewareFn<CustomContext> = async (ctx, next) => {
    if(ctx.session.user && ctx.session.user.id) return next();
    
    return ctx.reply('**Access Denied:** You must first connect your Express account to the bot. Run the **/connect** command to connect your Telegram username and continue.');
};