import { DynamoDB } from 'aws-sdk'
import Config from './config'
import { batchWrite } from './query/batch-write'
import { Table } from './table'

export class BatchWrite {
  private dynamo: DynamoDB
  private readonly list: DynamoDB.BatchWriteItemRequestMap[] = []

  /**
   * Perform a BatchWrite operation.
   *
   * @see {@link https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_BatchWriteItem.html}
   *
   * A Batch operation puts or deletes multiple items in one or more tables.
   *
   * The individual `PutItem` and `DeleteItem` operations specified in batch operation are atomic,
   * however, the whole batch operation is not atomic. This means that some puts and deletes can
   * be successful and others can fail.
   *
   * To perform an atomic operation, use `Dyngoose.Transaction`.
   *
   * @param {DynamoDB} connection You can optionally specify the DynamoDB connection to utilize.
   * @see {@link https://github.com/benhutchins/dyngoose/blob/master/docs/Connections.md}.
   */
  constructor(connection?: DynamoDB) {
    this.dynamo = connection == null ? Config.defaultConnection.client : connection
  }

  public setConnection(dynamo: DynamoDB): this {
    this.dynamo = dynamo
    return this
  }

  public put<T extends Table>(...records: T[]): this {
    for (const record of records) {
      const tableClass = record.constructor as typeof Table
      const requestMap: DynamoDB.BatchWriteItemRequestMap = {
        [tableClass.schema.name]: [
          {
            PutRequest: {
              Item: record.toDynamo(),
            },
          },
        ],
      }

      this.list.push(requestMap)
    }

    return this
  }

  public delete<T extends Table>(...records: T[]): this {
    for (const record of records) {
      const tableClass = record.constructor as typeof Table
      const requestMap: DynamoDB.BatchWriteItemRequestMap = {
        [tableClass.schema.name]: [
          {
            DeleteRequest: {
              Key: record.getDynamoKey(),
            },
          },
        ],
      }

      this.list.push(requestMap)
    }

    return this
  }

  public async commit(): Promise<DynamoDB.BatchWriteItemOutput> {
    return await batchWrite(this.dynamo, this.list)
  }
}
