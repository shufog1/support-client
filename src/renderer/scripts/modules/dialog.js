export class Dialog {
    constructor() {
        this._overlay = null;
        this._injectDOM();
    }

    _injectDOM() {
        if (document.getElementById('appDialogOverlay')) return;

        const overlay = document.createElement('div');
        overlay.id = 'appDialogOverlay';
        overlay.className = 'app-dialog-overlay';
        overlay.setAttribute('aria-modal', 'true');
        overlay.setAttribute('role', 'dialog');

        overlay.innerHTML =
            '<div class="app-dialog-card">' +
                '<div class="app-dialog-icon-wrap" id="appDialogIconWrap"></div>' +
                '<div class="app-dialog-title" id="appDialogTitle"></div>' +
                '<div class="app-dialog-body" id="appDialogBody"></div>' +
                '<button class="app-dialog-btn" id="appDialogBtn">OK</button>' +
            '</div>';

        document.body.appendChild(overlay);
        this._overlay = overlay;

        document.getElementById('appDialogBtn').addEventListener('click', () => this._close());
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) this._close();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this._overlay.classList.contains('active')) {
                this._close();
            }
        });
    }

    show({ title, body, icon, primaryLabel, type }) {
        const iconWrap = document.getElementById('appDialogIconWrap');
        const titleEl = document.getElementById('appDialogTitle');
        const bodyEl = document.getElementById('appDialogBody');
        const btn = document.getElementById('appDialogBtn');

        iconWrap.textContent = icon || '';
        titleEl.textContent = title || '';
        bodyEl.textContent = body || '';
        btn.textContent = primaryLabel || 'OK';

        this._overlay.classList.remove('success', 'error');
        if (type) this._overlay.classList.add(type);

        this._overlay.classList.add('active');
        btn.focus();

        return new Promise((resolve) => {
            this._resolve = resolve;
        });
    }

    success(title, body) {
        return this.show({
            title,
            body,
            icon: '✓',
            primaryLabel: 'OK',
            type: 'success'
        });
    }

    error(title, body) {
        return this.show({
            title,
            body,
            icon: '⚠',
            primaryLabel: 'OK',
            type: 'error'
        });
    }

    _close() {
        this._overlay.classList.remove('active');
        if (this._resolve) {
            this._resolve();
            this._resolve = null;
        }
    }
}
