import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

import { CONFIG } from '@config';

import { logError, logInfo } from '@utils/logger';

interface MailOptions {
    to: string;
    subject: string;
    text: string;
    html?: string;
}

export class MailService {

    private transporter: Transporter | null = null;
    private readonly fromAddress: string;
    private readonly fromName: string;

    constructor() {
        this.fromAddress = CONFIG.MAIL.MAIL_FROM_ADDRESS; 
        this.fromName = CONFIG.MAIL.MAIL_FROM_NAME;

        const smtpUser = CONFIG.MAIL.SMTP_USER;
        const clientId = CONFIG.MAIL.OAUTH_CLIENT_ID;
        const clientSecret = CONFIG.MAIL.OAUTH_CLIENT_SECRET;
        const refreshToken = CONFIG.MAIL.OAUTH_REFRESH_TOKEN;

        this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                type: 'OAuth2',
                user: smtpUser,
                clientId: clientId,
                clientSecret: clientSecret,
                refreshToken: refreshToken,
            },
            pool: true,
            maxConnections: 5,
            rateLimit: 10,
        });

        this.transporter.verify()
            .then(() => logInfo(`[EMAIL SETUP] OAuth client is ready and emails will be sent from: ${this.fromAddress}`))
            .catch(error => {
                logError('[EMAIL SETUP] SMTP verification error. Check HOST, PORT and CREDENTIALS.', error.message);
                this.transporter = null;
            });
    }

    sendMail = async (options: MailOptions): Promise<nodemailer.SentMessageInfo | void> => {
        if(!this.transporter) return;

        const mailDetails = {
            from: `${this.fromName} <${this.fromAddress}>`, 
            to: options.to,
            subject: options.subject,
            text: options.text,
            html: options.html || options.text, 
        };

        try {
            const info = await this.transporter.sendMail(mailDetails);
            return info;
        } catch(error) {
            logError('[EMAIL SENDING] Error while sending email: ', error);
        }
    }
}

export const mailService = new MailService();