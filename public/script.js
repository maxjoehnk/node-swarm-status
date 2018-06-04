const body = document.querySelector('body');

setInterval(() => {
    fetch('/status')
        .then(res => res.text())
        .then(html => {
            body.innerHTML = html;
        })
        .catch(err => console.error(err));
}, 10000);
