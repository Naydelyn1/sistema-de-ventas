import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { diskStorage } from 'multer'
import { extname, join } from 'path'
import { existsSync, mkdirSync } from 'fs'
import { ProductosService } from './productos.service'
import { CrearProductoDto } from './dto/crear-producto.dto'
import { ActualizarProductoDto } from './dto/actualizar-producto.dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/decorators/roles.decorator'
import { ApiTags, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger'

@ApiTags('Productos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('productos')
export class ProductosController {
  constructor(private readonly productosService: ProductosService) {}

  @Roles('ADMIN', 'ALMACENERO')
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = join(process.cwd(), 'uploads', 'productos')
          if (!existsSync(uploadPath)) {
            mkdirSync(uploadPath, { recursive: true })
          }
          cb(null, uploadPath)
        },
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
          const ext = extname(file.originalname).toLowerCase()
          cb(null, `prod-${uniqueSuffix}${ext}`)
        },
      }),
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|webp|gif)$/)) {
          return cb(
            new BadRequestException(
              'Solo se permiten imágenes (JPG, PNG, WEBP, GIF)',
            ),
            false,
          )
        }
        cb(null, true)
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  uploadImagen(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No se ha proporcionado ninguna imagen')
    }
    return { url: `/uploads/productos/${file.filename}` }
  }

  @Roles('ADMIN', 'ALMACENERO')
  @Post()
  crear(@Body() dto: CrearProductoDto) {
    return this.productosService.crear(dto)
  }

  @Roles('ADMIN')
  @Post('backfill-kardex')
  backfillKardex() {
    return this.productosService.backfillKardex()
  }

  @Get()
  findAll(@Query('todos') todos?: string) {
    return this.productosService.findAll(todos !== 'true')
  }

  @Get('stock-bajo')
  stockBajo() {
    return this.productosService.stockBajo()
  }

  @Get('por-vencer')
  porVencer() {
    return this.productosService.porVencer()
  }

  @Get(':id/kardex')
  kardex(
    @Param('id', ParseIntPipe) id: number,
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
  ) {
    return this.productosService.kardex(id, desde, hasta)
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productosService.findOne(id)
  }

  @Roles('ADMIN', 'ALMACENERO')
  @Patch(':id')
  actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ActualizarProductoDto,
  ) {
    return this.productosService.actualizar(id, dto)
  }

  @Roles('ADMIN', 'ALMACENERO')
  @Patch(':id/toggle')
  toggleActivo(@Param('id', ParseIntPipe) id: number) {
    return this.productosService.toggleActivo(id)
  }
}
