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
      h1, h2 {
        font-size: 20px !important;
      }
      p, a, td {
        font-size: 14px !important;
      }
      img.logo {
        width: 80px !important;
        height: auto !important;
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

    .log-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
    }

    .log-table th, .log-table td {
      padding: 8px 12px;
      text-align: left;
      border-bottom: 1px solid rgba(255,255,255,0.1);
    }

    .log-table th {
      background-color: rgba(255, 255, 255, 0.05);
      font-weight: bold;
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
    <div class="container glass" style="max-width: 700px; width: 100%; margin: 0 auto; padding: 20px; box-sizing: border-box;">

      <!-- Logo -->
      <div style="text-align: center; padding-bottom: 10px;">
        <img class="logo" src="https://static.wixstatic.com/media/e48a18_c949f6282e6a4c8e9568f40916a0c704~mv2.png/v1/crop/x_0,y_151,w_1920,h_746/fill/w_310,h_120,fp_0.50_0.50,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/For%20Dark%20Theme.png" alt="DeepCytes Logo" width="100" style="display: block; margin: 0 auto;">
      </div>

      <!-- Header -->
      <h1 style="font-family: 'Playfair Display', serif; font-size: 24px; margin: 10px 0;">🛡️ Admin Daily Action Report</h1>
      <p style="color: #b0b0b0; margin-bottom: 20px;">Summary of actions performed by <strong>${adminName}</strong> on <strong>${date}</strong>.</p>

      <!-- Action Table -->
      <div class="glass" style="padding: 15px; box-sizing: border-box;">
        <table class="log-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Action</th>
              <th>Target</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${logs.map(log => `
              <tr>
                <td>${log.time}</td>
                <td>${log.action}</td>
                <td>${log.target}</td>
                <td>${log.status}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- Footer -->
      <p style="font-size: 13px; color: #aaaaaa; margin-top: 30px;">
        This report is automatically generated. For security reasons, all logs are recorded and monitored.
        <br/>Need help? Contact <a href="mailto:support@deepcytes.com" style="color: #ffffff;">support@deepcytes.com</a>.
      </p>

    </div>
  </div>
</body>
</html>
  `;
}

module.exports = { getActionEmail };
