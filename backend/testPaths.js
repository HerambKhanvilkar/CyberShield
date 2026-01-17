const fs = require('fs');
const path = require('path');

const servicesDir = 'c:\\Users\\Aryan\\Badge-Viewer\\backend\\services';
const logoPath = path.join(servicesDir, '../uploads/assets/DC_LOGO.png');

console.log('Logo Path:', logoPath);
console.log('Exists:', fs.existsSync(logoPath));

const signaturePath = path.join(servicesDir, '../uploads/assets/SP Sign DCFP.png');
console.log('Signature Path:', signaturePath);
console.log('Exists:', fs.existsSync(signaturePath));
