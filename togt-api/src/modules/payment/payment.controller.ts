import { Body, Controller, Get, Headers, Param, Post, Query, Req } from '@nestjs/common';
import { Role, User } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { InitializePaymentDto } from './dto/initialize-payment.dto';
import { PaymentService } from './payment.service';

@Controller('payment')
export class PaymentController {
  constructor(private readonly payments: PaymentService) {}
  @Post('initialize') @Roles(Role.CUSTOMER) initialize(@Body() dto: InitializePaymentDto, @CurrentUser() user: User) { return this.payments.initialize(dto, user); }
  @Get('verify/:transactionId') verify(@Param('transactionId') id: string, @CurrentUser() user: User) { return this.payments.verify(id, user); }
  // Chapa's documented callback is a GET with trx_ref/ref_id/status as query
  // params; older integrations POSTed the same payload. Accept both.
  @Get('callback') @Public() callbackGet(@Query() query: { trx_ref?: string; tx_ref?: string; ref_id?: string; transaction_id?: string; status?: string }) { return this.payments.callback(query); }
  @Post('callback') @Public() callback(@Body() body: { trx_ref?: string; tx_ref?: string; ref_id?: string; transaction_id?: string; status?: string }) { return this.payments.callback(body); }
  @Post('cancel/:transactionId') @Roles(Role.CUSTOMER) cancel(@Param('transactionId') id: string, @CurrentUser() user: User) { return this.payments.cancel(id, user); }
  @Post('webhook') @Public() webhook(@Body() body: Record<string, unknown>, @Headers('x-chapa-signature') signature: string | undefined, @Req() request: { rawBody?: Buffer }) { return this.payments.webhook(request.rawBody?.toString() ?? JSON.stringify(body), signature, body as never); }
}

@Controller('service-requests')
export class PaymentStatusController {
  constructor(private readonly payments: PaymentService) {}
  @Get(':id/payment') status(@Param('id') id: string, @CurrentUser() user: User) { return this.payments.status(id, user); }
}
