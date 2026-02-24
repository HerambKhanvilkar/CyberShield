function getRevokeUpdateEmail(reasonType, badgeName = '', additionalInfo = '', profileLink = null) {
  const defaultProfileLink = profileLink || `${process.env.FRONTEND || 'http://localhost:3000'}/`;
  let title = 'Profile Update';
  let intro = 'Your profile has been updated.';

  if (reasonType === 'badge_stripped') {
    title = 'Badge Revoked';
    intro = `We wanted to let you know that the badge ${badgeName ? `<strong>${badgeName}</strong>` : ''} has been removed from your profile.`;
  } else if (reasonType === 'badge_updated') {
    title = 'Badge Updated';
    intro = `A badge on your profile has been updated: ${badgeName ? `<strong>${badgeName}</strong>` : ''}`;
  } else if (reasonType === 'profile_update') {
    title = 'Profile Updated';
    intro = 'An administrator has updated your profile information.';
  }

  const additionalHtml = additionalInfo ? `<div style="margin-top:10px;color:#d0d0d0;">${additionalInfo}</div>` : '';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    @media only screen and (max-width: 620px) { .container{width:95% !important;padding:10px !important;} }
    .glass{background:rgba(10,10,30,0.6);border-radius:10px;padding:16px;color:#d0d0d0}
  </style>
</head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background-color:#001133;color:#ffffff;">
  <div style="padding:20px;text-align:center;">
    <div style="max-width:700px;margin:0 auto;">
      <div style="text-align:center;padding-bottom:12px;"><img src="https://static.wixstatic.com/media/e48a18_c949f6282e6a4c8e9568f40916a0c704~mv2.png" alt="DeepCytes" width="100" style="display:block;margin:0 auto;"/></div>
      <div class="glass">
        <h1 style="font-size:20px;margin:6px 0;">${title}</h1>
        <p style="color:#b0b0b0;margin-top:6px;">${intro}</p>
        ${additionalHtml}
        <div style="margin-top:18px;text-align:center;">
          <a href="https://profile.deepcytes.io/" style="background:#ffffff;color:#000;padding:10px 14px;border-radius:6px;text-decoration:none;font-weight:bold;">Visit Website</a>
        </div>
        <p style="font-size:13px;color:#aaaaaa;margin-top:16px;">If you believe this was done in error, contact <a href="mailto:info@deepcytes.io" style="color:#ffffff;">info@deepcytes.io</a>.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

module.exports = { getRevokeUpdateEmail };
