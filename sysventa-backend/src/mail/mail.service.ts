import { Injectable } from '@nestjs/common'
import * as nodemailer from 'nodemailer'

@Injectable()
export class MailService {
  private transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  })

  async sendPasswordReset(to: string, nombre: string, token: string) {
    const url = `${process.env.FRONTEND_URL}/reset-password?token=${token}`
    await this.transporter.sendMail({
      from: `"SysVenta" <${process.env.MAIL_USER}>`,
      to,
      subject: 'Recuperación de contraseña — SysVenta',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
          <h2 style="color:#1e40af;margin-bottom:8px">SysVenta</h2>
          <p style="color:#374151">Hola <strong>${nombre}</strong>,</p>
          <p style="color:#374151">Recibimos una solicitud para restablecer tu contraseña.</p>
          <div style="text-align:center;margin:32px 0">
            <a href="${url}"
               style="background:#2563eb;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;display:inline-block">
              Restablecer contraseña
            </a>
          </div>
          <p style="color:#6b7280;font-size:14px">Este enlace expira en <strong>30 minutos</strong>.</p>
          <p style="color:#6b7280;font-size:14px">Si no solicitaste este cambio, ignora este correo.</p>
        </div>
      `,
    })
  }
}
