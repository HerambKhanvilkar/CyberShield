function getAdminDailyEmail(adminName, date, logs = []) {
  const rows = logs.map(log => `
      <tr>
        <td style="padding:8px;border-bottom:1px solid rgba(255,255,255,0.06);">${log.time || ''}</td>
        <td style="padding:8px;border-bottom:1px solid rgba(255,255,255,0.06);">${log.action || ''}</td>
        <td style="padding:8px;border-bottom:1px solid rgba(255,255,255,0.06);">${log.target || ''}</td>
        <td style="padding:8px;border-bottom:1px solid rgba(255,255,255,0.06);">${log.status || ''}</td>
      </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <style>
    @media only screen and (max-width: 620px) {
      .container { width: 95% !important; padding: 10px !important; }
      h1 { font-size: 20px !important; }
      p, a { font-size: 14px !important; }
      img.logo { width: 80px !important; height: auto !important; }
    }
    .glass { background: rgba(10,10,30,0.6); border-radius:10px; padding:16px; color:#d0d0d0; }
    table { width:100%; border-collapse:collapse; }
    th { text-align:left; padding:8px; border-bottom:1px solid rgba(255,255,255,0.08); }
  </style>
</head>
<body style="margin:0;padding:0;font-family:Arial, sans-serif;background-color:#001133;color:#ffffff;">
  <div style="padding:20px;text-align:center;">
    <div style="max-width:700px;margin:0 auto;">
      <div style="text-align:center;padding-bottom:12px;">
        <img class="logo" src="https://static.wixstatic.com/media/e48a18_c949f6282e6a4c8e9568f40916a0c704~mv2.png" alt="DeepCytes" width="100" style="display:block;margin:0 auto;">
      </div>
      <div class="glass">
        <h1 style="font-family:'Playfair Display', serif;font-size:20px;margin:6px 0;">Admin Daily Summary — ${date}</h1>
        <p style="color:#b0b0b0;margin-top:6px;">Hello ${adminName || 'Admin'}, here is the summary of actions performed today.</p>
        <div style="margin-top:12px;">
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>Action</th>
                <th>Target</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
        </div>
        <p style="font-size:13px;color:#aaaaaa;margin-top:12px;">This report is automated. For questions, contact <a href="mailto:info@deepcytes.io" style="color:#ffffff;">info@deepcytes.io</a>.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

module.exports = { getAdminDailyEmail };
