import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common'
import { ProductsService } from './products.service'
import { CreateProductDto } from './dto/create-product.dto'
import { UpdateProductDto } from './dto/update-product.dto'
import { CreateCategoryDto } from './dto/create-category.dto'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { CurrentOrg } from '../../common/decorators/current-org.decorator'
import { RequirePermissions } from '../../common/decorators/permissions.decorator'
import { Public } from '../../common/decorators/permissions.decorator'

@Controller('admin/products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // ─── Categories ────────────────────────────────────────────────────────────

  @Get('categories')
  @RequirePermissions('products:read')
  findAllCategories(@CurrentOrg() orgId: string) {
    return this.productsService.findAllCategories(orgId)
  }

  @Post('categories')
  @RequirePermissions('products:create')
  createCategory(@CurrentOrg() orgId: string, @CurrentUser() user: any, @Body() dto: CreateCategoryDto) {
    return this.productsService.createCategory(orgId, user.sub, dto)
  }

  @Patch('categories/:id')
  @RequirePermissions('products:update')
  updateCategory(@CurrentOrg() orgId: string, @CurrentUser() user: any, @Param('id') id: string, @Body() dto: Partial<CreateCategoryDto>) {
    return this.productsService.updateCategory(orgId, user.sub, id, dto)
  }

  @Delete('categories/:id')
  @RequirePermissions('products:delete')
  removeCategory(@CurrentOrg() orgId: string, @CurrentUser() user: any, @Param('id') id: string) {
    return this.productsService.removeCategory(orgId, user.sub, id)
  }

  // ─── Products ──────────────────────────────────────────────────────────────

  @Get()
  @RequirePermissions('products:read')
  findAll(@CurrentOrg() orgId: string, @Query() query: any) {
    return this.productsService.findAll(orgId, query)
  }

  @Get(':id')
  @RequirePermissions('products:read')
  findOne(@CurrentOrg() orgId: string, @Param('id') id: string) {
    return this.productsService.findOne(orgId, id)
  }

  @Post()
  @RequirePermissions('products:create')
  create(@CurrentOrg() orgId: string, @CurrentUser() user: any, @Body() dto: CreateProductDto) {
    return this.productsService.create(orgId, user.sub, dto)
  }

  @Patch(':id')
  @RequirePermissions('products:update')
  update(@CurrentOrg() orgId: string, @CurrentUser() user: any, @Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(orgId, user.sub, id, dto)
  }

  @Delete(':id')
  @RequirePermissions('products:delete')
  remove(@CurrentOrg() orgId: string, @CurrentUser() user: any, @Param('id') id: string) {
    return this.productsService.remove(orgId, user.sub, id)
  }
}

// Rota pública para a loja
@Controller('public/store')
export class StoreController {
  constructor(private readonly productsService: ProductsService) {}

  @Get('products')
  @Public()
  findPublicProducts(@Query('orgSlug') orgSlug: string, @Query() query: any) {
    // Produtos ativos e visíveis publicamente
    return this.productsService.findAll(orgSlug, { ...query, status: 'ACTIVE' })
  }
}
