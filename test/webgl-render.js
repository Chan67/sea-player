function WebGLRender(canvas) {
    this._canvas = canvas;

    this._webGL = null;
    this._shaderProgram = null;
    // this._texturePosBuffer = null;
    this._yTextureRef = null;
    this._uTextureRef = null;
    this._vTextureRef = null;

    this._init();
}
WebGLRender.prototype.render = function (buffer, width, height) {
    let ylen = width * height;
    let uvlen = (width / 2) * (height / 2);

    let yData = buffer.subarray(0, ylen)
    let uData = buffer.subarray(ylen, ylen + uvlen)
    let vData = buffer.subarray(ylen + uvlen, ylen + uvlen + uvlen)

    let drawData = {
        yData: yData,
        uData: uData,
        vData: vData
    }
    this._drawWebGL(drawData, width, height);
}
WebGLRender.prototype._drawWebGL = function (data, width, height) {
    let gl = this._webGL;
    let yData = data.yData,
        uData = data.uData,
        vData = data.vData;

    let yTextureRef = this._yTextureRef,
        uTextureRef = this._uTextureRef,
        vTextureRef = this._vTextureRef;

    let drawWidth = this._canvas.width,
        drawHeight = this._canvas.height;
    let yDataPerRow = width,
        yRowCnt = height;
    let uDataPerRow = width >> 1,
        uRowCnt = height >> 1;
    let vDataPerRow = uDataPerRow,
        vRowCnt = uRowCnt;

    gl.viewport(0, 0, drawWidth, drawHeight);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, yTextureRef);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, yDataPerRow, yRowCnt, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, yData);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, uTextureRef);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, uDataPerRow, uRowCnt, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, uData);

    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, vTextureRef);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, vDataPerRow, vRowCnt, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, vData);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}

WebGLRender.prototype._init = function () {
    this._initContextGL();
}
WebGLRender.prototype._initContextGL = function () {
    let options = {
        antialias: true,
        preserveDrawingBuffer: true
    };
    this._webGL = this._canvas.getContext('webgl', options) || this._canvas.getContext('experimental-webgl', options);

    this._initGL();
}
WebGLRender.prototype._initGL = function () {
    let gl = this._webGL;
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);

    let vertexShaderScript = `
        attribute highp vec4 aPosition;
        attribute vec2 aTexturePosition;
        varying highp vec2 vTexturePosition;
        
        void main() {
            gl_Position = aPosition;
            vTexturePosition = aTexturePosition;
        }    
    `;
    let vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vertexShaderScript);
    gl.compileShader(vertexShader);
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
        throw new RuntimeException('Vertex shader failed to compile: ' + gl.getShaderInfoLog(vertexShader));
    }

    let fragmentShaderScript = `
        precision highp float;
        varying highp vec2 vTexturePosition;
        uniform sampler2D uTextureY;
        uniform sampler2D uTextureCb;
        uniform sampler2D uTextureCr;
        uniform mat4 YUV2RGB;

        void main(void) {
            highp float y = texture2D(uTextureY,  vTexturePosition).r;
            highp float u = texture2D(uTextureCb,  vTexturePosition).r;
            highp float v = texture2D(uTextureCr,  vTexturePosition).r;
            gl_FragColor = vec4(y, u, v, 1) * YUV2RGB;
        }
    `;
    let fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fragmentShaderScript);
    gl.compileShader(fragmentShader);
    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
        throw new RuntimeException('Fragment shader failed to compile: ' + gl.getShaderInfoLog(fragmentShader));
    }

    let program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new RuntimeException('Program failed to compile: ' + gl.getProgramInfoLog(program));
    }

    gl.useProgram(program);

    let YUV2RGB = [
        1.1643828125, 0, 1.59602734375, -.87078515625,
        1.1643828125, -.39176171875, -.81296875, .52959375,
        1.1643828125, 2.017234375, 0, -1.081390625,
        0, 0, 0, 1
    ]
    let YUV2RGBRef = gl.getUniformLocation(program, 'YUV2RGB');
    gl.uniformMatrix4fv(YUV2RGBRef, false, YUV2RGB);

    let positionLocation = gl.getAttribLocation(program, 'aPosition');
    gl.enableVertexAttribArray(positionLocation);

    let texturePositionLocation = gl.getAttribLocation(program, 'aTexturePosition');
    gl.enableVertexAttribArray(texturePositionLocation);

    let vertexPosBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexPosBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([1.0, 1.0, 0.0, -1.0, 1.0, 0.0, 1.0, -1.0, 0.0, -1.0, -1.0, 0.0]), gl.STATIC_DRAW);
    gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);

    let texturePosBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texturePosBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([1.0, 0.0, 0.0, 0.0, 1.0, 1.0, 0.0, 1.0]), gl.STATIC_DRAW);
    gl.vertexAttribPointer(texturePositionLocation, 2, gl.FLOAT, false, 0, 0);

    let yTextureRef = this._createTexture();
    let ySamplerRef = gl.getUniformLocation(program, 'uTextureY');
    gl.uniform1i(ySamplerRef, 0);
    this._yTextureRef = yTextureRef;

    let uTextureRef = this._createTexture();
    let uSamplerRef = gl.getUniformLocation(program, 'uTextureCb');
    gl.uniform1i(uSamplerRef, 1);
    this._uTextureRef = uTextureRef;

    let vTextureRef = this._createTexture();
    let vSamplerRef = gl.getUniformLocation(program, 'uTextureCr');
    gl.uniform1i(vSamplerRef, 2);
    this._vTextureRef = vTextureRef;
}

WebGLRender.prototype._createTexture = function () {
    let gl = this._webGL;

    let textureRef = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, textureRef);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    gl.bindTexture(gl.TEXTURE_2D, null);

    return textureRef;
}
