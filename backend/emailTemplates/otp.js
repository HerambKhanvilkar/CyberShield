function getOTPEmail(otpCode) {
  return `
  <!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <style>
    @media only screen and (max-width: 620px) {
      .container {
        width: 95% !important;
        padding: 10px !important;
      }
      h1 {
        font-size: 20px !important;
      }
      p, a, .otp {
        font-size: 16px !important;
      }
      img.logo {
        width: 80px !important;
        height: auto !important;
      }
      .button {
        padding: 12px 16px !important;
        font-size: 16px !important;
      }
    }

    .glass {
      background: rgba(10, 10, 30, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 10px;
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.7);
      color: #d0d0d0;
    }

    .otp {
      font-size: 24px;
      font-weight: bold;
      letter-spacing: 4px;
      text-align: center;
      color: #ffffff;
      background: rgba(255, 255, 255, 0.1);
      padding: 10px 20px;
      border-radius: 8px;
      margin: 20px 0;
      display: inline-block;
    }
    .copy-btn {
      display: inline-block;
      margin-left: 10px;
      padding: 8px 16px;
      font-size: 15px;
      background: #00bcd4;
      color: #fff;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      transition: background 0.2s;
    }
    .copy-btn:active {
      background: #008c9e;
    }
    .copy-success {
      color: #00e676;
      font-size: 13px;
      margin-left: 8px;
      display: none;
    }
  </style>
</head>
<body style="
  margin:0; padding:0; font-family: Arial, sans-serif;
  background-color: #001133;
  background-image: linear-gradient(180deg, #001133 0%, #002255 50%, #000a33 100%);
  color: white;
">
  <div style="background: url('/stacked-waves-haikei.png') no-repeat center center; background-size: cover; padding: 20px; text-align: center;">
    <div class="container glass" style="max-width: 600px; width: 100%; margin: 0 auto; padding: 20px; box-sizing: border-box;">
      <!-- Logo -->
      <div style="text-align: center; padding-bottom: 10px;">
        <img class="logo" src="https://static.wixstatic.com/media/e48a18_c949f6282e6a4c8e9568f40916a0c704~mv2.png/v1/crop/x_0,y_151,w_1920,h_746/fill/w_310,h_120,fp_0.50_0.50,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/For%20Dark%20Theme.png" alt="DeepCytes Logo" width="100" style="display: block; margin: 0 auto;">
      </div>

      <!-- Header -->
      <h1 style="font-family: 'Playfair Display', serif; font-size: 22px; margin-bottom: 10px;">🔐 Email Verification</h1>
      <p style="color: #b0b0b0;">Use the OTP below to verify your email address:</p>

      <!-- OTP and Copy Button -->
      <div style="display: flex; align-items: center; justify-content: center;">
        <div class="otp" id="otp-value">${otpCode}</div>
        <button class="copy-btn" onclick="copyOTP()">Copy OTP</button>
        <span class="copy-success" id="copy-success">Copied!</span>
      </div>

      <script>
        function copyOTP() {
          var otp = document.getElementById('otp-value').innerText;
          if (navigator.clipboard) {
            navigator.clipboard.writeText(otp).then(function() {
              var success = document.getElementById('copy-success');
              success.style.display = 'inline';
              setTimeout(function() { success.style.display = 'none'; }, 1500);
            });
          } else {
            // fallback for older browsers
            var textarea = document.createElement('textarea');
            textarea.value = otp;
            document.body.appendChild(textarea);
            textarea.select();
            try {
              document.execCommand('copy');
              var success = document.getElementById('copy-success');
              success.style.display = 'inline';
              setTimeout(function() { success.style.display = 'none'; }, 1500);
            } catch (err) {}
            document.body.removeChild(textarea);
          }
        }
      </script>

      <!-- Info -->
      <p style="color: #aaaaaa; margin-top: 20px;">This OTP is valid for 10 minutes. Do not share this code with anyone.</p>

      <!-- Footer / CTA -->
      <div style="margin-top: 30px; font-size: 13px; color: #888888;">
        If you didn’t request this, you can safely ignore this email.<br/>
        Need help? <a href="mailto:support@deepcytes.com" style="color: #ffffff;">Contact Support</a>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

module.exports = { getOTPEmail };
