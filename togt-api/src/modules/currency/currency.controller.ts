import { Controller, Get } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { CurrencyService } from './currency.service';

@Controller('currency')
export class CurrencyController {
  constructor(private readonly currency: CurrencyService) {}

  @Public()
  @Get('rates')
  rates() {
    return this.currency.getRates();
  }
}
