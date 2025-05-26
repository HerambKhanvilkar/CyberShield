function getActionEmail(data) {
  const newCves =  data || {msg: "Vendor Microsoft has been Added to Hello"};

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
      p, a {
        font-size: 14px !important;
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
      <h1 style="font-family: 'Playfair Display', serif; font-size: 22px; margin: 10px 0;">🔄 Profile Update Notification</h1>
      <p style="color: #b0b0b0; margin-bottom: 20px;">
        Your profile has recently been updated. See the details below.
      </p>

      <!-- Change Info -->
      <div class="glass" style="margin-top: 20px; padding: 15px;">
        <p style="font-size: 14px; line-height: 1.5;">
          ${reasonType === 'badge_stripped'
            ? `The <strong>${badgeName}</strong> badge has been removed from your profile.`
            : `Your profile information has been edited by an administrator.`}
        </p>
        ${additionalInfo}
      </div>

      <!-- CTA -->
      <div style="margin-top: 25px; text-align: center;">
        <a href="${profileLink}" class="button" style="background: white; color: black; padding: 12px 20px; font-size: 14px; font-weight: bold; border-radius: 6px; text-decoration: none;">
          View My Profile 🔍
        </a>
      </div>

      <!-- Footer -->
      <div style="margin-top: 30px; font-size: 13px; color: #888888;">
        This message was sent to notify you of changes to your profile or achievements.<br/>
        If you have questions, reach out to <a href="mailto:support@deepcytes.com" style="color: #ffffff;">support@deepcytes.com</a>.
      </div>

    </div>
  </div>
</body>
</html>
  `;
}

module.exports = { getActionEmail };
