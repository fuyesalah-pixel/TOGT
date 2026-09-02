import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { Role, User } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CreateFlightOrderDto } from './dto/create-flight-order.dto';
import { SearchFlightsDto } from './dto/search-flights.dto';
import { DuffelService } from './duffel.service';

@Controller('duffel')
export class DuffelController {
  constructor(private readonly duffel: DuffelService) {}

  @Post('search') @Roles(Role.CUSTOMER, Role.ADMIN, Role.WORKER) search(@Body() dto: SearchFlightsDto) {
    return this.duffel.search(dto);
  }

  @Get('offers/:offerId') @Roles(Role.CUSTOMER, Role.ADMIN, Role.WORKER) getOffer(@Param('offerId') offerId: string) {
    return this.duffel.getOffer(offerId);
  }

  @Public() @Get('seat-map') seatMap(@Query('offerId') offerId: string) {
    return this.duffel.getSeatMap(offerId);
  }

  @Public() @Get('offer-services') offerServices(@Query('offerId') offerId: string) {
    return this.duffel.getOfferServices(offerId);
  }

  @Post('orders') @Roles(Role.CUSTOMER) createOrder(@Body() dto: CreateFlightOrderDto, @CurrentUser() user: User) {
    return this.duffel.createOrder(dto, user);
  }

  @Get('orders/:id') @Roles(Role.CUSTOMER, Role.ADMIN, Role.WORKER) getOrder(@Param('id') id: string, @CurrentUser() user: User) {
    return this.duffel.getOrder(id, user);
  }

  @Post('orders/:id/pay') @Roles(Role.CUSTOMER) payOrder(@Param('id') id: string, @CurrentUser() user: User) {
    return this.duffel.payOrder(id, user);
  }

  @Post('orders/:id/confirm') @Roles(Role.CUSTOMER, Role.ADMIN) confirmOrder(@Param('id') id: string, @CurrentUser() user: User) {
    return this.duffel.confirmOrder(id, user);
  }

  @Post('orders/:id/cancel') @Roles(Role.CUSTOMER, Role.ADMIN) cancelOrder(
    @Param('id') id: string,
    @Query('confirm') confirm: string,
    @CurrentUser() user: User,
  ) {
    return this.duffel.cancel(id, user, confirm === 'true');
  }
}
