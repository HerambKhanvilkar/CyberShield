function getPremiumTemplate({ title, message, bodyContent, footerExtra = "" }) {
    return `
  <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      <style>
        @media only screen and (max-width: 620px) {
          .container { width: 95% !important; padding: 10px !important; }
          h1 { font-size: 20px !important; }
          p, a { font-size: 16px !important; }
          img.logo { width: 80px !important; height: auto !important; }
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
        .highlight {
          color: #ffffff;
          background: rgba(255, 255, 255, 0.1);
          padding: 8px 16px;
          border-radius: 8px;
          margin: 15px 0;
          display: inline-block;
          font-family: monospace;
        }
      </style>
    </head>
    <body style="
      margin:0; padding:0; font-family: 'Segoe UI', Arial, sans-serif;
      background-color: #00040A;
      background-image: linear-gradient(180deg, #00040A 0%, #001133 100%);
      color: white;
    ">
      <div style="padding: 20px; text-align: center;">
        <div class="container glass" style="max-width: 600px; width: 100%; margin: 0 auto; padding: 40px 20px; box-sizing: border-box; text-align: center;">
          
          <!-- Logo -->
          <div style="text-align: center; padding-bottom: 20px;">
            <img class="logo" src="https://profile.deepcytes.io/STAGE%20NEO.png" alt="DeepCytes Logo" width="120" style="display: block; margin: 0 auto;">
          </div>

          <!-- Header -->
          <h1 style="font-size: 24px; margin-bottom: 20px; color: #ffffff; text-transform: uppercase; letter-spacing: 2px;">${title}</h1>
          
          <p style="color: #b0b0b0; line-height: 1.6; font-size: 16px;">${message}</p>

          <!-- Content Area -->
          <div style="margin: 30px 0;">
            ${bodyContent}
          </div>

          <!-- Footer / CTA -->
          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.05); font-size: 13px; color: #666666;">
            [SECURE_TRANSMISSION_PROTOCOL: v4.1]<br/>
            ${footerExtra}
            Need assistance? <a href="mailto:support@deepcytes.io" style="color: #06b6d0; text-decoration: none;">Contact Mission Control</a>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

module.exports = { getPremiumTemplate };
