import { CustomContext } from '@telegram/index';
import { MiddlewareFn } from 'telegraf';

export const requireAppUser: MiddlewareFn<CustomContext> = async (ctx, next) => {
    if(ctx.session.auth && ctx.session.auth.user && ctx.session.auth.user.id && ctx.session.auth.valid) return next();
    
    return ctx.reply('*Access Denied:* You must first connect your Participium account to the bot.\nRun the */connect* command to connect your Telegram username and continue.', { parse_mode: 'Markdown' });
};