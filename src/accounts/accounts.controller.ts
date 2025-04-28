import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  NotFoundException,
  UsePipes,
  ValidationPipe,
  ParseUUIDPipe,
} from '@nestjs/common';

import { AccountsService } from './accounts.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { Account } from './entities/account.entity';
import { AccountBalanceDto } from './dto/account-balance.dto';
import { plainToClass } from 'class-transformer';

@Controller('accounts')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Post()
  async create(@Body() createAccountDto: CreateAccountDto): Promise<Account> {
    return this.accountsService.create(createAccountDto);
  }

  @Get()
  async findAll(): Promise<Account[]> {
    return this.accountsService.findAll();
  }

  @Get(':id/balance')
  async getBalance(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<AccountBalanceDto> {
    const account = await this.accountsService.findOne(id);
    const balance = await this.accountsService.getBalance(id);

    return plainToClass(AccountBalanceDto, {
      id: account.id,
      name: account.name,
      type: account.type,
      balance: balance.toString(),
    });
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Account> {
    try {
      return await this.accountsService.findOne(id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new NotFoundException(`Account with ID "${id}" not found`);
    }
  }

  

  @Put(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateAccountDto: UpdateAccountDto,
  ): Promise<Account> {
    return this.accountsService.update(id, updateAccountDto);
  }

  @Delete(':id')
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ message: string }> {
    await this.accountsService.remove(id);
    return { message: 'Account deleted successfully' };
  }
}
