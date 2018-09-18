import QRCode from './core';

function validateColor(c) {
  const regexpA = /^#[0-9a-fA-F]{6}$/;
  const regexpB = /^#[0-9a-fA-F]{3}$/;
  return regexpA.test(c) || regexpB.test(c);
}

function isCanvasSupported() {
  var el = document.createElement('canvas');
  return !!(el.getContext && el.getContext('2d'));
}

function clacImgZoomParam(maxWidth, maxHeight, width, height) {
  var result = {
    top: 0,
    left: 0,
    width: width,
    height: height
  };

  if (width > maxWidth || height > maxHeight) {
    let rateWidth = width / maxWidth;
    let rateHeight = height / maxHeight;
    if (rateWidth > rateHeight) {
      result.width = maxWidth;
      result.height = Math.round(height / rateWidth);
    } else {
      result.width = Math.round(width / rateHeight);
      result.height = maxHeight;
    }
  }

  result.left = Math.round((maxWidth - result.width) / 2);
  result.top = Math.round((maxHeight - result.height) / 2);

  return result;
}

const QRErrorCorrectLevel = {
  L: 1,
  M: 0,
  Q: 3,
  H: 2
};

class IQrcode {
  constructor(props) {
    /**
     * IQrcode() create a QRCode generator class
     * QRCode create Param
     *
     * @param {Canvas Element} el 节点
     * @param {string} text 编码文本
     * @param {number} width 编码宽度
     * @param {number} height 编码高度
     * @param {number} size 二维码尺寸
     * @param {number} correctLevel 容错率['L' 'M' 'Q' 'H']
     * @param {string} foreground 前景色
     * @param {string} background 背景色
     * @param {string} jbcol 渐变色
     * @param {string} jbtype 渐变方式['r'圆形, 'h'垂直, 'w'水平, 'x'斜线, 'rx'反斜线]
     * @param {string} dr 直角圆角[-1液态, 0直角, 1圆角]
     * @param {string} dan_w 大正方形颜色
     * @param {string} dan_l 小正方形颜色
     * @param {string} logo 图片base64数据
     */
    const defaultParam = {
      el: null,
      text: '',
      width: 200,
      height: 200,
      typeNumber: -1,
      correctLevel: 'H',
      background: '#fff',
      foreground: '#222',
      jbcol: '#222',
      jbtype: '',
      dr: 0,
      padding: 0
    };
    let param = defaultParam;

    for (let key in props) {
      if ({}.hasOwnProperty.call(props, key)) {
        param[key] = props[key];
      }
    }

    // Init Size
    if (props.size) {
      param.width = props.size;
      param.height = props.size;
    }

    this.param = param;
    const userAgent = window.navigator.userAgent;
    this.isOpera = userAgent.indexOf('Opera') >= 0;
  }

  init() {
    if (!isCanvasSupported()) {
      alert('您当前的浏览器不支持二维码插件！');
      return;
    }
    this.extendCanvas();
    this.createQrcode();
  }

  update(props = {}) {
    for (let key in props) {
      if ({}.hasOwnProperty.call(props, key)) {
        this.param[key] = props[key];
      }
    }

    // Init Size
    if (props.size) {
      this.param.width = props.size;
      this.param.height = props.size;
    }

    this.createQrcode();
  }

  createQrcode() {
    const param = this.param;
    let node = new QRCode(
      param.typeNumber,
      QRErrorCorrectLevel[param.correctLevel]
    );
    param.text = this.fromatText(param.text);
    node.addData(param.text);
    node.make();

    let tempEl = param.el;
    if (!tempEl) return;
    tempEl.width = param.width;
    tempEl.height = param.height;

    const canvas = tempEl.getContext('2d');

    this.renderCode(canvas, node);
  }

  renderCode(canvas, node) {
    const param = this.param;
    const gridWidth = Math.round(
      (param.width - param.padding) / node.getModuleCount()
    );
    const gridHeight = Math.round(
      (param.height - param.padding) / node.getModuleCount()
    );
    const originX = Math.round(
      (param.width - gridWidth * node.getModuleCount()) / 2
    );
    const originY = Math.round(
      (param.height - gridHeight * node.getModuleCount()) / 2
    );

    // radius
    const radius = param.dr < 0 ? 0 - param.dr : param.dr;
    let dec = Math.round(gridWidth / 2 * radius);
    if (dec > gridWidth / 2) dec = Math.round(gridWidth / 2);

    let radiusList = [dec, dec, dec, dec];

    canvas.fillStyle = validateColor(param.foreground)
      ? param.foreground
      : '#000';

    // render code
    for (let u = 0; u < node.getModuleCount(); u++) {
      for (let t = 0; t < node.getModuleCount(); t++) {
        let paddingX = (t + 1) * gridWidth - t * gridWidth;
        let paddingY = (u + 1) * gridWidth - u * gridWidth;
        let startX = originX + t * gridWidth;
        let startY = originY + u * gridHeight;

        if (node.isDark(u, t)) {
          if (param.dr < 0) {
            radiusList = this.renderDark(dec, node, t, u);
            canvas
              .roundRect(startX, startY, paddingX, paddingY, radiusList)
              .fill();
          } else {
            canvas
              .roundRect(startX, startY, paddingX, paddingY, radiusList)
              .fill();
          }
        } else {
          if (param.dr < 0) {
            radiusList = this.renderLight(dec, node, t, u);
            canvas
              .droundRectd(startX, startY, paddingX, paddingY, radiusList)
              .fill();
          }
        }
      }
    }

    // render Gradient
    if (validateColor(param.jbcol) && param.jbtype) {
      this.renderGradient(canvas);
    }

    // render big grid color
    if (validateColor(param.dan_w)) {
      canvas.globalCompositeOperation = 'source-over';
      canvas.fillStyle = param.dan_w;
      this.renderGrid(canvas, node, 3, dec, gridWidth, originX);
      if (param.dr < 0) {
        this.renderGrid(canvas, node, 2, dec, gridWidth, originX);
      }
    }

    // render small grid color
    if (validateColor(param.dan_l)) {
      canvas.globalCompositeOperation = 'source-over';
      canvas.fillStyle = param.dan_l;
      this.renderGrid(canvas, node, 1, dec, gridWidth, originX);
    }

    this.renderBackround(canvas);

    // render center logo image
    if (param.logo) {
      canvas.globalCompositeOperation = 'source-over';
      const Logo = new Image();
      Logo.onload = () => {
        const maxWidth = param.width * 0.3;
        const maxHeight = param.height * 0.3;
        const zoomParam = clacImgZoomParam(
          maxWidth,
          maxHeight,
          Logo.width,
          Logo.height
        );
        const logoX = (param.width - zoomParam.width) / 2;
        const logoY = (param.height - zoomParam.height) / 2;
        canvas.drawImage(Logo, logoX, logoY, zoomParam.width, zoomParam.height);
      };
      Logo.src = param.logo;
    }
  }

  fromatText(text) {
    let result = '';
    let charCode = null;
    let len = text.length;

    for (let i = 0; i < len; i++) {
      charCode = text.charCodeAt(i);
      if (charCode >= 1 && charCode <= 127) {
        result += text.charAt(i);
      } else {
        if (charCode > 2047) {
          result += String.fromCharCode(224 | ((charCode >> 12) & 15));
          result += String.fromCharCode(128 | ((charCode >> 6) & 63));
          result += String.fromCharCode(128 | ((charCode >> 0) & 63));
        } else {
          result += String.fromCharCode(192 | ((charCode >> 6) & 31));
          result += String.fromCharCode(128 | ((charCode >> 0) & 63));
        }
      }
    }

    return result;
  }

  extendCanvas() {
    const param = this.param;
    CanvasRenderingContext2D.prototype.roundRect = function(
      startX,
      startY,
      paddingX,
      paddingY,
      radius
    ) {
      this.beginPath();
      if (this.isOpera) {
        if (param.dr == 0) {
          this.rect(startX, startY, paddingX, paddingY);
          return this;
        }
        this.arcTo(
          startX + paddingX,
          startY + radius[0],
          startX + paddingX - radius[0],
          startY,
          radius[0]
        );
        this.arcTo(
          startX + radius[3],
          startY,
          startX,
          startY + radius[3],
          radius[3]
        );
        this.arcTo(
          startX,
          startY + paddingY - radius[2],
          startX + radius[2],
          startY + paddingY,
          radius[2]
        );
        this.arcTo(
          startX + paddingX - radius[1],
          startY + paddingY,
          startX + paddingX,
          startY + paddingY - radius[1],
          radius[1]
        );
      } else {
        this.moveTo(startX + radius[0], startY);
        this.arcTo(
          startX + paddingX,
          startY,
          startX + paddingX,
          startY + paddingY,
          radius[0]
        );
        this.arcTo(
          startX + paddingX,
          startY + paddingY,
          startX,
          startY + paddingY,
          radius[1]
        );
        this.arcTo(startX, startY + paddingY, startX, startY, radius[2]);
        this.arcTo(startX, startY, startX + paddingX, startY, radius[3]);
      }
      this.closePath();
      return this;
    };

    CanvasRenderingContext2D.prototype.droundRectd = function(
      startX,
      startY,
      paddingX,
      paddingY,
      radius
    ) {
      this.beginPath();
      if (this.isOpera) {
        this.moveTo(startX + paddingX, startY);
        this.arcTo(
          startX + paddingX,
          startY + radius[0],
          startX + paddingX - radius[0],
          startY,
          radius[0]
        );
        this.lineTo(startX + paddingX, startY);
        this.moveTo(startX, startY);
        this.arcTo(
          startX + radius[3],
          startY,
          startX,
          startY + radius[3],
          radius[3]
        );
        this.lineTo(startX, startY);
        this.moveTo(startX, startY + paddingY);
        this.arcTo(
          startX,
          startY + paddingY - radius[2],
          startX + radius[2],
          startY + paddingY,
          radius[2]
        );
        this.lineTo(startX, startY + paddingY);
        this.moveTo(startX + paddingX, startY + paddingY);
        this.arcTo(
          startX + paddingX - radius[1],
          startY + paddingY,
          startX + paddingX,
          startY + paddingY - radius[1],
          radius[1]
        );
        this.lineTo(startX + paddingX, startY + paddingY);
      } else {
        this.moveTo(startX + radius[0], startY);
        this.arcTo(
          startX + paddingX,
          startY,
          startX + paddingX,
          startY + paddingY,
          radius[0]
        );
        this.lineTo(startX + paddingX, startY);
        this.moveTo(startX + paddingX, startY + paddingY - radius[1]);
        this.arcTo(
          startX + paddingX,
          startY + paddingY,
          startX,
          startY + paddingY,
          radius[1]
        );
        this.lineTo(startX + paddingX, startY + paddingY);
        this.moveTo(startX + radius[2], startY + paddingY);
        this.arcTo(startX, startY + paddingY, startX, startY, radius[2]);
        this.lineTo(startX, startY + paddingY);
        this.moveTo(startX, startY + radius[3]);
        this.arcTo(startX, startY, startX + paddingX, startY, radius[3]);
        this.lineTo(startX, startY);
      }
      this.closePath();
      return this;
    };
  }

  renderGradient(canvas) {
    const param = this.param;
    const foreground = param.foreground;
    const jbcol = param.jbcol;
    const jbtype = param.jbtype;
    let gradient = null;
    canvas.globalCompositeOperation = 'source-in';

    switch (jbtype) {
      case 'r':
        var left = param.width / 2;
        var top = param.height / 2;
        var mid = left * 0.05;
        gradient = canvas.createRadialGradient(
          left,
          top,
          mid,
          left,
          top,
          left * 1.5
        );
        break;
      case 'h':
        gradient = canvas.createLinearGradient(0, 0, 0, param.height);
        break;
      case 'w':
        gradient = canvas.createLinearGradient(0, 0, param.width, 0);
        break;
      case 'x':
        gradient = canvas.createLinearGradient(0, 0, param.width, param.height);
        break;
      case 'rx':
        gradient = canvas.createLinearGradient(param.width, 0, 0, param.height);
        break;
    }

    gradient.addColorStop(0, foreground);
    gradient.addColorStop(1, jbcol);
    canvas.fillStyle = gradient;
    canvas.rect(0, 0, param.width, param.height);
    canvas.fill();
  }

  renderBackround(canvas) {
    const param = this.param;
    if (!validateColor(param.background)) return;
    canvas.globalCompositeOperation = 'destination-over';
    canvas.fillStyle = param.background;
    canvas.rect(0, 0, param.width, param.height);
    canvas.fill();
  }

  renderDark(target, node, coordX, coordY) {
    let origin = this.isOpera ? 0.01 : 0;
    let byArr = [target, target, target, target];

    if (
      node.MyisDark(coordY - 1, coordX) ||
      node.MyisDark(coordY - 1, coordX - 1) ||
      node.MyisDark(coordY, coordX - 1)
    ) {
      byArr[3] = origin;
    }

    if (
      node.MyisDark(coordY, coordX + 1) ||
      node.MyisDark(coordY - 1, coordX + 1) ||
      node.MyisDark(coordY - 1, coordX)
    ) {
      byArr[0] = origin;
    }

    if (
      node.MyisDark(coordY, coordX + 1) ||
      node.MyisDark(coordY + 1, coordX + 1) ||
      node.MyisDark(coordY + 1, coordX)
    ) {
      byArr[1] = origin;
    }

    if (
      node.MyisDark(coordY + 1, coordX) ||
      node.MyisDark(coordY + 1, coordX - 1) ||
      node.MyisDark(coordY, coordX - 1)
    ) {
      byArr[2] = origin;
    }

    return byArr;
  }

  renderLight(target, node, coordX, coordY) {
    let origin = this.isOpera ? 0.01 : 0;
    let byArr = [origin, origin, origin, origin];

    if (
      node.MyisDark(coordY - 1, coordX) &&
      node.MyisDark(coordY, coordX - 1)
    ) {
      byArr[3] = target;
    }

    if (
      node.MyisDark(coordY, coordX + 1) &&
      node.MyisDark(coordY - 1, coordX)
    ) {
      byArr[0] = target;
    }

    if (
      node.MyisDark(coordY, coordX + 1) &&
      node.MyisDark(coordY + 1, coordX)
    ) {
      byArr[1] = target;
    }

    if (
      node.MyisDark(coordY + 1, coordX) &&
      node.MyisDark(coordY, coordX - 1)
    ) {
      byArr[2] = target;
    }
    return byArr;
  }

  renderGrid(canvas, node, z, q, s, G) {
    const param = this.param;
    let E = [q, q, q, q];
    let A = node.getModuleCount();
    let J = [[3, 3], [3, A - 4], [A - 4, 3]];
    let arr = [];

    for (let D in J) {
      if (z == 1) {
        arr.push(J[D]);
      }
      if (z == 2) {
        arr.push([J[D][0] - z, J[D][1] - z]);
        arr.push([J[D][0] + z, J[D][1] + z]);
        arr.push([J[D][0] - z, J[D][1] + z]);
        arr.push([J[D][0] + z, J[D][1] - z]);
        continue;
      }
      for (var u = J[D][0] - z; u <= J[D][0] + z; u++) {
        arr.push([u, J[D][1] - z], [u, J[D][1] + z]);
      }
      for (var u = J[D][0] - z + 1; u <= J[D][0] + z - 1; u++) {
        arr.push([J[D][1] - z, u], [J[D][1] + z, u]);
      }
    }

    for (let xy in arr) {
      let t = arr[xy][0];
      let I = arr[xy][1];
      let F = (t + 1) * s - t * s;
      let v = (I + 1) * s - I * s;
      let D = G + t * s;
      let B = G + I * s;
      if (z == 2) {
        E = this.renderLight(q, node, t, I);
        canvas.droundRectd(D, B, F, v, E).fill();
      } else {
        if (param.dr < 0) {
          E = this.renderDark(q, node, t, I);
        }
        canvas.roundRect(D, B, F, v, E).fill();
      }
    }
  }
}

export default IQrcode;
