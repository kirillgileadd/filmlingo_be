import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}

  async sendActivationMail(emailTo: string, link: string) {
    await this.mailerService.sendMail({
      to: emailTo, // список получателей
      from: process.env.SMTP_USERNAME, // отправитель
      subject: 'Активация аккаунта на' + process.env.API_URL, // Тема письма
      text: '', // Текстовое тело письма (можно оставить пустым)
      html: `
        <!DOCTYPE html>
        <html lang="ru">
          <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>Фильминго — Подтверждение регистрации</title>
            <style>
              /* Для почтовых клиентов, которые поддерживают внешние шрифты */
              @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap');
    
              body {
                font-family: 'Roboto', Arial, sans-serif;
                background-color: #f7f7f7;
                margin: 0;
                padding: 0;
              }
              .container {
                width: 100%;
                max-width: 600px;
                margin: 0 auto;
                background-color: #ffffff;
                border-radius: 8px;
                padding: 20px;
                box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
              }
              h1 {
                color: #000000;
                font-size: 24px;
                text-align: center;
                margin-bottom: 20px;
              }
              .logo {
                font-size: 30px;
                font-weight: 700;
                color: #000000;
                text-align: center;
                margin-bottom: 20px;
              }
              .content {
                font-size: 16px;
                color: #555555;
                margin-bottom: 20px;
                text-align: center;
              }
              .button {
                display: inline-block;
                padding: 10px 20px;
                background-color: #000000;
                color: #ffffff;
                text-decoration: none;
                font-size: 16px;
                font-weight: bold;
                border-radius: 5px;
                text-align: center;
              }
              .button:hover {
                background-color: #444444;
              }
              footer {
                font-size: 12px;
                color: #888888;
                text-align: center;
                margin-top: 30px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="logo">Filmlingo</div>
              <h1>Для активации перейдите по ссылке</h1>
              <div class="content">
                <a href="${link}" class="button">Активировать аккаунт</a>
              </div>
              <footer>
                <p>Если вы не запрашивали регистрацию, проигнорируйте это письмо.</p>
              </footer>
            </div>
          </body>
        </html>
      `,
    });
  }

  async sendForgotPasswordMail(emailTo: string, link: string) {
    try {
      await this.mailerService.sendMail({
        to: emailTo, // list of receivers
        from: process.env.SMTP_USERNAME, // sender address
        subject: 'Восстановление пароля ✔' + `${process.env.API_URL}`, // Subject line
        text: '', // plaintext body
        html: `
        <!DOCTYPE html>
        <html lang="ru">
          <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>Фильминго — Подтверждение регистрации</title>
            <style>
              /* Для почтовых клиентов, которые поддерживают внешние шрифты */
              @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap');
    
              body {
                font-family: 'Roboto', Arial, sans-serif;
                background-color: #f7f7f7;
                margin: 0;
                padding: 0;
              }
              .container {
                width: 100%;
                max-width: 600px;
                margin: 0 auto;
                background-color: #ffffff;
                border-radius: 8px;
                padding: 20px;
                box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
              }
              h1 {
                color: #000000;
                font-size: 24px;
                text-align: center;
                margin-bottom: 20px;
              }
              .logo {
                font-size: 30px;
                font-weight: 700;
                color: #000000;
                text-align: center;
                margin-bottom: 20px;
              }
              .content {
                font-size: 16px;
                color: #555555;
                margin-bottom: 20px;
                text-align: center;
              }
              .button {
                display: inline-block;
                padding: 10px 20px;
                background-color: #000000;
                color: #ffffff;
                text-decoration: none;
                font-size: 16px;
                font-weight: bold;
                border-radius: 5px;
                text-align: center;
              }
              .button:hover {
                background-color: #444444;
              }
              footer {
                font-size: 12px;
                color: #888888;
                text-align: center;
                margin-top: 30px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="logo">Filmlingo</div>
              <h1>Для сброса пароля перейдите по ссылке</h1>
              <div class="content">
                <a href="${link}" class="button">Сбросить пароль</a>
              </div>
              <footer>
                <p>Если вы не запрашивали сброс, проигнорируйте это письмо.</p>
              </footer>
            </div>
          </body>
        </html>
      `, // HTML body content
      });
    } catch (e) {
      console.log(e);
    }
  }
}
