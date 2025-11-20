function getResetPasswordEmail(otpCode) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <style>
    @media only screen and (max-width: 620px) { .container{width:95% !important;padding:10px !important;} h1{font-size:20px;} p{font-size:14px;} }
    .glass{background:rgba(10,10,30,0.6);border-radius:10px;padding:18px;color:#d0d0d0}
    .otp{font-size:24px;font-weight:bold;letter-spacing:4px;text-align:center;color:#ffffff;background:rgba(255,255,255,0.06);padding:12px;border-radius:8px;display:inline-block}
  </style>
</head>
<body style="margin:0;padding:0;font-family:Arial, sans-serif;background-color:#001133;color:#ffffff;">
  <div style="padding:20px;text-align:center;">
    <div style="max-width:700px;margin:0 auto;">
      <div style="text-align:center;padding-bottom:12px;"><img src="https://static.wixstatic.com/media/e48a18_c949f6282e6a4c8e9568f40916a0c704~mv2.png" alt="DeepCytes" width="100" style="display:block;margin:0 auto;"/></div>
      <div class="glass">
        <h1 style="font-size:20px;margin:6px 0;">Reset Your Password</h1>
        <p style="color:#b0b0b0;margin-top:6px;">We received a request to reset your password. Use the code below to continue.</p>
        <div style="margin:18px 0;text-align:center;"><span class="otp">${otpCode}</span></div>
        <p style="color:#aaaaaa;margin-top:8px;font-size:13px;">This code expires in 10 minutes. If you didn’t request a password reset, please ignore this email or contact support.</p>
        <p style="font-size:13px;color:#aaaaaa;margin-top:16px;">Need help? Contact <a href="mailto:support@deepcytes.com" style="color:#ffffff;">support@deepcytes.com</a>.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

module.exports = { getResetPasswordEmail };
