import Qrcode from './qrcode';

const appQrcode = new Qrcode({
	el: document.getElementById('canvas'),
	text: 'https://www.qq.com',
	correctLevel: 'H',
	size: 600,
	foreground: '#333',
	padding: 40
});

appQrcode.init();
