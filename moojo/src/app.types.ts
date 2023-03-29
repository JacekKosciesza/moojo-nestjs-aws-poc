import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ required: false })
  name: string;

  @ApiProperty()
  email: string;
}

export class CreatePostDto {
  @ApiProperty()
  title: string;

  @ApiProperty({ required: false })
  content?: string;

  @ApiProperty()
  authorEmail: string;
}
