import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  NotFoundException,
  BadRequestException,
  UsePipes,
  ValidationPipe,
  ParseUUIDPipe,
} from '@nestjs/common';

import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { TransactionFilterDto } from './dto/transaction-filter.dto';
import { Transaction } from './entities/transaction.entity';

@Controller('transactions')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  async create(
    @Body() createTransactionDto: CreateTransactionDto,
  ): Promise<Transaction> {
    try {
      return await this.transactionsService.create(createTransactionDto);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        error.message || 'Failed to create transaction',
      );
    }
  }

  @Get()
  async findAll(
    @Query() filters?: TransactionFilterDto,
  ): Promise<Transaction[]> {
    return this.transactionsService.findAll(filters);
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Transaction> {
    try {
      return await this.transactionsService.findOne(id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new NotFoundException(`Transaction with ID "${id}" not found`);
    }
  }
}
