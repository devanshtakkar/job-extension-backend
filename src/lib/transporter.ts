const nodemailer = require('nodemailer');
import { SMTP_SERVER, SMTP_SEND_EMAIL, SMTP_PORT, SMTP_LOGIN_EMAIL } from './CONSTANTS';
import { config } from 'dotenv';
config();

export function generateTransporter() {
    return nodemailer.createTransport({
        host: SMTP_SERVER,
        port: SMTP_PORT,
        secure: true,
        auth: {
            user: SMTP_LOGIN_EMAIL,
            pass: process.env.SMTP_PASSWORD
        },
        tls: {
            rejectUnauthorized: true
        }
    })
}