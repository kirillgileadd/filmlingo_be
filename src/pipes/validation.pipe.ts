import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';
@Injectable()
export class ValidationPipe implements PipeTransform<any> {
  async transform(value: any, metadata: ArgumentMetadata): Promise<any> {
    if (!metadata.metatype || !this.toValidate(metadata.metatype)) {
      return value; // Если это простой тип, просто возвращаем значение
    }

    const obj = plainToClass(metadata.metatype, value);
    const errors = await validate(obj);

    if (errors.length) {
      const errorMessages = this.formatErrors(errors);
      throw new BadRequestException({
        message: 'Validation failed',
        errors: errorMessages,
      });
    }

    return value;
  }

  private formatErrors(errors: ValidationError[]): Record<string, string[]> {
    return errors.reduce((formattedErrors, error) => {
      const property = error.property;
      const constraints = error.constraints;

      if (property && constraints) {
        formattedErrors[property] = Object.values(constraints);
      } else if (error.children && error.children.length) {
        const nestedErrors = this.formatErrors(error.children);
        Object.assign(formattedErrors, nestedErrors);
      }

      return formattedErrors;
    }, {});
  }

  // eslint-disable-next-line @typescript-eslint/ban-types
  private toValidate(metatype: Function): boolean {
    // eslint-disable-next-line @typescript-eslint/ban-types
    const types: Function[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }
}
