<?php
// backend/helpers/mailer.php

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require_once __DIR__ . '/../vendor/autoload.php';

/**
 * Configure a PHPMailer instance with shared SMTP settings.
 */
function createMailer(): PHPMailer {
    $config = require __DIR__ . '/../config.php';
    $smtp   = $config['smtp'];

    $mail = new PHPMailer(true);

    $mail->isSMTP();
    $mail->Host       = $smtp['host'];
    $mail->SMTPAuth   = true;
    $mail->Username   = $smtp['username'];
    $mail->Password   = $smtp['password'];
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
    $mail->Port       = $smtp['port'];
    $mail->CharSet    = 'UTF-8';
    $mail->Encoding   = 'base64';
    $mail->XMailer    = 'PixelForge Mailer';

    $mail->setFrom($smtp['from'], $smtp['fromName']);

    // Proper multipart: text/plain + text/html
    $mail->isHTML(true);

    return $mail;
}

function sendPasswordResetEmail(string $toEmail, string $toName, string $resetUrl): bool {
    $mail = createMailer();
    $mail->addAddress($toEmail, $toName);

    $safeUrl = htmlspecialchars($resetUrl, ENT_QUOTES, 'UTF-8');

    $mail->Subject = 'Reset your PixelForge password';
    $mail->Body    = '<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Reset your PixelForge password</title></head>
<body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background-color: #0f0f14; color: #e5e5e5;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #0f0f14; padding: 40px 20px;">
    <tr><td align="center">
      <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width: 480px; background-color: #1a1a2e; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 40px;">
        <tr><td style="text-align: center; padding-bottom: 32px;">
          <span style="font-size: 18px; font-weight: 600; color: #ffffff;">PixelForge</span>
        </td></tr>
        <tr><td>
          <h1 style="font-size: 22px; font-weight: 700; color: #ffffff; margin: 0 0 12px;">Reset your password</h1>
          <p style="color: #999999; font-size: 15px; line-height: 1.6; margin: 0 0 8px;">
            Hello ' . htmlspecialchars($toName, ENT_QUOTES, 'UTF-8') . ',
          </p>
          <p style="color: #999999; font-size: 15px; line-height: 1.6; margin: 0 0 28px;">
            We received a request to reset the password for your PixelForge account. Click the button below to choose a new password. This link is valid for <strong style="color: #ffffff;">1 hour</strong> and can only be used once.
          </p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
            <tr><td align="center">
              <a href="' . $safeUrl . '" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%); color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px;">Reset Password</a>
            </td></tr>
          </table>
          <p style="color: #666666; font-size: 13px; line-height: 1.6; margin: 0 0 8px;">
            If the button above does not work, copy and paste this URL into your browser:
          </p>
          <p style="color: #5b9cf5; font-size: 13px; line-height: 1.5; margin: 0 0 24px; word-break: break-all;">
            ' . $safeUrl . '
          </p>
          <p style="color: #555555; font-size: 13px; line-height: 1.5; margin: 0;">
            If you did not request a password reset, no action is needed. Your password will remain unchanged and your account is secure.
          </p>
          <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.07); margin: 28px 0;">
          <p style="color: #444444; font-size: 12px; text-align: center; margin: 0;">
            This is an automated message from PixelForge (pixelforge.pro). Please do not reply to this email.
          </p>
          <p style="color: #444444; font-size: 12px; text-align: center; margin: 8px 0 0;">
            &copy; 2025 PixelForge. All rights reserved.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>';

    $mail->AltBody = "Reset your PixelForge password\n"
        . "================================\n\n"
        . "Hello {$toName},\n\n"
        . "We received a request to reset the password for your PixelForge account.\n"
        . "Click the link below to choose a new password. This link is valid for 1 hour and can only be used once.\n\n"
        . "Reset your password:\n{$resetUrl}\n\n"
        . "If you did not request a password reset, no action is needed.\n"
        . "Your password will remain unchanged and your account is secure.\n\n"
        . "---\n"
        . "This is an automated message from PixelForge (pixelforge.pro). Please do not reply to this email.\n"
        . "© 2025 PixelForge. All rights reserved.\n";

    return $mail->send();
}

function sendVerificationEmail(string $toEmail, string $verifyUrl): bool {
    $mail = createMailer();
    $mail->addAddress($toEmail);

    $safeUrl = htmlspecialchars($verifyUrl, ENT_QUOTES, 'UTF-8');

    $mail->Subject = 'Verify your PixelForge account';
    $mail->Body    = '<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Verify your PixelForge account</title></head>
<body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background-color: #0f0f14; color: #e5e5e5;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #0f0f14; padding: 40px 20px;">
    <tr><td align="center">
      <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width: 480px; background-color: #1a1a2e; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 40px;">
        <tr><td style="text-align: center; padding-bottom: 32px;">
          <span style="font-size: 18px; font-weight: 600; color: #ffffff;">PixelForge</span>
        </td></tr>
        <tr><td>
          <h1 style="font-size: 22px; font-weight: 700; color: #ffffff; margin: 0 0 12px;">Verify your email</h1>
          <p style="color: #999999; font-size: 15px; line-height: 1.6; margin: 0 0 8px;">
            Welcome to PixelForge!
          </p>
          <p style="color: #999999; font-size: 15px; line-height: 1.6; margin: 0 0 28px;">
            Thanks for signing up. To complete your registration and start using your account, please verify your email address by clicking the button below.
          </p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
            <tr><td align="center">
              <a href="' . $safeUrl . '" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%); color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px;">Verify Email</a>
            </td></tr>
          </table>
          <p style="color: #666666; font-size: 13px; line-height: 1.6; margin: 0 0 8px;">
            If the button above does not work, copy and paste this URL into your browser:
          </p>
          <p style="color: #5b9cf5; font-size: 13px; line-height: 1.5; margin: 0 0 24px; word-break: break-all;">
            ' . $safeUrl . '
          </p>
          <p style="color: #555555; font-size: 13px; line-height: 1.5; margin: 0;">
            If you did not create a PixelForge account, you can safely ignore this email. No account will be activated.
          </p>
          <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.07); margin: 28px 0;">
          <p style="color: #444444; font-size: 12px; text-align: center; margin: 0;">
            This is an automated message from PixelForge (pixelforge.pro). Please do not reply to this email.
          </p>
          <p style="color: #444444; font-size: 12px; text-align: center; margin: 8px 0 0;">
            &copy; 2025 PixelForge. All rights reserved.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>';

    $mail->AltBody = "Verify your PixelForge account\n"
        . "================================\n\n"
        . "Welcome to PixelForge!\n\n"
        . "Thanks for signing up. To complete your registration and start using your account,\n"
        . "please verify your email address by visiting the link below.\n\n"
        . "Verify your email:\n{$verifyUrl}\n\n"
        . "If you did not create a PixelForge account, you can safely ignore this email.\n"
        . "No account will be activated.\n\n"
        . "---\n"
        . "This is an automated message from PixelForge (pixelforge.pro). Please do not reply to this email.\n"
        . "© 2025 PixelForge. All rights reserved.\n";

    return $mail->send();
}
