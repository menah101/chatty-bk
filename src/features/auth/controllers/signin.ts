import { Request, Response } from 'express';
import { config } from '@root/config';
import JWT from 'jsonwebtoken';
import HTTP_STATUS from 'http-status-codes';
import { joiValidation } from '@global/decorators/joi-validate.decorators';
import { IAuthDocument } from '../interfaces/auth.interface';
import { loginSchema } from '../schemes/signin';
import { BadRequestError } from '@global/helpers/error-handle';
import { IResetPasswordParams, IUserDocument } from '@root/features/user/interfaces/user.interface';
import { authService } from '@root/shared/services/db/auth.service';
import { userService } from '@root/shared/services/db/user.service';
import { forgotPasswordTemplate } from '@root/shared/services/emails/templates/forgot-password/forgot-password-template';
import { emailQueue } from '@root/shared/services/queues/email.queue';
// import { mailTransport } from '@root/shared/services/mails/mail.transport';
import moment from 'moment';
import publicIP from 'ip';
import { resetPasswordTemplate } from '@root/shared/services/emails/templates/reset-password/reset-password-template';

export class SignIn {
  @joiValidation(loginSchema)
  public async read(req: Request, res: Response): Promise<void> {
    const { username, password } = req.body;
    const existingUser: IAuthDocument = await authService.getAuthUserByUsername(
      username
    );
    if (!existingUser) {
      throw new BadRequestError('Invalid credentials');
    }

    const passwordsMatch: boolean = await existingUser.comparePassword(
      password
    );
    if (!passwordsMatch) {
      throw new BadRequestError('Invalid credentials');
    }
    const user: IUserDocument = await userService.getUserByAuthId(
      `${existingUser._id}`
    );
    const userJwt: string = JWT.sign(
      {
        userId: user._id,
        uId: existingUser.uId,
        email: existingUser.email,
        username: existingUser.username,
        avatarColor: existingUser.avatarColor,
      },
      config.JWT_TOKEN!
    );
    req.session = { jwt: userJwt };
    const userDocument: IUserDocument = {
      ...user,
      authId: existingUser!._id,
      username: existingUser!.username,
      email: existingUser!.email,
      avatarColor: existingUser!.avatarColor,
      uId: existingUser!.uId,
      createdAt: existingUser!.createdAt,
    } as IUserDocument;
    // Test send mail
    // await mailTransport.sendMail(
    //   'dina.connelly90@ethereal.email',
    //   'Test send mail development',
    //   'this is test mail'
    // );
    // End test send mail

    // Test Reset Password
    const templateParams: IResetPasswordParams = {
      username: existingUser.username!,
      email: existingUser.email!,
      ipaddress: publicIP.address(),
      date: moment().format('DD/MM/YYYY HH:mm')
    };

    // const resetLint = `${config.CLIENT_URL}/reset-password?token=12213123123123123`;
    const template: string = resetPasswordTemplate.passwordResetConfirmationTemplate(templateParams);
    emailQueue.addEMailJob('forgotPasswordEmail', {template, receiverEmail: 'dina.connelly90@ethereal.email', subject: 'Pass reset config'});
    // End test reset password
    res.status(HTTP_STATUS.OK).json({
      message: 'User login successfully',
      user: userDocument,
      token: userJwt,
    });
  }
}
