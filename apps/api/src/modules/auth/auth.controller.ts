import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req } from '@nestjs/common'
import { AuthService } from './auth.service'
import { LoginDto } from './dto/login.dto'
import { RegisterDto } from './dto/register.dto'
import { RefreshTokenDto } from './dto/refresh-token.dto'
import { ForgotPasswordDto } from './dto/forgot-password.dto'
import { Public } from '../../common/decorators/permissions.decorator'
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator'

interface NestRequest {
  ip: string
  headers: Record<string, string | string[] | undefined>
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  register(@Body() dto: RegisterDto, @Req() req: NestRequest) {
    return this.authService.register(dto, req.ip, req.headers['user-agent'] as string | undefined)
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto, @Req() req: NestRequest) {
    return this.authService.login(dto, req.ip, req.headers['user-agent'] as string | undefined)
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Body() dto: RefreshTokenDto, @Req() req: NestRequest) {
    return this.authService.refreshTokens(dto.refreshToken, req.ip)
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  logout(@CurrentUser() user: JwtPayload, @Body() dto: RefreshTokenDto) {
    return this.authService.logout(user.sub, dto.refreshToken)
  }

  @Get('me')
  me(@CurrentUser() user: JwtPayload) {
    return this.authService.getProfile(user.sub)
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return {
      message:
        'Se este e-mail estiver cadastrado, você receberá as instruções para redefinir sua senha.',
    }
  }
}
