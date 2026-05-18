import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { PrismaModule } from './prisma/prisma.module'
import { AuthModule } from './auth/auth.module'
import { UsuariosModule } from './usuarios/usuarios.module'
import { ProductosModule } from './productos/productos.module'
import { CategoriasModule } from './categorias/categorias.module'
import { ClientesModule } from './clientes/clientes.module'
import { ProveedoresModule } from './proveedores/proveedores.module'
import { VentasModule } from './ventas/ventas.module'
import { ComprasModule } from './compras/compras.module'
import { ReportesModule } from './reportes/reportes.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsuariosModule,
    ProductosModule,
    CategoriasModule,
    ClientesModule,
    ProveedoresModule,
    VentasModule,
    ComprasModule,
    ReportesModule,
  ],
})
export class AppModule {}
