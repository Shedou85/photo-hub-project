<?php
// backend/helpers/mailer.php

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require_once __DIR__ . '/../vendor/autoload.php';

function sendPasswordResetEmail(string $toEmail, string $toName, string $resetUrl): bool {
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

    $mail->setFrom($smtp['from'], $smtp['fromName']);
    $mail->addAddress($toEmail, $toName);

    $mail->isHTML(true);
    $mail->Subject = 'Reset your PixelForge password';
    $mail->Body    = '
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family: Arial, sans-serif; background: #0f0f14; color: #e5e5e5; padding: 40px 20px;">
  <div style="max-width: 480px; margin: 0 auto; background: #1a1a2e; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 40px;">
    <div style="text-align: center; margin-bottom: 32px;">
      <div style="display: inline-flex; align-items: center; gap: 8px;">
        <div style="width: 32px; height: 32px; border-radius: 8px; background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%); display: inline-block;"></div>
        <span style="font-size: 18px; font-weight: 600; color: #fff;">PixelForge</span>
      </div>
    </div>
    <h1 style="font-size: 22px; font-weight: 700; color: #fff; margin: 0 0 12px;">Reset your password</h1>
    <p style="color: rgba(255,255,255,0.6); font-size: 15px; line-height: 1.6; margin: 0 0 28px;">
      We received a request to reset your password. Click the button below to set a new password. This link expires in <strong style="color: #fff;">1 hour</strong>.
    </p>
    <a href="' . htmlspecialchars($resetUrl, ENT_QUOTES) . '"
       style="display: block; text-align: center; background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%); color: #fff; font-size: 15px; font-weight: 600; text-decoration: none; padding: 14px 24px; border-radius: 8px; margin-bottom: 24px;">
      Reset Password
    </a>
    <p style="color: rgba(255,255,255,0.35); font-size: 13px; line-height: 1.5; margin: 0;">
      If you did not request a password reset, you can safely ignore this email. Your password will not change.
    </p>
    <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.07); margin: 28px 0;">
    <p style="color: rgba(255,255,255,0.2); font-size: 12px; text-align: center; margin: 0;">
      &copy; 2025 PixelForge. All rights reserved.
    </p>
  </div>
</body>
</html>';
    $mail->AltBody = "Reset your PixelForge password\n\nClick the link below to reset your password (expires in 1 hour):\n\n{$resetUrl}\n\nIf you did not request this, ignore this email.";

    return $mail->send();
}

function sendVerificationEmail(string $toEmail, string $verifyUrl): bool {
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

    $mail->setFrom($smtp['from'], $smtp['fromName']);
    $mail->addAddress($toEmail);

    $mail->isHTML(true);
    $mail->Subject = 'Verify your PixelForge account';
    $mail->Body    = '
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family: Arial, sans-serif; background: #0f0f14; color: #e5e5e5; padding: 40px 20px;">
  <div style="max-width: 480px; margin: 0 auto; background: #1a1a2e; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 40px;">
    <div style="text-align: center; margin-bottom: 32px;">
      <div style="display: inline-flex; align-items: center; gap: 8px;">
        <div style="width: 32px; height: 32px; border-radius: 8px; background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%); display: inline-block;"></div>
        <span style="font-size: 18px; font-weight: 600; color: #fff;">PixelForge</span>
      </div>
    </div>
    <h1 style="font-size: 22px; font-weight: 700; color: #fff; margin: 0 0 12px;">Verify your email</h1>
    <p style="color: rgba(255,255,255,0.6); font-size: 15px; line-height: 1.6; margin: 0 0 28px;">
      Thanks for signing up! Click the button below to verify your email address and activate your account.
    </p>
    <a href="' . htmlspecialchars($verifyUrl, ENT_QUOTES) . '"
       style="display: block; text-align: center; background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%); color: #fff; font-size: 15px; font-weight: 600; text-decoration: none; padding: 14px 24px; border-radius: 8px; margin-bottom: 24px;">
      Verify Email
    </a>
    <p style="color: rgba(255,255,255,0.35); font-size: 13px; line-height: 1.5; margin: 0;">
      If you did not create an account, you can safely ignore this email.
    </p>
    <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.07); margin: 28px 0;">
    <p style="color: rgba(255,255,255,0.2); font-size: 12px; text-align: center; margin: 0;">
      &copy; 2025 PixelForge. All rights reserved.
    </p>
  </div>
</body>
</html>';
    $mail->AltBody = "Verify your PixelForge account\n\nClick the link below to verify your email:\n\n{$verifyUrl}\n\nIf you did not create an account, ignore this email.";

    return $mail->send();
}
