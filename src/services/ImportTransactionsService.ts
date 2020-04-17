import path from 'path';
import fs from 'fs';
import csvParse from 'csv-parse';

import uploadConfig from '../config/upload';
import Transaction from '../models/Transaction';
import CreateTransactionService from './CreateTransactionService';

interface Request {
  filename: string;
}

interface CSVTransactions {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class ImportTransactionsService {
  async execute({ filename }: Request): Promise<Transaction[]> {
    const filePath = path.join(uploadConfig.directory, filename);
    const createTransaction = new CreateTransactionService();

    const parsedTransactions = await new Promise<CSVTransactions[]>(
      (resolve, reject) => {
        const csvTransactions: CSVTransactions[] = [];
        fs.createReadStream(filePath)
          .pipe(csvParse({ delimiter: ',', columns: true, trim: true }))
          .on('data', async data => {
            csvTransactions.push(data);
          })
          .on('error', () => reject)
          .on('end', () => {
            resolve(csvTransactions);
            fs.promises.unlink(filePath);
          });
      },
    );
    async function importTransactions(
      toImportTransactions: Array<CSVTransactions>,
    ): Promise<Transaction[]> {
      const importedTransactions: Transaction[] = [];

      /* eslint-disable no-restricted-syntax */
      for await (const data of toImportTransactions) {
        const transaction = await createTransaction.execute({
          title: data.title,
          type: data.type,
          value: data.value,
          category: data.category,
        });
        importedTransactions.push(transaction);
      }

      return importedTransactions;
    }

    const transactions = await importTransactions(parsedTransactions);

    return transactions;
  }
}

export default ImportTransactionsService;
