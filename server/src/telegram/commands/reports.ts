import { Telegraf, Markup } from 'telegraf';

import { CustomContext } from '@telegram/index';
import { requireAppUser } from '@telegram/middlewares/authMiddleware';

import { CONFIG } from '@config';

import { ReportDTO } from '@dtos/ReportDTO';

interface ReportsResponse {
    reports: ReportDTO[],
}

interface ReportResponse {
    report: ReportDTO,
}

export class Reports {
    public register = (bot: Telegraf<CustomContext>) => {
        bot.command('my_reports', requireAppUser, this.myReports);
        bot.action(/report_status:.+/, this.reportStatusAction);
        bot.command('report_status', requireAppUser, this.reportStatusCommand);
    }

    private readonly myReports = async (ctx: CustomContext) => {
        try {
            const res = await fetch(`http://localhost:${CONFIG.APP_PORT}/api/reports/mine`, {
                headers: {
                    'Authorization': `Bearer ${ctx.session.auth.token as string}`,
                }
            });

            if(!res.ok) return ctx.reply('**Error** loading your reports. Please try again later.', { parse_mode: 'Markdown' });

            const data: ReportsResponse = (await res.json()) as ReportsResponse;
            const { reports } = data;

            if(!reports || reports.length === 0) return ctx.reply('No reports found for your account. Run **/newreports** to create a new report', { parse_mode: 'Markdown' });

            const lines: string[] = [];
            const buttons: any[] = [];
            for(const r of reports) {
                const cat = (r as any).category?.name ?? (r as any).category ?? 'N/A';
                const title = String((r as any).title ?? 'N/A');
                const status = String((r as any).status ?? 'N/A');
                // Use HTML formatting (<b>) and escape user-provided text
                lines.push(`- <b>#${r.id} ${this.escapeHtml(title)}</b><b>\n\t\t\tCategory</b>: ${this.escapeHtml(cat)}\n\t\t\t<b>Status</b>: ${this.escapeHtml(status)}\n`);

                buttons.push([Markup.button.callback(`#${r.id}`, `report_status:${r.id}`)]);
            }

            const message = ['<b>Your reports</b>:', '', ...lines].join('\n');
            return ctx.reply(message, {
                parse_mode: 'HTML',
                ...Markup.inlineKeyboard(buttons, { columns: 2 }),
            });
        } catch {
            return ctx.reply('*Error* during initial loading. Please try again later.', { parse_mode: 'Markdown' });
        }
    }

    private readonly escapeHtml = (str: string) => {
        return String(str)
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll('\'', '&#39;');
    }

    private readonly reportStatusAction = async (ctx: CustomContext) => {
        try {
            try { 
                await ctx.answerCbQuery(); 
            } catch {
                try {
                    const cq = (ctx.callbackQuery as any)?.id || (ctx.callbackQuery as any)?.message?.message_id;
                    if (cq) await ctx.telegram.answerCbQuery(cq as string);
                } catch {
                    // swallow catch
                }
            }

            const data = (ctx.callbackQuery && (ctx.callbackQuery as any).data) as string | undefined;
            if(!data) {
                await ctx.reply('Invalid action');
                return;
            }

            const m = new RegExp(/^report_status:(.+)$/).exec(data);
            if(!m) {
                await ctx.reply('Invalid action');
                return;
            }

            const id = m[1];

            const token = ctx.session?.auth?.token as string | undefined;
            if(!token) {
                await ctx.reply('You must be logged in to view report details. Please use /login or re-open the bot.');
                return;
            }

            await this.fetchAndReplyReport(id, ctx);
        } catch {
            return ctx.reply('*Error* during initial loading. Please try again later.', { parse_mode: 'Markdown' });
        }
    }

    private readonly reportStatusCommand = async (ctx: CustomContext) => {
        const text = (ctx.message && (ctx.message as any).text) as string | undefined;
        if(!text) return ctx.reply('Usage: /report_status [ID]');
        
        const parts = text.trim().split(/\s+/);
        if(parts.length < 2) return ctx.reply('Usage: /report_status [ID]');
        
        const id = parts[1];
        await this.fetchAndReplyReport(id, ctx);
    }

    private readonly fetchAndReplyReport = async (id: string, ctx: CustomContext) => {
        try {
            const res = await fetch(`http://localhost:${CONFIG.APP_PORT}/api/reports/${id}`, {
                headers: {
                    'Authorization': `Bearer ${ctx.session.auth.token as string}`,
                }
            });

            if(!res.ok) return ctx.reply(`Report with id <b>${this.escapeHtml(id)}</b> not found. Please, verify your submitted reports by running <b>/my_reports</b>.`, { parse_mode: 'HTML' });

            const data: ReportResponse = (await res.json()) as ReportResponse;
            const { report } = data;

            const cat = report.category?.name ?? report.category ?? 'N/A';
            const title = String(report.title ?? 'N/A');
            const desc = String(report.description ?? 'N/A');
            const status = String(report.status ?? 'N/A');
            return ctx.reply(`Report <b>#${report.id}</b>\n\n<b>Title</b>: ${this.escapeHtml(title)}\n<b>Description</b>: ${this.escapeHtml(desc)}\n<b>Category</b>: ${this.escapeHtml(cat)}\n<b>Status</b>: ${this.escapeHtml(status)}`, { parse_mode: 'HTML' });
        } catch {
            return ctx.reply('*Error* during initial loading. Please try again later.', { parse_mode: 'Markdown' });
        }
    }
}