import { DynamoDB } from 'aws-sdk'
import { trim } from 'lodash'
import { DynamoAttributeType } from '../../dynamo-attribute-types'
import { ValidationError } from '../../errors'
import { IAttributeType } from '../../interfaces/attribute-type.interface'
import { StringAttributeMetadata } from '../../metadata/attribute-types/string.metadata'
import { AttributeType } from '../../tables/attribute-type'

type Value = DynamoDB.StringAttributeValue
type Metadata = StringAttributeMetadata

export class StringAttributeType extends AttributeType<Value, Metadata> implements IAttributeType<Value> {
  type = DynamoAttributeType.String

  toDynamo(value: Value) {
    if (typeof value !== 'string') {
      throw new ValidationError(`Expected ${this.propertyName} to be a string, but was given a ${typeof value}`)
    }

    if (this.metadata.trim) {
      value = trim(value)

      if (value === '') {
        return {
          NULL: true,
        }
      }
    }

    if (this.metadata.uppercase) {
      value = value.toUpperCase()
    } else if (this.metadata.lowercase) {
      value = value.toLowerCase()
    }

    return {
      S: value,
    }
  }
}
