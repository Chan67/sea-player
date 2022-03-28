class TipsUI {
    private _tipsElement: HTMLDivElement;
    constructor(element: HTMLElement) {
        this._tipsElement = document.createElement('div');
        this._tipsElement.style.cssText = `
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            color: #fff;
        `;
        element.appendChild(this._tipsElement);
    }
    destroy() {
        this._tipsElement.remove();
    }
    text(message: string) {
        this._tipsElement.innerHTML = message;
    }
    show() {
        this._tipsElement.style.visibility = 'visible'
    }
    hide() {
        this._tipsElement.style.visibility = 'hidden';
    }
}

export default TipsUI;