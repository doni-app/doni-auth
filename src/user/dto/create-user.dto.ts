export class CreateUserDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  address?: string;
}
