export class Toast {
    showMessage(text, type) {
        document.querySelectorAll('.message').forEach(msg => msg.remove());

        const message = document.createElement('div');
        message.className = 'message ' + type;
        message.textContent = text;

        const form = document.querySelector('.main-form');
        if (form) {
            form.insertBefore(message, form.firstChild);

            setTimeout(() => {
                if (message.parentNode) {
                    message.remove();
                }
            }, 4000);
        }
    }
}
