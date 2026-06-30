import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common'
import { PlansService } from './plans.service'
import { CreatePlanDto } from './dto/create-plan.dto'
import { UpdatePlanDto } from './dto/update-plan.dto'
import { CreatePriceDto } from './dto/create-price.dto'
import { CreateAddonDto } from './dto/create-addon.dto'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { CurrentOrg } from '../../common/decorators/current-org.decorator'
import { RequirePermissions } from '../../common/decorators/permissions.decorator'

@Controller('admin/plans')
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @Get()
  @RequirePermissions('products:read')
  findAll(@CurrentOrg() orgId: string, @Query('productId') productId?: string) {
    return this.plansService.findAll(orgId, productId)
  }

  @Get(':id')
  @RequirePermissions('products:read')
  findOne(@CurrentOrg() orgId: string, @Param('id') id: string) {
    return this.plansService.findOne(orgId, id)
  }

  @Post()
  @RequirePermissions('products:create')
  create(@CurrentOrg() orgId: string, @CurrentUser() user: any, @Body() dto: CreatePlanDto) {
    return this.plansService.create(orgId, user.sub, dto)
  }

  @Patch(':id')
  @RequirePermissions('products:update')
  update(@CurrentOrg() orgId: string, @CurrentUser() user: any, @Param('id') id: string, @Body() dto: UpdatePlanDto) {
    return this.plansService.update(orgId, user.sub, id, dto)
  }

  @Delete(':id')
  @RequirePermissions('products:delete')
  remove(@CurrentOrg() orgId: string, @CurrentUser() user: any, @Param('id') id: string) {
    return this.plansService.remove(orgId, user.sub, id)
  }

  @Post(':id/prices')
  @RequirePermissions('products:update')
  addPrice(@CurrentOrg() orgId: string, @Param('id') planId: string, @Body() dto: CreatePriceDto) {
    return this.plansService.addPrice(orgId, planId, dto)
  }

  @Delete(':id/prices/:priceId')
  @RequirePermissions('products:update')
  removePrice(@CurrentOrg() orgId: string, @Param('id') planId: string, @Param('priceId') priceId: string) {
    return this.plansService.removePrice(orgId, planId, priceId)
  }
}

@Controller('admin/addons')
export class AddonsController {
  constructor(private readonly plansService: PlansService) {}

  @Get()
  @RequirePermissions('products:read')
  findAll(@CurrentOrg() orgId: string, @Query('planId') planId?: string) {
    return this.plansService.findAllAddons(orgId, planId)
  }

  @Post()
  @RequirePermissions('products:create')
  create(@CurrentOrg() orgId: string, @CurrentUser() user: any, @Body() dto: CreateAddonDto) {
    return this.plansService.createAddon(orgId, user.sub, dto)
  }

  @Patch(':id')
  @RequirePermissions('products:update')
  update(@CurrentOrg() orgId: string, @CurrentUser() user: any, @Param('id') id: string, @Body() dto: Partial<CreateAddonDto>) {
    return this.plansService.updateAddon(orgId, user.sub, id, dto)
  }

  @Delete(':id')
  @RequirePermissions('products:delete')
  remove(@CurrentOrg() orgId: string, @CurrentUser() user: any, @Param('id') id: string) {
    return this.plansService.removeAddon(orgId, user.sub, id)
  }
}
