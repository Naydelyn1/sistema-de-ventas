import { Injectable, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { PrismaService } from '../prisma/prisma.service'
import { LoginDto } from './dto/login.dto'
import { MailService } from '../mail/mail.service'
import * as bcrypt from 'bcrypt'
import * as crypto from 'crypto'

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {}

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto

    const usuario = await this.prisma.usuario.findUnique({
      where: { email },
    })

    if (!usuario || !usuario.activo) {
      throw new UnauthorizedException('Credenciales incorrectas')
    }

    const passwordValido = await bcrypt.compare(password, usuario.password)
    if (!passwordValido) {
      throw new UnauthorizedException('Credenciales incorrectas')
    }

    const payload = {
      sub: usuario.id,
      email: usuario.email,
      rol: usuario.rol,
      nombre: usuario.nombre,
    }

    return {
      access_token: this.jwtService.sign(payload),
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
      },
    }
  }

  async forgotPassword(email: string) {
    const usuario = await this.prisma.usuario.findUnique({ where: { email } })
    // Respuesta genérica para no revelar si el email existe
    if (!usuario || !usuario.activo) return { message: 'Si el correo existe recibirás un enlace' }

    const token = crypto.randomBytes(32).toString('hex')
    const expiry = new Date(Date.now() + 30 * 60 * 1000) // 30 minutos

    await this.prisma.usuario.update({
      where: { id: usuario.id },
      data: { resetToken: token, resetTokenExpiry: expiry },
    })

    try {
      await this.mailService.sendPasswordReset(usuario.email, usuario.nombre, token)
    } catch (err) {
      console.error('Error enviando email de recuperación:', err)
      throw new BadRequestException('No se pudo enviar el correo. Verifica la configuración de email.')
    }
    return { message: 'Si el correo existe recibirás un enlace' }
  }

  async resetPassword(token: string, newPassword: string) {
    const usuario = await this.prisma.usuario.findFirst({
      where: { resetToken: token },
    })

    if (!usuario || !usuario.resetTokenExpiry || usuario.resetTokenExpiry < new Date()) {
      throw new BadRequestException('El enlace no es válido o ha expirado')
    }

    const hashed = await bcrypt.hash(newPassword, 10)
    await this.prisma.usuario.update({
      where: { id: usuario.id },
      data: { password: hashed, resetToken: null, resetTokenExpiry: null },
    })

    return { message: 'Contraseña actualizada correctamente' }
  }

  async perfil(userId: number) {
    return this.prisma.usuario.findUnique({
      where: { id: userId },
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        activo: true,
        creadoEn: true,
      },
    })
  }
}
