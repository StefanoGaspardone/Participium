import { Telegraf, Markup } from 'telegraf';
import { CustomContext } from "@telegram/index";
import { requireAppUser } from '@telegram/middlewares/authMiddleware';
import { CONFIG } from '@config';
import { isPointInTurin } from '@utils/geo_turin';

export class NewReport {
    public register = (bot: Telegraf<CustomContext>): void => {
        bot.command('new_report', requireAppUser, this.startReportFlow);
        bot.command('done', requireAppUser, this.handleDone);

        bot.on('location', requireAppUser, this.handleLocation);
        bot.on('photo', requireAppUser, this.handlePhoto);
        bot.on('text', requireAppUser, this.handleText);
        bot.on('callback_query', requireAppUser, this.handleCallbackQuery);
    }

    private startReportFlow = async (ctx: CustomContext) => {
        const userId = ctx.session.user!.id;

        ctx.session.report = {
            step: 'location', 
            data: { userId },
            categories: []
        };

        try {
            const resp = await fetch(`http://localhost:${CONFIG.APP_PORT}/api/categories`);
            if(!resp.ok) return ctx.reply('**Error** loading categories (server unavailable). Please try again later.', { parse_mode: 'Markdown' });

            const data: any = await resp.json().catch(() => null);
            const categories = (data && Array.isArray(data.categories)) ? data.categories : [];
            ctx.session.report.categories = categories;

            if(!categories.length) return ctx.reply('Unable to create report: no categories found.');
            
            return ctx.reply(
                '**STEP 1/6: Submit Location**\nPlease attach the location (must be within the boundaries of Turin).', { parse_mode: 'Markdown' }
            );

        } catch(error) {
            const msg = (error instanceof Error) ? error.message : 'Unknown error';
            return ctx.reply('**Error** during initial loading. Please try again later.', { parse_mode: 'Markdown' });
        }
    }

    private handleLocation = async (ctx: CustomContext) => {
        const reportState = ctx.session.report;
        if(!reportState || reportState.step !== 'location') return;
        
        const msg = ctx.message;
        if(!msg || !('location' in msg)) return;

        const location = (msg as any).location;
        const { latitude, longitude } = location;

        const isInsideTurinPolygon = isPointInTurin(latitude, longitude);
        if(isInsideTurinPolygon) {
            reportState.data.latitude = latitude;
            reportState.data.longitude = longitude;
            reportState.step = 'title';
            
            return ctx.reply('**Position Accepted!** Now enter a short **title** for your report.', { parse_mode: 'Markdown' });
        } else {
            return ctx.reply('**Attention!** The selected location is outside the Turin city limits. Choose a location *within* the polygon.', { parse_mode: 'Markdown' });
        }
    }

    private handleText = async (ctx: CustomContext) => {
        const text = ctx.message?.text?.trim();
        const reportState = ctx.session.report;

        if (!reportState || !text || ['location', 'awaiting_photos', 'anonymous', 'complete'].includes(reportState.step)) return;
        
        if(text === '/done') return;

        if(reportState.step === 'title') {
            reportState.data.title = text.substring(0, 50);
            reportState.step = 'description';
            
            return ctx.reply('**STEP 3/6: Enter Description**\nProvide a detailed **description**.', { parse_mode: 'Markdown' });
        } else if(reportState.step === 'description') {
            reportState.data.description = text;
            reportState.step = 'category';
            
            const categories = reportState.categories;
            const categoryButtons = categories.map(cat =>  Markup.button.callback(cat.name, `category_${cat.id}`) );
            
            return ctx.reply(
                '**STEP 4/6: Choose Category**\nSelect the most appropriate category:', {
                    parse_mode: 'Markdown',
                    ...Markup.inlineKeyboard(categoryButtons, { columns: 2 })
                }
            );
        }
    }

    private handlePhoto = async (ctx: CustomContext) => {
        const reportState = ctx.session.report;

        if(!reportState || reportState.step !== 'awaiting_photos' || !ctx.message?.photo) return;
        if(reportState.data.photos.length >= 3) return ctx.reply('You have reached the maximum limit of **3 images**. Click /done to continue.', { parse_mode: 'Markdown' });
    
        const fileId = ctx.message.photo.pop()!.file_id;

        try {
            const processingMessage = await ctx.reply('Uploading image...');

            const fileLink = await ctx.telegram.getFileLink(fileId);
            const telegramFileUrl = fileLink.href;

            const signRes = await fetch(`http://localhost:${CONFIG.APP_PORT}/api/uploads/sign`, { method: "POST" });
            if(!signRes.ok) {
                const text = await signRes.text().catch(() => "");
                throw new Error(`Failed to sign upload: ${signRes.status} ${text}`);
            }

            const sign: UploadSignResponse = await signRes.json();

            const form = new FormData();
            form.append("file", image);
            form.append("api_key", sign.apiKey);
            form.append("timestamp", String(sign.timestamp));
            form.append("signature", sign.signature);

            if(sign.defaultFolder) form.append("folder", sign.defaultFolder);
            if(sign.uploadPreset) form.append("upload_preset", sign.uploadPreset);

            const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${sign.cloudName}/image/upload`;
            const cloudRes = await fetch(cloudinaryUrl, {
                method: "POST",
                body: form,
            });

            if(!cloudRes.ok) {
                const text = await cloudRes.text().catch(() => "");
                throw new Error(`Cloudinary upload failed: ${cloudRes.status} ${text}`);
            }

            const cloudData: CloudinaryUploadResponse = await cloudRes.json();
            const url = cloudData.secure_url || cloudData.url;

            if(!url) throw new Error("Cloudinary did not return a URL");

            reportState.data.images.push(url);
            const count = reportState.data.images.length;

            await ctx.deleteMessage(processingMessage.message_id);
            await ctx.reply(`Image ${count} loaded! Send more photos **(max 3)** or click /done.`, { parse_mode: 'Markdown' });
        } catch(error) {
            return ctx.reply('An error occurred while uploading the image. Please try again or click /done to skip.');
        }
    }

    private handleDone = async (ctx: CustomContext) => {
        const reportState = ctx.session.report;

        if(!reportState || reportState.step !== 'awaiting_photos') return ctx.reply('The command is invalid at this stage. Are you running a report? Use /new_reports.');
        if(!reportState.data.photos || reportState.data.photos.length === 0) return ctx.reply('You must submit **at least 1 photo** before completing the report. Submit an image.', { parse_mode: 'Markdown' });
    
        reportState.step = 'anonymous';

        return ctx.reply(
            '**STEP 6/6: Anonymous Report?**\nDo you want this report to be sent anonymously? Select YES or NO to finish.', {
                parse_mode: 'Markdown',
                ...Markup.inlineKeyboard([
                    Markup.button.callback('Yes', 'anon_true'),
                    Markup.button.callback('No', 'anon_false')
                ], { columns: 2 }).reply_markup,
                ...Markup.removeKeyboard()
            }
        );
    }

    private handleCallbackQuery = async () => {
        const callbackData = ctx.callbackQuery?.data;
        const reportState = ctx.session.report;
        const currentStep = reportState?.step;

        if(!callbackData || !reportState) return;
        
        if(currentStep === 'category' && callbackData.startsWith('category_')) {
            const categoryId = parseInt(callbackData.substring(9));
            const selectedCategory = reportState.categories.find(c => c.id === categoryId);
            
            reportState.data.categoryId = categoryId;
            reportState.step = 'awaiting_photos';
            reportState.data.images = [];

            await ctx.editMessageText(`**STEP 4/6: Selected Category:** ${selectedCategory ? selectedCategory.name : 'ID ' + categoryId}.`, { parse_mode: 'Markdown' });
            
            return ctx.reply(
                '**STEP 5/6: Submit Images**\Please submit **1-3 photos** for the report. Once submitted, click /done to continue.', {
                    parse_mode: 'Markdown',
                    ...Markup.keyboard([['/done']]).resize()
                }
            );
        }
        
        if(currentStep === 'anonymous' && (callbackData === 'anon_true' || callbackData === 'anon_false')) {
            const isAnonymous = callbackData === 'anon_true';
            
            reportState.data.anonymous = isAnonymous;
            reportState.step = 'complete';

            await ctx.editMessageText(`**STEP 6/6: Anonymity Selected:** ${isAnonymous ? 'Yes' : 'No'}.`, { parse_mode: 'Markdown' });
            
            return this.uploadReport(ctx);
        }
    }

    private async uploadReport(ctx: CustomContext): Promise<void> {
        const reportState = ctx.session.report;

        const finalReport = {
            ...reportState.data,
            userId: ctx.session.user!.id,
            images: reportState.data.images || [],
        };

        try {
            await ctx.reply('**Sending...**\nSending the final report to Participium.', { parse_mode: 'Markdown' });
            
            const res = await fetch(`http://localhost:${CONFIG.APP_PORT}/api/reports/telegram`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(finalReport),
            });

            if(!res.ok) {
                const text = await res.text().catch(() => '');
                throw new Error(`Failed to upload report: ${res.status} ${text}`);
            }

            const json: any = await res.json().catch(() => ({}));
            const reportId = json?.reportId ?? 'N/A';

            ctx.session.report = { step: 'start', data: {} };
            
            return ctx.reply(`**Report uploaded!**\nReport ID: ${reportId}.\nThank you for your contribution.`, { 
                disable_notification: true, parse_mode: 'Markdown'
            });
        } catch(error) {
            ctx.session.report = { step: 'start', data: {} };
            return ctx.reply('**Upload Error**\nThere was a problem finalizing the report. Please try again later.');
        }
    }
}